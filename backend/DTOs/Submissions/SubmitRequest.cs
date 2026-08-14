using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Submissions
{
    public class SubmitRequest
    {
        [Range(1, int.MaxValue, ErrorMessage = "AssignmentId must be a positive integer")]
        public int AssignmentId { get; set; }

        [StringLength(5000, ErrorMessage = "Content must be at most 5000 characters")]
        public string? Content { get; set; }
    }
}
