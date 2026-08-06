using AssignmentSystemApi.DTOs.Auth;

namespace AssignmentSystemApi.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse?> AuthenticateAsync(LoginRequest request);
        string HashPassword(string plain);
    }
}
