namespace KingList.Api.Models;

public class Group
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string InviteCode { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public Dictionary<string, GroupMember> Members { get; set; } = [];
}

public class GroupMember
{
    public string Email { get; set; } = "";
    public string Role { get; set; } = "member";    // "owner" | "member"
}
