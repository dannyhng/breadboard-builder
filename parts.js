// parts.js
// Part definitions as DATA. Each part type declares how many holes its legs span
// and a draw() that paints realistic SVG in a LOCAL frame: leg 1 is at (0,0) and
// leg 2 is at (len, 0), along the +x axis. The app rotates the whole part by
// transforming its group, so the same draw() works horizontal or vertical.
//
// draw(mk, len, opts): mk(name, attrs) appends one SVG element to the part group.
// Adding a 2-leg part = one entry here. No new logic elsewhere.

(function (root) {
  'use strict';

  function drawLED(mk, len, opts) {
    var mx = len / 2, baseY = -24, domeCy = baseY - 12;
    mk('line', { x1: 0, y1: 0, x2: mx - 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: mx + 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('rect', { x: mx - 15, y: baseY - 6, width: 30, height: 10, rx: 3, fill: '#ececec', stroke: '#bdbdbd', 'stroke-width': 0.8 });
    var dome = 'M ' + (mx - 15) + ' ' + (baseY - 4) + ' L ' + (mx - 15) + ' ' + domeCy +
      ' A 15 15 0 0 1 ' + (mx + 15) + ' ' + domeCy + ' L ' + (mx + 15) + ' ' + (baseY - 4) + ' Z';
    mk('path', { d: dome, fill: 'url(#ledGrad)', stroke: '#7c1010', 'stroke-width': 0.8, filter: 'url(#soft)' });
    mk('circle', { cx: mx, cy: domeCy, r: 15, fill: 'url(#ledGrad)', stroke: '#7c1010', 'stroke-width': 0.8 });
    mk('ellipse', { cx: mx - 5, cy: domeCy - 6, rx: 5, ry: 7.5, fill: '#ffffff', opacity: 0.55,
      transform: 'rotate(-18 ' + (mx - 5) + ' ' + (domeCy - 6) + ')' });
  }

  function drawResistor(mk, len, opts) {
    var bands = (opts && opts.bands) || ['#b8392b', '#b8392b', '#5b3a1e', '#d4af37'];
    var bs = Math.max(10, len * 0.20), be = Math.min(len - 10, len * 0.80);
    if (be <= bs) { bs = len * 0.3; be = len * 0.7; }
    var w = be - bs, bh = 18;
    mk('line', { x1: 0, y1: 0, x2: bs, y2: 0, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: len, y1: 0, x2: be, y2: 0, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('rect', { x: bs, y: -bh / 2, width: w, height: bh, rx: bh / 2, fill: 'url(#resGrad)', stroke: '#8a6a30', 'stroke-width': 0.9, filter: 'url(#soft)' });
    bands.forEach(function (c, i) {
      var bx = bs + Math.min(w - 6, 8 + i * 7);
      mk('rect', { x: bx, y: -bh / 2, width: 4, height: bh, fill: c });
    });
  }

  root.PARTS = {
    led: { label: 'LED', span: 2, draw: drawLED },
    resistor: { label: 'Resistor', span: 5, draw: drawResistor }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { PARTS: root.PARTS };
})(typeof window !== 'undefined' ? window : globalThis);
