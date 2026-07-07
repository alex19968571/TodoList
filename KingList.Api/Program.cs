using KingList.Api.Hubs;
using KingList.Api.Middleware;
using KingList.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Firebase
FirebaseService.Initialize(builder.Configuration);
builder.Services.AddSingleton<FirebaseService>();

// CORS
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors();
app.UseStaticFiles();           // serves Angular dist from wwwroot
app.UseMiddleware<FirebaseAuthMiddleware>();
app.MapControllers();
app.MapHub<GroupHub>("/hubs/group");

// Fallback to Angular index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
