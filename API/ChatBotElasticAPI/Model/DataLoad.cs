using System.IO;

namespace ChatBotElasticAPI.Model
{
    public class DataLoad
    {
        public Stream Stream { get; set; }
        public string Index { get; set; }
        public string BotName { get; set; }
        public string PassPhrase { get; set; }
    }
}
