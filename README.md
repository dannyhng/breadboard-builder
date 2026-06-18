# Breadboard Builder

A browser based virtual breadboard. Drop an Arduino, parts and wires onto a
realistic breadboard, and watch the LEDs light up. Built to plan and understand
wiring for electronics study, with nothing to install: it runs from a URL or
straight off your hard drive.

This is an original, from scratch alternative to Fritzing's breadboard view. The
realistic look is all hand drawn SVG (see [NOTICE.md](NOTICE.md) for why that
matters).

**Live:** https://dannyhng.github.io/breadboard-builder/

## Run it

- Easiest: double click `index.html`. That is the whole "nothing to install"
  promise, working.
- To open it on any device or share with classmates: it is already on GitHub
  Pages at the link above, and redeploys on every push with no build step.

## What it does

### A realistic board, faithful to the real thing

- A breadboard with correctly grouped electrical holes: the a-e and f-j column
  strips and the power rails, split by the center ravine, exactly like a real
  board.
- A stylized **Arduino UNO** below it with every header pin wire-able (5V, 3V3,
  the GND pins, D0-D13, A0-A5, VIN, IOREF, AREF, RESET), so a full circuit is
  buildable end to end.
- Draw colored **jumper wires** between any two holes, or to any Arduino pin.

### A parts library tuned to the Elegoo UNO R3 kit (19 parts)

The bin is grouped into sections, and everything has its own hand drawn art:

- **Basics**: resistor (color-banded by value), LED, RGB LED, diode, pushbutton,
  buzzer.
- **Passives**: ceramic capacitor, electrolytic capacitor (polarized), potentiometer.
- **Sensors**: photoresistor (LDR), thermistor (NTC), tilt switch.
- **Transistors**: NPN (S8050) and PNP (S8550) in a TO-92 body with E/B/C labels.
- **ICs and displays**: 8-pin IC, 74HC595 shift register, L293D motor driver,
  1-digit and 4-digit 7-segment displays.

Parts snap their legs to holes. Polarized parts (LED, diode, electrolytic,
transistor) have a **Flip** control; valued parts (resistor, caps, transistor,
sensors) have a **value dropdown** in the Inspector. **DIP-style parts snap to
straddle the center ravine** so their pins are never accidentally shorted, and
their rotation is locked (a DIP only goes one way on a real board).

### Live power simulation

Toggle **Power** (on by default) and the board lights up. A simplified DC
power-flow check finds every net a supply can reach (5V / 3V3 / + rails, and
digital pins assumed HIGH) and every net that reaches ground, then lights each
LED that forms a real closed loop: source -> ... -> LED -> ... -> ground. The
RGB LED lights per channel, a powered buzzer shows sound arcs, and unpowered LEDs
dim. Turn Power off to see the plain board.

### Catches your mistakes (ERC)

- **Hover any hole** to light up every hole electrically connected to it (the
  equipotential highlight; it correctly stops at a component).
- The **Issues** panel and badge flag a power-rail short, a shorted component, a
  backwards LED, an LED with no current-limiting resistor, and a DIP with shorted
  pins. Click an issue to highlight where it is.

### Premium editing

- **Command palette** (Ctrl/Cmd+K) for every action.
- **Drag empty space to pan** the canvas, Shift+drag to marquee-select, scroll to
  zoom to the cursor, pinch on touch, Fit to reset.
- **Multi-select** with a marquee and **drag the whole group** together.
- A **floating toolbar** on the selected part (rotate / flip / duplicate / delete),
  a custom **right-click menu**, and keyboard shortcuts throughout.
- **Undo/redo** (Ctrl+Z / Ctrl+Shift+Z), **autosave** to the browser, **Export**
  and **Import** of the layout as JSON, and **Clear**.

## Controls

| Action | How |
| --- | --- |
| Place a part | Click it in the bin (or Ctrl+K), then click the board |
| Move a part | Drag it (drag a multi-selection to move the group) |
| Pan the canvas | Drag empty space, or hold Space, or middle-drag |
| Marquee select | Shift+drag on empty space |
| Rotate a part | While placing, or with a part selected, press `]` or `[` |
| Flip polarity | The Flip control on a polarized part |
| Draw a wire | Click `Wire` (or `W`), click the first hole, click the second |
| Zoom | Scroll, pinch, or the +/- controls; `0` or Fit to reset |
| Simulate power | The `Power` button in the bottom bar |
| Duplicate | Ctrl+D |
| Delete | Select it, press `Delete` |
| Cancel placing / wiring | `Escape` |
| Command palette | Ctrl/Cmd+K |

## How it is built

No framework, no build tooling. A single page plus a few plain scripts:

| File | Role |
| --- | --- |
| `index.html` | Markup, the SVG, gradient/filter `<defs>`, the hole `<symbol>` |
| `style.css` | Styling and the light/dark design tokens |
| `board.js` | Breadboard geometry + the electrical-node model. Pure data, no DOM, so it is unit-testable under Node |
| `parts.js` | Part definitions as data. Each part declares its legs, a `draw()`, and optional `polar` / `values` / `straddle` flags |
| `app.js` | State, rendering, all interaction (place / drag / snap / wire / select / pan / zoom), the ERC, the power simulation, and save/load |

Two ideas everything rests on:

1. **Every hole belongs to one electrical node**, exactly like a real breadboard.
   Wires union nodes; components do not. This single model drives the
   equipotential highlight, the ERC, the connector status dots, and the power
   simulation.
2. **Parts are data, not code.** `PARTS[type]` declares the legs (as column/row
   offsets) and a `draw()`; the app handles placement, rotation, snapping,
   labels, the Inspector, and lighting generically. Adding a part is one entry
   plus a draw function.

Rendering spends its budget where it counts: the ~400 repeated holes are one
`<symbol>` instanced with `<use>` and carry no filters, while the parts spend the
gradient and drop-shadow budget. Small labels are hidden when zoomed out (LOD).

## Verified

Every change is driven in a real browser before shipping: place each part, rotate
and flip, run the simulation, and assert zero uncaught console errors. The board
model is also checked under Node (hole count, node count, column grouping, ravine
split), and `node --check` passes on all scripts.

## Roadmap

- Deepen the simulation: button press state, transistor switching, lighting the
  7-segment from its pins.
- A schematic view of the same circuit.
- Full-size 63-column board as a toggle (current default fits a screen).
- PNG export for lab reports, and a draggable Arduino.
- More parts as the kit work continues (MOSFET, more DIPs via the shared body).

## Art and licensing

All component art here is original. If you ever want even higher fidelity, the
cleanest borrow is Wokwi's MIT-licensed part SVGs, **not** Fritzing's (its part
graphics are CC-BY-SA and its own FAQ asks you not to reuse them in other
software). Full detail and sources: [NOTICE.md](NOTICE.md).

## Design doc

[DESIGN.md](DESIGN.md) is the original plan and the engineering notes (the
electrical model, the snap rule, the gotchas). [COMPARISON.md](COMPARISON.md)
tracks where this stands against Fritzing.
