using AssignmentSystemApi.Data;
//using AssignmentSystemApi.Data;
using AssignmentSystemApi.DTOs.Auth;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AssignmentSystemApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;

        public AuthService(AppDbContext db, IConfiguration cfg)
        {
            _db = db;
            _cfg = cfg;
        }

        public string HashPassword(string plain)
        {
            return BCrypt.Net.BCrypt.HashPassword(plain);
        }

        public async Task<LoginResponse?> AuthenticateAsync(LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (user == null) return null;

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return null;

            var token = GenerateJwtToken(user);
            return new LoginResponse
            {
                Token = token,
                ExpiresIn = long.Parse(_cfg["Jwt:ExpiresMinutes"] ?? "60") * 60
            };
        }

        private string GenerateJwtToken(User user)
        {
            var key = _cfg["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured");
            var issuer = _cfg["Jwt:Issuer"] ?? "AssignmentSystemApi";
            var audience = _cfg["Jwt:Audience"] ?? "AssignmentSystemApiUsers";
            var expiresMinutes = int.Parse(_cfg["Jwt:ExpiresMinutes"] ?? "60");

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            };

            var keyBytes = Encoding.UTF8.GetBytes(key);
            var securityKey = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
