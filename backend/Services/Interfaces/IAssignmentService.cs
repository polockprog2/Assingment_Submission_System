using AssignmentSystemApi.Common;
using AssignmentSystemApi.DTOs.Assignments;
using AssignmentSystemApi.Entities;
using Microsoft.AspNetCore.Http;

namespace AssignmentSystemApi.Services.Interfaces
{
    public interface IAssignmentService
    {
        Task<Assignment?> CreateAsync(int teacherId, AssignmentCreateRequest dto);
        Task<List<Assignment>> GetByTeacherAsync(int teacherId);
        Task<List<Subject>> GetTeacherSubjectsAsync(int teacherId);
        Task<List<Assignment>> GetAvailableForStudentAsync(int studentId);
        Task<Assignment?> GetByIdAsync(int teacherId, int id);
        Task<bool> UpdateAsync(int teacherId, int id, AssignmentUpdateRequest dto);
        Task<bool> DeleteAsync(int teacherId, int id);
        Task<bool> PublishAsync(int teacherId, int id);
        Task<bool> UploadFileAsync(int teacherId, int id, IFormFile file);
        Task<StoredFileInfo?> GetAssignmentFileAsync(int userId, int id);
        Task<bool> DeleteFileAsync(int teacherId, int id);
    }
}

