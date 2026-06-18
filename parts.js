// parts.js
// Part definitions as DATA. Each part type declares its leg span, a realistic
// draw(), and default editable properties. draw(mk, len, opts) paints in a LOCAL
// frame: leg 1 at (0,0), leg 2 at (len,0). The app rotates the group, so one
// draw() works at any angle.

(function (root) {
  'use strict';

  // resistor presets: value label -> real 4-band color code
  var RES_VALUES = [
    { v: '220',  bands: ['#b8392b', '#b8392b', '#6b4423', '#d4af37'] }, // red red brown gold
    { v: '330',  bands: ['#e08a1e', '#e08a1e', '#6b4423', '#d4af37'] }, // orange orange brown
    { v: '470',  bands: ['#e6d21e', '#7b3fb0', '#6b4423', '#d4af37'] }, // yellow violet brown
    { v: '1k',   bands: ['#6b4423', '#161616', '#b8392b', '#d4af37'] }, // brown black red
    { v: '2.2k', bands: ['#b8392b', '#b8392b', '#b8392b', '#d4af37'] }, // red red red
    { v: '4.7k', bands: ['#e6d21e', '#7b3fb0', '#b8392b', '#d4af37'] }, // yellow violet red
    { v: '10k',  bands: ['#6b4423', '#161616', '#e08a1e', '#d4af37'] }, // brown black orange
    { v: '100k', bands: ['#6b4423', '#161616', '#e6d21e', '#d4af37'] }  // brown black yellow
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
    // cathode (the flat / minus side) marker. cathode leg is local x=len unless flipped.
    var cathodeRight = !flip;
    mk('rect', { x: cathodeRight ? (mx + 11) : (mx - 15), y: baseY - 6, width: 4, height: 10, fill: '#222', opacity: 0.85 });
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

  root.PARTS = {
    led: { label: 'LED', span: 2, draw: drawLED, defaults: { color: 'red', flip: false } },
    resistor: { label: 'Resistor', span: 5, draw: drawResistor, defaults: { value: '220' } }
  };
  root.RES_VALUES = RES_VALUES;
  root.LED_COLORS = LED_COLORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { PARTS: root.PARTS, RES_VALUES: RES_VALUES, LED_COLORS: LED_COLORS };
})(typeof window !== 'undefined' ? window : globalThis);
