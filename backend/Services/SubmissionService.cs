using AssignmentSystemApi.Common;
using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.Submissions;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Services
{
    public class SubmissionService : ISubmissionService
    {
        private readonly AppDbContext _db;
        private readonly IFileStorageService _storage;

        public SubmissionService(AppDbContext db, IFileStorageService storage)
        {
            _db = db;
            _storage = storage;
        }

        public async Task<Submission?> SubmitAsync(int studentId, SubmitRequest req)
        {
            var assignment = await _db.Assignments.Include(a => a.Subject).FirstOrDefaultAsync(a => a.Id == req.AssignmentId);
            if (assignment == null) throw new InvalidOperationException("Assignment not found");

            if (assignment.Status != "Published") throw new InvalidOperationException("Assignment is not published");

            // check student class matches assignment's subject's class
            var student = await _db.Users.FindAsync(studentId);
            if (student == null) throw new InvalidOperationException("Student not found");
            if (student.ClassId == null) throw new InvalidOperationException("Student has no class assigned");
            if (assignment.Subject.ClassId != student.ClassId) throw new UnauthorizedAccessException("Student not allowed to submit for this assignment");

            // check deadline
            if (DateTime.UtcNow > assignment.Deadline) throw new InvalidOperationException("Submission rejected: after the assignment deadline");

            // check existing submission
            var existing = await _db.Submissions.FirstOrDefaultAsync(s => s.AssignmentId == req.AssignmentId && s.StudentId == studentId);
            if (existing != null) throw new InvalidOperationException("Submission already exists");

            var submission = new Submission
            {
                AssignmentId = req.AssignmentId,
                StudentId = studentId,
                Content = req.Content,
                SubmittedAt = DateTime.UtcNow,
                SubmissionStatus = "Submitted",
                GradingStatus = "Pending"
            };
            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync();
            return submission;
        }

        public async Task<Submission?> UpdateSubmissionAsync(int studentId, int submissionId, UpdateSubmissionRequest req)
        {
            var s = await _db.Submissions.Include(x => x.Assignment).FirstOrDefaultAsync(x => x.Id == submissionId);
            if (s == null) return null;
            if (s.StudentId != studentId) return null;
            if (DateTime.UtcNow > s.Assignment.Deadline) throw new InvalidOperationException("Cannot update submission after deadline");
            s.Content = req.Content;
            s.SubmittedAt = DateTime.UtcNow;
            s.SubmissionStatus = s.SubmittedAt > s.Assignment.Deadline ? "Late" : "Submitted";
            s.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return s;
        }

        public async Task<List<Submission>> GetMySubmissionsAsync(int studentId)
        {
            return await _db.Submissions.Where(s => s.StudentId == studentId).Include(s => s.Assignment).AsNoTracking().ToListAsync();
        }

        public async Task<List<Submission>> GetSubmissionsForAssignmentAsync(int teacherId, int assignmentId)
        {
            var assignment = await _db.Assignments.FindAsync(assignmentId);
            if (assignment == null) throw new InvalidOperationException("Assignment not found");
            if (assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Teacher not allowed to view submissions for this assignment");
            return await _db.Submissions.Where(s => s.AssignmentId == assignmentId).Include(s => s.Student).AsNoTracking().ToListAsync();
        }

        public async Task<Submission?> GradeSubmissionAsync(int teacherId, int submissionId, GradeRequest req)
        {
            var s = await _db.Submissions.Include(s => s.Assignment).FirstOrDefaultAsync(s => s.Id == submissionId);
            if (s == null) return null;
            if (s.Assignment.TeacherId != teacherId) throw new UnauthorizedAccessException("Teacher not allowed to grade this submission");
            if (req.Marks > s.Assignment.MaxMarks) throw new InvalidOperationException($"Marks cannot exceed assignment max marks ({s.Assignment.MaxMarks})");
            s.Marks = req.Marks;
            s.Feedback = req.Feedback;
            s.GradingStatus = "Graded";
            s.GradedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return s;
        }

        public async Task<Submission?> GetSubmissionByIdAsync(int userId, int submissionId)
        {
            var s = await _db.Submissions.Include(s => s.Assignment).Include(s => s.Student).FirstOrDefaultAsync(s => s.Id == submissionId);
            if (s == null) return null;
            // if student, allow only own; if teacher, allow if own assignment; if admin, allow all
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return null;
            if (user.Role == "Admin") return s;
            if (user.Role == "Student" && s.StudentId == userId) return s;
            if (user.Role == "Teacher" && s.Assignment.TeacherId == userId) return s;
            return null;
        }

        public async Task<List<Submission>> GetAllAsync()
        {
            return await _db.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> UploadSubmissionFileAsync(int studentId, int submissionId, IFormFile file)
        {
            var s = await _db.Submissions.Include(x => x.Assignment).FirstOrDefaultAsync(x => x.Id == submissionId);
            if (s == null || s.StudentId != studentId) return false;

            if (s.Assignment.Status != "Published") throw new InvalidOperationException("Assignment is not published");
            if (DateTime.UtcNow > s.Assignment.Deadline) throw new InvalidOperationException("Cannot upload submission after deadline");

            if (file == null || file.Length == 0) throw new InvalidOperationException("File is required");

            var relativePath = await _storage.SaveAsync(file, Path.Combine("submissions", submissionId.ToString()));
            var oldPath = s.FilePath;

            s.FilePath = relativePath;
            s.FileName = Path.GetFileName(file.FileName);
            s.FileContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
            s.FileSize = file.Length;
            s.SubmittedAt = DateTime.UtcNow;
            s.SubmissionStatus = s.SubmittedAt > s.Assignment.Deadline ? "Late" : "Submitted";
            s.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _storage.Delete(oldPath);
            return true;
        }

        public async Task<StoredFileInfo?> GetSubmissionFileAsync(int userId, int submissionId)
        {
            var s = await _db.Submissions.Include(x => x.Assignment).Include(x => x.Student).FirstOrDefaultAsync(x => x.Id == submissionId);
            if (s == null || string.IsNullOrEmpty(s.FilePath)) return null;

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return null;

            if (user.Role == "Admin") { /* allowed */ }
            else if (user.Role == "Student")
            {
                if (s.StudentId != userId) return null;
            }
            else if (user.Role == "Teacher")
            {
                if (s.Assignment.TeacherId != userId) return null;
            }
            else return null;

            var fullPath = _storage.GetFullPath(s.FilePath);
            if (!File.Exists(fullPath)) return null;

            return new StoredFileInfo
            {
                FullPath = fullPath,
                FileName = s.FileName ?? Path.GetFileName(s.FilePath),
                ContentType = s.FileContentType ?? "application/octet-stream",
                Length = s.FileSize ?? new FileInfo(fullPath).Length
            };
        }
    }
}
