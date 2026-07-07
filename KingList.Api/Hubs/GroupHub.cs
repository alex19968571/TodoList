using KingList.Api.Services;
using Microsoft.AspNetCore.SignalR;

namespace KingList.Api.Hubs;

/// <summary>
/// SignalR hub for real-time group task updates.
/// Client calls JoinGroup/LeaveGroup; server broadcasts TasksChanged when Firestore changes.
/// </summary>
public class GroupHub(FirebaseService fb) : Hub
{
    private static readonly Dictionary<string, IDisposable> _listeners = new();

    public async Task JoinGroup(string groupId, string firebaseIdToken)
    {
        // Verify token
        try
        {
            await FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(firebaseIdToken);
        }
        catch { return; }

        await Groups.AddToGroupAsync(Context.ConnectionId, groupId);

        // Subscribe to Firestore if not already subscribed
        if (!_listeners.ContainsKey(groupId))
        {
            var sub = fb.Db.Collection("groups").Document(groupId).Collection("tasks")
                .Listen(async snap =>
                {
                    var tasks = snap.Documents
                        .Select(d =>
                        {
                            var dict = d.ToDictionary();
                            dict["id"] = d.Id;
                            return dict;
                        }).ToList();

                    await Clients.Group(groupId).SendAsync("TasksChanged", tasks);
                });
            _listeners[groupId] = sub;
        }
    }

    public async Task LeaveGroup(string groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
    }
}
