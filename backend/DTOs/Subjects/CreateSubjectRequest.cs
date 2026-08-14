using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Subjects
{
    public class CreateSubjectRequest
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Name must be 1-100 characters")]
        public string Name { get; set; } = null!;

        [Range(1, int.MaxValue, ErrorMessage = "ClassId must be a positive integer")]
        public int ClassId { get; set; }
    }
}
