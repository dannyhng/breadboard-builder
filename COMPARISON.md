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
| Place + rotate parts | Yes (19 parts, Elegoo UNO R3 aligned) | Yes (huge library) | Yes (broad library) |
| Jumper wires | Click hole to hole, or to any Arduino pin | Bendable wires + Bezier curves | Yes |
| Equipotential highlight (see the net) | Yes | Yes (press-and-hold) | Partial |
| Wiring checks (ERC) | Short, shorted part, reversed LED, no resistor, shorted DIP pins | Ratsnest "still to connect" | Live electrical sim |
| Edit part values (Inspector) | Yes (value dropdowns, LED color, flip polarity) | Yes (resistance, LED color, live) | Yes |
| Undo/redo, multi-select, group-drag | Yes | Yes | Yes |
| Zoom / pan | Yes (scroll-zoom-to-cursor, drag-to-pan, pinch) | Yes | Yes |
| Parts library + search | 19 parts in sections + Ctrl+K palette | Large bins + search | Large catalogs |
| Live simulation | Yes: DC power-flow lights the LEDs (connectivity level, not code execution) | Basic/recent | Yes (the headline feature, runs real code) |
| Share link / embed | No (JSON export) | File | Yes (one-click) |
| Install | None (browser) | Desktop download | None (browser) |

## The honest strategic read

The category has moved past "draw a static wiring picture." Tinkercad Circuits
(free, Autodesk) and Wokwi (runs real firmware, debugger, logic analyzer) define
the bar, and that bar is **live in-browser simulation of the actual circuit/code**.
A static diagram no longer commands payment on its own.

We are not trying to out-simulate Autodesk and Wokwi (we do not execute sketches).
The play is to be **the clearest, smoothest way to learn breadboard wiring**: the
equipotential highlight, the ERC, and now a connectivity-level power simulation
that lights the LEDs and shows a circuit working or not, wrapped in premium editor
polish (undo, zoom/pan, drag-to-pan, group move, an inspector, a command palette),
with zero install and zero account. That sits deliberately between Fritzing's
static diagram and Wokwi's full code sim, and it is a defensible study niche.

## Premium roadmap (status)

**P0 - the line between "toy" and "tool" (all SHIPPED):**
1. Undo / redo (keyboard + buttons).
2. Zoom + pan (scroll-zoom-to-cursor, drag-to-pan, Space/middle-drag, pinch, Fit).
3. Marquee multi-select and group-drag.

**P1 - depth (all SHIPPED):**
4. Inspector: value dropdowns (resistor ohms with color bands, cap uF, transistor
   part number, sensor model), LED color, flip polarity, rename.
5. 19 parts on an N-leg architecture, grouped into Basics / Passives / Sensors /
   Transistors / ICs and displays, tuned to the Elegoo UNO R3 kit. DIPs snap to
   straddle the ravine.
6. Deeper ERC: short, shorted component, reversed LED, no-resistor LED, shorted
   DIP pins; click an issue to highlight it.
7. Live power simulation: a DC power-flow check lights LEDs (per-channel RGB) and
   buzzers, with a Power toggle.

**Next:**
- Deepen the sim: button-press state, transistor switching, lighting the 7-segment.
- A schematic view of the same circuit; share-by-URL; PNG export for lab reports.
- Full-size 63-column board toggle; draggable Arduino.

## Known issues the audit found (status)

- Resistor body stretched across the ravine. FIXED (fixed-size body, leads stretch).
- `nextId` reused after deletions / on import. FIXED (the id counter now floors
  above every loaded id).
- No `pointercancel` handler (stuck touch-drag). FIXED.
- Duplicate wires between the same two holes. FIXED (identical wires deduped).
- DIP pins shorted unless straddling the ravine. FIXED (DIPs snap to straddle, and
  an ERC rule catches any that do not).
- Right-button marquee, un-undoable rename, stale-gesture state. FIXED in the
  multi-agent robustness pass.
- Silent failures: a drag/rotate that cannot fit still gives no message. OPEN
  (minor; the placement ghost turns red, which covers placement).
- `occupied()` tracks part legs, not wire ends. OPEN (low impact).
- Single-slot save, JSON-only export. OPEN (named saves + share-by-URL are
  roadmap).

This doc is the working plan. It is updated as items ship.
