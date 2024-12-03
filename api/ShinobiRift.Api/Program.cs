using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using ShinobiRift.Api.Hubs;
using ShinobiRift.Api.Services;
using ShinobiRift.Api.Middleware;
using ShinobiRift.Api.Configuration;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Reflection;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var isDevelopment = builder.Environment.IsDevelopment();

// Bind configuration
var appSettings = new AppSettings();
builder.Configuration.Bind(appSettings);
builder.Services.AddSingleton(appSettings);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ShinobiRift API",
        Version = "v1",
        Description = "API for ShinobiRift game authentication and real-time communication"
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);

    // Add JWT Authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

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
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
})
.AddStackExchangeRedis(redisConnection, options =>
{
    options.Configuration.ChannelPrefix = RedisChannel.Literal(appSettings.Redis.ChannelPrefix);
});

// Configure JWT Authentication
var tokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = appSettings.Tokens.Issuer,
    ValidAudience = appSettings.Tokens.Audience,
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(appSettings.Tokens.SecretKey)),
    ClockSkew = TimeSpan.Zero
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = tokenValidationParameters;
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"].ToString();
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/game"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        var corsBuilder = builder
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();

        if (isDevelopment)
        {
            corsBuilder
                .WithExposedHeaders("Set-Cookie")
                .SetIsOriginAllowed(_ => true);
        }
    });
});

// Add custom services
builder.Services.AddSingleton<IPlayFabService, PlayFabService>();
builder.Services.AddSingleton<IUserSessionManager, UserSessionManager>();
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<ISessionService, SessionService>();
builder.Services.AddSingleton<IDiscordAuthService, DiscordAuthService>();
builder.Services.AddHostedService<ActivityCleanupService>();

// Configure HttpClient for Discord API
builder.Services.AddHttpClient<IDiscordAuthService, DiscordAuthService>();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ShinobiRift API v1");
        c.RoutePrefix = "swagger";
    });
    
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

// Use authentication and authorization
app.UseAuthentication();
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
