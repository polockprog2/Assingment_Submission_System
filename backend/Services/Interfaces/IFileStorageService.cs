using Microsoft.AspNetCore.Http;

namespace AssignmentSystemApi.Services.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveAsync(IFormFile file, string subfolder);
        void Delete(string? relativePath);
        string GetFullPath(string relativePath);
    }
}
