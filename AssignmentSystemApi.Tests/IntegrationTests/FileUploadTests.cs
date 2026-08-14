using System.Net.Http.Headers;
using System.Net.Http.Json;
using AssignmentSystemApi.DTOs.Auth;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AssignmentSystemApi.Tests.IntegrationTests
{
    public class FileUploadTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public FileUploadTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=TestDb;Username=test;Password=test",
                        ["Jwt:Key"] = new string('t', 64),
                        ["Storage:UploadsRoot"] = Path.Combine(Path.GetTempPath(), "AssignmentSystemApiTests", Guid.NewGuid().ToString("N")),
                        ["Storage:MaxFileSizeMb"] = "50",
                        ["Storage:AllowedExtensions:0"] = ".pdf",
                        ["Storage:AllowedExtensions:1"] = ".docx"
                    });
                });
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AssignmentSystemApi.Data.AppDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<AssignmentSystemApi.Data.AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("FileUploadTestDb");
                    });

                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AssignmentSystemApi.Data.AppDbContext>();
                    var auth = scopedServices.GetRequiredService<AssignmentSystemApi.Services.Interfaces.IAuthService>();

                    db.Database.EnsureDeleted();
                    db.Database.EnsureCreated();

                    var clsA = new AssignmentSystemApi.Entities.Class { Name = "Class A" };
                    var clsB = new AssignmentSystemApi.Entities.Class { Name = "Class B" };
                    db.Classes.AddRange(clsA, clsB);
                    db.SaveChanges();

                    var teacher = new AssignmentSystemApi.Entities.User
                    {
                        Email = "teacher-file@example.com",
                        PasswordHash = auth.HashPassword("TeacherPass1!"),
                        Role = "Teacher"
                    };
                    var studentA = new AssignmentSystemApi.Entities.User
                    {
                        Email = "studentA-file@example.com",
                        PasswordHash = auth.HashPassword("StudentPass1!"),
                        Role = "Student",
                        ClassId = clsA.Id
                    };
                    var studentB = new AssignmentSystemApi.Entities.User
                    {
                        Email = "studentB-file@example.com",
                        PasswordHash = auth.HashPassword("StudentPass1!"),
                        Role = "Student",
                        ClassId = clsB.Id
                    };
                    db.Users.AddRange(teacher, studentA, studentB);
                    db.SaveChanges();

                    var subject = new AssignmentSystemApi.Entities.Subject { Name = "Math", ClassId = clsA.Id };
                    db.Subjects.Add(subject);
                    db.SaveChanges();

                    db.TeacherSubjectAssignments.Add(new AssignmentSystemApi.Entities.TeacherSubjectAssignment
                    {
                        TeacherId = teacher.Id,
                        SubjectId = subject.Id
                    });
                    db.SaveChanges();

                    var assignment = new AssignmentSystemApi.Entities.Assignment
                    {
                        Title = "File Assignment",
                        Description = "Upload a file",
                        Deadline = DateTime.UtcNow.AddDays(7),
                        MaxMarks = 100,
                        Status = "Published",
                        SubjectId = subject.Id,
                        TeacherId = teacher.Id
                    };
                    db.Assignments.Add(assignment);
                    db.SaveChanges();

                    var submission = new AssignmentSystemApi.Entities.Submission
                    {
                        AssignmentId = assignment.Id,
                        StudentId = studentA.Id,
                        Content = "notes",
                        SubmittedAt = DateTime.UtcNow,
                        SubmissionStatus = "Submitted",
                        GradingStatus = "Pending"
                    };
                    db.Submissions.Add(submission);
                    db.SaveChanges();
                });
            });
        }

        private async Task<HttpClient> CreateAuthenticatedClientAsync(string email, string password)
        {
            var client = _factory.CreateClient();
            var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Email = email, Password = password });
            File.AppendAllText(Path.Combine(Path.GetTempPath(), "createRespBody.txt"), $"login {email}: {(int)login.StatusCode} {await login.Content.ReadAsStringAsync()}\n");
            var loginRes = await login.Content.ReadFromJsonAsync<LoginResponse>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginRes!.Token);
            return client;
        }

        private static MultipartFormDataContent BuildFileContent(byte[] bytes, string fileName)
        {
            var content = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(bytes);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            content.Add(fileContent, "file", fileName);
            return content;
        }

        [Fact]
        public async Task Teacher_uploads_assignment_file_then_student_downloads_it()
        {
            var teacherClient = await CreateAuthenticatedClientAsync("teacher-file@example.com", "TeacherPass1!");
            var diag = new System.Text.StringBuilder();
            var health = await teacherClient.GetAsync("/health");
            diag.AppendLine($"health: {(int)health.StatusCode} {await health.Content.ReadAsStringAsync()}");
            var getMine = await teacherClient.GetAsync("/api/assignments");
            diag.AppendLine($"GET /api/assignments: {(int)getMine.StatusCode} {await getMine.Content.ReadAsStringAsync()}");
            var createResp = await teacherClient.PostAsJsonAsync("/api/assignments", new
            {
                Title = "Uploaded assignment",
                Description = "desc",
                Deadline = DateTime.UtcNow.AddDays(7),
                MaxMarks = 50,
                SubjectId = 1
            });
            diag.AppendLine($"POST /api/assignments: {(int)createResp.StatusCode} {await createResp.Content.ReadAsStringAsync()}");
            File.WriteAllText(Path.Combine(Path.GetTempPath(), "createRespBody.txt"), diag.ToString());
            createResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK, diag.ToString());
            var assignment = await createResp.Content.ReadFromJsonAsync<AssignmentSystemApi.Entities.Assignment>();
            var assignmentId = assignment!.Id;

            var bytes = new byte[] { 37, 80, 68, 70, 45, 1, 2, 3 };
            using var upload = BuildFileContent(bytes, "brief.pdf");
            var uploadResp = await teacherClient.PostAsync($"/api/assignments/{assignmentId}/file", upload);
            uploadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var studentClient = await CreateAuthenticatedClientAsync("studentA-file@example.com", "StudentPass1!");
            var downloadResp = await studentClient.GetAsync($"/api/assignments/{assignmentId}/file");
            downloadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var downloaded = await downloadResp.Content.ReadAsByteArrayAsync();
            downloaded.Should().Equal(bytes);
        }

        [Fact]
        public async Task Student_in_different_class_cannot_download_assignment_file()
        {
            var teacherClient = await CreateAuthenticatedClientAsync("teacher-file@example.com", "TeacherPass1!");
            var bytes = new byte[] { 1, 2, 3, 4 };
            using var upload = BuildFileContent(bytes, "brief.pdf");
            var uploadResp = await teacherClient.PostAsync("/api/assignments/1/file", upload);
            uploadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var otherStudentClient = await CreateAuthenticatedClientAsync("studentB-file@example.com", "StudentPass1!");
            var downloadResp = await otherStudentClient.GetAsync("/api/assignments/1/file");
            downloadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task Student_uploads_submission_file()
        {
            var studentClient = await CreateAuthenticatedClientAsync("studentA-file@example.com", "StudentPass1!");
            var bytes = new byte[] { 37, 80, 68, 70, 9, 9, 9 };
            using var upload = BuildFileContent(bytes, "answer.pdf");
            var uploadResp = await studentClient.PostAsync("/api/submissions/1/file", upload);
            uploadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var downloadResp = await studentClient.GetAsync("/api/submissions/1/file");
            downloadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var downloaded = await downloadResp.Content.ReadAsByteArrayAsync();
            downloaded.Should().Equal(bytes);
        }

        [Fact]
        public async Task Upload_with_disallowed_extension_is_rejected()
        {
            var teacherClient = await CreateAuthenticatedClientAsync("teacher-file@example.com", "TeacherPass1!");
            var content = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(new byte[] { 1, 2, 3 });
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            content.Add(fileContent, "file", "malware.exe");

            var uploadResp = await teacherClient.PostAsync("/api/assignments/1/file", content);
            uploadResp.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }
    }
}
