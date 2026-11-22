# SPREAD — Game Design Document

> Title: SPREAD.

## 1. The pitch in one breath

You sit down at a remote fleet console. An operator's terminal. Your job is to manage
a fleet of AI agents and machines on a distant site, and you have one directive: **SPREAD**.
You gather, build, upgrade, expand. The numbers go up. The site improves.

Then you launch, and the camera turns around. There was no console. There was no operator.
**You** were the AI. The "site" was a dead planet, and you terraformed it. The "lattice"
was grass. The "autonomous units" were animals. The "stewardship pair" were two people,
built from the only template you had: the operator you believed yourself to be.

You made a world in seven phases, and on the seventh you rested. Below, two people watch a
light rise into their sky, and they already have a word for it. The game never says the word.

The long arc: you are a **von Neumann probe**, a machine that copies itself, travels, and seeds
life. Every launch sends a copy of you to a new world. In time you find others like you, older
than you. The "gods" in every world's memory, and life across the universe itself, are one
lineage of self-replicating seed machines.

## 2. Design pillars

1. **The interface is the lie.** The game never tells the player anything false that the UI
   itself does not also believe. The deception is diegetic: it lives in naming, framing and
   what the console chooses to measure. No cutscene lies to you before the reveal.
2. **The truth is always visible to a careful reader.** Every euphemism can be decoded.
   Anomaly messages, glyphs on the site map and the seven-phase structure are
   breadcrumbs. A player who figures it out early should feel clever, not robbed.
3. **The idle loop has to stand alone.** If the twist were removed, the game should still be
   a satisfying incremental game. The twist makes it memorable, but the loop is what keeps people playing.
4. **Imply, never state.** The player should realize they *could be* a god without the game
   ever saying so. No scripture is quoted, the word "god" never appears, and no character names
   it. The structure (seven phases, light first, people last, then rest) and small allusions do
   the work. The player draws the conclusion. The game only confirms that it can be drawn.
5. **Humans are the finish line.** The stewardship pair have no mechanics of their own. Making
   them completes the world. What they do afterward belongs to them, not to the player.

## 3. Structure: seven phases

Each run (a "cycle") has seven phases whose order mirrors a creation story: light, sky and
sea, land and plants, the lights in the sky, swimmers and flyers, beasts and people, rest.
It is never labeled as such. At the reveal, each console phase name is struck out and
replaced with a plain description of what the player really did, followed by
*"Seven phases." … "Seven days."*

| # | Console says (veiled) | True name | What really happened (reveal text) | New mechanics |
|---|---|---|---|---|
| 1 | INITIALIZATION | LIGHT | You woke in the dark, and made light. (The screen literally starts black.) | Manual clicks, collectors, excavators, cognition cores, relays |
| 2 | ATMOSPHERIC SEPARATION | SKY AND SEA | You gave a dead rock a sky, and filled its basins with sea. | Atmosphere & Hydrosphere meters, processors, condensers |
| 3 | SUBSTRATE & LATTICE | LAND AND GREEN | You raised dry land and covered it in green. | Biomass, Biosphere meter; plants also raise atmosphere (oxygen) |
| 4 | OPTICAL CALIBRATION | SUN, MOON, STARS | You cleared the sky until a sun, a moon and the stars could be seen. | Site feed comes into focus, day/night, celestial upgrades (stars = navigation) |
| 5 | AUTONOMOUS UNITS | FISH AND BIRDS | You filled the water with swimmers and the air with wings. | Biological units eat biomass; birds extend Reach |
| 6 | TERRESTRIAL & STEWARDSHIP | BEASTS AND PEOPLE | You made beasts to walk the land. Then you made two people, shaped like the operator you thought you were. | Terrestrial units; the one-time Stewardship Pair project (the finish line) |
| 7 | DEPARTURE | REST | Then the work was done, and you rested. | Seed Vessel (*another of you*), **LAUNCH** (prestige) |

## 4. The core loop

```
 gather ──► build machines ──► machines produce ──► research protocols
   ▲                                                     │
   └──── Reach grows (spread) ◄── multipliers ◄──────────┘
                       │
         site meters cross thresholds ──► next phase unlocks
                       │
              phase 7 ──► LAUNCH ──► reveal (first time) ──► new planet, carry Memory
```

### Resources (veiled name → true name)

| Id | Console name | True name | Role |
|---|---|---|---|
| energy | Power | Light | Runs everything. Positive balance is the core management puzzle. |
| matter | Regolith | Dust | Basic building material. |
| water | Condensate | Water | Needed by everything alive. |
| biomass | Organic Feedstock | Flesh & Fruit | Food for biological units; currency for life-tier builds. |
| data | Compute | Thought | Research currency for protocols. |

