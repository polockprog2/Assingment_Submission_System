using AssignmentSystemApi.Common;
using AssignmentSystemApi.DTOs.Submissions;
using AssignmentSystemApi.Entities;
using Microsoft.AspNetCore.Http;

namespace AssignmentSystemApi.Services.Interfaces
{
    public interface ISubmissionService
    {
        Task<Submission?> SubmitAsync(int studentId, SubmitRequest req);
        Task<Submission?> UpdateSubmissionAsync(int studentId, int submissionId, UpdateSubmissionRequest req);
        Task<List<Submission>> GetMySubmissionsAsync(int studentId);
        Task<List<Submission>> GetSubmissionsForAssignmentAsync(int teacherId, int assignmentId);
        Task<Submission?> GradeSubmissionAsync(int teacherId, int submissionId, GradeRequest req);
        Task<Submission?> GetSubmissionByIdAsync(int userId, int submissionId); // for student view
        Task<List<Submission>> GetAllAsync();
        Task<bool> UploadSubmissionFileAsync(int studentId, int submissionId, IFormFile file);
        Task<StoredFileInfo?> GetSubmissionFileAsync(int userId, int submissionId);
    }
}