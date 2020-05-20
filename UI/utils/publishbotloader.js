var headers = { 'Content-Type': 'application/json' };
var apiURL = 'http://13.69.27.216/api/ElasticBot';
var index = '';
var botName = '';
var en = '_en';
var fr = '_fr';
var regionSelected = '';
var countrySelected = '';
var roleSelected = '';
var selectedLanguage = '_en';
var maxAllowedBots = 50;
var name = '';
var botImg = 'assets/images/botpic.svg';
var userImg = 'assets/images/user.png';
var qna = 'qna';
var create = 'create';
var createBot = 'Create a Bot.';
var test = 'test';
var testBot = 'Test a Bot.';
var provideBotName = 'What would you like to name the bot (alphanumeric)?';
var uploadBotQNA = 'Upload QNA for bot';
var botCreateSuccess = ' created successfully.';
var botCreateFail = ' creation failed.';
var botExists = 'Bot already exists try another name';
var botExceeded = 'Bots exceeded!!! try later';
var botIndices = [];
var nextBotIndexName = 'ssbc_';
var selectAction = {
  placeholder: '',
  searchselect: true,
  label: 'text',
  options: [],
  button: {
    icon: 'check',
    label: 'Ok'
  }
};

//Initialization
var botui = new BotUI('botengine');

$(document).ready(function(){
  index = getParameterByName('index');
  botName = getParameterByName('botName');

  setPage();    
});

var multiAnswer = function(response, actions){
  if(response.value === actions.length - 1){
    humanMessage(response.text, function() {
      botDelayMessage(locale['noneOfTheAbove' + selectedLanguage], emptyFunction);
    });
  } else {
    humanMessage(response.text, function() {
      //answers is from helper.js
      botDelayMessage(answers[response.value], emptyFunction);
    });    
  }
};

var emptyFunction = function(){};

function callAPI(){
  event.preventDefault();
  var chat = document.getElementById("queryTxt").value;

  if(chat && chat.length > 0){
    humanMessage(chat, emptyFunction);
    document.getElementById("queryTxt").value = '';

    axios.post(
      apiURL, 
      { 
        index: index,
        query: chat
      }, 
      { headers: headers }
    ).then(function(response){
      if(canShowMessage(response.data)){
        botDelayMessage(response.data[0].answer, emptyFunction);
      } else{
        var actions = buildQuestionsAnswers(response.data);

        botMessage('Did you mean:', emptyFunction);
        botDelayButtonsExtra(actions, multiAnswer);
      }
    })

  }
}

function hookQueryEvent(){
  document.getElementById("queryTxt")
    .addEventListener("keyup", function(event) {
      event.preventDefault();
      if (event.keyCode === 13) {
          document.getElementById("sendQueryBtn").click();
      }
    });
}

function setPage(){
  hookQueryEvent();
  var welcomeMsg = (locale['welcomeMsg' + selectedLanguage]).replace('Zap', botName);
  var indexspan = document.getElementById("indexSpan");

  indexspan.innerHTML = index;

  $('#load').fadeOut(2000, function(){
    $('#main-container').show();
    botDelayMessage(welcomeMsg, emptyFunction);
  });
}

var focusControl = function (control){
  $('#' + control).focus();
};

function getAllBotIndices(){
  axios.get(apiURL)
    .then(function(response){
      if(response && response.data && response.data.length > 0){
        botIndices = response.data;

        //next index name
        var indexNumbers = [];
        botIndices = botIndices.filter(function(item){
          if(item.name.indexOf(nextBotIndexName) > -1){
            var nameSplit = item.name.split('_');

            if(nameSplit && nameSplit[1]){
              indexNumbers.push(Number(nameSplit[1]));
            }

            return item;
          }
        });

        if(indexNumbers.length > 0){
          indexNumbers.sort(function(a,b){return b-a});
          nextBotIndexName += (indexNumbers[0] + 1).toString();
        } else {
          nextBotIndexName += '100';
        }

        nextBotIndexName += '_en';
      }
    });
}