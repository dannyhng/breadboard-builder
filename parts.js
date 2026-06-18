// parts.js
// Part definitions as DATA. Each part declares its legs (offsets from the anchor
// hole, in column/row deltas at rotation 0), a label prefix, and a draw().
//
//   axis:true  -> 2-leg parts. draw(mk, len, opts) in a local frame the app
//                 rotates (leg 1 at 0,0, leg 2 at len,0).
//   axis:false -> N-leg parts. draw(mk, legCoords, opts) in board coords.
// Optional: values [..] (Inspector value dropdown), polar (has a Flip control).

(function (root) {
  'use strict';

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

  function drawLED(mk, len, opts) {
    var color = (opts && opts.color) || 'red';
    var meta = LED_COLORS[color] || LED_COLORS.red;
    var flip = !!(opts && opts.flip);
    var mx = len / 2, baseY = -24, domeCy = baseY - 12;
    mk('line', { x1: 0, y1: 0, x2: mx - 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx + 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('rect', { x: mx - 15, y: baseY - 6, width: 30, height: 10, rx: 3, fill: '#ececec', stroke: '#bdbdbd', 'stroke-width': 0.8 });
    var dome = 'M ' + (mx - 15) + ' ' + (baseY - 4) + ' L ' + (mx - 15) + ' ' + domeCy +
      ' A 15 15 0 0 1 ' + (mx + 15) + ' ' + domeCy + ' L ' + (mx + 15) + ' ' + (baseY - 4) + ' Z';
    mk('path', { d: dome, fill: 'url(#' + meta.grad + ')', stroke: meta.stroke, 'stroke-width': 0.8, filter: 'url(#soft)' });
    mk('circle', { cx: mx, cy: domeCy, r: 15, fill: 'url(#' + meta.grad + ')', stroke: meta.stroke, 'stroke-width': 0.8 });
    mk('ellipse', { cx: mx - 5, cy: domeCy - 6, rx: 5, ry: 7.5, fill: '#ffffff', opacity: 0.5,
      transform: 'rotate(-18 ' + (mx - 5) + ' ' + (domeCy - 6) + ')' });
    mk('rect', { x: (!flip) ? (mx + 11) : (mx - 15), y: baseY - 6, width: 4, height: 10, fill: '#222', opacity: 0.85 });
  }

  function drawResistor(mk, len, opts) {
    var bands = resistorBands((opts && opts.value) || '220');
    var BODY = 46, bh = 18, bs, be;
    if (len > BODY + 16) { bs = (len - BODY) / 2; be = bs + BODY; }
    else { bs = len * 0.2; be = len * 0.8; }
    var w = be - bs;
    mk('line', { x1: 0, y1: 0, x2: bs, y2: 0, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: be, y2: 0, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('rect', { x: bs, y: -bh / 2, width: w, height: bh, rx: bh / 2, fill: 'url(#resGrad)', stroke: '#8a6a30', 'stroke-width': 0.9, filter: 'url(#soft)' });
    bands.forEach(function (c, i) { mk('rect', { x: bs + 10 + i * 8, y: -bh / 2, width: 4, height: bh, fill: c }); });
  }

  function drawBuzzer(mk, len, opts) {
    var mx = len / 2, r = 17, cy = -2 - r;
    mk('line', { x1: 0, y1: 0, x2: mx, y2: cy + r, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx, y2: cy + r, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('circle', { cx: mx, cy: cy, r: r, fill: '#181818', stroke: '#000', 'stroke-width': 1, filter: 'url(#soft)' });
    mk('circle', { cx: mx, cy: cy, r: r - 3, fill: '#242424' });
    mk('circle', { cx: mx, cy: cy - 1, r: 3.5, fill: '#0a0a0a' });
    mk('line', { x1: 7, y1: -9, x2: 7, y2: -3, stroke: '#ddd', 'stroke-width': 1.4 });
    mk('line', { x1: 4, y1: -6, x2: 10, y2: -6, stroke: '#ddd', 'stroke-width': 1.4 });
  }

  function drawCapacitor(mk, len, opts) {
    var mx = len / 2, by = -16;
    mk('line', { x1: 0, y1: 0, x2: mx - 5, y2: by + 4, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx + 5, y2: by + 4, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('ellipse', { cx: mx, cy: by, rx: 15, ry: 12, fill: '#dba24c', stroke: '#9a6e2a', 'stroke-width': 0.9, filter: 'url(#soft)' });
    mk('ellipse', { cx: mx - 4, cy: by - 4, rx: 5, ry: 4, fill: '#ffffff', opacity: 0.22 });
  }

  function drawDiode(mk, len, opts) {
    var flip = !!(opts && opts.flip);
    var by = -2, bw = 26, bh = 12, bx1 = (len - bw) / 2, bx2 = bx1 + bw;
    mk('line', { x1: 0, y1: 0, x2: bx1, y2: by, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: bx2, y2: by, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('rect', { x: bx1, y: by - bh / 2, width: bw, height: bh, rx: 2, fill: '#1a1a1a', stroke: '#000', 'stroke-width': 0.8, filter: 'url(#soft)' });
    mk('rect', { x: flip ? (bx1 + 2.5) : (bx2 - 5.5), y: by - bh / 2, width: 3, height: bh, fill: '#dcdcdc' });
  }

  function drawPot(mk, coords, opts) {
    var xs = coords.map(function (c) { return c.x; }), ys = coords.map(function (c) { return c.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var cy = Math.min.apply(null, ys), cx = (minX + maxX) / 2, topY = cy - 40;
    coords.forEach(function (c) { mk('line', { x1: c.x, y1: c.y, x2: c.x, y2: topY + 26, stroke: 'url(#metalGrad)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }); });
    mk('rect', { x: minX - 6, y: topY, width: (maxX - minX) + 12, height: 28, rx: 3, fill: '#2a4a8a', stroke: '#16264a', 'stroke-width': 1, filter: 'url(#soft)' });
    mk('circle', { cx: cx, cy: topY + 13, r: 10, fill: '#cfcfcf', stroke: '#8a8a8a', 'stroke-width': 1 });
    mk('rect', { x: cx - 1.2, y: topY + 6, width: 2.4, height: 14, rx: 1, fill: '#555' });
  }

  function drawIC(mk, coords, opts) {
    var xs = coords.map(function (c) { return c.x; }), ys = coords.map(function (c) { return c.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var bx = minX - 4, bw = (maxX - minX) + 8, by = minY, bh = (maxY - minY), midY = (minY + maxY) / 2;
    coords.forEach(function (c) {
      var ey = c.y < midY ? by : by + bh;
      mk('rect', { x: c.x - 1.6, y: Math.min(c.y, ey), width: 3.2, height: Math.abs(c.y - ey) + 1, fill: '#9a9a9a' });
    });
    mk('rect', { x: bx, y: by, width: bw, height: bh, rx: 3, fill: '#161616', stroke: '#000', 'stroke-width': 0.8, filter: 'url(#soft)' });
    mk('path', { d: 'M ' + (bx + bw / 2 - 6) + ' ' + by + ' A 6 6 0 0 0 ' + (bx + bw / 2 + 6) + ' ' + by + ' Z', fill: '#0a0a0a' });
    mk('circle', { cx: bx + 7, cy: by + 7, r: 1.8, fill: '#444' });
  }

  root.PARTS = {
    led:           { label: 'LED',           prefix: 'LED', axis: true,  polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawLED,       defaults: { color: 'red', flip: false } },
    resistor:      { label: 'Resistor',      prefix: 'R',   axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 5, dr: 0 }], draw: drawResistor, defaults: { value: '220' } },
    capacitor:     { label: 'Capacitor',     prefix: 'C',   axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawCapacitor, defaults: {} },
    diode:         { label: 'Diode',         prefix: 'D',   axis: true,  polar: true, legs: [{ dc: 0, dr: 0 }, { dc: 3, dr: 0 }], draw: drawDiode, defaults: { flip: false } },
    buzzer:        { label: 'Buzzer',        prefix: 'BZ',  axis: true,  legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }], draw: drawBuzzer, defaults: {} },
    button:        { label: 'Button',        prefix: 'S',   axis: false, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }, { dc: 0, dr: 2 }, { dc: 2, dr: 2 }], draw: drawButton, defaults: {} },
    potentiometer: { label: 'Potentiometer', prefix: 'RV',  axis: false, legs: [{ dc: 0, dr: 0 }, { dc: 2, dr: 0 }, { dc: 4, dr: 0 }], draw: drawPot, values: ['1k', '10k', '100k'], defaults: { value: '10k' } },
    ic:            { label: 'IC (8-pin)',    prefix: 'U',   axis: false, legs: [{ dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 2, dr: 1 }, { dc: 3, dr: 1 }], draw: drawIC, defaults: {} }
  };

  function drawButton(mk, coords, opts) {
    var xs = coords.map(function (c) { return c.x; }), ys = coords.map(function (c) { return c.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    coords.forEach(function (c) {
      mk('line', { x1: c.x, y1: c.y, x2: c.x + (cx - c.x) * 0.42, y2: c.y + (cy - c.y) * 0.42, stroke: 'url(#metalGrad)', 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    });
    var bw = (maxX - minX) - 6, bh = (maxY - minY) - 6;
    mk('rect', { x: minX + 3, y: minY + 3, width: bw, height: bh, rx: 4, fill: '#1d1d1d', stroke: '#000', 'stroke-width': 1, filter: 'url(#soft)' });
    var br = Math.min(bw, bh) * 0.32;
    mk('circle', { cx: cx, cy: cy, r: br, fill: '#c0392b', stroke: '#7a1414', 'stroke-width': 1.2 });
    mk('circle', { cx: cx - br * 0.3, cy: cy - br * 0.3, r: br * 0.42, fill: '#e06a5a', opacity: 0.5 });
  }

  root.RES_VALUES = RES_VALUES;
  root.LED_COLORS = LED_COLORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { PARTS: root.PARTS, RES_VALUES: RES_VALUES, LED_COLORS: LED_COLORS };
})(typeof window !== 'undefined' ? window : globalThis);
