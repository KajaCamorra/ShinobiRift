using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using ShinobiRift.Api.Hubs;
using ShinobiRift.Api.Services;
using ShinobiRift.Api.Middleware;
using ShinobiRift.Api.Configuration;
using Microsoft.Extensions.Caching.StackExchangeRedis;

var builder = WebApplication.CreateBuilder(args);

// Bind configuration
var appSettings = new AppSettings();
builder.Configuration.Bind(appSettings);
builder.Services.AddSingleton(appSettings);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Redis
var redisConnection = appSettings.Redis.ConnectionString;
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnection));

// Configure distributed cache with Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnection;
    options.InstanceName = appSettings.Redis.InstanceName;
});

// Configure SignalR with Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(redisConnection, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal(appSettings.Redis.ChannelPrefix);
    });

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder
            .SetIsOriginAllowed(_ => true) // Allow requests from our test page
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add custom services
builder.Services.AddSingleton<IPlayFabService, PlayFabService>();
builder.Services.AddSingleton<IUserSessionManager, UserSessionManager>();
builder.Services.AddHostedService<ActivityCleanupService>();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // In development, accept HTTP connections
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHttpsRedirection();
}

// Enable static files
app.UseDefaultFiles();
app.UseStaticFiles();

// Use CORS before auth middleware
app.UseCors();

// Use rate limiting before auth
app.UseRateLimiting();

// Use custom session authentication
app.UseSessionAuth();

app.UseAuthorization();

// Map controllers and SignalR hub
app.MapControllers();
app.MapHub<GameHub>("/hubs/game");

// Add middleware to track activity on all requests
app.Use(async (context, next) =>
{
    var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (!string.IsNullOrEmpty(userId))
    {
        var sessionManager = context.RequestServices.GetRequiredService<IUserSessionManager>();
        await sessionManager.UpdateUserActivityAsync(userId);
    }
    await next();
});

app.Run();
