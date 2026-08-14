using AssignmentSystemApi.DTOs.Users;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Controllers
    {
        [Route("api/users")]
        [ApiController]
        [Authorize(Roles = "Admin")]
        public class UserController : ControllerBase
    {
        private readonly Services.Interfaces.IAuthService _auth;
        private readonly AssignmentSystemApi.Data.AppDbContext _db;

        public UserController(Services.Interfaces.IAuthService auth, AssignmentSystemApi.Data.AppDbContext db)
        {
            _auth = auth;
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        {
            if (_db.Users.Any(u => u.Email.ToLower() == req.Email.ToLower()))
                return Conflict(new { error = "Email already exists" });

            var user = new User
            {
                Email = req.Email,
                PasswordHash = _auth.HashPassword(req.Password),
                Role = req.Role,
                ClassId = req.ClassId
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return Ok(new { id = user.Id, email = user.Email, role = user.Role });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.Users.AsNoTracking();
            var total = await query.CountAsync();
            var items = await query
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new { u.Id, u.Email, u.Role, u.ClassId })
                .ToListAsync();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<object>
            {
                Items = items.Cast<object>().ToList(),
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var user = await _db.Users.AsNoTracking().Where(u => u.Id == id).Select(u => new { u.Id, u.Email, u.Role, u.ClassId }).FirstOrDefaultAsync();
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateUserRequest req)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.Email = req.Email ?? user.Email;
            if (!string.IsNullOrWhiteSpace(req.Password)) user.PasswordHash = _auth.HashPassword(req.Password);
            user.Role = req.Role ?? user.Role;
            user.ClassId = req.ClassId;
            await _db.SaveChangesAsync();
            return Ok(new { id = user.Id, email = user.Email, role = user.Role });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }
    }
}
