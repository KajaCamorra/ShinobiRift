using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using ShinobiRift.Api.Configuration;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;
using Xunit;

namespace ShinobiRift.Api.Tests.Services
{
    public class SessionServiceTests
    {
        private readonly Mock<IDistributedCache> _cacheMock;
        private readonly Mock<ILogger<SessionService>> _loggerMock;
        private readonly AppSettings _appSettings;
        private readonly SessionService _sessionService;

        public SessionServiceTests()
        {
            _cacheMock = new Mock<IDistributedCache>();
            _loggerMock = new Mock<ILogger<SessionService>>();
            _appSettings = new AppSettings
            {
                Session = new SessionSettings
                {
                    SessionExpirationDays = 3,
                    ActiveThresholdMinutes = 5,
                    OnlineThresholdMinutes = 15
                }
            };

            _sessionService = new SessionService(_cacheMock.Object, _appSettings, _loggerMock.Object);

            // Setup default cache behavior
            _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string key, CancellationToken token) =>
                {
                    var sessionData = _cachedSessions.GetValueOrDefault(key);
                    return sessionData != null ? JsonSerializer.SerializeToUtf8Bytes(sessionData) : null;
                });

            _cacheMock.Setup(x => x.SetAsync(
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                It.IsAny<CancellationToken>()))
                .Callback<string, byte[], DistributedCacheEntryOptions, CancellationToken>(
                    (key, value, options, token) =>
                    {
                        var session = JsonSerializer.Deserialize<AuthSession>(value);
                        if (session != null)
                        {
                            _cachedSessions[key] = session;
                        }
                    });
        }

        private readonly Dictionary<string, AuthSession> _cachedSessions = new();

        [Fact(DisplayName = "Should store and retrieve sessions with correct data structure")]
        public async Task ShouldStoreAndRetrieveSession()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                PlayFabId = "pfid",
                PlayFabSessionTicket = "ticket",
                SessionToken = "sessionToken",
                AccessToken = "accessToken",
                Created = DateTimeOffset.UtcNow,
                Expires = DateTimeOffset.UtcNow.AddDays(3),
                LastActive = DateTimeOffset.UtcNow,
                AuthSource = AuthSource.Discord
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.NotNull(retrievedSession);
            Assert.Equal(session.SessionId, retrievedSession.SessionId);
            Assert.Equal(session.UserId, retrievedSession.UserId);
            Assert.Equal(session.AuthSource, retrievedSession.AuthSource);
        }

        [Fact(DisplayName = "Should enforce session expiration")]
        public async Task ShouldEnforceSessionExpiration()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                Expires = DateTimeOffset.UtcNow.AddMinutes(-1), // Expired
                AuthSource = AuthSource.Discord
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.Null(retrievedSession);
        }

        [Fact(DisplayName = "Should handle concurrent updates safely")]
        public async Task ShouldHandleConcurrentUpdates()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                LastActive = DateTimeOffset.UtcNow,
                AuthSource = AuthSource.Discord,
                Expires = DateTimeOffset.UtcNow.AddDays(1)
            };

            await _sessionService.SaveSessionAsync(session);

            // Act
            var tasks = new List<Task>();
            for (int i = 0; i < 10; i++)
            {
                tasks.Add(Task.Run(async () =>
                {
                    await _sessionService.UpdateLastActiveAsync(session.SessionId);
                }));
            }

            // Assert
            await Task.WhenAll(tasks);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);
            Assert.NotNull(retrievedSession);
            Assert.True(retrievedSession.LastActive > session.LastActive);
        }

        [Fact(DisplayName = "Should maintain proper security settings")]
        public void ShouldMaintainSecuritySettings()
        {
            // Arrange
            var expires = DateTimeOffset.UtcNow.AddDays(3);

            // Act
            var options = CookieConfig.GetSecureCookieOptions(expires);

            // Assert
            Assert.True(options.HttpOnly);
            Assert.True(options.Secure);
            Assert.Equal(SameSiteMode.Strict, options.SameSite);
            Assert.Equal("/", options.Path);
            Assert.Equal(TimeSpan.FromDays(3), options.MaxAge);
        }

        [Fact(DisplayName = "Should handle PlayFab development authentication")]
        public async Task ShouldHandlePlayFabDevAuth()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                AuthSource = AuthSource.PlayFabDev,
                Created = DateTimeOffset.UtcNow,
                Expires = DateTimeOffset.UtcNow.AddDays(3)
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.NotNull(retrievedSession);
            Assert.Equal(AuthSource.PlayFabDev, retrievedSession.AuthSource);
        }

        [Fact(DisplayName = "Should properly set auth source for development mode")]
        public async Task ShouldSetAuthSourceForDevMode()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                AuthSource = AuthSource.PlayFabDev,
                Created = DateTimeOffset.UtcNow,
                Expires = DateTimeOffset.UtcNow.AddDays(3)
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.NotNull(retrievedSession);
            Assert.Equal(AuthSource.PlayFabDev, retrievedSession.AuthSource);
        }

        [Fact(DisplayName = "Should validate development credentials")]
        public async Task ShouldValidateDevCredentials()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                AuthSource = AuthSource.PlayFabDev,
                PlayFabSessionTicket = "devTicket",
                Created = DateTimeOffset.UtcNow,
                Expires = DateTimeOffset.UtcNow.AddDays(3)
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.NotNull(retrievedSession);
            Assert.Equal("devTicket", retrievedSession.PlayFabSessionTicket);
        }

        [Fact(DisplayName = "Should respect environment configuration")]
        public async Task ShouldRespectEnvironmentConfig()
        {
            // Arrange
            var session = new AuthSession
            {
                SessionId = Guid.NewGuid().ToString(),
                UserId = "testUser",
                AuthSource = AuthSource.PlayFabDev,
                Created = DateTimeOffset.UtcNow,
                Expires = DateTimeOffset.UtcNow.AddDays(_appSettings.Session.SessionExpirationDays)
            };

            // Act
            await _sessionService.SaveSessionAsync(session);
            var retrievedSession = await _sessionService.GetSessionAsync(session.SessionId);

            // Assert
            Assert.NotNull(retrievedSession);
            Assert.Equal(session.Expires, retrievedSession.Expires);
        }
    }
}
