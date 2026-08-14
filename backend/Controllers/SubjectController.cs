using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.Subjects;
using AssignmentSystemApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/subjects")]
    [ApiController]
    public class SubjectController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SubjectController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.Subjects.Include(s => s.Class).AsNoTracking();
            var total = await query.CountAsync();
            var items = await query
                .OrderBy(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<Subject>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Get(int id)
        {
            var item = await _db.Subjects.Include(s => s.Class).FirstOrDefaultAsync(s => s.Id == id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateSubjectRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Name is required" });
            var classExists = await _db.Classes.AnyAsync(c => c.Id == req.ClassId);
            if (!classExists) return BadRequest(new { error = "ClassId invalid" });

            var exists = await _db.Subjects.AnyAsync(s => s.Name.ToLower() == req.Name.ToLower() && s.ClassId == req.ClassId);
            if (exists) return Conflict(new { error = "Subject with same name exists for class" });

            var subj = new Subject { Name = req.Name, ClassId = req.ClassId };
            _db.Subjects.Add(subj);
            await _db.SaveChangesAsync();
            return Ok(subj);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateSubjectRequest req)
        {
            var subj = await _db.Subjects.FindAsync(id);
            if (subj == null) return NotFound();
            subj.Name = req.Name ?? subj.Name;
            subj.ClassId = req.ClassId;
            await _db.SaveChangesAsync();
            return Ok(subj);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var subj = await _db.Subjects.FindAsync(id);
            if (subj == null) return NotFound();
            _db.Subjects.Remove(subj);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Subject deleted successfully" });
        }
    }
}
