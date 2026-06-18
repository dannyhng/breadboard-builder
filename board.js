// board.js
// Breadboard geometry + electrical-node model. Pure data, no DOM.
// Works as a browser <script> (window.buildBoard) and under Node (module.exports).
//
// Core model: every hole belongs to exactly one electrical "node" (a group wired
// together under the board), like a real breadboard:
//   - the 5 holes a-e of a column are one node, f-j are a separate node
//   - each power rail is one long node

(function (root) {
  'use strict';

  var PITCH = 20, HOLE_R = 4, COLS = 30, MARGIN = 44;
  var TOP = ['a', 'b', 'c', 'd', 'e'];
  var BOT = ['f', 'g', 'h', 'i', 'j'];

  function buildBoard() {
    var holes = [], nodes = {}, byCR = {};
    function add(id, x, y, node, col, row, rail) {
      var h = { id: id, x: x, y: y, node: node, col: col, row: row, rail: !!rail };
      holes.push(h);
      (nodes[node] = nodes[node] || { id: node, holes: [] }).holes.push(id);
      if (!rail) byCR[col + ',' + row] = h;
      return h;
    }

    var x0 = MARGIN + PITCH, y = MARGIN;
    var yTP = y; y += PITCH;
    var yTM = y; y += PITCH; y += PITCH;
    var topY = {}; TOP.forEach(function (r) { topY[r] = y; y += PITCH; });
    var ravineY = y; y += PITCH * 1.5;
    var botY = {}; BOT.forEach(function (r) { botY[r] = y; y += PITCH; });
    y += PITCH;
    var yBM = y; y += PITCH;
    var yBP = y; y += PITCH;
    var H = y + MARGIN;

    for (var c = 1; c <= COLS; c++) {
      var cx = x0 + (c - 1) * PITCH;
      TOP.forEach(function (r) { add('T-' + c + '-' + r, cx, topY[r], 'col-top-' + c, c, r); });
      BOT.forEach(function (r) { add('B-' + c + '-' + r, cx, botY[r], 'col-bot-' + c, c, r); });
    }

    // power rails: 25 holes each, 5 groups of 5 with a 1-slot gap between groups
    function rail(prefix, node, yy) {
      var i = 0;
      for (var g = 0; g < 5; g++) {
        for (var k = 0; k < 5; k++) {
          var slot = g * 6 + k;
          add(prefix + '-' + i, x0 + slot * PITCH, yy, node, 'R-' + slot, prefix, true);
          i++;
        }
      }
    }
    rail('RTP', 'rail-top-plus', yTP);
    rail('RTM', 'rail-top-minus', yTM);
    rail('RBM', 'rail-bot-minus', yBM);
    rail('RBP', 'rail-bot-plus', yBP);

    var W = x0 + (COLS - 1) * PITCH + MARGIN;

    return {
      holes: holes, nodes: nodes, byCR: byCR,
      dims: { width: W, height: H, pitch: PITCH, holeR: HOLE_R },
      layout: {
        x0: x0, cols: COLS, topY: topY, botY: botY, ravineY: ravineY, ravineH: PITCH * 1.5,
        rails: [
          { node: 'rail-top-plus', y: yTP, sign: '+', color: '#d23' },
          { node: 'rail-top-minus', y: yTM, sign: '-', color: '#2a6fd6' },
          { node: 'rail-bot-minus', y: yBM, sign: '-', color: '#2a6fd6' },
          { node: 'rail-bot-plus', y: yBP, sign: '+', color: '#d23' }
        ]
      }
    };
  }

  root.buildBoard = buildBoard;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildBoard: buildBoard };
})(typeof window !== 'undefined' ? window : globalThis);
