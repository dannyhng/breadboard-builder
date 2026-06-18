# Breadboard Builder

A browser based virtual breadboard. Drop an Arduino, LEDs and resistors onto a
realistic breadboard, draw the jumper wires, and save the layout. Built to plan
wiring for electronics study, with nothing to install: it runs from a URL or
straight off your hard drive.

This is an original, from scratch alternative to Fritzing's breadboard view. The
realistic look is all hand drawn SVG (see [NOTICE.md](NOTICE.md) for why that
matters).

## Run it

- Easiest: double click `index.html`. That is the whole "nothing to install"
  promise, working.
- To open it on any device or share with classmates: push this folder to a
  GitHub repo and turn on GitHub Pages. It redeploys on every push, no build
  step.

## What it does (v1)

- A realistic breadboard with correctly grouped electrical holes (the a-e and
  f-j column groups and the power rails, just like a real board).
- Place an **LED** or a **Resistor** from the palette. Legs snap to holes, and
  **R** rotates them: horizontal or vertical, including across the ravine.
- Draw colored **jumper wires** between any two holes (or to the Arduino's pins).
- A stylized **Arduino UNO** below the board with wire-able 5V / GND / D13 / D12
  pins, so a full "blink an LED" circuit is buildable end to end.
- **Hover any hole** to light up every hole electrically connected to it (the
  equipotential highlight), and live **checks** flag a power-rail short or a
  component shorted across one strip.
- **Select** a part or wire and press **Delete** to remove it.
- **Autosave** to the browser, plus **Export** / **Import** of the layout as
  JSON, and **Clear**.
- A first run demo (resistor + LED + two wires) so an empty board still shows the
  look and a real circuit.

## Controls

| Action | How |
| --- | --- |
| Place a part | Click `LED` or `Resistor`, then click the board |
| Move a part | Drag it |
| Rotate a part | While placing, or with a part selected, press `R` |
| Draw a wire | Click `Wire`, click the first hole, click the second |
| Wire color | The color swatch next to `Wire` |
| Select | Click a part or wire (in Select mode) |
| Delete | Select it, press `Delete` or `Backspace` |
| Cancel placing / wiring | `Escape` |

## How it is built

No framework, no build tooling. A single page plus a few plain scripts:

| File | Role |
| --- | --- |
| `index.html` | Markup, the SVG, gradient/filter `<defs>`, the hole `<symbol>` |
| `style.css` | Styling |
| `board.js` | Breadboard geometry + the electrical-node model. Pure data, no DOM, so it is unit-testable under Node |
| `parts.js` | Part definitions as data. Each part declares its leg span and a realistic `draw()`. Adding a 2-leg part is one entry |
| `app.js` | State, rendering, all the interaction (place / drag / snap / wire / select / delete), and save/load |

The one idea everything rests on: **every hole belongs to one electrical node**
(a group of connected holes), exactly like a real breadboard. The data model
tracks it, which is what makes a future "did I wire this right?" checker cheap.

Rendering follows the performance pattern from the research: the ~400 repeated
holes are one `<symbol>` instanced with `<use>` and carry no filters, while the
few "hero" parts (the glossy LED dome, the banded resistor) spend the gradient
and drop-shadow budget. See the technique notes in `DESIGN.md`.

## Verified

- `node --check` passes on all scripts.
- The board model is checked under Node: 400 holes, 64 electrical nodes, correct
  column grouping and ravine split.
- Rendered in a real browser with zero console errors. Placing a part and drawing
  a wire were both driven programmatically and confirmed to work.

## Roadmap (next, in rough order)

1. More parts: push button (4-leg, straddles the ravine), potentiometer, a DIP
   IC, jumper-less power.
2. Full-size 63-column board as a toggle (current default is a 30-column board
   that fits a screen).
3. Deepen the wiring checker. The equipotential highlight + short detection have
   shipped (union-find over the electrical nodes). Next: floating-pin detection
   and "is D13 actually connected to the LED?" reachability.
4. Draggable Arduino, and a small parts library.
5. PNG export for lab reports.

Shipped since the first commit: rotate parts with `R`, horizontal or vertical
across the ravine.

## Art and licensing

All component art here is original. If you ever want even higher fidelity, the
cleanest borrow is Wokwi's MIT-licensed part SVGs, **not** Fritzing's (its part
graphics are CC-BY-SA and its own FAQ asks you not to reuse them in other
software). Full detail and sources: [NOTICE.md](NOTICE.md).

## Design doc

[DESIGN.md](DESIGN.md) is the original plan and the engineering notes (the
electrical model, the snap rule, the gotchas).
