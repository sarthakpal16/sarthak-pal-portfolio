(function () {
  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function current() {
    return root.dataset.theme || (media.matches ? 'dark' : 'light');
  }
  function sync() {
    button.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false');
  }
  button.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  if (media.addEventListener) media.addEventListener('change', sync);
  sync();
})();

/* The location graph in the streaming project. Nodes are schematic; PageRank and
   breadth-first search run on this small graph in the browser. */
(function () {
  var figure = document.querySelector('[data-diagram="graph"]');
  if (!figure) return;
  var SVG = 'http://www.w3.org/2000/svg';
  var nodes = {
    a: [276, 84], b: [356, 50], c: [446, 80], d: [532, 54], e: [300, 176],
    f: [404, 164], g: [502, 152], h: [334, 262], i: [452, 254], j: [538, 238]
  };
  var edges = [
    ['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e'], ['b', 'f'], ['c', 'f'], ['c', 'g'],
    ['d', 'g'], ['e', 'f'], ['f', 'g'], ['e', 'h'], ['f', 'h'], ['f', 'i'], ['g', 'i'],
    ['g', 'j'], ['i', 'j'], ['h', 'i']
  ];
  var from = 'a';
  var to = 'j';
  var ids = Object.keys(nodes);
  var adj = {};
  ids.forEach(function (id) { adj[id] = []; });
  edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });

  // PageRank, treating each connection as running both ways.
  var rank = {};
  ids.forEach(function (id) { rank[id] = 1 / ids.length; });
  for (var k = 0; k < 40; k++) {
    var next = {};
    ids.forEach(function (id) { next[id] = 0.15 / ids.length; });
    ids.forEach(function (id) {
      adj[id].forEach(function (n) { next[n] += 0.85 * rank[id] / adj[id].length; });
    });
    rank = next;
  }
  var lo = Math.min.apply(null, ids.map(function (id) { return rank[id]; }));
  var hi = Math.max.apply(null, ids.map(function (id) { return rank[id]; }));

  // Breadth-first search from one location to another.
  var prev = {};
  var seen = {};
  seen[from] = true;
  var queue = [from];
  while (queue.length) {
    var cur = queue.shift();
    if (cur === to) break;
    adj[cur].forEach(function (n) {
      if (!seen[n]) { seen[n] = true; prev[n] = cur; queue.push(n); }
    });
  }
  var path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  function onPath(x, y) {
    for (var p = 0; p < path.length - 1; p++) {
      if ((path[p] === x && path[p + 1] === y) || (path[p] === y && path[p + 1] === x)) return true;
    }
    return false;
  }

  var edgeLayer = figure.querySelector('.g-edges');
  var nodeLayer = figure.querySelector('.g-nodes');
  edges.forEach(function (e) {
    var line = document.createElementNS(SVG, 'line');
    line.setAttribute('class', 'g-edge' + (onPath(e[0], e[1]) ? ' on-path' : ''));
    line.setAttribute('x1', nodes[e[0]][0]);
    line.setAttribute('y1', nodes[e[0]][1]);
    line.setAttribute('x2', nodes[e[1]][0]);
    line.setAttribute('y2', nodes[e[1]][1]);
    edgeLayer.appendChild(line);
  });
  var circles = {};
  ids.forEach(function (id) {
    var c = document.createElementNS(SVG, 'circle');
    c.setAttribute('class', 'g-node' + (path.indexOf(id) >= 0 ? ' on-path' : ''));
    c.setAttribute('cx', nodes[id][0]);
    c.setAttribute('cy', nodes[id][1]);
    c.setAttribute('r', 8);
    nodeLayer.appendChild(c);
    circles[id] = c;
  });
  [['from', from, -1], ['to', to, 1]].forEach(function (t) {
    var label = figure.querySelector('[data-endpoint="' + t[0] + '"]');
    label.setAttribute('x', nodes[t[1]][0]);
    label.setAttribute('y', nodes[t[1]][1] + (t[2] < 0 ? -22 : 34));
  });

  figure.setRanked = function (on) {
    figure.classList.toggle('ranked', on);
    ids.forEach(function (id) {
      var r = on ? 6 + 10 * (rank[id] - lo) / (hi - lo) : 8;
      circles[id].setAttribute('r', r.toFixed(1));
      circles[id].style.r = r.toFixed(1) + 'px';
    });
  };
})();

/* Step explorers: each step button marks its part of the diagram. */
(function () {
  document.querySelectorAll('.project').forEach(function (project) {
    var figure = project.querySelector('.diagram');
    var note = project.querySelector('.step-note');
    var buttons = project.querySelectorAll('.flow button');
    var parts = figure.querySelectorAll('.part');
    function select(step) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.step === step ? 'true' : 'false');
      });
      parts.forEach(function (p) {
        p.classList.toggle('on', !!step && p.dataset.part.split(' ').indexOf(step) >= 0);
      });
      figure.classList.toggle('tracing', !!step);
      if (step) figure.dataset.step = step; else delete figure.dataset.step;
      if (figure.setRanked) figure.setRanked(step === '4');
      var active = step && project.querySelector('.flow button[data-step="' + step + '"]');
      note.textContent = active ? active.dataset.note : '';
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        select(b.getAttribute('aria-pressed') === 'true' ? '' : b.dataset.step);
      });
    });
  });
})();
