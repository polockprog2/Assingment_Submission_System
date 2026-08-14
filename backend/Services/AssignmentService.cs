using AssignmentSystemApi.Common;
using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.Assignments;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly AppDbContext _db;
        private readonly IFileStorageService _storage;

        public AssignmentService(AppDbContext db, IFileStorageService storage)
        {
            _db = db;
            _storage = storage;
        }

        public async Task<Assignment?> CreateAsync(int teacherId, AssignmentCreateRequest dto)
        {
            // verify teacher assigned to subject
            var tsa = await _db.TeacherSubjectAssignments.AnyAsync(t => t.TeacherId == teacherId && t.SubjectId == dto.SubjectId);
            if (!tsa) return null;

            var assignment = new Assignment
            {
                Title = dto.Title,
                Description = dto.Description,
                Deadline = dto.Deadline,
                MaxMarks = dto.MaxMarks,
                SubjectId = dto.SubjectId,
                TeacherId = teacherId,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow
            };
            _db.Assignments.Add(assignment);
            await _db.SaveChangesAsync();
            return assignment;
        }

        public async Task<List<Assignment>> GetByTeacherAsync(int teacherId)
        {
            return await _db.Assignments.Where(a => a.TeacherId == teacherId).ToListAsync();
        }

        public async Task<List<Subject>> GetTeacherSubjectsAsync(int teacherId)
        {
            return await _db.TeacherSubjectAssignments
                .Where(t => t.TeacherId == teacherId)
                .Include(t => t.Subject)
                .ThenInclude(s => s.Class)
                .AsNoTracking()
                .Select(t => t.Subject)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetAvailableForStudentAsync(int studentId)
        {
            var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
            if (student == null || student.ClassId == null) return new List<Assignment>();
            return await _db.Assignments
                .Include(a => a.Subject)
                .AsNoTracking()
                .Where(a => a.Status == "Published"
                    && a.Subject.ClassId == student.ClassId
                    && a.Deadline > DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task<Assignment?> GetByIdAsync(int teacherId, int id)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return null;
            return a;
        }

        public async Task<bool> UpdateAsync(int teacherId, int id, AssignmentUpdateRequest dto)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return false;
            if (dto.Title != null) a.Title = dto.Title;
            if (dto.Description != null) a.Description = dto.Description;
            if (dto.Deadline.HasValue) a.Deadline = dto.Deadline.Value;
            if (dto.MaxMarks.HasValue) a.MaxMarks = dto.MaxMarks.Value;
            if (dto.SubjectId.HasValue) a.SubjectId = dto.SubjectId.Value;
            a.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int teacherId, int id)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return false;
            _db.Assignments.Remove(a);
            await _db.SaveChangesAsync();
            _storage.Delete(a.FilePath);
            return true;
        }

        public async Task<bool> PublishAsync(int teacherId, int id)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return false;
            a.Status = "Published";
            a.PublishedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UploadFileAsync(int teacherId, int id, IFormFile file)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return false;

            var relativePath = await _storage.SaveAsync(file, Path.Combine("assignments", id.ToString()));
            var oldPath = a.FilePath;

            a.FilePath = relativePath;
            a.FileName = Path.GetFileName(file.FileName);
            a.FileContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
            a.FileSize = file.Length;
            a.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _storage.Delete(oldPath);
            return true;
        }

        public async Task<StoredFileInfo?> GetAssignmentFileAsync(int userId, int id)
        {
            var a = await _db.Assignments.Include(x => x.Subject).FirstOrDefaultAsync(x => x.Id == id);
            if (a == null || string.IsNullOrEmpty(a.FilePath)) return null;

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return null;

            if (user.Role == "Admin") { /* allowed */ }
            else if (user.Role == "Teacher")
            {
                if (a.TeacherId != userId) return null;
            }
            else if (user.Role == "Student")
            {
                if (user.ClassId == null || a.Subject.ClassId != user.ClassId) return null;
            }
            else return null;

            var fullPath = _storage.GetFullPath(a.FilePath);
            if (!File.Exists(fullPath)) return null;

            return new StoredFileInfo
            {
                FullPath = fullPath,
                FileName = a.FileName ?? Path.GetFileName(a.FilePath),
                ContentType = a.FileContentType ?? "application/octet-stream",
                Length = a.FileSize ?? new FileInfo(fullPath).Length
            };
        }

        public async Task<bool> DeleteFileAsync(int teacherId, int id)
        {
            var a = await _db.Assignments.FindAsync(id);
            if (a == null || a.TeacherId != teacherId) return false;

            _storage.Delete(a.FilePath);
            a.FilePath = null;
            a.FileName = null;
            a.FileContentType = null;
            a.FileSize = null;
            a.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
