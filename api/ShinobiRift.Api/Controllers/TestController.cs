using Microsoft.AspNetCore.Mvc;

namespace ShinobiRift.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("ratelimit")]
        public IActionResult TestRateLimit()
        {
            return Ok(new { message = "Request successful" });
        }
    }
}
