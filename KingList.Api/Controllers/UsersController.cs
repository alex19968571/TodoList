using Google.Cloud.Firestore;
using KingList.Api.Models;
using KingList.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace KingList.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController(FirebaseService fb) : ControllerBase
{
    private string Uid => HttpContext.Items["Uid"]?.ToString()!;

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var snap = await fb.Db.Collection("users").Document(Uid).GetSnapshotAsync();
        if (!snap.Exists) return Ok(new UserData());

        var data = snap.ToDictionary();
        return Ok(MapUserData(data));
    }

    [HttpPut("me")]
    public async Task<IActionResult> SaveMe([FromBody] UserData body)
    {
        var doc = fb.Db.Collection("users").Document(Uid);
        await doc.SetAsync(ToDict(body), SetOptions.MergeAll);
        return NoContent();
    }

    private static UserData MapUserData(Dictionary<string, object> d)
    {
        var ud = new UserData();
        if (d.TryGetValue("tasks", out var t))
            ud.Tasks = MapTasks(t);
        if (d.TryGetValue("trash", out var tr))
            ud.Trash = MapTasks(tr);
        if (d.TryGetValue("groupTrash", out var gt))
            ud.GroupTrash = MapTasks(gt);
        if (d.TryGetValue("groups", out var g) && g is List<object> gl)
            ud.Groups = gl.Select(x => x.ToString()!).ToList();
        if (d.TryGetValue("avatarUrl", out var av))
            ud.AvatarUrl = av?.ToString();
        if (d.TryGetValue("settings", out var s) && s is Dictionary<string, object> sd)
            ud.Settings = MapSettings(sd);
        return ud;
    }

    private static List<TaskItem> MapTasks(object raw)
    {
        if (raw is not List<object> list) return [];
        return list.OfType<Dictionary<string, object>>().Select(MapTask).ToList();
    }

    public static TaskItem MapTask(Dictionary<string, object> d)
    {
        return new TaskItem
        {
            Id          = d.GetValueOrDefault("id")?.ToString() ?? "",
            Text        = d.GetValueOrDefault("text")?.ToString() ?? "",
            Description = d.GetValueOrDefault("description")?.ToString() ?? "",
            Date        = d.GetValueOrDefault("date")?.ToString() ?? "",
            StartTime   = d.GetValueOrDefault("startTime")?.ToString(),
            Deadline    = d.GetValueOrDefault("deadline")?.ToString(),
            Priority    = d.GetValueOrDefault("priority")?.ToString() ?? "4",
            Tags        = d.TryGetValue("tags", out var tags) && tags is List<object> tl
                            ? tl.Select(x => x.ToString()!).ToList() : [],
            Completed   = d.TryGetValue("completed", out var c) && c is bool b && b,
            IsOverdue   = d.TryGetValue("isOverdue", out var o) && o is bool ob && ob,
            ReminderType = d.GetValueOrDefault("reminderType")?.ToString() ?? "0",
            CalculatedReminder = d.GetValueOrDefault("calculatedReminder")?.ToString(),
            Location    = d.GetValueOrDefault("location")?.ToString() ?? "",
        };
    }

    private static UserSettings MapSettings(Dictionary<string, object> d) => new()
    {
        Theme        = d.GetValueOrDefault("theme")?.ToString() ?? "system",
        Language     = d.GetValueOrDefault("language")?.ToString() ?? "zh-TW",
        FontSize     = d.GetValueOrDefault("fontSize")?.ToString() ?? "md",
        AccentColor  = d.GetValueOrDefault("accentColor")?.ToString() ?? "#667eea",
        NotifEnabled = d.TryGetValue("notifEnabled", out var ne) && ne is bool neb && neb,
        TodayBg      = d.GetValueOrDefault("todayBg")?.ToString() ?? "",
        CalBg        = d.GetValueOrDefault("calBg")?.ToString() ?? "",
    };

    private static Dictionary<string, object> ToDict(UserData ud) => new()
    {
        ["tasks"]      = ud.Tasks,
        ["trash"]      = ud.Trash,
        ["groupTrash"] = ud.GroupTrash,
        ["groups"]     = ud.Groups,
        ["avatarUrl"]  = ud.AvatarUrl ?? "",
        ["settings"]   = new Dictionary<string, object>
        {
            ["theme"]        = ud.Settings.Theme,
            ["language"]     = ud.Settings.Language,
            ["fontSize"]     = ud.Settings.FontSize,
            ["accentColor"]  = ud.Settings.AccentColor,
            ["notifEnabled"] = ud.Settings.NotifEnabled,
            ["todayBg"]      = ud.Settings.TodayBg,
            ["calBg"]        = ud.Settings.CalBg,
            ["dateBgs"]      = ud.Settings.DateBgs,
        }
    };
}
