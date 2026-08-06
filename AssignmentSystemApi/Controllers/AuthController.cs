using AssignmentSystemApi.DTOs.Auth;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        public AuthController(IAuthService auth)
        {
            _auth = auth;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var res = await _auth.AuthenticateAsync(req);
            if (res == null) return Unauthorized(new { error = "Invalid credentials" });
            return Ok(res);
        }
    }
}
