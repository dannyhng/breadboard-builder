// app.js
// The interactive tool: realistic breadboard + Arduino, place LED/Resistor parts
// that snap to holes (rotate with R, horizontal OR vertical across the ravine),
// draw jumper wires hole-to-hole, select + delete, autosave.
//
// Electrical net awareness: hover any hole and every hole electrically connected
// to it lights up (the equipotential highlight). Live checks flag a power-rail
// short and a component shorted across one strip.
//
// Layers (back to front): board (static) | arduino (static) | wires | parts | overlay.
// Holes are a <symbol> instanced with <use> (no per-instance filters: cheap).

(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  var board = window.buildBoard();
  var PARTS = window.PARTS;
  var dims = board.dims, L = board.layout, P = dims.pitch;

  var svg = document.getElementById('board');
  var ARD_H = 332;
  svg.setAttribute('viewBox', '0 0 ' + dims.width + ' ' + (dims.height + ARD_H));

  function E(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }
  function txt(g, x, y, s, a) {
    var t = E('text', Object.assign({ x: x, y: y, 'font-family': 'monospace', 'font-size': 10, fill: '#7d7868' }, a || {}), g);
    t.textContent = s; return t;
  }

  var boardLayer = E('g'), ardLayer = E('g'), wireLayer = E('g'), partLayer = E('g');
  var overlay = E('g', { 'pointer-events': 'none' });

  var holesById = {};
  board.holes.forEach(function (h) { holesById[h.id] = h; });
  function holeByCR(c, r) { return board.byCR[c + ',' + r]; }

  // ---------- static render: breadboard ----------
  (function renderBoard() {
    E('rect', { x: 10, y: 10, width: dims.width - 20, height: dims.height - 20, rx: 12,
      fill: 'url(#boardGrad)', stroke: '#cfc9b4', 'stroke-width': 1.5, filter: 'url(#softbig)' }, boardLayer);
    E('rect', { x: 14, y: L.ravineY, width: dims.width - 28, height: L.ravineH, fill: '#e0dbc8' }, boardLayer);
    L.rails.forEach(function (rail) {
      E('line', { x1: 24, y1: rail.y - 9, x2: dims.width - 24, y2: rail.y - 9, stroke: rail.color, 'stroke-width': 2, opacity: 0.5 }, boardLayer);
      var t = txt(boardLayer, L.x0 - 22, rail.y, rail.sign, { 'text-anchor': 'end', 'font-weight': 'bold' });
      t.setAttribute('fill', rail.color);
    });
    board.holes.forEach(function (h) {
      E('use', { href: '#hole', x: h.x - 4, y: h.y - 4, width: 8, height: 8 }, boardLayer);
    });
    var rightX = L.x0 + (L.cols - 1) * P;
    ['a', 'b', 'c', 'd', 'e'].forEach(function (r) {
      txt(boardLayer, L.x0 - 22, L.topY[r], r, { 'text-anchor': 'end' });
      txt(boardLayer, rightX + 22, L.topY[r], r, { 'text-anchor': 'start' });
    });
    ['f', 'g', 'h', 'i', 'j'].forEach(function (r) {
      txt(boardLayer, L.x0 - 22, L.botY[r], r, { 'text-anchor': 'end' });
      txt(boardLayer, rightX + 22, L.botY[r], r, { 'text-anchor': 'start' });
    });
    for (var c = 1; c <= L.cols; c++) {
      if (c === 1 || c % 5 === 0) {
        var cx = L.x0 + (c - 1) * P;
        txt(boardLayer, cx, L.topY.a - 14, String(c), { 'text-anchor': 'middle' });
        txt(boardLayer, cx, L.botY.j + 16, String(c), { 'text-anchor': 'middle' });
      }
    }
  })();

  // ---------- static render: stylized Arduino, with wire-able pins ----------
  var ardPins = {};
  (function drawArduino() {
    var ax = 100, ay = dims.height + 16, W = 470, H = 304, g = ardLayer;
    var DIGITAL = [
      { l: 'AREF', id: 'ARD-AREF' }, { l: 'GND', id: 'ARD-GND' }, { l: '13', id: 'ARD-D13' }, { l: '12', id: 'ARD-D12' },
      { l: '~11', id: 'ARD-D11' }, { l: '~10', id: 'ARD-D10' }, { l: '~9', id: 'ARD-D9' }, { l: '8', id: 'ARD-D8' },
      { l: '7', id: 'ARD-D7' }, { l: '~6', id: 'ARD-D6' }, { l: '~5', id: 'ARD-D5' }, { l: '4', id: 'ARD-D4' },
      { l: '~3', id: 'ARD-D3' }, { l: '2', id: 'ARD-D2' }, { l: '1', id: 'ARD-D1' }, { l: '0', id: 'ARD-D0' }
    ];
    var POWER = [
      { l: 'IOREF', id: 'ARD-IOREF' }, { l: 'RST', id: 'ARD-RESET' }, { l: '3V3', id: 'ARD-3V3' }, { l: '5V', id: 'ARD-5V' },
      { l: 'GND', id: 'ARD-GND2' }, { l: 'GND', id: 'ARD-GND3' }, { l: 'VIN', id: 'ARD-VIN' }
    ];
    var ANALOG = [
      { l: 'A0', id: 'ARD-A0' }, { l: 'A1', id: 'ARD-A1' }, { l: 'A2', id: 'ARD-A2' },
      { l: 'A3', id: 'ARD-A3' }, { l: 'A4', id: 'ARD-A4' }, { l: 'A5', id: 'ARD-A5' }
    ];

    E('rect', { x: ax, y: ay, width: W, height: H, rx: 12, fill: 'url(#pcbGrad)', stroke: '#044f56', 'stroke-width': 1.5, filter: 'url(#softbig)' }, g);
    E('rect', { x: ax + 9, y: ay + 9, width: W - 18, height: H - 18, rx: 7, fill: 'none', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.25 }, g);

    [[ax + 24, ay + 24], [ax + 24, ay + H - 24], [ax + W - 26, ay + 52], [ax + W - 26, ay + H - 52]].forEach(function (p) {
      E('circle', { cx: p[0], cy: p[1], r: 6.5, fill: '#dcdcdc', stroke: '#8a8a8a', 'stroke-width': 1 }, g);
      E('circle', { cx: p[0], cy: p[1], r: 2.6, fill: '#1c1c1c' }, g);
    });

    E('rect', { x: ax - 24, y: ay + 44, width: 36, height: 52, rx: 3, fill: 'url(#usbGrad)', stroke: '#7c7c7c', 'stroke-width': 1 }, g);
    E('rect', { x: ax - 19, y: ay + 50, width: 27, height: 40, rx: 2, fill: '#cdcdcd', stroke: '#9a9a9a', 'stroke-width': 0.6 }, g);

    E('rect', { x: ax - 16, y: ay + H - 96, width: 36, height: 48, rx: 7, fill: '#0c0c0c', stroke: '#333', 'stroke-width': 1 }, g);
    E('ellipse', { cx: ax + 2, cy: ay + H - 72, rx: 9, ry: 10, fill: '#262626', stroke: '#555', 'stroke-width': 1.2 }, g);

    E('rect', { x: ax + 44, y: ay + H - 132, width: 28, height: 36, rx: 2, fill: '#171717' }, g);
    E('rect', { x: ax + 48, y: ay + H - 136, width: 20, height: 8, rx: 1, fill: '#3a3a3a' }, g);

    [[ax + 96, ay + H - 92], [ax + 130, ay + H - 92]].forEach(function (p) {
      E('circle', { cx: p[0], cy: p[1], r: 16, fill: '#1b2a4a', stroke: '#0d1530', 'stroke-width': 1.3 }, g);
      E('circle', { cx: p[0], cy: p[1], r: 9, fill: '#243a64' }, g);
      E('line', { x1: p[0] - 6, y1: p[1], x2: p[0] + 6, y2: p[1], stroke: '#9aa6c0', 'stroke-width': 1 }, g);
    });

    E('rect', { x: ax + 22, y: ay + 26, width: 34, height: 30, rx: 3, fill: '#101010' }, g);
    E('circle', { cx: ax + 39, cy: ay + 41, r: 9, fill: '#c0392b', stroke: '#7a1414', 'stroke-width': 1.3 }, g);
    txt(g, ax + 39, ay + 64, 'RESET', { 'text-anchor': 'middle', 'font-size': 7, fill: '#dff' });

    function icsp(x, y, label) {
      E('rect', { x: x - 3, y: y - 3, width: 24, height: 21, rx: 2, fill: '#caa15a', opacity: 0.22 }, g);
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) E('rect', { x: x + c * 9, y: y + r * 9, width: 6, height: 6, rx: 1, fill: '#caa15a', stroke: '#7a5e2e', 'stroke-width': 0.5 }, g);
      if (label) txt(g, x + 9, y + 28, label, { 'text-anchor': 'middle', 'font-size': 6, fill: '#dff' });
    }
    icsp(ax + 74, ay + 30, 'ICSP2');
    icsp(ax + W - 56, ay + 150, 'ICSP');

    var icx = ax + 188, icy = ay + 184, icw = 168, ich = 42;
    E('rect', { x: icx, y: icy, width: icw, height: ich, rx: 2, fill: '#141414', stroke: '#000', 'stroke-width': 0.8 }, g);
    E('path', { d: 'M ' + (icx + icw / 2 - 8) + ' ' + icy + ' A 8 8 0 0 0 ' + (icx + icw / 2 + 8) + ' ' + icy + ' Z', fill: '#0a0a0a' }, g);
    for (var i = 0; i < 14; i++) {
      var lx = icx + 9 + i * ((icw - 18) / 13);
      E('rect', { x: lx - 1.5, y: icy - 4, width: 3, height: 4, fill: '#9a9a9a' }, g);
      E('rect', { x: lx - 1.5, y: icy + ich, width: 3, height: 4, fill: '#9a9a9a' }, g);
    }
    txt(g, icx + icw / 2, icy + ich / 2 + 3, 'ATMEGA328', { 'text-anchor': 'middle', 'font-size': 7, fill: '#7a7a7a' });

    E('rect', { x: icx + icw + 8, y: icy + 8, width: 30, height: 16, rx: 8, fill: '#c8c8c8', stroke: '#999', 'stroke-width': 1 }, g);
    txt(g, icx + icw + 23, icy + 33, '16MHz', { 'text-anchor': 'middle', 'font-size': 5.5, fill: '#cfe' });

    (function logo() {
      var cx = ax + 196, cy = ay + 112;
      E('circle', { cx: cx - 12, cy: cy, r: 12, fill: 'none', stroke: '#fff', 'stroke-width': 4, opacity: 0.9 }, g);
      E('circle', { cx: cx + 12, cy: cy, r: 12, fill: 'none', stroke: '#fff', 'stroke-width': 4, opacity: 0.9 }, g);
      txt(g, cx - 12, cy + 4, '–', { 'text-anchor': 'middle', 'font-size': 13, fill: '#fff', 'font-weight': 'bold' });
      txt(g, cx + 12, cy + 5, '+', { 'text-anchor': 'middle', 'font-size': 12, fill: '#fff', 'font-weight': 'bold' });
      txt(g, cx + 36, cy + 6, 'ARDUINO', { 'text-anchor': 'start', 'font-size': 17, 'font-weight': 'bold', 'font-family': 'system-ui', fill: '#fff' });
      E('rect', { x: cx + 152, y: cy - 15, width: 60, height: 30, rx: 15, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.85 }, g);
      txt(g, cx + 182, cy + 7, 'UNO', { 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 'bold', 'font-family': 'system-ui', fill: '#fff' });
    })();

    function ledDot(x, y, color, label, labelLeft) {
      E('rect', { x: x, y: y, width: 10, height: 6, rx: 1, fill: color, stroke: '#0005', 'stroke-width': 0.4 }, g);
      if (label) txt(g, labelLeft ? x - 3 : x + 13, y + 5.5, label, { 'text-anchor': labelLeft ? 'end' : 'start', 'font-size': 6, fill: '#dff' });
    }
    ledDot(ax + 132, ay + 86, '#f2d83a', 'L', true);
    ledDot(ax + 120, ay + 132, '#f2d83a', 'TX', true);
    ledDot(ax + 120, ay + 146, '#f2d83a', 'RX', true);
    ledDot(ax + W - 96, ay + 120, '#37d04a', 'ON');

    function headerRow(sx, y, pins, labelBelow) {
      var pitch = 13.5, n = pins.length;
      E('rect', { x: sx - 7, y: y - 7, width: (n - 1) * pitch + 14, height: 14, rx: 3, fill: '#191919' }, g);
      pins.forEach(function (pin, i) {
        var px = sx + i * pitch;
        E('rect', { x: px - 4.5, y: y - 4.5, width: 9, height: 9, rx: 1.5, fill: '#3a3a3a', stroke: '#0a0a0a', 'stroke-width': 0.6 }, g);
        E('rect', { x: px - 1.8, y: y - 1.8, width: 3.6, height: 3.6, rx: 0.6, fill: '#6a6a6a' }, g);
        if (pin.id) ardPins[pin.id] = { x: px, y: y, label: pin.l };
        if (pin.l) {
          var ly = labelBelow ? y + 8 : y - 8;
          var t = txt(g, px, ly, pin.l, { 'text-anchor': 'start', 'font-size': 6, fill: '#e6f2f3' });
          t.setAttribute('transform', 'rotate(-90 ' + px + ' ' + ly + ')');
        }
      });
    }
    headerRow(ax + 180, ay + 20, DIGITAL, true);
    headerRow(ax + 180, ay + H - 20, POWER, false);
    headerRow(ax + 312, ay + H - 20, ANALOG, false);

    txt(g, ax + 280, ay + 46, 'DIGITAL (PWM~)', { 'text-anchor': 'middle', 'font-size': 8, fill: '#fff', opacity: 0.85 });
    txt(g, ax + 220, ay + H - 44, 'POWER', { 'text-anchor': 'middle', 'font-size': 7, fill: '#fff', opacity: 0.8 });
    txt(g, ax + 346, ay + H - 44, 'ANALOG IN', { 'text-anchor': 'middle', 'font-size': 7, fill: '#fff', opacity: 0.8 });
    txt(g, ax + 150, ay + H - 12, 'www.arduino.cc', { 'text-anchor': 'middle', 'font-size': 6, fill: '#fff', opacity: 0.5 });
  })();

  // ---------- state ----------
  var state = { parts: [], wires: [], sel: null, tool: 'select', placing: null, wireDraft: null, hoverNode: null, nextId: 1 };
  var wireColor = '#2a6fd6';
  var lastPointer = { x: dims.width / 2, y: 80 };
  var drag = null;
  var nets = null;
  var history = [], future = [];
  var view = { x: 0, y: 0, w: dims.width, h: dims.height + ARD_H };
  var pointers = {}, pan = null, pinch = null, spaceDown = false;

  // ---------- geometry helpers ----------
  function byId(id) { for (var i = 0; i < state.parts.length; i++) if (state.parts[i].id === id) return state.parts[i]; return null; }
  function wireById(id) { for (var i = 0; i < state.wires.length; i++) if (state.wires[i].id === id) return state.wires[i]; return null; }
  function connXY(id) { return holesById[id] || ardPins[id] || null; }
  function nodeOfConn(id) { return holesById[id] ? holesById[id].node : id; } // arduino pin id is its own node
  function nearestHole(x, y, gridOnly) {
    var best = null, bd = Infinity;
    for (var i = 0; i < board.holes.length; i++) {
      var h = board.holes[i]; if (gridOnly && h.rail) continue;
      var dx = h.x - x, dy = h.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
  function nearestConn(x, y) {
    var best = null, bd = Infinity, dx, dy, d;
    board.holes.forEach(function (h) { dx = h.x - x; dy = h.y - y; d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { id: h.id, x: h.x, y: h.y }; } });
    for (var pid in ardPins) { var p = ardPins[pid]; dx = p.x - x; dy = p.y - y; d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { id: pid, x: p.x, y: p.y }; } }
    return { conn: best, dist: Math.sqrt(bd) };
  }
  function occupied(holeId, exceptId) {
    return state.parts.some(function (p) { return p.id !== exceptId && p.legHoles.indexOf(holeId) >= 0; });
  }
  function deriveLegs(type, anchorHole, rot) {
    if (!anchorHole || anchorHole.rail) return null;
    var span = PARTS[type].span, dc = 0, dr = 0;
    if (rot === 0) dc = span; else if (rot === 2) dc = -span;
    else if (rot === 1) dr = span; else if (rot === 3) dr = -span;
    var ri = ROWS.indexOf(anchorHole.row) + dr;
    if (ri < 0 || ri >= ROWS.length) return null;
    var h2 = holeByCR(anchorHole.col + dc, ROWS[ri]);
    if (!h2) return null;
    return [anchorHole.id, h2.id];
  }
  function validLegs(type, anchorHole, rot, exceptId) {
    var legs = deriveLegs(type, anchorHole, rot);
    if (!legs) return null;
    if (occupied(legs[0], exceptId) || occupied(legs[1], exceptId)) return null;
    return legs;
  }
  function wirePath(x1, y1, x2, y2) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(70, Math.abs(x2 - x1) * 0.3 + 22);
    return 'M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
  }
  function screenToBoard(cx, cy) {
    var p = svg.createSVGPoint(); p.x = cx; p.y = cy;
    var m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    var b = p.matrixTransform(m.inverse());
    return { x: b.x, y: b.y };
  }
  function toBoard(evt) { return screenToBoard(evt.clientX, evt.clientY); }

  // ---------- zoom / pan (viewBox; toBoard reads the live CTM so snapping stays correct) ----------
  function applyView() {
    svg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h);
    var z = document.getElementById('zoomlevel'); if (z) z.textContent = Math.round(dims.width / view.w * 100) + '%';
  }
  function clampW(w) { return Math.max(dims.width * 0.22, Math.min(dims.width * 1.7, w)); }
  function zoomAt(bx, by, factor) {
    var nw = clampW(view.w * factor), k = nw / view.w, nh = view.h * k;
    var fx = (bx - view.x) / view.w, fy = (by - view.y) / view.h;
    view.w = nw; view.h = nh; view.x = bx - fx * nw; view.y = by - fy * nh; applyView();
  }
  function fitView() { view.x = 0; view.y = 0; view.w = dims.width; view.h = dims.height + ARD_H; applyView(); }
  function doPan(e) {
    if (!pan) return;
    var rect = svg.getBoundingClientRect();
    view.x = pan.vx - (e.clientX - pan.sx) * (view.w / rect.width);
    view.y = pan.vy - (e.clientY - pan.sy) * (view.h / rect.height);
    applyView();
  }
  function pinchPair() { var ids = Object.keys(pointers); return [pointers[ids[0]], pointers[ids[1]]]; }
  function startPinch() {
    var p = pinchPair(); if (!p[0] || !p[1]) return;
    var mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2, b = screenToBoard(mx, my);
    pinch = { d0: Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)), bx: b.x, by: b.y, vw: view.w, vh: view.h };
  }
  function doPinch() {
    if (!pinch) return; var p = pinchPair(); if (!p[0] || !p[1]) return;
    var mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
    var d = Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y));
    var nw = clampW(pinch.vw * (pinch.d0 / d)), nh = pinch.vh * (nw / pinch.vw);
    var rect = svg.getBoundingClientRect();
    view.w = nw; view.h = nh;
    view.x = pinch.bx - ((mx - rect.left) / rect.width) * nw;
    view.y = pinch.by - ((my - rect.top) / rect.height) * nh;
    applyView();
  }
  function drawPartInto(parent, type, legHoles, opts, extraAttrs) {
    var h0 = holesById[legHoles[0]], h1 = holesById[legHoles[1]];
    if (!h0 || !h1) return null;
    var dx = h1.x - h0.x, dy = h1.y - h0.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    var attrs = Object.assign({ transform: 'translate(' + h0.x + ' ' + h0.y + ') rotate(' + ang + ')' }, extraAttrs || {});
    var g = E('g', attrs, parent);
    PARTS[type].draw(function (n, a) { return E(n, a, g); }, len, opts || {});
    return g;
  }

  // ---------- electrical nets (union-find over nodes + arduino pins) ----------
  function refreshNets() {
    var parent = {};
    function find(a) {
      if (parent[a] === undefined) parent[a] = a;
      var r = a; while (parent[r] !== r) r = parent[r];
      while (parent[a] !== r) { var nx = parent[a]; parent[a] = r; a = nx; }
      return r;
    }
    function uni(a, b) { var ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
    for (var id in board.nodes) find(id);
    for (var pid in ardPins) find(pid);
    state.wires.forEach(function (w) { uni(nodeOfConn(w.from), nodeOfConn(w.to)); });
    // NOTE: components do NOT union nodes. A resistor's two sides are different
    // potentials, so the equipotential highlight correctly stops at a component.
    var holeNet = {}, pinNet = {}, nodeNet = {};
    for (var id2 in board.nodes) nodeNet[id2] = find(id2);
    board.holes.forEach(function (h) { holeNet[h.id] = find(h.node); });
    for (var pid2 in ardPins) pinNet[pid2] = find(pid2);

    var issues = [];
    var rp = [find('rail-top-plus'), find('rail-bot-plus')];
    var rm = [find('rail-top-minus'), find('rail-bot-minus')];
    if (rp.some(function (a) { return rm.indexOf(a) >= 0; })) issues.push('Power rails are shorted (+ tied to -).');
    state.parts.forEach(function (p) {
      var h0 = holesById[p.legHoles[0]], h1 = holesById[p.legHoles[1]];
      if (h0 && h1 && h0.node === h1.node) issues.push(PARTS[p.type].label + ' is shorted (both legs on the same strip).');
    });

    // LED polarity / missing-resistor checks. Supply = + rails and 5V; ground =
    // - rails and GND. Because components do not union nets, an LED whose legs
    // land directly on supply and ground has no resistor in series.
    var supRoots = ['rail-top-plus', 'rail-bot-plus', 'ARD-5V', 'ARD-3V3', 'ARD-VIN'].map(find);
    var gndRoots = ['rail-top-minus', 'rail-bot-minus', 'ARD-GND', 'ARD-GND2', 'ARD-GND3'].map(find);
    function inSet(set, r) { return set.indexOf(r) >= 0; }
    var ledNoRes = false, ledRev = false;
    state.parts.forEach(function (p) {
      if (p.type !== 'led') return;
      var h0 = holesById[p.legHoles[0]], h1 = holesById[p.legHoles[1]];
      if (!h0 || !h1 || h0.node === h1.node) return;
      var ra = find(p.flip ? h1.node : h0.node), rc = find(p.flip ? h0.node : h1.node);
      if ((inSet(supRoots, ra) && inSet(gndRoots, rc)) || (inSet(gndRoots, ra) && inSet(supRoots, rc))) {
        ledNoRes = true;
        if (inSet(gndRoots, ra) && inSet(supRoots, rc)) ledRev = true;
      }
    });
    if (ledNoRes) issues.push('LED is directly across power with no current-limiting resistor.');
    if (ledRev) issues.push('LED looks backwards (its cathode is toward +).');

    nets = { nodeNet: nodeNet, holeNet: holeNet, pinNet: pinNet, find: find, issues: issues };
  }
  function rootOfNode(nodeId) {
    if (!nets) return null;
    return nets.nodeNet[nodeId] !== undefined ? nets.nodeNet[nodeId] : nets.pinNet[nodeId];
  }
  function selectionNetRoot() {
    if (!nets || !state.sel) return null;
    if (state.sel.kind === 'part') { var p = byId(state.sel.id); if (p) return nets.holeNet[p.legHoles[0]]; }
    if (state.sel.kind === 'wire') { var w = wireById(state.sel.id); if (w) return rootOfNode(nodeOfConn(w.from)); }
    return null;
  }

  // ---------- render dynamic layers ----------
  function render() {
    refreshNets();
    clear(wireLayer); clear(partLayer); clear(overlay);

    // active electrical net to highlight: hover wins, else current selection
    var active = (state.hoverNode != null) ? nets.nodeNet[state.hoverNode] : selectionNetRoot();
    if (active != null) {
      board.holes.forEach(function (h) {
        if (nets.holeNet[h.id] === active) {
          E('circle', { cx: h.x, cy: h.y, r: 6, fill: '#3aa0ff', opacity: 0.18 }, overlay);
          E('circle', { cx: h.x, cy: h.y, r: 6, fill: 'none', stroke: '#3aa0ff', 'stroke-width': 1.8, opacity: 0.95 }, overlay);
        }
      });
      for (var pid in ardPins) {
        if (nets.pinNet[pid] === active) {
          var pp = ardPins[pid];
          E('circle', { cx: pp.x, cy: pp.y, r: 6.5, fill: 'none', stroke: '#3aa0ff', 'stroke-width': 2 }, overlay);
        }
      }
    }

    state.wires.forEach(function (w) {
      var a = connXY(w.from), b = connXY(w.to); if (!a || !b) return;
      var d = wirePath(a.x, a.y, b.x, b.y);
      E('path', { d: d, fill: 'none', stroke: '#00000040', 'stroke-width': 6, 'stroke-linecap': 'round' }, wireLayer);
      E('path', { d: d, fill: 'none', stroke: w.color, 'stroke-width': 4, 'stroke-linecap': 'round' }, wireLayer);
      E('path', { d: d, fill: 'none', stroke: '#000', 'stroke-width': 13, opacity: 0, 'data-wire-id': w.id, style: 'cursor:pointer' }, wireLayer);
      E('circle', { cx: a.x, cy: a.y, r: 3.2, fill: w.color }, wireLayer);
      E('circle', { cx: b.x, cy: b.y, r: 3.2, fill: w.color }, wireLayer);
      if (state.sel && state.sel.kind === 'wire' && state.sel.id === w.id)
        E('path', { d: d, fill: 'none', stroke: '#3aa0ff', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, wireLayer);
    });

    state.parts.forEach(function (p) {
      var g = drawPartInto(partLayer, p.type, p.legHoles, p, { 'data-part-id': p.id, style: 'cursor:grab' });
      if (g && state.sel && state.sel.kind === 'part' && state.sel.id === p.id) {
        try {
          var bb = g.getBBox();
          E('rect', { x: bb.x - 3, y: bb.y - 3, width: bb.width + 6, height: bb.height + 6, rx: 5,
            fill: 'none', stroke: '#3aa0ff', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' }, g);
        } catch (_) {}
      }
    });

    if (state.placing) {
      var nh = nearestHole(lastPointer.x, lastPointer.y, true);
      var legs = validLegs(state.placing.type, nh, state.placing.rot);
      if (legs) {
        drawPartInto(overlay, state.placing.type, legs, {}, { opacity: 0.85 });
        E('circle', { cx: holesById[legs[0]].x, cy: holesById[legs[0]].y, r: 6.5, fill: 'none', stroke: '#27c93f', 'stroke-width': 2 }, overlay);
        E('circle', { cx: holesById[legs[1]].x, cy: holesById[legs[1]].y, r: 6.5, fill: 'none', stroke: '#27c93f', 'stroke-width': 2 }, overlay);
      } else if (nh) {
        E('circle', { cx: nh.x, cy: nh.y, r: 7, fill: 'none', stroke: '#e33', 'stroke-width': 2 }, overlay);
      }
    }

    if (state.wireDraft) {
      var f = connXY(state.wireDraft.from);
      if (f) {
        E('circle', { cx: f.x, cy: f.y, r: 5, fill: 'none', stroke: '#3aa0ff', 'stroke-width': 2 }, overlay);
        E('line', { x1: f.x, y1: f.y, x2: lastPointer.x, y2: lastPointer.y, stroke: '#3aa0ff', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, overlay);
      }
    }
    updateStatus();
    updateChecks();
    renderInspector();
  }

  function updateStatus() {
    var s = document.getElementById('status');
    if (!s) return;
    var mode = state.placing ? ('placing ' + state.placing.type + ' (R to rotate)')
      : (state.tool === 'wire' ? (state.wireDraft ? 'wire: pick 2nd hole' : 'wire: pick 1st hole') : 'select');
    s.textContent = state.parts.length + ' parts, ' + state.wires.length + ' wires  |  ' + mode;
  }
  function updateChecks() {
    var ck = document.getElementById('checks');
    if (!ck || !nets) return;
    if (!nets.issues.length) { ck.textContent = 'No electrical issues'; ck.className = 'checks ok'; }
    else { ck.innerHTML = nets.issues.map(function (s) { return '<div>' + s + '</div>'; }).join(''); ck.className = 'checks warn'; }
  }

  var _inspSig = '';
  function renderInspector() {
    var el = document.getElementById('inspector'); if (!el) return;
    var p = (state.sel && state.sel.kind === 'part') ? byId(state.sel.id) : null;
    var sig = p ? (p.id + '|' + p.type + '|' + (p.value || '') + '|' + (p.color || '') + '|' + p.flip + '|' + p.rot) : '';
    if (sig === _inspSig) return;
    _inspSig = sig;
    if (!p) { el.innerHTML = '<div class="insp-empty">Select a part to edit its value.</div>'; return; }
    var h = '<div class="insp-title">' + PARTS[p.type].label + '</div>';
    if (p.type === 'resistor') {
      h += '<label>Resistance</label><select data-insp="value">';
      window.RES_VALUES.forEach(function (o) { h += '<option value="' + o.v + '"' + (o.v === (p.value || '220') ? ' selected' : '') + '>' + o.v + ' Ω</option>'; });
      h += '</select>';
    } else if (p.type === 'led') {
      h += '<label>Color</label><select data-insp="color">';
      Object.keys(window.LED_COLORS).forEach(function (c) { h += '<option value="' + c + '"' + (c === (p.color || 'red') ? ' selected' : '') + '>' + c + '</option>'; });
      h += '</select><button data-insp="flip">Flip polarity</button>';
      h += '<div class="insp-note">The marked side is the cathode (minus).</div>';
    }
    h += '<div class="insp-row"><button data-insp="rotate">Rotate</button><button data-insp="delete">Delete</button></div>';
    el.innerHTML = h;
  }

  // ---------- events ----------
  svg.addEventListener('pointermove', function (e) {
    if (pointers[e.pointerId]) { pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY; }
    if (pinch) { doPinch(); return; }
    if (pan) { doPan(e); return; }
    lastPointer = toBoard(e);
    if (state.placing || state.wireDraft) { render(); return; }
    if (drag) {
      var p = byId(drag.id);
      if (p) {
        var legs = validLegs(p.type, nearestHole(lastPointer.x, lastPointer.y, true), p.rot, p.id);
        if (legs) { p.anchor = legs[0]; p.legHoles = legs; drag.moved = true; render(); }
      }
      return;
    }
    if (state.tool === 'select') {
      var hh = nearestHole(lastPointer.x, lastPointer.y, false);
      var nn = (hh && Math.hypot(hh.x - lastPointer.x, hh.y - lastPointer.y) < P * 0.55) ? hh.node : null;
      if (nn !== state.hoverNode) { state.hoverNode = nn; render(); }
    }
  });

  svg.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pointers).length >= 2) { startPinch(); pan = null; drag = null; try { svg.setPointerCapture(e.pointerId); } catch (_) {} return; }
    if (spaceDown || e.button === 1) { pan = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; document.body.classList.add('panning'); try { svg.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); return; }
    lastPointer = toBoard(e);
    if (state.placing || state.tool === 'wire') return;
    var partEl = e.target.closest && e.target.closest('[data-part-id]');
    if (partEl) {
      var id = +partEl.getAttribute('data-part-id');
      state.sel = { kind: 'part', id: id };
      if (byId(id)) drag = { id: id, moved: false, before: JSON.stringify(snapshot()) };
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      render(); return;
    }
    var wireEl = e.target.closest && e.target.closest('[data-wire-id]');
    if (wireEl) { state.sel = { kind: 'wire', id: wireEl.getAttribute('data-wire-id') }; render(); return; }
    state.sel = null; render();
  });

  window.addEventListener('pointerup', function (e) {
    delete pointers[e.pointerId];
    if (pinch && Object.keys(pointers).length < 2) pinch = null;
    if (pan) { pan = null; document.body.classList.remove('panning'); }
    if (drag) {
      if (drag.moved) { try { history.push(drag.before); if (history.length > 120) history.shift(); future.length = 0; } catch (_) {} updateUndoButtons(); save(); }
      drag = null;
    }
  });
  window.addEventListener('pointercancel', function (e) {
    delete pointers[e.pointerId];
    pinch = null; drag = null;
    if (pan) { pan = null; document.body.classList.remove('panning'); }
  });
  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pt = toBoard(e);
    zoomAt(pt.x, pt.y, e.deltaY < 0 ? 0.86 : 1.16);
  }, { passive: false });
  window.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Spacebar') spaceDown = false; });

  svg.addEventListener('pointerleave', function () {
    if (state.hoverNode != null) { state.hoverNode = null; render(); }
  });

  svg.addEventListener('click', function (e) {
    var pt = toBoard(e);
    if (state.placing) {
      var legs = validLegs(state.placing.type, nearestHole(pt.x, pt.y, true), state.placing.rot);
      if (legs) {
        pushHistory();
        var np = { id: state.nextId++, type: state.placing.type, anchor: legs[0], rot: state.placing.rot, legHoles: legs };
        var dd = PARTS[state.placing.type].defaults; if (dd) for (var dk in dd) np[dk] = dd[dk];
        state.parts.push(np);
        state.placing = null; document.body.classList.remove('placing'); setActiveAction('select'); state.tool = 'select';
        save(); render();
      }
      return;
    }
    if (state.tool === 'wire') {
      var c = nearestConn(pt.x, pt.y);
      if (c.conn && c.dist < 16) {
        if (!state.wireDraft) state.wireDraft = { from: c.conn.id };
        else if (c.conn.id !== state.wireDraft.from) {
          var fr = state.wireDraft.from, to = c.conn.id;
          var dup = state.wires.some(function (w) { return (w.from === fr && w.to === to) || (w.from === to && w.to === fr); });
          if (!dup) { pushHistory(); state.wires.push({ id: 'w' + state.nextId++, from: fr, to: to, color: wireColor }); save(); }
          state.wireDraft = null;
        }
        render();
      }
    }
  });

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { if (e.shiftKey) redo(); else undo(); e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { redo(); e.preventDefault(); return; }
    if (k === ' ' || k === 'Spacebar') { spaceDown = true; if (e.target === document.body) e.preventDefault(); return; }
    if (k === '0') { fitView(); return; }
    if (k === 'Escape') { state.placing = null; state.wireDraft = null; document.body.classList.remove('placing'); render(); return; }
    if (k === 'r' || k === 'R') {
      if (state.placing) { state.placing.rot = (state.placing.rot + 1) % 4; render(); e.preventDefault(); return; }
      if (state.sel && state.sel.kind === 'part') {
        var p = byId(state.sel.id);
        if (p) {
          var nr = (p.rot + 1) % 4;
          var legs = validLegs(p.type, holesById[p.anchor], nr, p.id);
          if (legs) { pushHistory(); p.rot = nr; p.legHoles = legs; save(); render(); }
        }
        e.preventDefault();
      }
      return;
    }
    if (k === 'Delete' || k === 'Backspace') {
      if (state.sel) {
        pushHistory();
        if (state.sel.kind === 'part') state.parts = state.parts.filter(function (p) { return p.id !== state.sel.id; });
        else state.wires = state.wires.filter(function (w) { return w.id !== state.sel.id; });
        state.sel = null; save(); render(); e.preventDefault();
      }
    }
  });

  // ---------- tool bins + actions (delegated across the whole UI) ----------
  var bin = document.querySelector('.bin');
  function clearActive() { if (bin) bin.querySelectorAll('.bin-item').forEach(function (b) { b.classList.remove('active'); }); }
  function setActiveEl(b) { clearActive(); if (b && b.classList && b.classList.contains('bin-item')) b.classList.add('active'); }
  function setActiveAction(a) { setActiveEl(bin ? bin.querySelector('[data-action="' + a + '"]') : null); }
  function rotateSelected() {
    if (!state.sel || state.sel.kind !== 'part') return;
    var p = byId(state.sel.id); if (!p) return;
    var nr = (p.rot + 1) % 4, legs = validLegs(p.type, holesById[p.anchor], nr, p.id);
    if (legs) { pushHistory(); p.rot = nr; p.legHoles = legs; save(); render(); }
  }

  document.body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) return;
    var act = b.getAttribute('data-action');
    if (act === 'select') { state.tool = 'select'; state.placing = null; state.wireDraft = null; document.body.classList.remove('placing'); setActiveEl(b); }
    else if (act === 'wire') { state.tool = 'wire'; state.placing = null; document.body.classList.remove('placing'); setActiveEl(b); }
    else if (act === 'place') { state.tool = 'select'; state.wireDraft = null; state.placing = { type: b.getAttribute('data-part'), rot: 0 }; document.body.classList.add('placing'); setActiveEl(b); }
    else if (act === 'undo') { undo(); return; }
    else if (act === 'redo') { redo(); return; }
    else if (act === 'fit') { fitView(); return; }
    else if (act === 'zoomin') { zoomAt(view.x + view.w / 2, view.y + view.h / 2, 0.83); return; }
    else if (act === 'zoomout') { zoomAt(view.x + view.w / 2, view.y + view.h / 2, 1.2); return; }
    else if (act === 'rotate-sel') { rotateSelected(); return; }
    else if (act === 'export') { exportJSON(); return; }
    else if (act === 'import') { document.getElementById('file').click(); return; }
    else if (act === 'clear') { if (window.confirm('Clear the whole layout?')) { pushHistory(); state.parts = []; state.wires = []; state.sel = null; state.placing = null; state.wireDraft = null; save(); render(); } return; }
    render();
  });
  document.getElementById('wireColor').addEventListener('input', function (e) { wireColor = e.target.value; });
  document.getElementById('file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { importData(JSON.parse(r.result)); } catch (_) { window.alert('That file is not a valid layout.'); } };
    r.readAsText(f); e.target.value = '';
  });

  var inspEl = document.getElementById('inspector');
  function inspPart() { return (state.sel && state.sel.kind === 'part') ? byId(state.sel.id) : null; }
  inspEl.addEventListener('change', function (e) {
    var el = e.target.closest('[data-insp]'); if (!el) return;
    var p = inspPart(); if (!p) return;
    var k = el.getAttribute('data-insp');
    if (k === 'value') { pushHistory(); p.value = el.value; save(); _inspSig = ''; render(); }
    else if (k === 'color') { pushHistory(); p.color = el.value; save(); _inspSig = ''; render(); }
  });
  inspEl.addEventListener('click', function (e) {
    var el = e.target.closest('[data-insp]'); if (!el) return;
    var p = inspPart(); if (!p) return;
    var k = el.getAttribute('data-insp');
    if (k === 'flip') { pushHistory(); p.flip = !p.flip; save(); _inspSig = ''; render(); }
    else if (k === 'rotate') {
      var nr = (p.rot + 1) % 4, legs = validLegs(p.type, holesById[p.anchor], nr, p.id);
      if (legs) { pushHistory(); p.rot = nr; p.legHoles = legs; save(); _inspSig = ''; render(); }
    } else if (k === 'delete') { pushHistory(); state.parts = state.parts.filter(function (x) { return x.id !== p.id; }); state.sel = null; save(); render(); }
  });

  // ---------- persistence ----------
  var KEY = 'breadboard.layout.v1';
  function normalizePart(p) {
    if (p.rot == null) p.rot = 0;
    if (p.anchor == null && p.legHoles) p.anchor = p.legHoles[0];
    var d = PARTS[p.type] && PARTS[p.type].defaults; if (d) for (var k in d) if (p[k] == null) p[k] = d[k];
    return p;
  }
  function validPart(p) { return p.legHoles && PARTS[p.type] && holesById[p.legHoles[0]] && holesById[p.legHoles[1]]; }
  function snapshot() { return { version: 1, parts: state.parts, wires: state.wires, nextId: state.nextId }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (_) {} }
  function adopt(o) {
    state.parts = (o.parts || []).map(normalizePart).filter(validPart);
    state.wires = (o.wires || []).filter(function (w) { return connXY(w.from) && connXY(w.to); });
    state.nextId = o.nextId || (state.parts.length + state.wires.length + 10);
  }

  // ---------- undo / redo (snapshot history; state is tiny) ----------
  function pushHistory() {
    try { history.push(JSON.stringify(snapshot())); if (history.length > 120) history.shift(); } catch (_) {}
    future.length = 0;
    updateUndoButtons();
  }
  function applySnap(snap) {
    adopt(snap); state.sel = null; state.placing = null; state.wireDraft = null;
    document.body.classList.remove('placing'); save(); render(); updateUndoButtons();
  }
  function undo() { if (!history.length) return; future.push(JSON.stringify(snapshot())); applySnap(JSON.parse(history.pop())); }
  function redo() { if (!future.length) return; history.push(JSON.stringify(snapshot())); applySnap(JSON.parse(future.pop())); }
  function updateUndoButtons() {
    var u = document.querySelector('[data-action="undo"]'), r = document.querySelector('[data-action="redo"]');
    if (u) u.disabled = !history.length;
    if (r) r.disabled = !future.length;
  }
  function importData(o) {
    if (!o || o.version !== 1) { window.alert('Unsupported layout version.'); return; }
    pushHistory(); adopt(o); state.sel = null; save(); render();
  }
  function loadSaved() {
    try {
      var s = localStorage.getItem(KEY); if (!s) return false;
      var o = JSON.parse(s); if (!o || o.version !== 1) return false;
      adopt(o); return true;
    } catch (_) { return false; }
  }
  function exportJSON() {
    try {
      var blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'breadboard-layout.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (_) {}
  }

  function seedDemo() {
    function part(type, c, r) {
      var anchor = holeByCR(c, r); if (!anchor) return null;
      var legs = deriveLegs(type, anchor, 0); if (!legs) return null;
      var p = { id: state.nextId++, type: type, anchor: legs[0], rot: 0, legHoles: legs };
      var sd = PARTS[type].defaults; if (sd) for (var sk in sd) p[sk] = sd[sk];
      state.parts.push(p);
    }
    part('resistor', 12, 'b');
    part('led', 19, 'b');
    var r1 = holeByCR(12, 'b'), l2 = holeByCR(21, 'b');
    if (ardPins['ARD-D13'] && r1) state.wires.push({ id: 'w' + state.nextId++, from: 'ARD-D13', to: r1.id, color: '#1f9d3a' });
    if (ardPins['ARD-GND'] && l2) state.wires.push({ id: 'w' + state.nextId++, from: l2.id, to: 'ARD-GND', color: '#111' });
    save();
  }

  if (!loadSaved()) seedDemo();
  setActiveAction('select');
  applyView();
  render();
  updateUndoButtons();
})();
