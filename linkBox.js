(function() {
  var newWindow = false;

  function linkBox() {
    chrome.tabs.executeScript({ file: 'inject.js' });
  }

  chrome.commands.onCommand.addListener(function(command) {
    if (command === 'link-box-tab') {
      newWindow = false;
      linkBox();
    } else if (command === 'link-box-window') {
      newWindow = true;
      linkBox();
    }
  });

  chrome.runtime.onMessage.addListener(function(request) {
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
