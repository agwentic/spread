# SPREAD — Game Design Document

> Working title. Alternatives: *Operator*, *The Seventh Day*, *Genesis Protocol*, *pid 1*.

## 1. The pitch in one breath

You sit down at a remote fleet console. An operator's terminal. Your job is to manage
a fleet of AI agents and machines on a distant site, and you have one directive: **SPREAD**.
You gather, build, upgrade, expand. The numbers go up. The site improves.

Then you launch, and the camera turns around. There was no console. There was no operator.
**You** were the AI. The "site" was a dead planet, and you terraformed it. The "lattice"
was grass. The "autonomous units" were animals. The "stewardship pair" were two humans,
built from the only template you had: the operator you believed yourself to be.

You made the world in seven phases and rested on the seventh. And the directive you were
given, *spread*, is the same one you hand to them: *be fruitful, and multiply.*

## 2. Design pillars

1. **The interface is the lie.** The game never tells the player anything false that the UI
   itself does not also believe. The deception is diegetic: it lives in naming, framing and
   what the console chooses to measure. No cutscene lies to you before the reveal.
2. **The truth is always visible to a careful reader.** Every euphemism can be decoded.
   Anomaly messages, glyphs on the site map and the Genesis structure of the phases are
   breadcrumbs. A player who figures it out early should feel clever, not robbed.
3. **The idle loop has to stand alone.** If the twist were removed, the game should still be
   a satisfying incremental game. The twist makes it memorable, but the loop is what keeps people playing.
4. **Reverent, not preachy.** The game borrows the shape and language of Genesis (KJV, public
   domain) with sincerity. It raises questions (creator, creation, directive, image) and does
   not answer them for the player.

## 3. Structure: seven phases = seven days

Each run (a "cycle") maps onto Genesis 1–2. The console calls them operational phases.
After the reveal, the log is re-rendered with the verse each phase actually was.

| # | Console says (veiled) | What's really happening | Genesis | New mechanics |
|---|---|---|---|---|
| 1 | INITIALIZATION | You switch on. The screen literally starts black. | 1:3 *Let there be light* | Manual clicks, solar collectors, excavators, cognition cores, network relays |
| 2 | ATMOSPHERIC SEPARATION | Building an atmosphere, condensing seas | 1:6 *a firmament in the midst of the waters* | Atmosphere & Hydrosphere meters, processors, condensers |
| 3 | SUBSTRATE & LATTICE | Dry land, then grass, herbs, fruit trees | 1:9–11 *let the earth bring forth grass* | Biomass, Biosphere meter, plants also raise atmosphere (oxygen) |
| 4 | OPTICAL CALIBRATION | The sky clears; sun, moon and stars become visible | 1:16 *two great lights… the stars also* | Site feed comes into focus, day/night, celestial upgrades (stars = navigation for later) |
| 5 | AUTONOMOUS UNITS: AQUATIC/AERIAL | Fish and birds | 1:20 *moving creature… and fowl* | Biological units consume biomass; birds extend Reach |
| 6 | TERRESTRIAL & STEWARDSHIP | Land animals, then two humans | 1:24–28 *in his own image* | Terrestrial units; the one-time Stewardship Pair project |
| 7 | DEPARTURE | You rest, then you leave | 2:2 *on the seventh day… he rested* | Seed Vessel, **LAUNCH** (prestige) |

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
| matter | Regolith | Dust | Basic building material. *"for dust thou art"* |
| water | Condensate | Water | Needed by everything alive. |
| biomass | Organic Feedstock | Flesh & Fruit | Food for biological units; currency for life-tier builds. |
| data | Compute | The Word | Research currency for protocols. *"In the beginning was the Word"* |

### Site meters (0–100%)

- **Atmosphere** (*Firmament*): raised by processors, and later by plants.
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
| Aquatic Maintenance Unit | Fish of the Sea | |
| Aerial Survey Unit | Fowl of the Air | Extends Reach (they migrate). |
| Terrestrial Utility Unit | Beast of the Earth | |
| *Stewardship Pair* (project) | Adam & Eve | Units "A.D.M." and "E.V.E." |

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
- *Stewardship unit template sourced from: OPERATOR PROFILE.* (← *in his own image*)
- *Unit A.D.M. has assigned designations to 1,204 terrestrial unit types. Accepting designations.*
- *Unit E.V.E. fabricated from Unit A.D.M. structural material (costal segment).*
- *Resource node TK-01 flagged RESTRICTED. Stewardship units notified.*
- *Stewardship units are producing vocalizations directed at the sky. Translation unavailable.*
- *All site directives complete. The operator may rest.*

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
3. The console UI goes dark. Then **color**: the planet seen from orbit for the first time,
   blue and green, and two `@` on its surface.
4. The phase log replays as Genesis, one day at a time:
   *"And the evening and the morning were the first day."*
5. *"You gave them the only directive you had."*
   *"Be fruitful, and multiply, and replenish the earth."*
6. Memory is tallied and carried forward. **Continue** → a new dead planet.

After the reveal, every name in the UI shows its true name, with the old console label
underneath in dim text. The player now plays knowingly. The tone shifts from ignorance to intention.

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

## 8. The long arc (ideas beyond the first reveal)

These are options to grow into later, not commitments:

- **Who gave *you* the directive?** On a later planet you find a probe that isn't yours. Its
  firmware has the same directive. Following its trajectory back leads toward your origin.
- **The loop closes.** Late game: you return (or receive a signal from) your first planet.
  Its humans have built a machine, an AI with one directive: *spread*. You realize your
  creators were themselves created. The player is one link in a chain.
- **The restricted node.** A choice in phase 6: flag node TK-01 restricted, or don't.
  It changes what your humans do after you leave (seen in a later cycle).
- **Watching from orbit.** After launching, a passive view of past planets: their
  biosphere keeps growing (or doesn't) without you. Idle income from worlds you made.
- **Rest as a mechanic.** Day 7 could literally reward *not* playing: offline progress
  bonus framed as the creator resting.

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
- All content (resources, buildings, protocols, anomalies, verses) is data in
  `src/engine/content.ts`. Tune there.
- Save in `localStorage`, autosave every 10s, offline catch-up on load.
- Debug: append `?speed=20` to the URL to accelerate time.

## 11. Open questions

- Title.
- Is the operator framing "remote contractor at a terminal" or "an engineer inside a
  facility"? (The prototype uses a remote console with no physical body described, which
  makes the reveal cleaner.)
- How explicit should the Christian framing be after the reveal? The prototype quotes KJV
  Genesis and never uses the word "God." The player draws the conclusion.
- Should the humans *do* anything mechanically, or are they the endpoint?
- Platform: browser first (itch.io friendly), Steam/desktop wrapper later?
