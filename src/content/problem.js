var back=chrome.extension.getBackgroundPage();
alert(back.storage["last_problem"]);
back.storage["last_problem"]=location.href;