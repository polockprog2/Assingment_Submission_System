namespace AssignmentSystemApi.DTOs.Users
{
    public class CreateUserRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = "Student"; // Admin, Teacher, Student
        public int? ClassId { get; set; }
    }
}
