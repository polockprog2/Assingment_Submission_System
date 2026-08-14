using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.Classes;
using AssignmentSystemApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/classes")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ClassesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ClassesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.Classes.AsNoTracking();
            var total = await query.CountAsync();
            var items = await query
                .OrderBy(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<Class>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var item = await _db.Classes.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Name is required" });
            var exists = await _db.Classes.AnyAsync(c => c.Name.ToLower() == req.Name.ToLower());
            if (exists) return Conflict(new { error = "Class with same name exists" });
            var cls = new Class { Name = req.Name };
            _db.Classes.Add(cls);
            await _db.SaveChangesAsync();
            return Ok(cls);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateClassRequest req)
        {
            var cls = await _db.Classes.FindAsync(id);
            if (cls == null) return NotFound();
            cls.Name = req.Name ?? cls.Name;
            await _db.SaveChangesAsync();
            return Ok(cls);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cls = await _db.Classes.FindAsync(id);
            if (cls == null) return NotFound();
            _db.Classes.Remove(cls);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Class deleted successfully" });
        }
    }
}
