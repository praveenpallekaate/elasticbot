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
var createBot = 'Create a Bot';
var test = 'test';
var testBot = 'Test a Bot';
var demo = 'demo';
var demoBot = 'View Demo';
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

getAllBotIndices();

$(document).ready(function(){
  setPage();  
});

var appOptions = function(){
  var actions = [{
      text: createBot,
      value: create
    },
    {
      text: testBot,
      value: test
    },
    {
      text: demoBot,
      value: demo
    }
  ];

  botDelayButtons(actions, appOptionsSelected);
};

var appOptionsSelected = function(response){
  if(response.value === create){
    humanMessage(createBot, createBotStep1);
  } else if(response.value === test){
    humanMessage(testBot, testBotStep1);
  } else if(response.value === demo){
    humanMessage(demoBot, demoBotStep1);
  }
};

var createBotStep1 = function(){
  if(botIndices.length > maxAllowedBots){
    botDelayMessage(botExceeded, appOptions);
  } else {
    botDelayMessage(provideBotName, botNameLoad);
  }
};

var botNameLoad = function(){
  var action = {value:'', placeholder: 'Bot Name'};
  botDelayText(action, createBotStep2);
};

var createBotStep2 = function(response){
  botName = response.value.trim();

  var checkBot = botIndices.filter(function(item){
    return item.botName.toLowerCase() === botName.toLowerCase();
  })

  if(checkBot && checkBot.length > 0){
    botDelayMessage(botExists, appOptions);
  } else {
    botDelayMessage(uploadBotQNA, function(){
      toggleModal();
    });
  }
};

var testBotStep1 = function(){
  selectAction.options = botIndices.map(function(item){
    return {
      value: item.name,
      text: item.botName
    };
  });

  selectAction.placeholder = 'Select Bot';

  botDelaySelect(selectAction, testBotStep2);
};

var testBotStep2 = function(response){
  index = response.value;
  toggleQuery();
  hookQueryEvent();
  focusQuery();
};

var demoBotStep1 = function(){
  selectAction.options = botIndices.map(function(item){
    return {
      value: item.name,
      text: item.botName
    };
  });

  selectAction.placeholder = 'Select Bot to view demo';

  botDelaySelect(selectAction, demoBotStep2);
};

var demoBotStep2 = function(response){
  index = response.value;
  botName = response.text;  

  botDelayMessage('Launching demo, please wait...', demoBotStep3);
};

var demoBotStep3 = function(){
  window.location = 'publish.html?index=' + index + '&botName=' + botName;
};

var multiAnswer = function(response, actions){
  if(response.value === actions.length - 1){
    humanMessage(response.text, function() {
      botDelayMessage(locale['noneOfTheAbove' + selectedLanguage], focusQuery);
    });
  } else {
    humanMessage(response.text, function() {
      //answers is from helper.js
      botDelayMessage(answers[response.value], focusQuery);
    });    
  }
};

var emptyFunction = function(){};

function uploadFile(){
  var url = apiURL + '/loaddata';

  var data = new FormData();
  data.append('index', nextBotIndexName);
  data.append('botName', getPascalCaseString(botName));
  data.append('file', $('#file')[0].files[0]);

  axios.post(url, data)
    .then(function(response){
      nextBotIndexName = 'ssbc_';
      botDelayMessage(botName + botCreateSuccess, appOptions);
      getAllBotIndices();
    })
    .catch(function(error){
      botDelayMessage(botName + botCreateFail, appOptions);
    });

  toggleModal();
}

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
        botDelayMessage(response.data[0].answer, focusQuery());
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

function closeModal(){
  toggleModal();
  appOptions();
}

function closeBot(){
  index = '';
  toggleQuery();
  appOptions();
}

function toggleModal(){
  $('#uploadmodal').toggle();
}

function toggleQuery(){
  $('#query-div').toggle();
}

function setPage(){
  $('#load').fadeOut(2000, function(){
    $('#main-container').show();
    botDelayMessage(locale['welcomeMsg' + selectedLanguage], appOptions);
  });
}

var focusQuery = function (){
  $('#queryTxt').focus();
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