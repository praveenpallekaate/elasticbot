namespace ChatBotElasticAPI.Model
{
    public class ElasticDocument
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Type { get; set; }
        public double? Score { get; set; }
    }
}
