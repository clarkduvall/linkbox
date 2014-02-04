(function() {
  var startX,
      startY,
      currentX,
      currentY,
      element = null,
      counter,
      eventMap,
      styledLinks = [];

  Array.prototype.unique = function() {
    var ret = [];

    for (var i = 0; i < this.length; ++i) {
      if (ret.indexOf(this[i]) < 0)
        ret.push(this[i]);
    }

    return ret;
  };

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
      element.style.boxShadow = '1px 1px 5px rgba(0, 0, 0, 0.5)';
      element.style.background = 'rgba(0, 0, 0, 0.05)';
      element.style.border = '2px solid rgba(255, 255, 255, 0.4)';
      element.style.borderRadius = '5px';
      element.style.zIndex = '999999';
      element.style.position = 'absolute';
      element.style.textAlign = 'center';
      element.style.overflow = 'hidden';
      document.body.appendChild(element);

      counter = document.createElement('div');
      counter.style.color = 'rgba(0, 0, 0, 0.2)';
      counter.style.textShadow = '0 0 rgba(255, 255, 255, 0.5)';
      element.appendChild(counter);
    }

    element.style.top = rect.top + 'px';
    element.style.left = rect.left + 'px';
    element.style.width = rect.width + 'px';
    element.style.height = rect.height + 'px';
    counter.style.lineHeight = rect.height + 'px';
    counter.style.fontSize = Math.min(rect.height, rect.width) * 0.8 + 'px';
    counter.innerHTML = getValidBoxedURLs().length || '';
  }

  function clearStyles() {
    styledLinks.forEach(function(node) {
      node.style.textShadow = '';
      node.style.outline = '';
    });
    styledLinks.length = 0;
  }

  function isValidURL(url) {
    return url && url.indexOf('javascript:') !== 0
  }

  function highlightLinks() {
    var links = getBoxedLinks();

    clearStyles();

    links.forEach(function(node) {
      if (isValidURL(node.href)) {
        node.style.outline = '2px dashed red';
        styledLinks.push(node);
      }
    });
  }

  function createTabs() {
    chrome.runtime.sendMessage({
      links: getValidBoxedURLs()
    });
  }

  function getBoxedLinks() {
    var aNodes = document.getElementsByTagName('a'),
        links = [],
        nodeRect,
        node,
        rect = getRect(true);

    for (var i = 0; i < aNodes.length; ++i) {
      node = aNodes[i];

      if (node.offsetWidth <= 0 && node.offsetHeight <= 0) continue;

      nodeRect = node.getBoundingClientRect();

      if (nodeRect.left < rect.right && nodeRect.right > rect.left &&
          nodeRect.top < rect.bottom && nodeRect.bottom > rect.top) {
        links.push(node);
      }
    }

    return links;
  }

  function getValidBoxedURLs() {
    return getBoxedLinks().map(function(node) {
       return node.href;
     }).filter(function (href) {
       return isValidURL(href);
     }).unique();
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
  }

  eventMap.add('mousedown', mouseDown);
})();
