using AssignmentSystemApi.DTOs.Submissions;
using AssignmentSystemApi.Entities;
using AssignmentSystemApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AssignmentSystemApi.Controllers
{
    [Route("api/submissions")]
    [ApiController]
    public class SubmissionController : ControllerBase
    {
        private readonly ISubmissionService _service;

        public SubmissionController(ISubmissionService service)
        {
            _service = service;
        }

        private int GetUserIdFromClaims()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(sub!);
        }

        [Authorize(Roles = "Student")]
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] SubmitRequest req)
        {
            var studentId = GetUserIdFromClaims();
            try
            {
                var s = await _service.SubmitAsync(studentId, req);
                return Ok(s);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Student")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSubmissionRequest req)
        {
            var studentId = GetUserIdFromClaims();
            try
            {
                var s = await _service.UpdateSubmissionAsync(studentId, id, req);
                if (s == null) return NotFound();
                return Ok(s);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize(Roles = "Student")]
        [HttpGet("mine")]
        public async Task<IActionResult> MySubmissions()
        {
            var studentId = GetUserIdFromClaims();
            var list = await _service.GetMySubmissionsAsync(studentId);
            return Ok(list);
        }

        [Authorize(Roles = "Teacher")]
        [HttpGet("assignment/{assignmentId:int}")]
        public async Task<IActionResult> ForAssignment(int assignmentId)
        {
            var teacherId = GetUserIdFromClaims();
            try
            {
                var list = await _service.GetSubmissionsForAssignmentAsync(teacherId, assignmentId);
                return Ok(list);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Teacher")]
        [HttpPost("{id:int}/grade")]
        public async Task<IActionResult> Grade(int id, [FromBody] GradeRequest req)
        {
            var teacherId = GetUserIdFromClaims();
            try
            {
                var s = await _service.GradeSubmissionAsync(teacherId, id, req);
                if (s == null) return NotFound();
                return Ok(s);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Student")]
        [HttpPost("{id:int}/file")]
        public async Task<IActionResult> UploadFile(int id, [FromForm] IFormFile file)
        {
            var studentId = GetUserIdFromClaims();
            try
            {
                var ok = await _service.UploadSubmissionFileAsync(studentId, id, file);
                if (!ok) return Forbid();
                return Ok(new { message = "Submission file uploaded successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id:int}/file")]
        [Authorize(Roles = "Student,Teacher,Admin")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            var userId = GetUserIdFromClaims();
            var fileInfo = await _service.GetSubmissionFileAsync(userId, id);
            if (fileInfo == null) return NotFound();
            return PhysicalFile(fileInfo.FullPath, fileInfo.ContentType, fileInfo.FileName);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20)
        {
            var list = await _service.GetAllAsync();
            var total = list.Count;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var items = list
                .OrderBy(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new AssignmentSystemApi.Common.PagedResponse<Submission>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }
    }
}
