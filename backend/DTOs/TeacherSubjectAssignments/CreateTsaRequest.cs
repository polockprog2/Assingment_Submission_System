using System.ComponentModel.DataAnnotations;

namespace AssignmentSystemApi.DTOs.TeacherSubjectAssignments
{
    public class CreateTsaRequest
    {
        [Range(1, int.MaxValue, ErrorMessage = "TeacherId must be a positive integer")]
        public int TeacherId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "SubjectId must be a positive integer")]
        public int SubjectId { get; set; }
    }
}
