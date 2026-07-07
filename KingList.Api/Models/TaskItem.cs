namespace KingList.Api.Models;

public class TaskItem
{
    public string Id { get; set; } = "";
    public string Text { get; set; } = "";
    public string Description { get; set; } = "";
    public string Date { get; set; } = "";          // YYYY-MM-DD
    public string? StartTime { get; set; }           // YYYY-MM-DDTHH:mm
    public string? Deadline { get; set; }            // YYYY-MM-DDTHH:mm
    public string Priority { get; set; } = "4";     // 1-4
    public List<string> Tags { get; set; } = [];
    public List<TaskStep> Steps { get; set; } = [];
    public string Location { get; set; } = "";
    public string ReminderType { get; set; } = "0";
    public string? CustomReminderTime { get; set; }
    public string? CalculatedReminder { get; set; }
    public bool Completed { get; set; }
    public bool IsOverdue { get; set; }
    // Group task extras
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class TaskStep
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Text { get; set; } = "";
    public bool Done { get; set; }
}
