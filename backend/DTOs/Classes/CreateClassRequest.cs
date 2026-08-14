using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.Classes
{
    public class CreateClassRequest
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Name must be 1-100 characters")]
        public string Name { get; set; } = null!;
    }
}
