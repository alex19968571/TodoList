using FirebaseAdmin.Auth;

namespace KingList.Api.Middleware;

public class FirebaseAuthMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> _publicPaths =
    [
        "/hubs/group",
        "/api/translations"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip auth for public paths and static files
        if (!path.StartsWith("/api/") && !path.StartsWith("/hubs/"))
        {
            await next(context);
            return;
        }
        if (_publicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
        {
            context.Response.StatusCode = 401;
            return;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        try
        {
            var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(token);
            context.Items["Uid"]   = decoded.Uid;
            context.Items["Email"] = decoded.Claims.TryGetValue("email", out var e) ? e?.ToString() : "";
            await next(context);
        }
        catch
        {
            context.Response.StatusCode = 401;
        }
    }
}
