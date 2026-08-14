using System.Net.Http.Headers;
using System.Net.Http.Json;
using AssignmentSystemApi.DTOs.Auth;
using AssignmentSystemApi.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using Xunit;

namespace AssignmentSystemApi.Tests.IntegrationTests
{
    public class ManagementTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        private int _classAId;
        private int _teacherId;
        private int _subjectId;
        private int _assignmentId;

        public ManagementTests(WebApplicationFactory<Program> factory)
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
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AssignmentSystemApi.Data.AppDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<AssignmentSystemApi.Data.AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("ManagementTestDb");
                    });

                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AssignmentSystemApi.Data.AppDbContext>();
                    var auth = scopedServices.GetRequiredService<AssignmentSystemApi.Services.Interfaces.IAuthService>();

                    db.Database.EnsureDeleted();
                    db.Database.EnsureCreated();

                    var clsA = new Class { Name = "Class A" };
                    var clsB = new Class { Name = "Class B" };
                    db.Classes.AddRange(clsA, clsB);
                    db.SaveChanges();

                    var admin = new User
                    {
                        Email = "admin-mgmt@example.com",
                        PasswordHash = auth.HashPassword("AdminPass1!"),
                        Role = "Admin"
                    };
                    var teacher = new User
                    {
                        Email = "teacher-mgmt@example.com",
                        PasswordHash = auth.HashPassword("TeacherPass1!"),
                        Role = "Teacher"
                    };
                    var studentA = new User
                    {
                        Email = "studentA-mgmt@example.com",
                        PasswordHash = auth.HashPassword("StudentPass1!"),
                        Role = "Student",
                        ClassId = clsA.Id
                    };
                    var studentB = new User
                    {
                        Email = "studentB-mgmt@example.com",
                        PasswordHash = auth.HashPassword("StudentPass1!"),
                        Role = "Student",
                        ClassId = clsB.Id
                    };
                    db.Users.AddRange(admin, teacher, studentA, studentB);
                    db.SaveChanges();

                    var subject = new Subject { Name = "Physics", ClassId = clsA.Id };
                    db.Subjects.Add(subject);
                    db.SaveChanges();

                    db.TeacherSubjectAssignments.Add(new TeacherSubjectAssignment
                    {
                        TeacherId = teacher.Id,
                        SubjectId = subject.Id
                    });
                    db.SaveChanges();

                    var assignment = new Assignment
                    {
                        Title = "Published Assignment",
                        Description = "desc",
                        Deadline = DateTime.UtcNow.AddDays(7),
                        MaxMarks = 100,
                        Status = "Published",
                        SubjectId = subject.Id,
                        TeacherId = teacher.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    db.Assignments.Add(assignment);
                    db.SaveChanges();

                    _classAId = clsA.Id;
                    _teacherId = teacher.Id;
                    _subjectId = subject.Id;
                    _assignmentId = assignment.Id;
                });
            });
        }

        private async Task<HttpClient> CreateAuthenticatedClientAsync(string email, string password)
        {
            var client = _factory.CreateClient();
            var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = email, Password = password });
            login.StatusCode.Should().Be(System.Net.HttpStatusCode.OK, await login.Content.ReadAsStringAsync());
            var loginRes = await login.Content.ReadFromJsonAsync<LoginResponse>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginRes!.Token);
            return client;
        }

        private sealed class Paged<T>
        {
            public List<T> Items { get; set; } = new();
            public int Total { get; set; }
            public int Page { get; set; }
            public int PageSize { get; set; }
            public int TotalPages { get; set; }
        }

        [Fact]
        public async Task Admin_can_create_and_list_classes()
        {
            var client = await CreateAuthenticatedClientAsync("admin-mgmt@example.com", "AdminPass1!");

            var createResp = await client.PostAsJsonAsync("/api/classes", new { Name = "Class C" });
            createResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var listResp = await client.GetAsync("/api/classes");
            listResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var paged = await listResp.Content.ReadFromJsonAsync<Paged<Class>>();
            paged.Should().NotBeNull();
            paged!.Items.Should().Contain(c => c.Name == "Class C");
            paged.Total.Should().BeGreaterThanOrEqualTo(3);
        }

        [Fact]
        public async Task Teacher_cannot_manage_classes()
        {
            var client = await CreateAuthenticatedClientAsync("teacher-mgmt@example.com", "TeacherPass1!");
            var resp = await client.PostAsJsonAsync("/api/classes", new { Name = "Hacked" });
            resp.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task Admin_can_create_subject_and_assign_teacher()
        {
            var client = await CreateAuthenticatedClientAsync("admin-mgmt@example.com", "AdminPass1!");

            var createSubject = await client.PostAsJsonAsync("/api/subjects", new { Name = "Chemistry", ClassId = _classAId });
            createSubject.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var subject = await createSubject.Content.ReadFromJsonAsync<Subject>();
            subject.Should().NotBeNull();

            var assign = await client.PostAsJsonAsync("/api/teacher-subject-assignments", new
            {
                TeacherId = _teacherId,
                SubjectId = subject!.Id
            });
            assign.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var list = await client.GetAsync("/api/teacher-subject-assignments");
            list.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var paged = await list.Content.ReadFromJsonAsync<Paged<TeacherSubjectAssignment>>();
            paged!.Items.Should().Contain(t => t.SubjectId == subject.Id);
        }

        [Fact]
        public async Task Teacher_can_create_and_publish_assignment()
        {
            var client = await CreateAuthenticatedClientAsync("teacher-mgmt@example.com", "TeacherPass1!");

            var createResp = await client.PostAsJsonAsync("/api/assignments", new
            {
                Title = "New assignment",
                Description = "desc",
                Deadline = DateTime.UtcNow.AddDays(7),
                MaxMarks = 50,
                SubjectId = _subjectId
            });
            createResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var assignment = await createResp.Content.ReadFromJsonAsync<Assignment>();
            assignment.Should().NotBeNull();

            var publish = await client.PostAsync($"/api/assignments/{assignment!.Id}/publish", null);
            publish.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var mine = await client.GetAsync("/api/assignments");
            mine.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var paged = await mine.Content.ReadFromJsonAsync<Paged<Assignment>>();
            paged!.Items.Should().Contain(a => a.Id == assignment.Id);
        }

        [Fact]
        public async Task Student_can_submit_and_teacher_grades()
        {
            var studentClient = await CreateAuthenticatedClientAsync("studentA-mgmt@example.com", "StudentPass1!");

            var submitResp = await studentClient.PostAsJsonAsync("/api/submissions", new
            {
                AssignmentId = _assignmentId,
                Content = "My answer"
            });
            submitResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var submission = await submitResp.Content.ReadFromJsonAsync<Submission>();
            submission.Should().NotBeNull();

            var teacherClient = await CreateAuthenticatedClientAsync("teacher-mgmt@example.com", "TeacherPass1!");
            var gradeResp = await teacherClient.PostAsJsonAsync($"/api/submissions/{submission!.Id}/grade", new
            {
                Marks = 95,
                Feedback = "Good work"
            });
            gradeResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var graded = await gradeResp.Content.ReadFromJsonAsync<Submission>();
            graded!.GradingStatus.Should().Be("Graded");
            graded.Marks.Should().Be(95);
        }

        [Fact]
        public async Task Student_from_different_class_cannot_submit()
        {
            var client = await CreateAuthenticatedClientAsync("studentB-mgmt@example.com", "StudentPass1!");
            var submitResp = await client.PostAsJsonAsync("/api/submissions", new
            {
                AssignmentId = _assignmentId,
                Content = "cheating"
            });
            submitResp.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task Paged_list_endpoint_respects_page_size()
        {
            var client = await CreateAuthenticatedClientAsync("admin-mgmt@example.com", "AdminPass1!");
            var resp = await client.GetAsync("/api/classes?page=1&pageSize=1");
            resp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var paged = await resp.Content.ReadFromJsonAsync<Paged<Class>>();
            paged!.Items.Count.Should().Be(1);
            paged.Total.Should().BeGreaterThanOrEqualTo(2);
            paged.Page.Should().Be(1);
            paged.PageSize.Should().Be(1);
        }

        [Fact]
        public async Task Register_creates_student_with_class()
        {
            var client = _factory.CreateClient();
            var resp = await client.PostAsJsonAsync("/api/auth/register", new
            {
                Email = "newstudent-mgmt@example.com",
                Password = "NewStudent1!",
                ClassId = _classAId
            });
            resp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var duplicate = await client.PostAsJsonAsync("/api/auth/register", new
            {
                Email = "newstudent-mgmt@example.com",
                Password = "NewStudent1!",
                ClassId = _classAId
            });
            duplicate.StatusCode.Should().Be(System.Net.HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task Validation_rejects_invalid_input()
        {
            var client = await CreateAuthenticatedClientAsync("admin-mgmt@example.com", "AdminPass1!");
            var resp = await client.PostAsJsonAsync("/api/classes", new { Name = "" });
            resp.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }
    }
}
