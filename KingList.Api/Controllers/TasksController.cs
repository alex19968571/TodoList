using KingList.Api.Models;
using KingList.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace KingList.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController(FirebaseService fb) : ControllerBase
{
    private string Uid => HttpContext.Items["Uid"]?.ToString()!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var snap = await fb.Db.Collection("users").Document(Uid).GetSnapshotAsync();
        if (!snap.Exists) return Ok(Array.Empty<TaskItem>());

        var d = snap.ToDictionary();
        if (!d.TryGetValue("tasks", out var raw) || raw is not List<object> list)
            return Ok(Array.Empty<TaskItem>());

        return Ok(list.OfType<Dictionary<string, object>>()
                      .Select(UsersController.MapTask));
    }

    [HttpPut]
    public async Task<IActionResult> SaveAll([FromBody] List<TaskItem> tasks)
    {
        await fb.Db.Collection("users").Document(Uid)
                   .SetAsync(new Dictionary<string, object> { ["tasks"] = tasks },
                             Google.Cloud.Firestore.SetOptions.MergeAll);
        return NoContent();
    }

    [HttpPut("trash")]
    public async Task<IActionResult> SaveTrash([FromBody] List<TaskItem> trash)
    {
        await fb.Db.Collection("users").Document(Uid)
                   .SetAsync(new Dictionary<string, object> { ["trash"] = trash },
                             Google.Cloud.Firestore.SetOptions.MergeAll);
        return NoContent();
    }
}
