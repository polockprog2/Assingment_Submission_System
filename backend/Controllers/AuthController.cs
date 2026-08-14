using AssignmentSystemApi.DTOs.Auth;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly AssignmentSystemApi.Data.AppDbContext _db;

        public AuthController(IAuthService auth, AssignmentSystemApi.Data.AppDbContext db)
        {
            _auth = auth;
            _db = db;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var res = await _auth.AuthenticateAsync(req);
            if (res == null) return Unauthorized(new { error = "Invalid credentials" });
            return Ok(res);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            // Self-registration only for Students
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { error = "Email and password are required" });

            var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower());
            if (exists) return Conflict(new { error = "Email already exists" });

            var user = new AssignmentSystemApi.Entities.User
            {
                Email = req.Email,
                PasswordHash = _auth.HashPassword(req.Password),
                Role = "Student",
                ClassId = req.ClassId
            };

            // If Student role, require ClassId
            if (user.Role == "Student" && user.ClassId == null)
                return BadRequest(new { error = "classId is required for students" });

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return Ok(new { id = user.Id, email = user.Email, role = user.Role });
        }
    }
}
