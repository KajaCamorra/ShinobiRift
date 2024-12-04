using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ShinobiRift.Api.Services;
using StackExchange.Redis;
using System.Text.Json;
using Xunit;

namespace ShinobiRift.Api.Tests.Services
{
    public class RateLimitServiceTests
    {
        private readonly Mock<IConnectionMultiplexer> _redisMock;
        private readonly Mock<IDatabase> _dbMock;
        private readonly Mock<ILogger<RateLimitService>> _loggerMock;
        private readonly IConfiguration _configuration;
        private readonly RateLimitService _service;
        private readonly Mock<ITransaction> _transactionMock;

        public RateLimitServiceTests()
        {
            _redisMock = new Mock<IConnectionMultiplexer>();
            _dbMock = new Mock<IDatabase>();
            _loggerMock = new Mock<ILogger<RateLimitService>>();
            _transactionMock = new Mock<ITransaction>();

            var configValues = new Dictionary<string, string>
            {
                {"RateLimit:WindowSeconds", "300"},
                {"RateLimit:MaxAttempts", "5"},
                {"RateLimit:BlockDuration", "900"},
                {"RateLimit:FailClosed", "true"},
                {"RateLimit:CsrfWindowSeconds", "60"},
                {"RateLimit:CsrfMaxAttempts", "3"},
                {"RateLimit:CsrfBlockDuration", "300"}
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues)
                .Build();

            _redisMock.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
                .Returns(_dbMock.Object);

            // Setup transaction execution
            _transactionMock.Setup(x => x.ExecuteAsync(CommandFlags.None))
                .ReturnsAsync(true);

            _dbMock.Setup(x => x.CreateTransaction(It.IsAny<object>()))
                .Returns(_transactionMock.Object);

            // Setup Redis TIME command
            var timeResult = new RedisValue[] { (RedisValue)"1701000000", (RedisValue)"0" };
            _dbMock.Setup(x => x.ExecuteAsync("TIME", It.IsAny<object[]>(), CommandFlags.None))
                .Returns(Task.FromResult<RedisResult>(RedisResult.Create(timeResult)));

            _service = new RateLimitService(_redisMock.Object, _loggerMock.Object, _configuration);
        }

        [Fact]
        public async Task IsAllowedAndRecord_ShouldAllowRequestsWithinLimits()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = false
            };

            _transactionMock.Setup(x => x.KeyExistsAsync(It.IsAny<RedisKey>(), CommandFlags.None))
                .ReturnsAsync(false);
            _transactionMock.Setup(x => x.StringIncrementAsync(It.IsAny<RedisKey>(), 1, CommandFlags.None))
                .ReturnsAsync(3);

            // Act
            var result = await _service.IsAllowedAndRecord(key);

            // Assert
            Assert.True(result.Allowed);
            Assert.Equal(2, result.Remaining);
        }

        [Fact]
        public async Task IsAllowedAndRecord_ShouldBlockRequestsExceedingLimits()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = false
            };

            _transactionMock.Setup(x => x.KeyExistsAsync(It.IsAny<RedisKey>(), CommandFlags.None))
                .ReturnsAsync(true);
            _transactionMock.Setup(x => x.KeyTimeToLiveAsync(It.IsAny<RedisKey>(), CommandFlags.None))
                .ReturnsAsync(TimeSpan.FromSeconds(300));

            // Act
            var result = await _service.IsAllowedAndRecord(key);

            // Assert
            Assert.False(result.Allowed);
            Assert.Equal(0, result.Remaining);
        }

        [Fact]
        public async Task IsAllowedAndRecord_ShouldHandleConcurrentRequests()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = false
            };

            var attemptCount = 0;
            _transactionMock.Setup(x => x.KeyExistsAsync(It.IsAny<RedisKey>(), CommandFlags.None))
                .ReturnsAsync(false);
            _transactionMock.Setup(x => x.StringIncrementAsync(It.IsAny<RedisKey>(), 1, CommandFlags.None))
                .ReturnsAsync(() => ++attemptCount);

            // Act - Simulate concurrent requests
            var tasks = new List<Task<RateLimitResult>>();
            for (int i = 0; i < 3; i++)
            {
                tasks.Add(_service.IsAllowedAndRecord(key));
            }

            var results = await Task.WhenAll(tasks);

            // Assert - All requests should be processed atomically
            Assert.All(results, r => Assert.True(r.Allowed));
            Assert.Equal(3, results.Count());
        }

        [Fact]
        public async Task IsAllowedAndRecord_ShouldHandleCsrfRateLimitsSeparately()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = true
            };

            _transactionMock.Setup(x => x.KeyExistsAsync(It.IsAny<RedisKey>(), CommandFlags.None))
                .ReturnsAsync(false);
            _transactionMock.Setup(x => x.StringIncrementAsync(It.IsAny<RedisKey>(), 1, CommandFlags.None))
                .ReturnsAsync(2);

            // Act
            var result = await _service.IsAllowedAndRecord(key);

            // Assert
            Assert.True(result.Allowed);
            Assert.Equal(1, result.Remaining); // CSRF has lower limit (3)
            Assert.Contains("csrf", _dbMock.Invocations.ToString() ?? ""); // Verify CSRF-specific key used
        }

        [Fact]
        public async Task IsAllowedAndRecord_ShouldHandleRedisFailure()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = false
            };

            _dbMock.Setup(x => x.CreateTransaction(It.IsAny<object>()))
                .Throws(new RedisConnectionException(ConnectionFailureType.UnableToConnect, "Test failure"));

            // Act
            var result = await _service.IsAllowedAndRecord(key);

            // Assert
            Assert.False(result.Allowed); // FailClosed = true in config
            Assert.Equal(0, result.Remaining);
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Redis connection error")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task ClearLimit_ShouldRemoveAllKeys()
        {
            // Arrange
            var key = new RateLimitKey
            {
                Type = "ip",
                Value = "127.0.0.1",
                Environment = "test",
                IsCsrf = false
            };

            // Act
            await _service.ClearLimit(key);

            // Assert
            _dbMock.Verify(x => x.KeyDeleteAsync(It.IsAny<RedisKey[]>(), CommandFlags.None), Times.Once);
        }
    }
}
