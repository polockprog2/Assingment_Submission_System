using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AssignmentSystemApi.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string[] _allowedExtensions;
        private readonly string _uploadsRoot;
        private readonly long _maxFileSizeBytes;

        public FileStorageService(Microsoft.AspNetCore.Hosting.IWebHostEnvironment env, IConfiguration config)
        {
            var storageCfg = config.GetSection("Storage");
            var configuredExts = storageCfg.GetSection("AllowedExtensions").Get<string[]>();
            _allowedExtensions = configuredExts != null && configuredExts.Length > 0
                ? configuredExts.Select(e => e.ToLowerInvariant().StartsWith(".") ? e.ToLowerInvariant() : "." + e.ToLowerInvariant()).ToArray()
                : new[] { ".pdf", ".docx" };

            var maxMb = storageCfg["MaxFileSizeMb"];
            _maxFileSizeBytes = long.TryParse(maxMb, out var mb) ? mb * 1024 * 1024 : 50L * 1024 * 1024;

            var root = storageCfg["UploadsRoot"] ?? "uploads";
            _uploadsRoot = Path.IsPathRooted(root) ? root : Path.Combine(env.ContentRootPath, root);
        }

        public string GetFullPath(string relativePath)
        {
            var fullPath = Path.GetFullPath(Path.Combine(_uploadsRoot, relativePath));

            var root = Path.GetFullPath(_uploadsRoot);
            if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase) ||
                fullPath.Length == root.Length ||
                (fullPath[root.Length] != Path.DirectorySeparatorChar && fullPath[root.Length] != Path.AltDirectorySeparatorChar))
            {
                throw new InvalidOperationException("Resolved path escapes the uploads directory");
            }

            return fullPath;
        }

        public async Task<string> SaveAsync(IFormFile file, string subfolder)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(ext))
                throw new InvalidOperationException($"File type not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");

            if (file.Length <= 0)
                throw new InvalidOperationException("File is empty");
            if (file.Length > _maxFileSizeBytes)
                throw new InvalidOperationException($"File exceeds maximum size of {_maxFileSizeBytes / (1024 * 1024)} MB");

            var storedName = $"{Guid.NewGuid():N}{ext}";
            var relative = Path.Combine(subfolder, storedName);
            var fullPath = GetFullPath(relative);
            var folder = Path.GetDirectoryName(fullPath);
            if (folder != null)
            {
                Directory.CreateDirectory(folder);
            }

            await using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await file.CopyToAsync(stream);
            }

            return relative;
        }

        public void Delete(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return;
            var fullPath = GetFullPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }
}
