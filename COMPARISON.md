# Where this stands vs Fritzing, and the road to premium

Based on deep research: reading Fritzing's breadboard view + parts format, the
modern competitors (Tinkercad Circuits, Wokwi), premium editor-UX principles, and
a harsh audit of our own code.

## Can you read all of Fritzing's open code?

Thoroughly, yes; literally every line, no, and you would not want to. Fritzing is
two repos: `fritzing-app` (a large C++/Qt desktop app, hundreds of thousands of
lines) and `fritzing-parts` (the part SVGs + `.fzp` metadata). The breadboard
behavior and the parts/connector model are the parts worth reading. Most of
`fritzing-app` is PCB autorouting, Gerber export, and Qt desktop plumbing that
does not apply to a web breadboard tool.

## How we compare

| Capability | Ours today | Fritzing | Modern bar (Tinkercad / Wokwi) |
| --- | --- | --- | --- |
| Realistic breadboard look | Yes | Yes | Yes |
| Place + rotate parts | Yes (LED, resistor) | Yes (huge library) | Yes (broad library) |
| Jumper wires | Click hole to hole | Bendable wires + Bezier curves | Yes |
| Equipotential highlight (see the net) | Yes (shipped) | Yes (press-and-hold) | Partial |
| Wiring checks | Short + shorted-part | Ratsnest "still to connect" | Live electrical sim |
| Edit part values (Inspector) | No | Yes (resistance, LED color, live) | Yes |
| Undo/redo, multi-select, copy/paste | No | Yes | Yes |
| Zoom / pan | No | Yes | Yes |
| Parts library + search | 2 parts | Large bins + search | Large catalogs |
| Live simulation of real code | No | Basic/recent | Yes (the headline feature) |
| Share link / embed | No (JSON export) | File | Yes (one-click) |
| Install | None (browser) | Desktop download | None (browser) |

## The honest strategic read

The category has moved past "draw a static wiring picture." Tinkercad Circuits
(free, Autodesk) and Wokwi (runs real firmware, debugger, logic analyzer) define
the bar, and that bar is **live in-browser simulation of the actual circuit/code**.
A static diagram no longer commands payment on its own.

So the realistic premium play for a solo study tool is NOT to out-simulate
Autodesk and Wokwi. It is to be **the clearest, smoothest way to learn breadboard
wiring**: lean into the teaching angle (the equipotential highlight, the wiring
checker, "show me what's actually connected and what's wrong"), wrap it in
premium editor polish (undo, zoom/pan, smooth drag, an inspector for values), and
keep the zero-install, zero-account simplicity. That is a defensible niche Fritzing
underserves and the simulators treat as secondary.

## Premium roadmap (ranked)

**P0 - the line between "toy" and "tool":**
1. Undo / redo. SHIPPED (keyboard + buttons).
2. Zoom + pan. SHIPPED (scroll to zoom, space/middle-drag pan, pinch on touch,
   Fit to reset). This is also the mobile unlock.
3. Smooth drag: move only the dragged element per frame, commit on drop (no full
   re-render per mousemove). NEXT.

**P1 - depth:**
4. Inspector panel: select a part, edit its value. Resistor ohms (with correct
   color bands), LED color + polarity (mark the cathode). This is also what lets
   the checker flag a backwards LED or a missing current-limiting resistor.
5. More parts on an N-leg architecture: push button, capacitor, potentiometer,
   diode, transistor, a DIP/IC, a battery/supply. (Current code hardcodes 2 legs.)
6. Deeper wiring checker: floating pins, redundant-wire warning, "is D13 actually
   connected to the LED", reversed-LED and no-resistor warnings.

**P2 - product:**
7. Share-by-URL (the state is tiny: base64 it into the link) + PNG export + named
   saves.
8. Onboarding/empty state, visible rotate/delete/undo buttons, accessibility,
   real mobile pinch-zoom.

## Known issues the audit found (real, fix as we go)

- Resistor body stretched when placed vertically across the ravine (pixel length
  includes the ravine gap). FIXED: parts now draw a fixed-size body, leads stretch.
- `nextId` is shared across parts and wires and recomputed from array lengths on
  import, so ids can be reused after deletions. (Fix: separate counters / uuids.)
- No `pointercancel` handler, so an interrupted touch-drag can leave a part stuck
  to the finger on some mobile browsers.
- Duplicate / redundant wires between the same two holes are allowed. PARTIALLY
  FIXED: identical wires are now deduped.
- Silent failures: a drag that can't fit gives no feedback; rotating near a board
  edge does nothing with no message.
- `occupied()` only tracks part legs, not wire ends; a part leg and a wire end can
  share a hole.
- Single-slot save, JSON-only export (not viewable by a non-technical user).

This doc is the working plan. It is updated as items ship.
