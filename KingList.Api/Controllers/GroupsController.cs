using Google.Cloud.Firestore;
using KingList.Api.Models;
using KingList.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace KingList.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController(FirebaseService fb) : ControllerBase
{
    private string Uid   => HttpContext.Items["Uid"]?.ToString()!;
    private string Email => HttpContext.Items["Email"]?.ToString() ?? "";

    // ── GET group info ──────────────────────────────────────────────────────
    [HttpGet("{groupId}")]
    public async Task<IActionResult> GetGroup(string groupId)
    {
        var snap = await fb.Db.Collection("groups").Document(groupId).GetSnapshotAsync();
        if (!snap.Exists) return NotFound();
        return Ok(MapGroup(snap.ToDictionary(), groupId));
    }

    // ── GET group tasks ─────────────────────────────────────────────────────
    [HttpGet("{groupId}/tasks")]
    public async Task<IActionResult> GetTasks(string groupId)
    {
        var snaps = await fb.Db.Collection("groups").Document(groupId)
                               .Collection("tasks").GetSnapshotAsync();
        var tasks = snaps.Documents
            .Select(d => UsersController.MapTask(d.ToDictionary()) with { Id = d.Id })
            .ToList();
        return Ok(tasks);
    }

    // ── ADD group task ──────────────────────────────────────────────────────
    [HttpPost("{groupId}/tasks")]
    public async Task<IActionResult> AddTask(string groupId, [FromBody] TaskItem task)
    {
        task.CreatedBy = Uid;
        task.UpdatedBy = Uid;
        task.UpdatedAt = DateTime.UtcNow;
        var ref_ = await fb.Db.Collection("groups").Document(groupId)
                               .Collection("tasks").AddAsync(TaskToDict(task));
        task.Id = ref_.Id;
        return Ok(task);
    }

    // ── UPDATE group task ───────────────────────────────────────────────────
    [HttpPut("{groupId}/tasks/{taskId}")]
    public async Task<IActionResult> UpdateTask(string groupId, string taskId, [FromBody] TaskItem task)
    {
        task.UpdatedBy = Uid;
        task.UpdatedAt = DateTime.UtcNow;
        await fb.Db.Collection("groups").Document(groupId)
                   .Collection("tasks").Document(taskId).SetAsync(TaskToDict(task));
        return NoContent();
    }

    // ── DELETE group task ───────────────────────────────────────────────────
    [HttpDelete("{groupId}/tasks/{taskId}")]
    public async Task<IActionResult> DeleteTask(string groupId, string taskId)
    {
        await fb.Db.Collection("groups").Document(groupId)
                   .Collection("tasks").Document(taskId).DeleteAsync();
        return NoContent();
    }

    // ── CREATE group ────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
    {
        var code = GenerateCode();
        var groupRef = fb.Db.Collection("groups").Document();
        var batch = fb.Db.StartBatch();

        var members = new Dictionary<string, object>
        {
            [Uid] = new { email = Email, role = "owner", joinedAt = DateTime.UtcNow }
        };
        batch.Set(groupRef, new Dictionary<string, object>
        {
            ["name"] = dto.Name, ["inviteCode"] = code,
            ["createdBy"] = Uid, ["members"] = members
        });
        batch.Set(fb.Db.Collection("groupCodes").Document(code),
            new Dictionary<string, object> { ["groupId"] = groupRef.Id });
        batch.Update(fb.Db.Collection("users").Document(Uid),
            new Dictionary<string, object>
            {
                ["groups"] = FieldValue.ArrayUnion(groupRef.Id)
            });

        await batch.CommitAsync();
        return Ok(new { groupId = groupRef.Id, inviteCode = code });
    }

    // ── JOIN group ──────────────────────────────────────────────────────────
    [HttpPost("join")]
    public async Task<IActionResult> JoinGroup([FromBody] JoinGroupDto dto)
    {
        var codeSnap = await fb.Db.Collection("groupCodes")
                                   .Document(dto.InviteCode.ToUpper()).GetSnapshotAsync();
        if (!codeSnap.Exists) return BadRequest("邀請碼不存在");

        var groupId = codeSnap.GetValue<string>("groupId");
        var memberField = $"members.{Uid}";
        await fb.Db.Collection("groups").Document(groupId)
                   .UpdateAsync(new Dictionary<string, object>
                   {
                       [memberField] = new { email = Email, role = "member", joinedAt = DateTime.UtcNow }
                   });
        await fb.Db.Collection("users").Document(Uid)
                   .UpdateAsync(new Dictionary<string, object>
                   {
                       ["groups"] = FieldValue.ArrayUnion(groupId)
                   });
        return Ok(new { groupId });
    }

    // ── LEAVE group ─────────────────────────────────────────────────────────
    [HttpDelete("{groupId}/members/me")]
    public async Task<IActionResult> LeaveGroup(string groupId)
    {
        var memberField = $"members.{Uid}";
        await fb.Db.Collection("groups").Document(groupId)
                   .UpdateAsync(new Dictionary<string, object>
                   {
                       [memberField] = FieldValue.Delete
                   });
        await fb.Db.Collection("users").Document(Uid)
                   .UpdateAsync(new Dictionary<string, object>
                   {
                       ["groups"] = FieldValue.ArrayRemove(groupId)
                   });
        return NoContent();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
    }

    private static Group MapGroup(Dictionary<string, object> d, string id) => new()
    {
        Id         = id,
        Name       = d.GetValueOrDefault("name")?.ToString() ?? "",
        InviteCode = d.GetValueOrDefault("inviteCode")?.ToString() ?? "",
        CreatedBy  = d.GetValueOrDefault("createdBy")?.ToString() ?? "",
        Members    = d.TryGetValue("members", out var m) && m is Dictionary<string, object> md
            ? md.ToDictionary(kv => kv.Key, kv =>
            {
                var mv = kv.Value as Dictionary<string, object> ?? [];
                return new GroupMember
                {
                    Email = mv.GetValueOrDefault("email")?.ToString() ?? "",
                    Role  = mv.GetValueOrDefault("role")?.ToString() ?? "member"
                };
            }) : []
    };

    private static Dictionary<string, object> TaskToDict(TaskItem t) => new()
    {
        ["id"]                 = t.Id,
        ["text"]               = t.Text,
        ["description"]        = t.Description,
        ["date"]               = t.Date,
        ["startTime"]          = t.StartTime ?? "",
        ["deadline"]           = t.Deadline ?? "",
        ["priority"]           = t.Priority,
        ["tags"]               = t.Tags,
        ["completed"]          = t.Completed,
        ["isOverdue"]          = t.IsOverdue,
        ["reminderType"]       = t.ReminderType,
        ["calculatedReminder"] = t.CalculatedReminder ?? "",
        ["location"]           = t.Location,
        ["createdBy"]          = t.CreatedBy ?? "",
        ["updatedBy"]          = t.UpdatedBy ?? "",
        ["updatedAt"]          = t.UpdatedAt ?? DateTime.UtcNow,
    };
}

public record CreateGroupDto(string Name);
public record JoinGroupDto(string InviteCode);
