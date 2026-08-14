using System.Net.Http.Headers;
using System.Net.Http.Json;
using AssignmentSystemApi.DTOs.Auth;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using Xunit;

namespace AssignmentSystemApi.Tests.IntegrationTests
{
    public class AuthTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public AuthTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=TestDb;Username=test;Password=test",
                        ["Jwt:Key"] = new string('t', 64)
                    });
                });
                builder.ConfigureServices(services =>
                {
                    // Replace AppDbContext with InMemory
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AssignmentSystemApi.Data.AppDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<AssignmentSystemApi.Data.AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb");
                    });

                    // Build service provider to seed data
                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AssignmentSystemApi.Data.AppDbContext>();
                    var auth = scopedServices.GetRequiredService<AssignmentSystemApi.Services.Interfaces.IAuthService>();
                    // ensure database created
                    db.Database.EnsureDeleted();
                    db.Database.EnsureCreated();

                    // seed admin and student
                    var admin = new AssignmentSystemApi.Entities.User
                    {
                        Email = "admin@example.com",
                        PasswordHash = auth.HashPassword("AdminPass1!"),
                        Role = "Admin"
                    };
                    var student = new AssignmentSystemApi.Entities.User
                    {
                        Email = "student@example.com",
                        PasswordHash = auth.HashPassword("StudentPass1!"),
                        Role = "Student"
                    };
                    db.Users.AddRange(admin, student);
                    db.SaveChanges();
                });
            });
        }

        [Fact]
        public async Task Admin_can_login_and_create_user()
        {
            var client = _factory.CreateClient();

            var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = "admin@example.com", Password = "AdminPass1!" });
            login.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var loginRes = await login.Content.ReadFromJsonAsync<LoginResponse>();
            loginRes.Should().NotBeNull();
            var token = loginRes!.Token;

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var createResp = await client.PostAsJsonAsync("/api/users", new { Email = "newuser@example.com", Password = "UserPass1!", Role = "Student" });
            createResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        }

        [Fact]
        public async Task Student_cannot_create_user()
        {
            var client = _factory.CreateClient();
            var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = "student@example.com", Password = "StudentPass1!" });
            login.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var loginRes = await login.Content.ReadFromJsonAsync<LoginResponse>();
            var token = loginRes!.Token;

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var createResp = await client.PostAsJsonAsync("/api/users", new { Email = "another@example.com", Password = "UserPass1!", Role = "Student" });
            createResp.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
        }
    }
}
