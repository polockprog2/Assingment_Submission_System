namespace AssignmentSystemApi.Entities
{
    public class Submission
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public Assignment Assignment { get; set; } = null!;
        public int StudentId { get; set; }
        public User Student { get; set; } = null!;
        public string? Content { get; set; }
        public System.DateTime SubmittedAt { get; set; }
        public string SubmissionStatus { get; set; } = "Submitted"; // Submitted, Late
        public string GradingStatus { get; set; } = "Pending"; // Pending, Graded
        public int? Marks { get; set; }
        public string? Feedback { get; set; }
        public System.DateTime? GradedAt { get; set; }
        public System.DateTime? UpdatedAt { get; set; }
    }
}
