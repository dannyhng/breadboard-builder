# PR: Realistic, interactive browser breadboard (v1)

A from scratch, browser based alternative to Fritzing's breadboard view. One
page, no install, no build step. Plan a circuit by dropping parts on a realistic
breadboard and drawing the wires.

## What this delivers

- **Realistic breadboard** with the real electrical model under it: a-e and f-j
  column groups, the center ravine split, and four power rails.
- **Place parts**: LED and Resistor from a palette, legs snap to holes (anchor
  one leg, derive the other from the part's fixed span, reject invalid drops).
- **Draw jumper wires** between any two holes, or to the Arduino's pins, with a
  color picker. Wires bow like real jumpers.
- **Stylized Arduino UNO** with wire-able 5V / GND / D13 / D12 pins, so a full
  "blink an LED" circuit is buildable end to end.
- **Select + Delete**, **autosave** to the browser, **Export / Import** JSON,
  **Clear**, and a first-run demo circuit.

## Why it looks like Fritzing

The realism is hand drawn SVG: radial-gradient glossy LED dome, gradient resistor
body with color bands, recessed breadboard sockets, drop shadows, a teal Arduino
PCB with header sockets and silkscreen. Same technique Fritzing and Wokwi use
(vector art), so "single-file SVG" is not a downgrade from the Fritzing look, it
is the same approach.

## Architecture

No framework, no build tooling.

| File | Role |
| --- | --- |
| `index.html` | SVG, gradient/filter defs, hole `<symbol>`, toolbar |
| `style.css` | Styling |
| `board.js` | Geometry + electrical-node model (pure data, Node-testable) |
| `parts.js` | Parts as data; each declares a leg span + a realistic `draw()` |
| `app.js` | State, render, all interaction, save/load |

Performance pattern (from the research): the ~400 repeated holes are one
`<symbol>` + `<use>` with no filters; the filter/gradient budget is spent only on
the few hero parts.

## Verification (all run, all green)

- `node --check` passes on `board.js`, `parts.js`, `app.js`.
- Board model under Node: **400 holes, 64 nodes**, correct column grouping and
  ravine split, all seed positions valid.
- Rendered in a real browser: **zero console errors**.
- Interaction driven programmatically: placing an LED took parts 2 -> 3; the wire
  tool took wires 2 -> 3. Both confirmed.
- Screenshots in `screenshots/`.

## Licensing decision

All art is original (zero third-party obligations). The alternative art sources
were researched and license-verified against their actual LICENSE files:

- **Wokwi elements**: MIT. Safe to borrow with a copyright notice. The clean
  higher-fidelity path if ever wanted.
- **Fritzing parts**: CC-BY-SA 3.0 (share-alike) AND Fritzing's FAQ asks people
  not to reuse their part graphics in other software. Avoided on purpose.

Full detail and sources: `NOTICE.md`.

## Not in v1 (roadmap)

Rotation / vertical placement, more parts (push button, potentiometer, IC),
full-size 63-column board toggle, the union-find wiring checker, draggable
Arduino, PNG export. See `README.md`.

## Screenshots

- `screenshots/breadboard.png` — the tool with the seeded blink-an-LED circuit
- `screenshots/full-page.png` — full page with toolbar
- `screenshots/realism-scene.png` — an early realism study
