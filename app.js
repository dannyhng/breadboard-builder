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
  var ARD_H = 132;
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
    var ax = 120, ay = dims.height + 6, g = ardLayer;
    E('rect', { x: ax, y: ay, width: 360, height: 120, rx: 10, fill: 'url(#pcbGrad)', stroke: '#045158', 'stroke-width': 1.4, filter: 'url(#softbig)' }, g);
    E('rect', { x: ax + 8, y: ay + 8, width: 344, height: 104, rx: 6, fill: 'none', stroke: '#fff', 'stroke-width': 0.7, opacity: 0.3 }, g);
    var hx = ax + 70, hy = ay + 12, n = 16;
    E('rect', { x: hx - 8, y: hy, width: n * 13 + 6, height: 16, rx: 3, fill: '#1c1c1c' }, g);
    var labels = { 0: '5V', 1: 'GND', 5: 'D13', 6: 'D12' };
    for (var i = 0; i < n; i++) {
      var px = hx + i * 13;
      E('rect', { x: px - 4, y: hy + 3, width: 9, height: 9, rx: 1.5, fill: '#3a3a3a', stroke: '#0a0a0a', 'stroke-width': 0.6 }, g);
      if (labels[i]) {
        ardPins['ARD-' + labels[i]] = { x: px, y: hy + 2, label: labels[i] };
        txt(g, px, hy - 3, labels[i], { 'text-anchor': 'middle', 'font-size': 7, fill: '#cde' });
      }
    }
    E('rect', { x: ax - 14, y: ay + 26, width: 28, height: 36, rx: 3, fill: 'url(#usbGrad)', stroke: '#888' }, g);
    E('rect', { x: ax - 12, y: ay + 74, width: 26, height: 28, rx: 5, fill: '#101010', stroke: '#333' }, g);
    E('rect', { x: ax + 150, y: ay + 54, width: 110, height: 30, rx: 3, fill: '#161616' }, g);
    E('rect', { x: ax + 60, y: ay + 58, width: 18, height: 12, rx: 2, fill: '#0d0d0d' }, g);
    E('rect', { x: ax + 86, y: ay + 58, width: 12, height: 12, rx: 2, fill: '#c9a23a' }, g);
    E('rect', { x: ax + 40, y: ay + 58, width: 7, height: 5, rx: 1, fill: '#37d04a' }, g);
    txt(g, ax + 150, ay + 100, 'ARDUINO', { fill: '#fff', opacity: 0.85, 'font-size': 14, 'font-weight': 'bold', 'font-family': 'system-ui' });
    txt(g, ax + 150, ay + 112, 'UNO', { fill: '#fff', opacity: 0.7, 'font-size': 9, 'font-family': 'system-ui' });
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
  function applyView() { svg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h); }
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
    state.parts.forEach(function (p) {
      var h0 = holesById[p.legHoles[0]], h1 = holesById[p.legHoles[1]];
      if (h0 && h1) uni(h0.node, h1.node);
    });
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
    if (!nets.issues.length) { ck.textContent = 'Checks: no electrical issues'; ck.className = 'checks ok'; }
    else { ck.textContent = 'Checks: ' + nets.issues.join('   •   '); ck.className = 'checks warn'; }
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
        state.parts.push({ id: state.nextId++, type: state.placing.type, anchor: legs[0], rot: state.placing.rot, legHoles: legs });
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

  // ---------- toolbar ----------
  var toolbar = document.querySelector('.toolbar');
  function clearActive() { toolbar.querySelectorAll('button.tool').forEach(function (b) { b.classList.remove('active'); }); }
  function setActiveEl(b) { clearActive(); if (b) b.classList.add('active'); }
  function setActiveAction(a) { setActiveEl(toolbar.querySelector('button[data-action="' + a + '"]')); }

  toolbar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) return;
    var act = b.getAttribute('data-action');
    if (act === 'select') { state.tool = 'select'; state.placing = null; state.wireDraft = null; document.body.classList.remove('placing'); setActiveEl(b); }
    else if (act === 'wire') { state.tool = 'wire'; state.placing = null; document.body.classList.remove('placing'); setActiveEl(b); }
    else if (act === 'place') { state.tool = 'select'; state.wireDraft = null; state.placing = { type: b.getAttribute('data-part'), rot: 0 }; document.body.classList.add('placing'); setActiveEl(b); }
    else if (act === 'undo') { undo(); return; }
    else if (act === 'redo') { redo(); return; }
    else if (act === 'fit') { fitView(); return; }
    else if (act === 'export') exportJSON();
    else if (act === 'import') document.getElementById('file').click();
    else if (act === 'clear') { if (window.confirm('Clear the whole layout?')) { pushHistory(); state.parts = []; state.wires = []; state.sel = null; state.placing = null; state.wireDraft = null; save(); } }
    render();
  });
  document.getElementById('wireColor').addEventListener('input', function (e) { wireColor = e.target.value; });
  document.getElementById('file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { importData(JSON.parse(r.result)); } catch (_) { window.alert('That file is not a valid layout.'); } };
    r.readAsText(f); e.target.value = '';
  });

  // ---------- persistence ----------
  var KEY = 'breadboard.layout.v1';
  function normalizePart(p) { if (p.rot == null) p.rot = 0; if (p.anchor == null && p.legHoles) p.anchor = p.legHoles[0]; return p; }
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
      state.parts.push({ id: state.nextId++, type: type, anchor: legs[0], rot: 0, legHoles: legs });
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
