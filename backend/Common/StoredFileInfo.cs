namespace AssignmentSystemApi.Common
{
    public class StoredFileInfo
    {
        public string FullPath { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public string ContentType { get; set; } = "application/octet-stream";
        public long Length { get; set; }
    }
}
