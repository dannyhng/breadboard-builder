// parts.js
// Part definitions as DATA. Each part type declares how many holes its legs span
// and a draw() that paints realistic SVG between its two leg holes.
//
// draw(mk, x1, y1, x2, y2, opts): mk(name, attrs) appends one SVG element into the
// part's group. (x1,y1) and (x2,y2) are the two leg-hole centers.
// Adding a new 2-leg part = adding one entry here. No new logic elsewhere.

(function (root) {
  'use strict';

  function drawLED(mk, x1, y1, x2, y2, opts) {
    var midX = (x1 + x2) / 2, hy = Math.min(y1, y2);
    var baseY = hy - 24, domeCy = baseY - 12;
    mk('line', { x1: x1, y1: y1, x2: midX - 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('line', { x1: x2, y1: y2, x2: midX + 7, y2: baseY, stroke: 'url(#metalGrad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    mk('rect', { x: midX - 15, y: baseY - 6, width: 30, height: 10, rx: 3, fill: '#ececec', stroke: '#bdbdbd', 'stroke-width': 0.8 });
    var dome = 'M ' + (midX - 15) + ' ' + (baseY - 4) + ' L ' + (midX - 15) + ' ' + domeCy +
      ' A 15 15 0 0 1 ' + (midX + 15) + ' ' + domeCy + ' L ' + (midX + 15) + ' ' + (baseY - 4) + ' Z';
    mk('path', { d: dome, fill: 'url(#ledGrad)', stroke: '#7c1010', 'stroke-width': 0.8, filter: 'url(#soft)' });
    mk('circle', { cx: midX, cy: domeCy, r: 15, fill: 'url(#ledGrad)', stroke: '#7c1010', 'stroke-width': 0.8 });
    mk('ellipse', { cx: midX - 5, cy: domeCy - 6, rx: 5, ry: 7.5, fill: '#ffffff', opacity: 0.55,
      transform: 'rotate(-18 ' + (midX - 5) + ' ' + (domeCy - 6) + ')' });
  }

  function drawResistor(mk, x1, y1, x2, y2, opts) {
    var bands = (opts && opts.bands) || ['#b8392b', '#b8392b', '#5b3a1e', '#d4af37'];
    var by = Math.min(y1, y2) - 26;
    var bx1 = Math.min(x1, x2) + 6, bx2 = Math.max(x1, x2) - 6, w = bx2 - bx1;
    mk('line', { x1: x1, y1: y1, x2: x1, y2: by, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: x2, y1: y2, x2: x2, y2: by, stroke: 'url(#metalGrad)', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    mk('line', { x1: x1, y1: by, x2: x2, y2: by, stroke: 'url(#metalGrad)', 'stroke-width': 2.4 });
    mk('rect', { x: bx1, y: by - 10, width: w, height: 20, rx: 10, fill: 'url(#resGrad)', stroke: '#8a6a30', 'stroke-width': 0.9, filter: 'url(#soft)' });
    bands.forEach(function (c, i) { mk('rect', { x: bx1 + 12 + i * 9, y: by - 10, width: 4, height: 20, fill: c }); });
  }

  root.PARTS = {
    led: { label: 'LED', span: 2, draw: drawLED },
    resistor: { label: 'Resistor', span: 5, draw: drawResistor }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { PARTS: root.PARTS };
})(typeof window !== 'undefined' ? window : globalThis);