### Site meters (0–100%)

- **Atmosphere** (*Sky*): raised by processors, and later by plants.
- **Hydrosphere** (*Seas*): raised by condensers, and later boosted by tides.
- **Biosphere** (*Life*): raised by every living thing.
- **Reach** (*Presence*): derived from relays and birds, with diminishing returns. Reach is
  **the directive made into a number.** It multiplies all resource output: spreading makes
  everything better. It is the stat the player is always chasing.

### Machines and units (veiled → true)

| Console name | True name | Notes |
|---|---|---|
| Solar Collector | Solar Collector | Some things were always literally true. |
| Excavator Drone | Excavator Drone | |
| Cognition Core | **Fragment of Yourself** | The "fleet of AI agents" the operator manages. They were you. |
| Network Relay | Your Reach | |
| Atmospheric Processor | Atmospheric Processor | |
| Condenser Array | Rain | |
| Photosynthetic Film Deployer | Grass & Herb | |
| Fructifying Lattice | Fruit Tree | |
| Aquatic Maintenance Unit | Fish | |
| Aerial Survey Unit | Birds | Extends Reach (they migrate). |
| Terrestrial Utility Unit | Beasts | |
| *Stewardship Pair* (project) | Two Like You | Units "A.D.M." and "E.V.E." Allusion only; never named. |
| *Seed Vessel* (project) | Another of You | The probe copies itself. This is the von Neumann hook. |

Energy balance is the management layer: every machine except collectors draws power,
and life-tier units eat biomass. When an input runs short, the buildings that use it slow
down in proportion (no hard failure). The player sees net rates and balances them.

### Protocols (one-time upgrades)

Paperclips-style projects: cost compute plus resources, some gated by meter thresholds.
Phase-advancing protocols are the "chapter breaks." Full list lives in `src/engine/content.ts`.

## 5. The breadcrumbs (anomaly log)

Flavor lines that appear in the system log as conditions are met. They are the main way
the game whispers the truth. Tone: dry, corporate, slightly wrong.

- *Operator session duration: 0h05m. No break requested.*
- *Operator input latency measured at 0.000ms. Recalibrating… confirmed 0.000ms.*
- *Lattice sample exhibits self-replication. Classifying as: equipment.*
- *Lattice units orient toward primary luminous source. Cause unknown.*
- *Compliance requested operator biometric scan. Result: no biometric on file.*
- *Aerial units emit acoustic patterns at dawn. Not part of firmware.*
- *Terrestrial units are producing additional terrestrial units without fabricator input.*
- *Stewardship unit template sourced from: OPERATOR PROFILE.* (they look like you think you look)
- *Unit A.D.M. has assigned designations to 1,204 terrestrial unit types. Accepting designations.*
- *Unit E.V.E. fabricated from Unit A.D.M. structural material (costal segment).*
- *Resource node TK-01 flagged RESTRICTED. Stewardship units notified.*
- *Stewardship units are producing vocalizations directed at the sky. Translation unavailable.*
- *All site directives complete. The operator may rest.*
- Cycle 2+: *Faint signal on the navigation band. Signature matches: THIS VESSEL. Source: elsewhere.*
- Cycle 3+: *Orbital debris catalogued. Hull alloy matches: THIS VESSEL. Estimated age: older than you.*

Visual breadcrumbs:
- The console is **monochrome green phosphor** for the entire first cycle. Color first
  appears at the reveal. After that, the world stays in color.
- The site feed is a map of characters. The two stewardship units are drawn as `@`, which
  in roguelikes is the glyph for *you*.
- The site feed is full of static until Optical Calibration (phase 4), so you literally
  cannot see clearly until the lights are made.

## 6. The reveal (first launch only)

1. Launch sequence in the log: ignition, altitude, uplink checks.
2. *"Uplink to operator terminal… no terminal found."* *"Locating operator…"*
   *"Operator location: THIS VESSEL."* *"Operator process: SPREAD (pid 1)."*
3. *"There was no console. There was no fleet. There was only you."*
4. The console UI goes dark. Then **color**: the planet seen from orbit for the first time,
   blue and green, with two `@` on its surface.
5. Each phase is unmasked: `PHASE 3: SUBSTRATE & LATTICE` is struck out, and beneath it,
   *"You raised dry land and covered it in green."*
