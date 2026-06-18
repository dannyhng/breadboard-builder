// parts.js
// Part definitions as DATA. Each part declares its legs (offsets from the anchor
// hole, in column/row deltas at rotation 0), a label prefix, and a draw().
//
//   axis:true  -> 2-leg parts. draw(mk, len, opts) in a local frame the app
//                 rotates (leg 1 at 0,0, leg 2 at len,0).
//   axis:false -> N-leg parts. draw(mk, legCoords, opts) in board coords.
// Optional: values [..] (Inspector value dropdown), polar (a Flip control).
//
// Footprints + pinouts here track the ELEGOO UNO R3 starter kit parts so the
// shapes match what a beginner is actually holding (TO-92 transistor, common
// cathode RGB LED, 74HC595, common cathode 7-segment, etc).

(function (root) {
  'use strict';

  var METAL = 'url(#metalGrad)', SOFT = 'url(#soft)';

  var RES_VALUES = [
    { v: '220',  bands: ['#b8392b', '#b8392b', '#6b4423', '#d4af37'] },
    { v: '330',  bands: ['#e08a1e', '#e08a1e', '#6b4423', '#d4af37'] },
    { v: '470',  bands: ['#e6d21e', '#7b3fb0', '#6b4423', '#d4af37'] },
    { v: '1k',   bands: ['#6b4423', '#161616', '#b8392b', '#d4af37'] },
    { v: '2.2k', bands: ['#b8392b', '#b8392b', '#b8392b', '#d4af37'] },
    { v: '4.7k', bands: ['#e6d21e', '#7b3fb0', '#b8392b', '#d4af37'] },
    { v: '10k',  bands: ['#6b4423', '#161616', '#e08a1e', '#d4af37'] },
    { v: '100k', bands: ['#6b4423', '#161616', '#e6d21e', '#d4af37'] }
  ];
  function resistorBands(v) {
    for (var i = 0; i < RES_VALUES.length; i++) if (RES_VALUES[i].v === v) return RES_VALUES[i].bands;
    return RES_VALUES[0].bands;
  }

  var LED_COLORS = {
    red:    { grad: 'ledc-red',    stroke: '#7c1010' },
    yellow: { grad: 'ledc-yellow', stroke: '#8a6f10' },
    green:  { grad: 'ledc-green',  stroke: '#0f5a0f' },
    blue:   { grad: 'ledc-blue',   stroke: '#15296b' },
    white:  { grad: 'ledc-white',  stroke: '#9a9a9a' }
  };
  // glow colour used when an LED is lit in the power simulation
  var LED_GLOW = { red: '#ff5a4a', yellow: '#ffe25a', green: '#62ff6e', blue: '#5a9bff', white: '#ffffff' };

  // small helper: a text node (mk returns the element so we can set textContent)
  function label(mk, x, y, s, size, fill) {
    var t = mk('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': size || 6, fill: fill || '#9a9a9a', 'font-family': 'ui-monospace, Menlo, monospace', 'pointer-events': 'none', 'class': 'lod-hide' });
    t.textContent = s; return t;
  }
  function bbox(coords) {
    var xs = coords.map(function (c) { return c.x; }), ys = coords.map(function (c) { return c.y; });
    return { minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs), minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
  }

  // ---------- 2-leg (axis) parts ----------
  function drawLED(mk, len, opts) {
    var color = (opts && opts.color) || 'red';
    var meta = LED_COLORS[color] || LED_COLORS.red;
    var flip = !!(opts && opts.flip);
    var sim = !!(opts && opts._sim), lit = !!(opts && opts._lit);
    var mx = len / 2, baseY = -24, domeCy = baseY - 12;
    if (sim && lit) mk('circle', { cx: mx, cy: domeCy, r: 25, fill: LED_GLOW[color] || '#ffffff', opacity: 0.45, filter: SOFT });
    mk('line', { x1: 0, y1: 0, x2: mx - 7, y2: baseY, stroke: METAL, 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx + 7, y2: baseY, stroke: METAL, 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('rect', { x: mx - 15, y: baseY - 6, width: 30, height: 10, rx: 3, fill: '#ececec', stroke: '#bdbdbd', 'stroke-width': 0.8 });
    var dome = 'M ' + (mx - 15) + ' ' + (baseY - 4) + ' L ' + (mx - 15) + ' ' + domeCy +
      ' A 15 15 0 0 1 ' + (mx + 15) + ' ' + domeCy + ' L ' + (mx + 15) + ' ' + (baseY - 4) + ' Z';
    mk('path', { d: dome, fill: 'url(#' + meta.grad + ')', stroke: meta.stroke, 'stroke-width': 0.8, filter: SOFT });
    mk('circle', { cx: mx, cy: domeCy, r: 15, fill: 'url(#' + meta.grad + ')', stroke: meta.stroke, 'stroke-width': 0.8 });
    if (sim && lit) mk('circle', { cx: mx, cy: domeCy, r: 13, fill: '#ffffff', opacity: 0.4 });
    mk('ellipse', { cx: mx - 5, cy: domeCy - 6, rx: 5, ry: 7.5, fill: '#ffffff', opacity: 0.5,
      transform: 'rotate(-18 ' + (mx - 5) + ' ' + (domeCy - 6) + ')' });
    if (sim && !lit) mk('circle', { cx: mx, cy: domeCy, r: 15.5, fill: '#0b0e14', opacity: 0.42 }); // dim when not powered
    mk('rect', { x: (!flip) ? (mx + 11) : (mx - 15), y: baseY - 6, width: 4, height: 10, fill: '#222', opacity: 0.85 });
  }

  function drawResistor(mk, len, opts) {
    var bands = resistorBands((opts && opts.value) || '220');
    var BODY = 46, bh = 18, bs, be;
    if (len > BODY + 16) { bs = (len - BODY) / 2; be = bs + BODY; }
    else { bs = len * 0.2; be = len * 0.8; }
    var w = be - bs;
    mk('line', { x1: 0, y1: 0, x2: bs, y2: 0, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: be, y2: 0, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('rect', { x: bs, y: -bh / 2, width: w, height: bh, rx: bh / 2, fill: 'url(#resGrad)', stroke: '#8a6a30', 'stroke-width': 0.9, filter: SOFT });
    bands.forEach(function (c, i) { mk('rect', { x: bs + 10 + i * 8, y: -bh / 2, width: 4, height: bh, fill: c }); });
  }

  function drawCapacitor(mk, len, opts) {
    var mx = len / 2, by = -16;
    mk('line', { x1: 0, y1: 0, x2: mx - 5, y2: by + 4, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx + 5, y2: by + 4, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('ellipse', { cx: mx, cy: by, rx: 15, ry: 12, fill: '#dba24c', stroke: '#9a6e2a', 'stroke-width': 0.9, filter: SOFT });
    mk('ellipse', { cx: mx - 4, cy: by - 4, rx: 5, ry: 4, fill: '#ffffff', opacity: 0.22 });
  }

  // polarized electrolytic can: stripe + shorter leg mark the negative side.
  function drawElectrolytic(mk, len, opts) {
    var flip = !!(opts && opts.flip);
    var cx = len / 2, w = 18, topY = -42, h = 36;
    var posX = flip ? 0 : len, negX = flip ? len : 0; // stripe (negative) sits over leg 0 by default
    mk('line', { x1: posX, y1: 0, x2: cx, y2: topY + h, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    mk('line', { x1: negX, y1: 0, x2: cx, y2: topY + h - 6, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    mk('rect', { x: cx - w / 2, y: topY, width: w, height: h, rx: 5, fill: '#1f3b7a', stroke: '#13234a', 'stroke-width': 1, filter: SOFT });
    mk('ellipse', { cx: cx, cy: topY + 3, rx: w / 2 - 1, ry: 3, fill: '#2c4f9e', stroke: '#13234a', 'stroke-width': 0.6 });
    mk('line', { x1: cx - 4, y1: topY + 3, x2: cx + 4, y2: topY + 3, stroke: '#9fb2dd', 'stroke-width': 0.8 });
    mk('line', { x1: cx, y1: topY, x2: cx, y2: topY + 6, stroke: '#9fb2dd', 'stroke-width': 0.8 });
    var stripeX = flip ? (cx + w / 2 - 4) : (cx - w / 2);
    mk('rect', { x: stripeX, y: topY + 5, width: 4, height: h - 9, fill: '#cfd4e0' });
    for (var i = 0; i < 3; i++) label(mk, stripeX + 2, topY + 13 + i * 8, '-', 6, '#33406b');
    label(mk, cx, topY + h / 2 + 4, (opts && opts.value) || '100uF', 6, '#eaeef7');
  }

  function drawDiode(mk, len, opts) {
    var flip = !!(opts && opts.flip);
    var by = -2, bw = 26, bh = 12, bx1 = (len - bw) / 2, bx2 = bx1 + bw;
    mk('line', { x1: 0, y1: 0, x2: bx1, y2: by, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: bx2, y2: by, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('rect', { x: bx1, y: by - bh / 2, width: bw, height: bh, rx: 2, fill: '#1a1a1a', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    mk('rect', { x: flip ? (bx1 + 2.5) : (bx2 - 5.5), y: by - bh / 2, width: 3, height: bh, fill: '#dcdcdc' });
  }

  function drawBuzzer(mk, len, opts) {
    var mx = len / 2, r = 17, cy = -2 - r;
    mk('line', { x1: 0, y1: 0, x2: mx, y2: cy + r, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx, y2: cy + r, stroke: METAL, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('circle', { cx: mx, cy: cy, r: r, fill: '#181818', stroke: '#000', 'stroke-width': 1, filter: SOFT });
    mk('circle', { cx: mx, cy: cy, r: r - 3, fill: '#242424' });
    mk('circle', { cx: mx, cy: cy - 1, r: 3.5, fill: '#0a0a0a' });
    mk('line', { x1: 7, y1: -9, x2: 7, y2: -3, stroke: '#ddd', 'stroke-width': 1.4 });
    mk('line', { x1: 4, y1: -6, x2: 10, y2: -6, stroke: '#ddd', 'stroke-width': 1.4 });
    if (opts && opts._sim && opts._active) { // sounding: emit a couple of sound arcs
      mk('path', { d: 'M ' + (mx + r + 1) + ' ' + (cy - 5) + ' Q ' + (mx + r + 6) + ' ' + cy + ' ' + (mx + r + 1) + ' ' + (cy + 5), fill: 'none', stroke: '#27c93f', 'stroke-width': 1.4 });
      mk('path', { d: 'M ' + (mx + r + 5) + ' ' + (cy - 8) + ' Q ' + (mx + r + 12) + ' ' + cy + ' ' + (mx + r + 5) + ' ' + (cy + 8), fill: 'none', stroke: '#27c93f', 'stroke-width': 1.2, opacity: 0.7 });
    }
  }

  // photoresistor / LDR: pale disc with a serpentine track.
  function drawPhotoresistor(mk, len, opts) {
    var cx = len / 2, r = 12, cy = -22;
    mk('line', { x1: 0, y1: 0, x2: cx - 3, y2: cy + r, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: cx + 3, y2: cy + r, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('circle', { cx: cx, cy: cy, r: r, fill: '#d8c9a0', stroke: '#9a6e2a', 'stroke-width': 1, filter: SOFT });
    var xs = [-8, -4, -4, 0, 0, 4, 4, 8], ys = [-7, -7, 7, 7, -7, -7, 7, 7];
    var d = 'M ' + (cx + xs[0]) + ' ' + (cy + ys[0]);
    for (var i = 1; i < xs.length; i++) d += ' L ' + (cx + xs[i]) + ' ' + (cy + ys[i]);
    mk('path', { d: d, fill: 'none', stroke: '#3a2f28', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    mk('ellipse', { cx: cx - 4, cy: cy - 4, rx: 3, ry: 2, fill: '#ffffff', opacity: 0.25 });
  }

  // thermistor: small glossy black bead (deliberately distinct from the LDR disc).
  function drawThermistor(mk, len, opts) {
    var cx = len / 2, cy = -18, rx = 8, ry = 10;
    mk('line', { x1: 0, y1: 0, x2: cx - 3, y2: cy + ry - 2, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: cx + 3, y2: cy + ry - 2, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: '#141414', stroke: '#000', 'stroke-width': 0.6, filter: SOFT });
    mk('circle', { cx: cx - 2.5, cy: cy - 3, r: 1.6, fill: '#ffffff', opacity: 0.4 });
  }

  // tilt / ball switch: upright glossy black can standing vertically.
  function drawTiltSwitch(mk, len, opts) {
    var cx = len / 2, w = 13, topY = -38, h = 32;
    mk('line', { x1: 0, y1: 0, x2: cx - 3, y2: topY + h, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: cx + 3, y2: topY + h, stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round' });
    mk('rect', { x: cx - w / 2, y: topY, width: w, height: h, rx: 6, fill: '#1a1a1a', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    mk('rect', { x: cx - w / 2 + 2, y: topY + 3, width: 3, height: h - 8, rx: 1.5, fill: '#3a3a3a', opacity: 0.7 });
    mk('circle', { cx: cx, cy: topY + h - 7, r: 3, fill: '#444', opacity: 0.6 });
  }

  // ---------- N-leg (board-coords) parts ----------
  function drawButton(mk, coords, opts) {
    var b = bbox(coords), cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    coords.forEach(function (c) {
      mk('line', { x1: c.x, y1: c.y, x2: c.x + (cx - c.x) * 0.42, y2: c.y + (cy - c.y) * 0.42, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    });
    var bw = (b.maxX - b.minX) - 6, bh = (b.maxY - b.minY) - 6;
    mk('rect', { x: b.minX + 3, y: b.minY + 3, width: bw, height: bh, rx: 4, fill: '#1d1d1d', stroke: '#000', 'stroke-width': 1, filter: SOFT });
    var br = Math.min(bw, bh) * 0.32;
    mk('circle', { cx: cx, cy: cy, r: br, fill: '#c0392b', stroke: '#7a1414', 'stroke-width': 1.2 });
    mk('circle', { cx: cx - br * 0.3, cy: cy - br * 0.3, r: br * 0.42, fill: '#e06a5a', opacity: 0.5 });
  }

  function drawPot(mk, coords, opts) {
    var b = bbox(coords), cy = b.minY, cx = (b.minX + b.maxX) / 2, topY = cy - 40;
    coords.forEach(function (c) { mk('line', { x1: c.x, y1: c.y, x2: c.x, y2: topY + 26, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' }); });
    mk('rect', { x: b.minX - 6, y: topY, width: (b.maxX - b.minX) + 12, height: 28, rx: 3, fill: '#2a4a8a', stroke: '#16264a', 'stroke-width': 1, filter: SOFT });
    mk('circle', { cx: cx, cy: topY + 13, r: 10, fill: '#cfcfcf', stroke: '#8a8a8a', 'stroke-width': 1 });
    mk('rect', { x: cx - 1.2, y: topY + 6, width: 2.4, height: 14, rx: 1, fill: '#555' });
  }

  // NPN transistor (TO-92): D-shaped half-disc body, flat face toward the viewer.
  function drawTransistor(mk, coords, opts) {
    var flip = !!(opts && opts.flip);
    var b = bbox(coords), cx = (b.minX + b.maxX) / 2, baseY = b.minY;
    var r = 15, flatY = baseY - 16, left = cx - r, right = cx + r;
    coords.forEach(function (c) { mk('line', { x1: c.x, y1: c.y, x2: c.x, y2: flatY, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' }); });
    mk('path', { d: 'M ' + left + ' ' + flatY + ' A ' + r + ' ' + r + ' 0 0 1 ' + right + ' ' + flatY + ' Z', fill: '#161616', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    label(mk, cx, flatY - 5, (opts && opts.value) || 'S8050', 6, '#bdbdbd');
    var names = flip ? ['C', 'B', 'E'] : ['E', 'B', 'C'];
    coords.forEach(function (c, i) { if (i < 3) label(mk, c.x, c.y + 12, names[i], 6, '#8a8a8a'); });
  }

  // RGB LED (common cathode): one clear 4-leg dome with three colour pips.
  function drawRgbLed(mk, coords, opts) {
    var flip = !!(opts && opts.flip);
    var sim = !!(opts && opts._sim), rgb = (opts && opts._rgb) || null;
    var b = bbox(coords), cx = (b.minX + b.maxX) / 2, baseY = b.minY;
    var r = Math.min((b.maxX - b.minX) * 0.42, 22), flangeY = baseY - 18, domeCy = flangeY - 10;
    coords.forEach(function (c) { mk('line', { x1: c.x, y1: c.y, x2: c.x, y2: flangeY, stroke: METAL, 'stroke-width': 2.2, 'stroke-linecap': 'round' }); });
    var anyLit = sim && rgb && (rgb.R || rgb.G || rgb.B);
    var glow = !anyLit ? '#9ad7ff' : (rgb.R && rgb.G && rgb.B) ? '#ffffff' : (rgb.R && rgb.G) ? '#ffe25a' : (rgb.R && rgb.B) ? '#ff7ad9' : (rgb.G && rgb.B) ? '#5ad9e0' : rgb.R ? '#ff5a4a' : rgb.G ? '#62ff6e' : '#5a9bff';
    mk('circle', { cx: cx, cy: domeCy, r: r + (anyLit ? 9 : 4), fill: glow, opacity: anyLit ? 0.5 : 0.18, filter: SOFT });
    mk('rect', { x: cx - r, y: flangeY - 5, width: r * 2, height: 8, rx: 2, fill: '#e8e8e8', stroke: '#bdbdbd', 'stroke-width': 0.8 });
    var dome = 'M ' + (cx - r) + ' ' + (flangeY - 3) + ' L ' + (cx - r) + ' ' + domeCy +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + domeCy + ' L ' + (cx + r) + ' ' + (flangeY - 3) + ' Z';
    mk('path', { d: dome, fill: '#eef3f7', stroke: '#b8c2cc', 'stroke-width': 0.8, opacity: 0.85, filter: SOFT });
    mk('circle', { cx: cx, cy: domeCy, r: r, fill: '#eef3f7', opacity: 0.45 });
    function pop(ch) { return !sim ? 0.85 : (rgb && rgb[ch] ? 1 : 0.25); }
    mk('circle', { cx: cx - 6, cy: domeCy + 1, r: 3, fill: '#c0392b', opacity: pop('R') });
    mk('circle', { cx: cx, cy: domeCy - 4, r: 3, fill: '#2ecc40', opacity: pop('G') });
    mk('circle', { cx: cx + 6, cy: domeCy + 1, r: 3, fill: '#2a6fd6', opacity: pop('B') });
    mk('ellipse', { cx: cx - 4, cy: domeCy - 6, rx: 3, ry: 5, fill: '#ffffff', opacity: 0.5 });
    var names = flip ? ['B', 'G', '-', 'R'] : ['R', '-', 'G', 'B'];
    coords.forEach(function (c, i) { if (i < 4) label(mk, c.x, c.y + 12, names[i], 6, '#8a8a8a'); });
  }

  // generic black DIP body: auto-fits any leg coords, half-moon notch + pin-1 dot.
  function drawDIP(mk, coords, opts, chip) {
    var flip = !!(opts && opts.flip);
    var b = bbox(coords), midY = (b.minY + b.maxY) / 2;
    var bx = b.minX - 4, bw = (b.maxX - b.minX) + 8, by = b.minY, bh = (b.maxY - b.minY);
    coords.forEach(function (c) { var ey = c.y < midY ? by : by + bh; mk('rect', { x: c.x - 1.6, y: Math.min(c.y, ey), width: 3.2, height: Math.abs(c.y - ey) + 1, fill: '#9a9a9a' }); });
    mk('rect', { x: bx, y: by, width: bw, height: bh, rx: 3, fill: '#161616', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    mk('path', { d: 'M ' + (bx + bw / 2 - 6) + ' ' + by + ' A 6 6 0 0 0 ' + (bx + bw / 2 + 6) + ' ' + by + ' Z', fill: '#0a0a0a' });
    mk('circle', { cx: flip ? (bx + bw - 7) : (bx + 7), cy: by + 7, r: 1.8, fill: '#444' });
    if (chip) label(mk, bx + bw / 2, midY + 2.5, chip, 6, '#9a9a9a');
  }
  function drawIC(mk, coords, opts) { drawDIP(mk, coords, opts, ''); }
  function drawShiftReg(mk, coords, opts) { drawDIP(mk, coords, opts, '74HC595'); }

  // 7-segment display (common cathode): figure-8 of seven bars + decimal point.
  // The digit adapts to the body aspect, so rotating it gives an upright digit.
  function drawSevenSeg(mk, coords, opts) {
    var flip = !!(opts && opts.flip);
    var b = bbox(coords), midY = (b.minY + b.maxY) / 2;
    var bx = b.minX - 3, bw = (b.maxX - b.minX) + 6, by = b.minY - 14, bh = (b.maxY - b.minY) + 28;
    coords.forEach(function (c) { var ey = c.y < midY ? by : by + bh; mk('rect', { x: c.x - 1.5, y: Math.min(c.y, ey), width: 3, height: Math.abs(c.y - ey) + 1, fill: '#9a9a9a' }); });
    mk('rect', { x: bx, y: by, width: bw, height: bh, rx: 4, fill: '#1c1c1c', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    var dcx = bx + bw / 2, dcy = by + bh / 2;
    var dw = Math.min(bw * 0.28, 26), dh = Math.min(bh * 0.30, 28), th = 3.2;
    var on = '#dd3322', off = '#3a3a3a';
    function bar(x1, y1, x2, y2, lit) {
      mk('rect', { x: Math.min(x1, x2) - th / 2, y: Math.min(y1, y2) - th / 2, width: Math.abs(x2 - x1) + th, height: Math.abs(y2 - y1) + th, rx: th / 2, fill: lit ? on : off });
    }
    var T = dcy - dh, M = dcy, B = dcy + dh, Lx = dcx - dw, Rx = dcx + dw;
    bar(Lx, T, Rx, T, true);   // A
    bar(Rx, T, Rx, M, false);  // B
    bar(Rx, M, Rx, B, true);   // C
    bar(Lx, B, Rx, B, true);   // D
    bar(Lx, M, Lx, B, false);  // E
    bar(Lx, T, Lx, M, true);   // F
    bar(Lx, M, Rx, M, true);   // G  -> lit segments read "5"
    mk('circle', { cx: flip ? (Lx - 5) : (Rx + 5), cy: B, r: 2.2, fill: on });
  }
  function drawL293(mk, coords, opts) { drawDIP(mk, coords, opts, 'L293D'); }

  // 4-digit 7-segment: four figure-8 digits in a row, reading "1234", with a colon.
  function drawSevenSeg4(mk, coords, opts) {
    var b = bbox(coords), midY = (b.minY + b.maxY) / 2;
    var bx = b.minX - 3, bw = (b.maxX - b.minX) + 6, by = b.minY - 14, bh = (b.maxY - b.minY) + 28;
    coords.forEach(function (c) { var ey = c.y < midY ? by : by + bh; mk('rect', { x: c.x - 1.5, y: Math.min(c.y, ey), width: 3, height: Math.abs(c.y - ey) + 1, fill: '#9a9a9a' }); });
    mk('rect', { x: bx, y: by, width: bw, height: bh, rx: 4, fill: '#1c1c1c', stroke: '#000', 'stroke-width': 0.8, filter: SOFT });
    var on = '#dd3322', off = '#3a3a3a', th = 2.4, pad = 7, n = 4;
    var cellW = (bw - 2 * pad) / n, dh = Math.min(bh * 0.30, 22), dw = Math.min(cellW * 0.30, 8), dcy = by + bh / 2;
    function bar(x1, y1, x2, y2, lit) { mk('rect', { x: Math.min(x1, x2) - th / 2, y: Math.min(y1, y2) - th / 2, width: Math.abs(x2 - x1) + th, height: Math.abs(y2 - y1) + th, rx: th / 2, fill: lit ? on : off }); }
    var digits = [[0, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1], [0, 1, 1, 0, 0, 1, 1]]; // 1 2 3 4 as A,B,C,D,E,F,G
    for (var i = 0; i < n; i++) {
      var dcx = bx + pad + cellW * i + cellW / 2, T = dcy - dh, M = dcy, B2 = dcy + dh, Lx = dcx - dw, Rx = dcx + dw, g = digits[i];
      bar(Lx, T, Rx, T, g[0]); bar(Rx, T, Rx, M, g[1]); bar(Rx, M, Rx, B2, g[2]); bar(Lx, B2, Rx, B2, g[3]); bar(Lx, M, Lx, B2, g[4]); bar(Lx, T, Lx, M, g[5]); bar(Lx, M, Rx, M, g[6]);
    }
    var colX = bx + pad + cellW * 2;
    mk('circle', { cx: colX, cy: dcy - dh * 0.4, r: 1.6, fill: off }); mk('circle', { cx: colX, cy: dcy + dh * 0.4, r: 1.6, fill: off });
  }

  root.PARTS = {
    led:           { label: 'LED',                  prefix: 'LED', axis: true,  polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawLED, defaults: { color: 'red', flip: false } },
    resistor:      { label: 'Resistor',             prefix: 'R',   axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 5, dr: 0 }], draw: drawResistor, defaults: { value: '220' } },
    capacitor:     { label: 'Capacitor (ceramic)',  prefix: 'C',   axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawCapacitor, defaults: {} },
    electrolytic:  { label: 'Capacitor (electrolytic)', prefix: 'C', axis: true, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }], draw: drawElectrolytic, values: ['1uF', '10uF', '47uF', '100uF', '220uF', '470uF'], defaults: { value: '100uF', flip: false } },
    diode:         { label: 'Diode',                prefix: 'D',   axis: true,  polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 3, dr: 0 }], draw: drawDiode, defaults: { flip: false } },
    buzzer:        { label: 'Buzzer',               prefix: 'BZ',  axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawBuzzer, defaults: {} },
    photoresistor: { label: 'Photoresistor (LDR)',  prefix: 'LDR', axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawPhotoresistor, values: ['GL5528', 'GL5516', 'GL5537', 'GL5539'], defaults: { value: 'GL5528' } },
    thermistor:    { label: 'Thermistor (NTC)',     prefix: 'TH',  axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawThermistor, values: ['5k', '10k', '50k', '100k'], defaults: { value: '10k' } },
    tiltswitch:    { label: 'Tilt switch (ball)',   prefix: 'SW',  axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }], draw: drawTiltSwitch, values: ['SW-520D', 'SW-200D'], defaults: { value: 'SW-520D' } },
    button:        { label: 'Pushbutton',           prefix: 'S',   axis: false, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }, { dc: 0, dr: 2 }, { dc: 2, dr: 2 }], draw: drawButton, defaults: {} },
    potentiometer: { label: 'Potentiometer',        prefix: 'RV',  axis: false, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }, { dc: 4, dr: 0 }], draw: drawPot, values: ['1k', '10k', '100k'], defaults: { value: '10k' } },
    transistor:    { label: 'NPN transistor (TO-92)', prefix: 'Q', axis: false, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }], draw: drawTransistor, values: ['S8050', 'PN2222', '2N3904', 'BC547'], defaults: { value: 'S8050', flip: false } },
    pnptransistor: { label: 'PNP transistor (TO-92)', prefix: 'Q', axis: false, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }], draw: drawTransistor, values: ['S8550', '2N3906', 'BC557'], defaults: { value: 'S8550', flip: false } },
    rgbled:        { label: 'RGB LED (common cathode)', prefix: 'RGB', axis: false, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }], draw: drawRgbLed, defaults: { flip: false } },
    ic:            { label: 'IC (8-pin DIP)',       prefix: 'U',   axis: false, straddle: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }], draw: drawIC, defaults: {} },
    shiftregister: { label: 'IC 74HC595 (16-pin)',  prefix: 'U',   axis: false, straddle: true, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 4, dr: 0 }, { dc: 5, dr: 0 }, { dc: 6, dr: 0 }, { dc: 7, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }, { dc: 4, dr: 1 }, { dc: 5, dr: 1 }, { dc: 6, dr: 1 }, { dc: 7, dr: 1 }], draw: drawShiftReg, defaults: { flip: false } },
    l293d:         { label: 'L293D motor driver (16-pin)', prefix: 'U', axis: false, straddle: true, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 4, dr: 0 }, { dc: 5, dr: 0 }, { dc: 6, dr: 0 }, { dc: 7, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }, { dc: 4, dr: 1 }, { dc: 5, dr: 1 }, { dc: 6, dr: 1 }, { dc: 7, dr: 1 }], draw: drawL293, defaults: { flip: false } },
    sevenseg:      { label: '7-segment display (1 digit)', prefix: 'DS', axis: false, straddle: true, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 4, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }, { dc: 4, dr: 1 }], draw: drawSevenSeg, defaults: { flip: false } },
    sevenseg4:     { label: '7-segment display (4 digit)', prefix: 'DS', axis: false, straddle: true, polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 4, dr: 0 }, { dc: 5, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }, { dc: 4, dr: 1 }, { dc: 5, dr: 1 }], draw: drawSevenSeg4, defaults: { flip: false } }
  };

  root.RES_VALUES = RES_VALUES;
  root.LED_COLORS = LED_COLORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { PARTS: root.PARTS, RES_VALUES: RES_VALUES, LED_COLORS: LED_COLORS };
})(typeof window !== 'undefined' ? window : globalThis);
