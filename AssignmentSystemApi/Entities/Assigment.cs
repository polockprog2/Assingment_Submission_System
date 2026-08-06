namespace AssignmentSystemApi.Entities
{
    public class Assignment
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public System.DateTime Deadline { get; set; }
        public int MaxMarks { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Published
        public int SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;
        public int TeacherId { get; set; }
        public User Teacher { get; set; } = null!;
        public System.DateTime CreatedAt { get; set; }
        public System.DateTime? PublishedAt { get; set; }
        public System.DateTime? UpdatedAt { get; set; }
    }
}
