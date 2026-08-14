using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.TeacherSubjectAssignments;
using AssignmentSystemApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/teacher-subject-assignments")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class TeacherSubjectAssignmentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TeacherSubjectAssignmentsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.TeacherSubjectAssignments
                .Include(t => t.Teacher)
                .Include(t => t.Subject)
                .AsNoTracking();
            var total = await query.CountAsync();
            var items = await query
                .OrderBy(t => t.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<TeacherSubjectAssignment>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTsaRequest req)
        {
            // validate teacher exists and is Teacher role
            var teacher = await _db.Users.FindAsync(req.TeacherId);
            if (teacher == null || teacher.Role != "Teacher") return BadRequest(new { error = "TeacherId invalid or not a Teacher" });
            var subject = await _db.Subjects.FindAsync(req.SubjectId);
            if (subject == null) return BadRequest(new { error = "SubjectId invalid" });
            var exists = await _db.TeacherSubjectAssignments.AnyAsync(t => t.TeacherId == req.TeacherId && t.SubjectId == req.SubjectId);
            if (exists) return Conflict(new { error = "Assignment already exists" });

            var tsa = new TeacherSubjectAssignment { TeacherId = req.TeacherId, SubjectId = req.SubjectId };
            _db.TeacherSubjectAssignments.Add(tsa);
            await _db.SaveChangesAsync();
            return Ok(tsa);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tsa = await _db.TeacherSubjectAssignments.FindAsync(id);
            if (tsa == null) return NotFound();
            _db.TeacherSubjectAssignments.Remove(tsa);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Teacher-Subject assignment deleted successfully" });
        }
    }
}
