namespace KingList.Api.Models;

public class UserData
{
    public List<TaskItem> Tasks { get; set; } = [];
    public UserSettings Settings { get; set; } = new();
    public List<TaskItem> Trash { get; set; } = [];
    public List<TaskItem> GroupTrash { get; set; } = [];
    public List<string> Groups { get; set; } = [];
    public string? AvatarUrl { get; set; }
}

public class UserSettings
{
    public string Theme { get; set; } = "system";
    public string Language { get; set; } = "zh-TW";
    public string FontSize { get; set; } = "md";
    public string AccentColor { get; set; } = "#667eea";
    public string TodayBg { get; set; } = "";
    public string CalBg { get; set; } = "";
    public Dictionary<string, string> DateBgs { get; set; } = [];
    public bool NotifEnabled { get; set; } = true;
}
