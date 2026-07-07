using Microsoft.AspNetCore.Mvc;

namespace KingList.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TranslationController : ControllerBase
{
    [HttpGet("{lang}")]
    public IActionResult GetLocale(string lang)
    {
        var allowed = new[] { "zh-TW", "en-US" };
        if (!allowed.Contains(lang)) return BadRequest();

        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "locales", $"{lang}.json");
        if (!System.IO.File.Exists(path)) return NotFound();

        return PhysicalFile(path, "application/json");
    }
}
