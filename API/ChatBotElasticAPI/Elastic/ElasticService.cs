using ChatBotElasticAPI.Helper;
using ChatBotElasticAPI.Model;
using Microsoft.Extensions.Configuration;
using Nest;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ChatBotElasticAPI.Elastic
{
    public class ElasticService
    {
        private readonly ConnectionSettings _connectionSettings = null;
        private readonly ElasticClient _elasticClient = null;
        private readonly string _elasticRunURL = string.Empty;
        private readonly string _elasticAnalyserIndex = string.Empty;
        private readonly string _elasticAnalyserName = string.Empty;
        private readonly string _elasticDefaultIndex = string.Empty;
        private readonly string _elasticBotIndex = string.Empty;
        private readonly string _chitChatFile = string.Empty;
        private readonly string _nameQuestionsFile = string.Empty;

        private const string noresult = "Sorry, no results found.";
        private const string loadSuccess = "Data load success.";
        private const string loadFail = "Data load fail.";
        private const string question = "question";
        private const string answer = "answer";
        private const string en = "en";
        private const string fr = "fr";
        private IList<string> compareProps = new string[] { question, answer };
        private IList<string> comparelanguage = new string[] { en, fr };

        public ElasticService(IConfiguration configuration)
        {
            _elasticRunURL = configuration["Elastic:RunURL"];
            _elasticDefaultIndex = configuration["Elastic:DefaultIndex"];
            _elasticAnalyserIndex = configuration["Elastic:Analyser:Index"];
            _elasticAnalyserName = configuration["Elastic:Analyser:Name"];
            _elasticBotIndex = configuration["Elastic:BotsIndex"];
            _chitChatFile = configuration["AppFiles:ChitChatQNA"];
            _nameQuestionsFile = configuration["AppFiles:NameQuestions"];

            _connectionSettings = new ConnectionSettings(new Uri(_elasticRunURL))
                .DefaultIndex(_elasticDefaultIndex);
            _elasticClient = new ElasticClient(_connectionSettings);
        }

        public IEnumerable<ElasticDocument> ElasticSearch(QueryDetails queryDetails)
        {
            var result = _elasticClient.Search<QNA>(s => s
                            .Index(queryDetails.Index)
                            .Query(q => q
                                    .Match(m => m
                                        .Field("question")
                                        //.Field("answer")
                                        .Query(queryDetails.Query)
                                    )
                                )
                            );


            var response = result?.Hits
                .Select(i => new ElasticDocument
                {
                    Score = i?.Score,
                    Answer = i?.Source?.Answer?.Trim()?.Length > 0 ? i?.Source?.Answer : noresult,
                    Question = i?.Source?.Question,
                    Type = i?.Source?.Type
                });

            double? d = response.Sum(i => i.Score);

            double? mean = response.Sum(i => (double)i.Score) / response.Count();

            response = response.Where(i => i.Score >= mean).ToList();

            if(response?.Count() < 1)
            {
                response = new List<ElasticDocument>
                {
                    new ElasticDocument
                    {
                        Score = 1,
                        Question = noresult,
                        Answer = noresult
                    }
                };
            }

            return response;
        }

        public dynamic AddDocuments(DataLoad dataLoad)
        {
            int batch = 0;
            bool newIndex = false;

            try
            {
                var qnas = ExcelHelper.WorkSheetToQNA(dataLoad.Stream);
                List<QNA> modifiedQNA = qnas
                    .Select(i => new QNA
                    {
                        Question = i.Question,
                        Answer = string.IsNullOrEmpty(i.Answer) ? string.Empty : ClearDataWithAnalyzer(i.Answer),
                        Type = DocumentType.qna.ToString()
                    })
                    .ToList();

                var addedBotId = string.IsNullOrEmpty(dataLoad.BotName) ? false : UpdateBotIds(dataLoad);

                if (!_elasticClient.Indices.Exists(dataLoad.Index).Exists)
                {
                    newIndex = true;
                    _elasticClient.Indices.Create(dataLoad.Index);
                }                    

                if (addedBotId && newIndex)
                {
                    var nameQuestions = AddNamingQuestionsToIndex(dataLoad);
                    var chitChat = AddChitChat(dataLoad);

                    modifiedQNA.AddRange(nameQuestions);
                    modifiedQNA.AddRange(chitChat);
                }

                _elasticClient.BulkAll(modifiedQNA, b => b.Index(dataLoad.Index))
                    .Wait(TimeSpan.FromMinutes(30), next => { batch += 1; });
            }
            catch (Exception ex)
            {
                return new { message = ex.Message, metrics = batch, newIndex };
            }
            
            return new { message = loadSuccess, metrics = batch, newIndex };
        }

        public async Task<IEnumerable<BotIndexDetail>> GetBotIndicesAsync()
        {
            var indices = await _elasticClient.Indices.GetAsync(new GetIndexRequest(Indices.All));
            var botIdsSearch = _elasticClient.Search<BotIds>(s => s
                            .Index(_elasticBotIndex)
                            .Size(2000)
                            .Query(q => q.MatchAll())
                        );

            var botIds = botIdsSearch?.Hits
                            .Select(r => new BotIds
                            {
                                Index = r?.Source?.Index,
                                Name = r?.Source?.Name,
                                PassPhrase = r?.Source?.PassPhrase
                            }).ToList();

            var filteredIndices = indices.Indices
                .Where(j =>
                {
                    var hasProps = 0;
                    if (!j.Key.Name.StartsWith("."))
                    {
                        var props = j.Value?.Mappings?.Properties?.Values;

                        props?.Select(k =>
                        {
                            hasProps = compareProps.Contains(k.Name.Name.Trim().ToLower()) ? hasProps + 1 : hasProps;
                            return k;
                        }).ToList();
                    }
                    return hasProps == 2 ? true : false;
                })
                .Select(l =>
                {
                    var name = l.Key.Name;
                    var languageIndex = name.LastIndexOf("_");
                    var displayName = name.Substring(0, languageIndex > 0 ? languageIndex : name.Length);
                    var language = en;

                    if(languageIndex > 0)
                    {
                        var languageGiven = name.Substring(languageIndex + 1, name.Length - languageIndex - 1).Trim().ToLower();
                        if (comparelanguage.Contains(languageGiven))
                        {
                            language = languageGiven;
                        }
                        else
                        {
                            displayName = name;
                        }
                    }                    

                    return new BotIndexDetail
                    {
                        Name = name,
                        DisplayName = displayName,
                        Language = language,
                        BotName = botIds.Where(n => n.Index == name).Select(o => o.Name).FirstOrDefault() ?? string.Empty
                    };
                }).ToList();

            return filteredIndices;
        }

        private bool UpdateBotIds(DataLoad dataLoad)
        {
            if (!_elasticClient.Indices.Exists(_elasticBotIndex).Exists)
            {                
                _elasticClient.Indices.Create(_elasticBotIndex);
            }

            var exists = _elasticClient.Search<BotIds>(s => s
                            .Index(_elasticBotIndex)
                            .Query(q => q
                                    .Match(m => m
                                        .Field("name")
                                        .Query(dataLoad.BotName)
                                    ) &&
                                    q.Match(m => m
                                        .Field("index")
                                        .Query(dataLoad.Index)
                                    )
                                )
                            );

            if(exists == null || exists.Hits.Count == 0)
            {
                var result = _elasticClient.Index(new BotIds
                                {
                                    Index = dataLoad.Index,
                                    Name = dataLoad.BotName
                                },
                                i => i.Index(_elasticBotIndex)
                            );

                return result.IsValid;
            }

            return false;
        }

        private IEnumerable<QNA> AddNamingQuestionsToIndex(DataLoad dataLoad)
        {
            List<string> questions = null;
            IEnumerable<QNA> qnas = null;

            using (var streamReader = new StreamReader(_nameQuestionsFile))
            {
                string json = streamReader.ReadToEnd();
                questions = JsonConvert.DeserializeObject<List<string>>(json);
            }

            if(questions != null && questions.Count > 0)
            {
                qnas = questions
                    .Select(i => new QNA
                    {
                        Question = i,
                        Answer = dataLoad.BotName.Trim(),
                        Type = DocumentType.chitchat.ToString()
                    });
            }

            return qnas;
        }

        private IEnumerable<QNA> AddChitChat(DataLoad dataLoad)
        {
            IEnumerable<QNA> qnas = null;

            using (var stream = File.OpenRead(_chitChatFile))
            {
                qnas = ExcelHelper.WorkSheetToQNA(stream);
                qnas = qnas.Select(i => { i.Type = DocumentType.chitchat.ToString(); return i; });
            }

            if(qnas == null || qnas.Count() < 1)
            {
                qnas = new List<QNA>();
            }

            return qnas;
        }

        private string ClearDataWithAnalyzer(string textToProcess)
        {
            var analyzerResponse = _elasticClient.Indices
                .Analyze(az => az
                    .Index(_elasticAnalyserIndex)
                    .Analyzer(_elasticAnalyserName)
                    .Text(textToProcess)
                );

            string result = analyzerResponse?.Tokens?.FirstOrDefault()?.Token ?? textToProcess;
            result = result.Trim().Replace("\n\n\n", "\n").Replace("\n \n \n", "\n");

            return result;
        }
    }
}
