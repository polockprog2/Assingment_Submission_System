using AssignmentSystemApi.DTOs.Users;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/[controller]")]
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
        public IActionResult Create([FromBody] CreateUserRequest req)
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
            _db.SaveChanges();
            return Ok(new { id = user.Id, email = user.Email, role = user.Role });
        }
    }
}
