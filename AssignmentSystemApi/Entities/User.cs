namespace AssignmentSystemApi.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = null!; // Admin, Teacher, Student
        public int? ClassId { get; set; } // only set for Students
        public Class? Class { get; set; }
        public System.DateTime CreatedAt { get; set; }
    }
}
