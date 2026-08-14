namespace AssignmentSystemApi.DTOs.Auth
{
    public class LoginResponse
    {
        public string Token { get; set; } = null!;
        public string TokenType { get; set; } = "Bearer";
        public long ExpiresIn { get; set; }
    }
}
