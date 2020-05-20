var answers = [];

function canShowMessage(data){
  var result = false;

  if(data && data.length > 0){
    if(data.length === 1){
      result = true;
    } else if (data.length > 1){
      var validData = data.filter(function(item){
        return item.type === qna;
      });

      if(validData && validData.length > 0){
        if(validData.length === 1 || validData[0].score > 10){
          result = true;
        }
      } else {
        result = true;
      }
    }
  }

  return result;
}

function buildQuestionsAnswers(data){
  var questionActions = [];
  answers = [];

  data = data.filter(function(item){
    return item.type === qna;
  });

  answers = data.map(function(item, index){
    questionActions.push({
      text: item['question'],
      value: index
    });

    return item['answer'];
  });

  questionActions.push({
    text: 'None of the above.',
    value: questionActions.length
  });

  return questionActions;
}

const getPascalCaseString = function (words) {
  if(words){
    const checkedWords = undefinedToEmptyString(words);
    return checkedWords.replace(/\w+/g, function (val){
        return val[0].toUpperCase() + val.slice(1).toLowerCase();
    });
  } else {
    return '';
  }
}

const undefinedToEmptyString = function (e) {
  if(e === undefined){
      return "";
  }

  return e;
}

const getParameterByName = function (name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}