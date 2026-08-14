using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Submissions
{
    public class GradeRequest
    {
        [Range(0, int.MaxValue, ErrorMessage = "Marks must be a non-negative integer")]
        public int Marks { get; set; }

        [StringLength(2000, ErrorMessage = "Feedback must be at most 2000 characters")]
        public string? Feedback { get; set; }
    }
}
