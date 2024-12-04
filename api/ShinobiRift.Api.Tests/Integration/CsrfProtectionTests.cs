using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using ShinobiRift.Api.Services;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Xunit;
using StackExchange.Redis;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace ShinobiRift.Api.Tests.Integration
{
    public class CsrfProtectionTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly Mock<IConnectionMultiplexer> _redisMock;
        private readonly Mock<IDatabase> _dbMock;

        public CsrfProtectionTests(WebApplicationFactory<Program> factory)
        {
            _redisMock = new Mock<IConnectionMultiplexer>();
            _dbMock = new Mock<IDatabase>();
            _redisMock.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
                .Returns(_dbMock.Object);

            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll(typeof(IConnectionMultiplexer));
                    services.AddSingleton(_redisMock.Object);
                });
            });

            _client = _factory.CreateClient();
        }

        public void Dispose()
        {
            _client.Dispose();
        }

        [Fact]
        public async Task TokenRotation_ShouldAcceptOldTokenDuringGracePeriod()
        {
            // Arrange
            var (sessionId, oldToken) = await AuthenticateClient();
            _client.DefaultRequestHeaders.Add("X-CSRF-Token", oldToken);

            // Mock token validation
            _dbMock.Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k.ToString().Contains(sessionId)), It.IsAny<CommandFlags>()))
                .ReturnsAsync(oldToken);

            // Act - First request with old token
            var firstResponse = await _client.PostAsync("/api/protected/resource",
                new StringContent("{}", Encoding.UTF8, "application/json"));

            // Trigger token refresh
            var refreshResponse = await _client.PostAsync("/api/auth/refresh",
                new StringContent(JsonSerializer.Serialize(new { sessionId }), Encoding.UTF8, "application/json"));
            var newToken = refreshResponse.Headers.GetValues("X-CSRF-Token").FirstOrDefault();

            // Request during grace period with old token
            var gracePeriodResponse = await _client.PostAsync("/api/protected/resource",
                new StringContent("{}", Encoding.UTF8, "application/json"));

            // Assert
            Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
            Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
            Assert.NotNull(newToken);
            Assert.NotEqual(oldToken, newToken);
            Assert.Equal(HttpStatusCode.OK, gracePeriodResponse.StatusCode);
        }

        [Fact]
        public async Task TokenRotation_ShouldHandleConcurrentRequests()
        {
            // Arrange
            var (sessionId, initialToken) = await AuthenticateClient();
            _client.DefaultRequestHeaders.Add("X-CSRF-Token", initialToken);

            // Mock token validation
            _dbMock.Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k.ToString().Contains(sessionId)), It.IsAny<CommandFlags>()))
                .ReturnsAsync(initialToken);

            // Act - Send multiple concurrent refresh requests
            var tasks = new List<Task<HttpResponseMessage>>();
            for (int i = 0; i < 5; i++)
            {
                tasks.Add(_client.PostAsync("/api/auth/refresh",
                    new StringContent(JsonSerializer.Serialize(new { sessionId }), Encoding.UTF8, "application/json")));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert
            Assert.All(responses, response => Assert.True(response.IsSuccessStatusCode));
            
            // Verify we got the same new token for all responses
            var tokens = responses.Select(r => r.Headers.GetValues("X-CSRF-Token").FirstOrDefault()).Distinct();
            Assert.Single(tokens); // Should only have one unique new token
        }

        [Fact]
        public async Task TokenRotation_ShouldHandleErrorCases()
        {
            // Arrange
            var (sessionId, token) = await AuthenticateClient();

            // Mock Redis failure
            _dbMock.Setup(db => db.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
                .ThrowsAsync(new RedisConnectionException(ConnectionFailureType.UnableToConnect, "Simulated Redis failure"));

            // Act
            var response = await _client.PostAsync("/api/auth/refresh",
                new StringContent(JsonSerializer.Serialize(new { sessionId }), Encoding.UTF8, "application/json"));

            // Assert
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
            var error = await JsonSerializer.DeserializeAsync<ErrorResponse>(
                await response.Content.ReadAsStreamAsync());
            Assert.Contains("token rotation", error.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task TokenRotation_ShouldInvalidateOldTokenAfterGracePeriod()
        {
            // Arrange
            var (sessionId, oldToken) = await AuthenticateClient();
            _client.DefaultRequestHeaders.Add("X-CSRF-Token", oldToken);

            // Trigger token refresh
            var refreshResponse = await _client.PostAsync("/api/auth/refresh",
                new StringContent(JsonSerializer.Serialize(new { sessionId }), Encoding.UTF8, "application/json"));
            
            // Wait for grace period to expire
            await Task.Delay(31000); // Grace period is 30 seconds

            // Act - Try to use old token after grace period
            var response = await _client.PostAsync("/api/protected/resource",
                new StringContent("{}", Encoding.UTF8, "application/json"));

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            var error = await JsonSerializer.DeserializeAsync<ErrorResponse>(
                await response.Content.ReadAsStreamAsync());
            Assert.Contains("Invalid CSRF token", error.Message);
        }

        private async Task<(string sessionId, string csrfToken)> AuthenticateClient()
        {
            var sessionId = Guid.NewGuid().ToString();
            SetupRedisSessionMock(sessionId);

            var loginData = new { username = "testuser", password = "testpass" };
            var response = await _client.PostAsync("/api/auth/login",
                new StringContent(JsonSerializer.Serialize(loginData), Encoding.UTF8, "application/json"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var cookies = response.Headers.GetValues("Set-Cookie");
            var csrfToken = GetCsrfTokenFromCookie(cookies.First(c => c.StartsWith("csrf_token=")));

            var result = await JsonSerializer.DeserializeAsync<LoginResult>(
                await response.Content.ReadAsStreamAsync());
            _client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", result.AccessToken);

            return (sessionId, csrfToken);
        }

        private void SetupRedisSessionMock(string sessionId)
        {
            _dbMock.Setup(db => db.KeyTimeToLiveAsync(It.Is<RedisKey>(k => k.ToString().Contains(sessionId)), It.IsAny<CommandFlags>()))
                .ReturnsAsync(TimeSpan.FromHours(1));
            
            _dbMock.Setup(db => db.StringSetAsync(
                It.IsAny<RedisKey>(),
                It.IsAny<RedisValue>(),
                It.IsAny<TimeSpan?>(),
                It.IsAny<When>(),
                It.IsAny<CommandFlags>()))
                .ReturnsAsync(true);
        }

        private string GetCsrfTokenFromCookie(string cookie)
        {
            var tokenPart = cookie.Split(';')[0];
            return tokenPart.Split('=')[1];
        }

        private class LoginResult
        {
            public string SessionToken { get; set; }
            public string AccessToken { get; set; }
            public int ExpiresIn { get; set; }
        }

        private class ErrorResponse
        {
            public string Message { get; set; }
        }
    }
}
