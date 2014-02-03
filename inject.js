(function() {
  var startX,
      startY,
      currentX,
      currentY,
      element = null,
      eventMap,
      styledLinks = [];

  function EventMap() {
    this._events = {};
  }

  EventMap.prototype.add = function(name, handler) {
    this._events[name] = handler;
    window.addEventListener(name, handler);
  };

  EventMap.prototype.clear = function() {
    for (var k in this._events) {
      if (this._events.hasOwnProperty(k))
        window.removeEventListener(k, this._events[k]);
    }
  };

  eventMap = new EventMap();

  function getRect(subOffset) {
    var x = Math.min(startX, currentX),
        y = Math.min(startY, currentY),
        width = Math.abs(startX - currentX),
        height = Math.abs(startY - currentY);

    if (subOffset) {
      x -= window.scrollX;
      y -= window.scrollY;
    }

    return {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      width: width,
      height: height
    }
  }

  function drawBox() {
    var rect = getRect();

    if (!element) {
      element = document.createElement('div');
      element.style.boxShadow = '0 0 5px rgba(0, 0, 0, .5) inset';
      element.style.background = 'rgba(0, 0, 0, .1)';
      element.style.borderRadius = '5px';
      element.style.zIndex = '999999';
      element.style.position = 'absolute';
      document.body.appendChild(element);
    }

    element.style.top = rect.top + 'px';
    element.style.left = rect.left + 'px';
    element.style.width = rect.width + 'px';
    element.style.height = rect.height + 'px';
  }

  function clearStyles() {
    styledLinks.forEach(function(node) {
      node.style.textShadow = '';
    });
    styledLinks.length = 0;
  }

  function highlightLinks() {
    var links = getBoxedLinks();

    clearStyles();

    links.forEach(function(node) {
      node.style.textShadow = '0 0 2px red';
      styledLinks.push(node);
    });
  }

  function createTabs() {
    var links = getBoxedLinks();

    chrome.runtime.sendMessage({
      links: links.map(function(node) { return node.href; })
    });
  }

  function getBoxedLinks() {
    var aNodes = document.getElementsByTagName('a'),
        links = [],
        nodeRect,
        rect = getRect(true);

    for (var i = 0; i < aNodes.length; ++i) {
      nodeRect = aNodes[i].getBoundingClientRect();

      if (nodeRect.left < rect.right && nodeRect.right > rect.left &&
          nodeRect.top < rect.bottom && nodeRect.bottom > rect.top) {
        if (aNodes[i].href !== '#')
          links.push(aNodes[i]);
      }
    }

    return links;
  }

  function mouseDown(e) {
    startX = currentX = e.pageX;
    startY = currentY = e.pageY;
    drawBox();

    eventMap.clear();
    eventMap.add('mouseup', mouseUp);
    eventMap.add('mousemove', mouseMove);
    eventMap.add('selectstart', selectStart);
  }

  function mouseMove(e) {
    currentX = e.pageX;
    currentY = e.pageY;
    drawBox();
    highlightLinks();
  }

  function mouseUp(e) {
    if (element) {
      document.body.removeChild(element);
      element = null;
    }

    eventMap.clear();

    clearStyles();
    createTabs();
  }

  function selectStart(e) {
    e.preventDefault();
    return false;
  }

  eventMap.add('mousedown', mouseDown);
})();
