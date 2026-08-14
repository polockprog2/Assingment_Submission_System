using AssignmentSystemApi.Entities;

namespace AssignmentSystemApi.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext db, Services.Interfaces.IAuthService auth)
        {
            var clsA = GetOrCreateClass(db, "Class A");
            var clsB = GetOrCreateClass(db, "Class B");
            var clsC = GetOrCreateClass(db, "Class C");

            var admin = GetOrCreateUser(db, auth, "admin@example.com", "AdminPass1!", "Admin", null);
            var teacher = GetOrCreateUser(db, auth, "teacher@example.com", "TeacherPass1!", "Teacher", null);
            var teacher2 = GetOrCreateUser(db, auth, "teacher2@example.com", "Teacher2Pass1!", "Teacher", null);
            var teacher3 = GetOrCreateUser(db, auth, "teacher3@example.com", "Teacher3Pass1!", "Teacher", null);
            var teacher4 = GetOrCreateUser(db, auth, "teacher4@example.com", "Teacher4Pass1!", "Teacher", null);
            var student = GetOrCreateUser(db, auth, "student@example.com", "StudentPass1!", "Student", clsA.Id);
            var student2 = GetOrCreateUser(db, auth, "student2@example.com", "Student2Pass1!", "Student", clsB.Id);
            var student3 = GetOrCreateUser(db, auth, "student3@example.com", "Student3Pass1!", "Student", clsA.Id);
            var student4 = GetOrCreateUser(db, auth, "student4@example.com", "Student4Pass1!", "Student", clsC.Id);
            var student5 = GetOrCreateUser(db, auth, "student5@example.com", "Student5Pass1!", "Student", clsB.Id);
            var student6 = GetOrCreateUser(db, auth, "student6@example.com", "Student6Pass1!", "Student", clsC.Id);

            var subjMathA = GetOrCreateSubject(db, "Mathematics", clsA.Id);
            var subjPhysicsB = GetOrCreateSubject(db, "Physics", clsB.Id);
            var subjHistoryA = GetOrCreateSubject(db, "History", clsA.Id);
            var subjChemistryB = GetOrCreateSubject(db, "Chemistry", clsB.Id);
            var subjBiologyC = GetOrCreateSubject(db, "Biology", clsC.Id);
            var subjEnglishC = GetOrCreateSubject(db, "English", clsC.Id);

            GetOrCreateTsa(db, teacher.Id, subjMathA.Id);
            GetOrCreateTsa(db, teacher2.Id, subjPhysicsB.Id);
            GetOrCreateTsa(db, teacher.Id, subjHistoryA.Id);
            GetOrCreateTsa(db, teacher3.Id, subjChemistryB.Id);
            GetOrCreateTsa(db, teacher4.Id, subjBiologyC.Id);
            GetOrCreateTsa(db, teacher4.Id, subjEnglishC.Id);

            var assignmentMath = GetOrCreateAssignment(db, "Sample Assignment", teacher.Id, subjMathA.Id,
                DateTime.UtcNow.AddDays(7), 100, "Published", "Solve problems");
            var assignmentPhysics1 = GetOrCreateAssignment(db, "Physics Assignment 1", teacher2.Id, subjPhysicsB.Id,
                DateTime.UtcNow.AddDays(5), 50, "Published", "Lab report");
            GetOrCreateAssignment(db, "Draft Assignment", teacher.Id, subjMathA.Id,
                DateTime.UtcNow.AddDays(10), 20, "Draft", "Not yet published");
            var assignmentHistoryOverdue = GetOrCreateAssignment(db, "World War II Essay", teacher.Id, subjHistoryA.Id,
                DateTime.UtcNow.AddDays(-2), 40, "Published", "Write a 1000-word essay on the causes of WWII");
            var assignmentChemistry1 = GetOrCreateAssignment(db, "Periodic Table Quiz Writeup", teacher3.Id, subjChemistryB.Id,
                DateTime.UtcNow.AddDays(3), 30, "Published", "Summarize trends across periods and groups");
            var assignmentBiology1 = GetOrCreateAssignment(db, "Cell Structure Diagram", teacher4.Id, subjBiologyC.Id,
                DateTime.UtcNow.AddDays(4), 25, "Published", "Label a diagram of an animal cell");
            GetOrCreateAssignment(db, "Poetry Analysis (Draft)", teacher4.Id, subjEnglishC.Id,
                DateTime.UtcNow.AddDays(12), 30, "Draft", "Not yet published");

            GetOrCreateSubmission(db, assignmentMath.Id, student3.Id, "My answers...", "Submitted", "Pending",
                null, null, DateTime.UtcNow);
            GetOrCreateSubmission(db, assignmentPhysics1.Id, student2.Id, "Lab report content", "Submitted", "Graded",
                45, "Well done", DateTime.UtcNow.AddDays(-1));
            GetOrCreateSubmission(db, assignmentHistoryOverdue.Id, student.Id, "The causes of WWII include...", "Late", "Pending",
                null, null, DateTime.UtcNow);
            GetOrCreateSubmission(db, assignmentChemistry1.Id, student5.Id,
                "Trends across periods include atomic radius...", "Submitted", "Graded",
                18, "Good start, but missing ionization energy trends. Please review chapter 4.", DateTime.UtcNow.AddDays(-1));
            GetOrCreateSubmission(db, assignmentBiology1.Id, student4.Id,
                "Diagram attached with labeled organelles.", "Submitted", "Pending",
                null, null, DateTime.UtcNow);
            GetOrCreateSubmission(db, assignmentBiology1.Id, student6.Id,
                "Diagram attached with labeled organelles and mitochondria detail.", "Submitted", "Graded",
                24, "Excellent detail and labeling.", DateTime.UtcNow.AddDays(-1));
        }

        private static Class GetOrCreateClass(AppDbContext db, string name)
        {
            var existing = db.Classes.FirstOrDefault(c => c.Name.ToLower() == name.ToLower());
            if (existing != null) return existing;
            var cls = new Class { Name = name };
            db.Classes.Add(cls);
            db.SaveChanges();
            return cls;
        }

        private static User GetOrCreateUser(AppDbContext db, Services.Interfaces.IAuthService auth,
            string email, string password, string role, int? classId)
        {
            var existing = db.Users.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
            if (existing != null) return existing;
            var user = new User
            {
                Email = email,
                PasswordHash = auth.HashPassword(password),
                Role = role,
                ClassId = classId
            };
            db.Users.Add(user);
            db.SaveChanges();
            return user;
        }

        private static Subject GetOrCreateSubject(AppDbContext db, string name, int classId)
        {
            var existing = db.Subjects.FirstOrDefault(s => s.Name.ToLower() == name.ToLower() && s.ClassId == classId);
            if (existing != null) return existing;
            var subj = new Subject { Name = name, ClassId = classId };
            db.Subjects.Add(subj);
            db.SaveChanges();
            return subj;
        }

        private static void GetOrCreateTsa(AppDbContext db, int teacherId, int subjectId)
        {
            var exists = db.TeacherSubjectAssignments.Any(t => t.TeacherId == teacherId && t.SubjectId == subjectId);
            if (exists) return;
            db.TeacherSubjectAssignments.Add(new TeacherSubjectAssignment { TeacherId = teacherId, SubjectId = subjectId });
            db.SaveChanges();
        }

        private static Assignment GetOrCreateAssignment(AppDbContext db, string title, int teacherId, int subjectId,
            DateTime deadline, int maxMarks, string status, string description)
        {
            var existing = db.Assignments.FirstOrDefault(a => a.Title == title && a.TeacherId == teacherId);
            if (existing != null) return existing;
            var assignment = new Assignment
            {
                Title = title,
                Description = description,
                Deadline = deadline,
                MaxMarks = maxMarks,
                Status = status,
                SubjectId = subjectId,
                TeacherId = teacherId,
                CreatedAt = DateTime.UtcNow
            };
            db.Assignments.Add(assignment);
            db.SaveChanges();
            return assignment;
        }

        private static void GetOrCreateSubmission(AppDbContext db, int assignmentId, int studentId, string content,
            string submissionStatus, string gradingStatus, int? marks, string? feedback, DateTime submittedAt)
        {
            var exists = db.Submissions.Any(s => s.AssignmentId == assignmentId && s.StudentId == studentId);
            if (exists) return;
            var submission = new Submission
            {
                AssignmentId = assignmentId,
                StudentId = studentId,
                Content = content,
                SubmittedAt = submittedAt,
                SubmissionStatus = submissionStatus,
                GradingStatus = gradingStatus,
                Marks = marks,
                Feedback = feedback,
                GradedAt = marks.HasValue ? DateTime.UtcNow : null
            };
            db.Submissions.Add(submission);
            db.SaveChanges();
        }
    }
}