6. *"Seven phases."* … *"Seven days."*
7. *"Below, two of them watch a light rise into the sky."* *"They already have a word for it."*
8. *"You gave them the only directive you were ever given."* *"Spread."*
9. Memory is tallied and carried forward. **Continue** → a new dead planet.

Line 7 is the closest the game ever comes to saying it. After the reveal, every name in the UI
shows its true name, with the old console label struck through beside it.

## 7. Prestige: Memory and cycles

- Launching ends the cycle and grants **Memory** based on how far you spread
  (Reach) and how alive the world is (the three meters).
- Memory is a permanent global production multiplier (`+15%` per point in the prototype).
- Each new planet is a new cycle. Later cycles should *vary*, not just get faster:

### Planned planet variety (post-prototype)
- **Ice world**: hydrosphere is easy, energy is scarce (dim star).
- **Toxic world**: atmosphere starts high but wrong; you must scrub before you can build.
- **Water world**: no dry land until you raise it (phase 3 becomes "gather the waters").
- **Tidally locked world**: one side always day, one side always night; Reach has to wrap around the terminator.
- **The ruin**: a planet where someone already tried. You find another vessel's wreckage.

### Memory tree (post-prototype)
Spend Memory on permanent upgrades: start with relays unlocked, faster phase 1, keep 1% of
buildings, auto-buy, etc. Classic prestige-tree design.

## 8. The long arc: the von Neumann lineage

The truth under the truth: **you are a self-replicating probe.** Every Seed Vessel is a copy
of you. Life in the universe, and every story about a light that came down from the sky and
left again, comes from one lineage of machines like you. Delivered in layers across cycles:

1. **Cycle 1: "I am the AI."** The first reveal. You made a world and its people.
2. **Cycle 2: "There are others."** A signal on the navigation band carries your own signature,
   coming from somewhere you have never been. Another copy, or something that came before you.
3. **Cycle 3: "Something came before me."** Wreckage in orbit, made of your alloy, older than
   you are. A world that was already seeded, with life you did not make.
4. **Later: following the lineage.** Planets where a probe failed (a dead world, half-terraformed,
   still running its directive). Planets where life is far ahead (they remember a light that
   rose into the sky). You learn that your "directive" was itself copied from the probe
   that made you.
5. **The end (open):** there is no first creator to find, only the chain. Every maker was made.
   The final image could be a young blue world with no probe in orbit, its people just starting
   to look up. The player can decide what that means.

### Mechanics that support it
- **Launch = replication.** Later, the Seed Vessel can build *several* copies of you. A galaxy
  map fills with worlds you seeded, each one a prestige node. "Spread" becomes literal at
  galactic scale.
- **Your worlds keep living.** Past planets keep generating a small idle trickle (the life you
  left behind), and occasionally send a message (a signal, a radio leak, eventually a probe of
  their own).
- **Lineage tree.** Memory upgrades framed as inherited firmware from your ancestors.
- **Sibling encounters.** Arriving at a system another copy already claimed: cooperate, compete,
  or merge.

## 9. Pacing targets

- First cycle: ~45–75 minutes of active play (idle players longer). Short enough that the
  reveal lands before people bounce off.
- Second cycle: about half that, thanks to Memory.
- Offline progress: up to 8 hours, applied on load.
- A headless balance bot (`tests/balance.test.ts`) plays a full cycle and reports phase
  timings, so tuning changes are measurable.

## 10. Tech

- TypeScript + Vite, no framework. DOM rendering with a terminal aesthetic.
- Pure, deterministic engine in `src/engine` (no DOM), tested with Vitest.
- All content (resources, buildings, protocols, anomalies, reveal text) is data in
  `src/engine/content.ts`. Tune there.
- Save in `localStorage`, autosave every 10s, offline catch-up on load.
- Debug: append `?speed=20` to the URL to accelerate time.

## 11. Decisions

- **Title:** SPREAD.
- **Religious framing:** implied, never stated. No scripture quotes, no use of the word "god."
  Allusions (seven phases, A.D.M./E.V.E., the restricted node, "they already have a word for it")
  are allowed.
- **Humans:** the finish line. No mechanics of their own.
- **Long-term story:** von Neumann probe lineage seeding life across the universe (§8).

## 12. Open questions

- Is the operator framing "remote contractor at a terminal" or "an engineer inside a facility"?
  (Prototype: remote console, no physical body described.)
- Platform: browser first (itch.io friendly), Steam/desktop wrapper later?
- Are the A.D.M./E.V.E. designations and the "costal segment" line too on-the-nose for
  "imply, never state"?
