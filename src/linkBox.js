(function() {
  var newWindow = false,
      boxing = false;;

  function linkBox() {
    boxing = true;
    chrome.tabs.executeScript({file: 'src/inject.js'});
  }

  chrome.commands.onCommand.addListener(function(command) {
    if (boxing) return;

    if (command === 'link-box-tab') {
      newWindow = false;
      linkBox();
    } else if (command === 'link-box-window') {
      newWindow = true;
      linkBox();
    }
  });

  chrome.runtime.onMessage.addListener(function(request) {
    boxing = false;

    if (!request.links.length) return;

    if (newWindow) {
      chrome.windows.create({url: request.links});
    } else {
      request.links.forEach(function(href) {
        chrome.tabs.create({url: href});
      });
    }
  });
})();
