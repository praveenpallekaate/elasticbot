function botDelayMessage(msg, callback){
  botui.message.add({
    delay: 1000,
    loading: true,
    photo: botImg,
    content: msg
  }).then(function(){
    callback();
  });
}

function botMessage(msg, callback){
  botui.message.add({
    photo: botImg,
    content: msg
  }).then(function(){
    callback();
  });
}

function humanDelayMessage(msg, callback){
  botui.message.add({
    delay:1000,
    human: true,
    photo: userImg,
    content: msg
  }).then(function(){
    callback();
  });
}

function humanMessage(msg, callback){
  botui.message.add({
    human: true,
    photo: userImg,
    content: msg
  }).then(function(){
    callback();
  });
}

function botDelayButtons(items, callback){
  botui.action.button({
    delay:500,
    addMessage: false,
    action: items
  }).then(function(response){
    callback(response);
  });
}

function botDelayButtonsExtra(items, callback){
  botui.action.button({
    delay:500,
    addMessage: false,
    action: items
  }).then(function(response){
    callback(response, items);
  });
}

function botButtons(items, callback){
  botui.action.button({
    addMessage: false,
    action: items
  }).then(function(response){
    callback(response);
  });
}

function botDelayText(action, callback){
  botui.action.text({
    delay:500,
    action: action
  }).then(function(response){
    callback(response);
  });
}

function botText(action, callback){
  botui.action.text({
    action: action
  }).then(function(response){
    callback(response);
  });
}

function botDelaySelect(action, callback){
  botui.action.select({
    delay: 500,
    action: action
  }).then(function(response){
    callback(response);
  });
}

function botSelect(action, callback){
  botui.action.select({
    action: action
  }).then(function(response){
    callback(response);
  });
}