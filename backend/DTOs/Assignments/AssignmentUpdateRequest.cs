using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Assignments
{
    public class AssignmentUpdateRequest
    {
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be 1-200 characters")]
        public string? Title { get; set; }

        [StringLength(5000, ErrorMessage = "Description must be at most 5000 characters")]
        public string? Description { get; set; }

        public System.DateTime? Deadline { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "MaxMarks must be a positive integer")]
        public int? MaxMarks { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "SubjectId must be a positive integer")]
        public int? SubjectId { get; set; }
    }
}
