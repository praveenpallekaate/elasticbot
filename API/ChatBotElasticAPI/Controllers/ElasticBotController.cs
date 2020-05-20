using ChatBotElasticAPI.Elastic;
using ChatBotElasticAPI.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Threading.Tasks;

namespace ChatBotElasticAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ElasticBotController : ControllerBase
    {
        private readonly ElasticService _elasticService = null;

        public ElasticBotController(IConfiguration configuration)
        {
            _elasticService = new ElasticService(configuration);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await _elasticService.GetBotIndicesAsync();

            if (result == Enumerable.Empty<BotIndexDetail>())
            {
                NotFound();
            }

            return Ok(result);
        }

        [HttpPost]
        public IActionResult Post(QueryDetails queryDetails)
        {
            if (queryDetails == null) BadRequest();

            var result = _elasticService.ElasticSearch(queryDetails);

            if(result == null) return StatusCode(StatusCodes.Status500InternalServerError);

            return Ok(result);
        }

        [HttpPost("loaddata")]
        public IActionResult LoadData(IFormCollection keyValues)
        {
            if (keyValues == null || keyValues?.Files[0] == null) return BadRequest();

            string index = keyValues["index"];
            string botName = keyValues["botName"];

            if (string.IsNullOrEmpty(index)) return BadRequest();

            var stream = keyValues.Files[0].OpenReadStream();

            var items = _elasticService.AddDocuments(new DataLoad
            {
                BotName = botName,
                Index = index,
                Stream = stream
            });

            return Ok(items);
        }
    }
}