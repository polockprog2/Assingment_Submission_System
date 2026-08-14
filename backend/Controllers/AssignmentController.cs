using AssignmentSystemApi.DTOs.Assignments;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/assignments")]
    [ApiController]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentService _service;

        public AssignmentController(IAssignmentService service)
        {
            _service = service;
        }

        private int GetUserIdFromClaims()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(sub!);
        }

        [HttpPost]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Create([FromBody] AssignmentCreateRequest req)
        {
            var teacherId = GetUserIdFromClaims();
            var created = await _service.CreateAsync(teacherId, req);
            if (created == null) return Forbid();
            return Ok(created);
        }

        [HttpGet]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetMine(int page = 1, int pageSize = 20)
        {
            var teacherId = GetUserIdFromClaims();
            var list = await _service.GetByTeacherAsync(teacherId);
            var total = list.Count;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var items = list
                .OrderBy(a => a.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<AssignmentSystemApi.Entities.Assignment>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("available")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetAvailable(int page = 1, int pageSize = 20)
        {
            var studentId = GetUserIdFromClaims();
            var list = await _service.GetAvailableForStudentAsync(studentId);
            var total = list.Count;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var items = list
                .OrderBy(a => a.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<AssignmentSystemApi.Entities.Assignment>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("subjects")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetMySubjects()
        {
            var teacherId = GetUserIdFromClaims();
            var subjects = await _service.GetTeacherSubjectsAsync(teacherId);
            return Ok(subjects);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Get(int id)
        {
            var teacherId = GetUserIdFromClaims();
            var a = await _service.GetByIdAsync(teacherId, id);
            if (a == null) return NotFound();
            return Ok(a);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Update(int id, [FromBody] AssignmentUpdateRequest req)
        {
            var teacherId = GetUserIdFromClaims();
            var ok = await _service.UpdateAsync(teacherId, id, req);
            if (!ok) return Forbid();
            return Ok(new { message = "Assignment updated successfully" });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Delete(int id)
        {
            var teacherId = GetUserIdFromClaims();
            var ok = await _service.DeleteAsync(teacherId, id);
            if (!ok) return Forbid();
            return Ok(new { message = "Assignment deleted successfully" });
        }

        [HttpPost("{id:int}/publish")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Publish(int id)
        {
            var teacherId = GetUserIdFromClaims();
            var ok = await _service.PublishAsync(teacherId, id);
            if (!ok) return Forbid();
            return Ok(new { message = "Assignment published successfully" });
        }

        [HttpPost("{id:int}/file")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> UploadFile(int id, [FromForm] IFormFile file)
        {
            var teacherId = GetUserIdFromClaims();
            try
            {
                var ok = await _service.UploadFileAsync(teacherId, id, file);
                if (!ok) return Forbid();
                return Ok(new { message = "Assignment file uploaded successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id:int}/file")]
        [Authorize(Roles = "Teacher,Student,Admin")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            var userId = GetUserIdFromClaims();
            var fileInfo = await _service.GetAssignmentFileAsync(userId, id);
            if (fileInfo == null) return NotFound();
            return PhysicalFile(fileInfo.FullPath, fileInfo.ContentType, fileInfo.FileName);
        }

        [HttpDelete("{id:int}/file")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> DeleteFile(int id)
        {
            var teacherId = GetUserIdFromClaims();
            var ok = await _service.DeleteFileAsync(teacherId, id);
            if (!ok) return Forbid();
            return Ok(new { message = "Assignment file removed successfully" });
        }
    }
}
