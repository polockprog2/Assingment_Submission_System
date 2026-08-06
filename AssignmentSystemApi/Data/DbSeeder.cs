using AssignmentSystemApi.Entities;

namespace AssignmentSystemApi.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext db, Services.Interfaces.IAuthService auth)
        {
            // idempotent seeding
            if (db.Users.Any()) return;

            // Classes
            var cls = new Class { Name = "Class A" };
            db.Classes.Add(cls);

            // Users
            var admin = new User
            {
                Email = "admin@example.com",
                PasswordHash = auth.HashPassword("AdminPass1!"),
                Role = "Admin"
            };

            var teacher = new User
            {
                Email = "teacher@example.com",
                PasswordHash = auth.HashPassword("TeacherPass1!"),
                Role = "Teacher"
            };

            var student = new User
            {
                Email = "student@example.com",
                PasswordHash = auth.HashPassword("StudentPass1!"),
                Role = "Student",
                Class = cls
            };

            db.Users.AddRange(admin, teacher, student);
            db.SaveChanges();

            // Subject
            var subj = new Subject { Name = "Mathematics", ClassId = cls.Id };
            db.Subjects.Add(subj);
            db.SaveChanges();

            // TeacherSubjectAssignment
            var tsa = new TeacherSubjectAssignment { TeacherId = teacher.Id, SubjectId = subj.Id };
            db.TeacherSubjectAssignments.Add(tsa);
            db.SaveChanges();

            // Assignment
            var assignment = new Assignment
            {
                Title = "Sample Assignment",
                Description = "Solve problems",
                Deadline = DateTime.UtcNow.AddDays(7),
                MaxMarks = 100,
                Status = "Published",
                SubjectId = subj.Id,
                TeacherId = teacher.Id
            };
            db.Assignments.Add(assignment);
            db.SaveChanges();
        }
    }
}
