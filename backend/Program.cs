using AssignmentSystemApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AssignmentSystem API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register auth service
builder.Services.AddScoped<AssignmentSystemApi.Services.Interfaces.IAuthService, AssignmentSystemApi.Services.AuthService>();
// Register assignment service
builder.Services.AddScoped<AssignmentSystemApi.Services.Interfaces.IAssignmentService, AssignmentSystemApi.Services.AssignmentService>();
// Register submission service
builder.Services.AddScoped<AssignmentSystemApi.Services.Interfaces.ISubmissionService, AssignmentSystemApi.Services.SubmissionService>();
// Register file storage service
builder.Services.AddScoped<AssignmentSystemApi.Services.Interfaces.IFileStorageService, AssignmentSystemApi.Services.FileStorageService>();

// Allow larger file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    var maxSizeBytes = builder.Configuration.GetValue<long>("Storage:MaxFileSizeMb", 50) * 1024 * 1024;
    options.MultipartBodyLengthLimit = maxSizeBytes;
    options.ValueLengthLimit = (int)Math.Min(maxSizeBytes, int.MaxValue);
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = builder.Configuration.GetValue<long>("Storage:MaxFileSizeMb", 50) * 1024 * 1024;
});

// Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var cfg = builder.Configuration;
    var key = cfg["Jwt:Key"] ?? string.Empty;
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = cfg["Jwt:Issuer"],
        ValidAudience = cfg["Jwt:Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(key)),
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
});

// CORS configuration
var corsOriginsConfig = builder.Configuration["Cors:AllowedOrigins"] 
  ?? "http://localhost:3000,http://localhost:4200,http://localhost:5173";
var corsOrigins = corsOriginsConfig.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
  .Select(s => s.Trim()).ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition");
    });
});

// Fail fast if required security configuration is missing.
// In development use:  dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..."
//                      dotnet user-secrets set "Jwt:Key" "<random string, min 32 chars>"
// Or set the equivalent environment variables (ConnectionStrings__DefaultConnection, Jwt__Key).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString) ||
    connectionString.Contains("Password=;", StringComparison.Ordinal) ||
    connectionString.Contains("CHANGE_ME", StringComparison.Ordinal))
{
    throw new InvalidOperationException(
        "Database connection string is not configured. Set ConnectionStrings:DefaultConnection via user-secrets or environment variables.");
}
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32 ||
    jwtKey.Contains("CHANGE_ME", StringComparison.Ordinal) ||
    jwtKey.Contains("ReplaceWithSecureKey", StringComparison.Ordinal))
{
    throw new InvalidOperationException(
        "Jwt:Key is not configured with a secure value (min 32 chars). Set Jwt:Key via user-secrets or environment variables.");
}

var app = builder.Build();

// Seed demo data (run migrations and seed)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        var auth = services.GetRequiredService<AssignmentSystemApi.Services.Interfaces.IAuthService>();
        AssignmentSystemApi.Data.DbSeeder.Seed(db, auth);
    }
    catch (Exception ex)
    {
        System.Console.WriteLine($"Seeding error: {ex}");
        if (!app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Configure the HTTP request pipeline.
// Exception handling runs first so all downstream errors return a consistent JSON response.
app.UseMiddleware<AssignmentSystemApi.Middleware.ExceptionHandlingMiddleware>();

// Always enable Swagger UI for easier testing in dev/local environments
app.UseSwagger();
app.UseSwaggerUI();

// health endpoint
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Apply CORS before authentication and authorization
app.UseCors("AllowFrontend");

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// for WebApplicationFactory
public partial class Program { }
