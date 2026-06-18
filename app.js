// app.js
// The interactive tool: realistic breadboard + Arduino, place LED/Resistor parts
// that snap to holes, draw jumper wires hole-to-hole, select + delete, autosave.
//
// Layers (back to front): board (static) | arduino (static) | wires | parts | overlay.
// Holes are a <symbol> instanced with <use> (no per-instance filters: cheap).

(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  var board = window.buildBoard();
  var PARTS = window.PARTS;
  var dims = board.dims, L = board.layout, P = dims.pitch;

  var svg = document.getElementById('board');
  var ARD_H = 132; // vertical space reserved for the Arduino below the board
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

  // layers
  var boardLayer = E('g'), ardLayer = E('g'), wireLayer = E('g'), partLayer = E('g');
  var overlay = E('g', { 'pointer-events': 'none' });

  // lookups
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
  var ardPins = {}; // id -> {x, y, label}
  (function drawArduino() {
    var ax = 120, ay = dims.height + 6, g = ardLayer;
    E('rect', { x: ax, y: ay, width: 360, height: 120, rx: 10, fill: 'url(#pcbGrad)', stroke: '#045158', 'stroke-width': 1.4, filter: 'url(#softbig)' }, g);
    E('rect', { x: ax + 8, y: ay + 8, width: 344, height: 104, rx: 6, fill: 'none', stroke: '#fff', 'stroke-width': 0.7, opacity: 0.3 }, g);
    // top header with a few labeled, wire-able pins
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
  var state = { parts: [], wires: [], sel: null, tool: 'select', placing: null, wireDraft: null, nextId: 1 };
  var wireColor = '#2a6fd6';
  var lastPointer = { x: dims.width / 2, y: 80 };
  var drag = null;

  // ---------- geometry helpers ----------
  function byId(id) { for (var i = 0; i < state.parts.length; i++) if (state.parts[i].id === id) return state.parts[i]; return null; }
  function connXY(id) { return holesById[id] || ardPins[id] || null; }
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
  // anchor a part's first leg, derive the second from its fixed span; null if invalid
  function validLegs(type, anchorHole, exceptId) {
    if (!anchorHole || anchorHole.rail) return null;
    var leg2 = holeByCR(anchorHole.col + PARTS[type].span, anchorHole.row);
    if (!leg2) return null;
    if (occupied(anchorHole.id, exceptId) || occupied(leg2.id, exceptId)) return null;
    return [anchorHole.id, leg2.id];
  }
  function wirePath(x1, y1, x2, y2) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(70, Math.abs(x2 - x1) * 0.3 + 22);
    return 'M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
  }
  function toBoard(evt) {
    var p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
    var m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    var b = p.matrixTransform(m.inverse());
    return { x: b.x, y: b.y };
  }

  // ---------- render dynamic layers ----------
  function render() {
    clear(wireLayer); clear(partLayer); clear(overlay);

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
      var h0 = holesById[p.legHoles[0]], h1 = holesById[p.legHoles[1]]; if (!h0 || !h1) return;
      var g = E('g', { 'data-part-id': p.id, style: 'cursor:grab' }, partLayer);
      PARTS[p.type].draw(function (n, a) { return E(n, a, g); }, h0.x, h0.y, h1.x, h1.y, p);
      if (state.sel && state.sel.kind === 'part' && state.sel.id === p.id) {
        try {
          var bb = g.getBBox();
          E('rect', { x: bb.x - 3, y: bb.y - 3, width: bb.width + 6, height: bb.height + 6, rx: 5,
            fill: 'none', stroke: '#3aa0ff', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' }, g);
        } catch (_) {}
      }
    });

    if (state.placing) {
      var nh = nearestHole(lastPointer.x, lastPointer.y, true);
      var legs = validLegs(state.placing.type, nh);
      if (legs) {
        var a0 = holesById[legs[0]], a1 = holesById[legs[1]];
        var gg = E('g', { opacity: 0.85 }, overlay);
        PARTS[state.placing.type].draw(function (n, at) { return E(n, at, gg); }, a0.x, a0.y, a1.x, a1.y, {});
        E('circle', { cx: a0.x, cy: a0.y, r: 6.5, fill: 'none', stroke: '#27c93f', 'stroke-width': 2 }, overlay);
        E('circle', { cx: a1.x, cy: a1.y, r: 6.5, fill: 'none', stroke: '#27c93f', 'stroke-width': 2 }, overlay);
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
  }

  function updateStatus() {
    var s = document.getElementById('status');
    if (!s) return;
    var mode = state.placing ? ('placing ' + state.placing.type) : (state.tool === 'wire' ? (state.wireDraft ? 'wire: pick 2nd hole' : 'wire: pick 1st hole') : 'select');
    s.textContent = state.parts.length + ' parts, ' + state.wires.length + ' wires  |  ' + mode;
  }

  // ---------- events ----------
  svg.addEventListener('pointermove', function (e) {
    lastPointer = toBoard(e);
    if (state.placing || state.wireDraft) { render(); return; }
    if (drag) {
      var legs = validLegs(drag.type, nearestHole(lastPointer.x, lastPointer.y, true), drag.id);
      if (legs) { var p = byId(drag.id); if (p) { p.legHoles = legs; drag.moved = true; render(); } }
    }
  });

  svg.addEventListener('pointerdown', function (e) {
    lastPointer = toBoard(e);
    if (state.placing || state.tool === 'wire') return; // these commit on click
    var partEl = e.target.closest && e.target.closest('[data-part-id]');
    if (partEl) {
      var id = +partEl.getAttribute('data-part-id'); var p = byId(id);
      state.sel = { kind: 'part', id: id };
      if (p) drag = { id: id, type: p.type, moved: false };
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      render(); return;
    }
    var wireEl = e.target.closest && e.target.closest('[data-wire-id]');
    if (wireEl) { state.sel = { kind: 'wire', id: wireEl.getAttribute('data-wire-id') }; render(); return; }
    state.sel = null; render();
  });

  window.addEventListener('pointerup', function () {
    if (drag) { if (drag.moved) save(); drag = null; }
  });

  svg.addEventListener('click', function (e) {
    var pt = toBoard(e);
    if (state.placing) {
      var legs = validLegs(state.placing.type, nearestHole(pt.x, pt.y, true));
      if (legs) {
        state.parts.push({ id: state.nextId++, type: state.placing.type, legHoles: legs });
        state.placing = null; document.body.classList.remove('placing'); clearActive(); setActiveAction('select');
        state.tool = 'select'; save(); render();
      }
      return;
    }
    if (state.tool === 'wire') {
      var c = nearestConn(pt.x, pt.y);
      if (c.conn && c.dist < 16) {
        if (!state.wireDraft) state.wireDraft = { from: c.conn.id };
        else if (c.conn.id !== state.wireDraft.from) {
          state.wires.push({ id: 'w' + state.nextId++, from: state.wireDraft.from, to: c.conn.id, color: wireColor });
          state.wireDraft = null; save();
        }
        render();
      }
    }
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { state.placing = null; state.wireDraft = null; document.body.classList.remove('placing'); render(); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.sel) {
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
    else if (act === 'place') { state.tool = 'select'; state.wireDraft = null; state.placing = { type: b.getAttribute('data-part') }; document.body.classList.add('placing'); setActiveEl(b); }
    else if (act === 'export') exportJSON();
    else if (act === 'import') document.getElementById('file').click();
    else if (act === 'clear') { if (window.confirm('Clear the whole layout?')) { state.parts = []; state.wires = []; state.sel = null; state.placing = null; state.wireDraft = null; save(); } }
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
  function snapshot() { return { version: 1, parts: state.parts, wires: state.wires, nextId: state.nextId }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (_) {} }
  function importData(o) {
    if (!o || o.version !== 1) { window.alert('Unsupported layout version.'); return; }
    state.parts = (o.parts || []).filter(function (p) { return p.legHoles && PARTS[p.type] && holesById[p.legHoles[0]] && holesById[p.legHoles[1]]; });
    state.wires = (o.wires || []).filter(function (w) { return connXY(w.from) && connXY(w.to); });
    state.nextId = o.nextId || (state.parts.length + state.wires.length + 10);
    state.sel = null; save(); render();
  }
  function loadSaved() {
    try {
      var s = localStorage.getItem(KEY); if (!s) return false;
      var o = JSON.parse(s); if (!o || o.version !== 1) return false;
      state.parts = (o.parts || []).filter(function (p) { return p.legHoles && PARTS[p.type] && holesById[p.legHoles[0]] && holesById[p.legHoles[1]]; });
      state.wires = (o.wires || []).filter(function (w) { return connXY(w.from) && connXY(w.to); });
      state.nextId = o.nextId || (state.parts.length + state.wires.length + 10);
      return true;
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

  // first-run demo so an empty board still shows the realistic look + a blink-an-LED wiring
  function seedDemo() {
    var r1 = holeByCR(12, 'b'), r2 = holeByCR(17, 'b');
    var l1 = holeByCR(19, 'b'), l2 = holeByCR(21, 'b');
    if (r1 && r2) state.parts.push({ id: state.nextId++, type: 'resistor', legHoles: [r1.id, r2.id] });
    if (l1 && l2) state.parts.push({ id: state.nextId++, type: 'led', legHoles: [l1.id, l2.id] });
    if (ardPins['ARD-D13'] && r1) state.wires.push({ id: 'w' + state.nextId++, from: 'ARD-D13', to: r1.id, color: '#1f9d3a' });
    if (ardPins['ARD-GND'] && l2) state.wires.push({ id: 'w' + state.nextId++, from: l2.id, to: 'ARD-GND', color: '#111' });
    save();
  }

  if (!loadSaved()) seedDemo();
  setActiveAction('select');
  render();
})();
