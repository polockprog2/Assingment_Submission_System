using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Submissions
{
    public class UpdateSubmissionRequest
    {
        [StringLength(5000, ErrorMessage = "Content must be at most 5000 characters")]
        public string? Content { get; set; }
    }
}
