# Classic-freeware deployment

This is the zero-install content path. Players do not select a local game
installation or package: the deployed PWA fetches one versioned package from
its own origin, verifies it, commits it to origin-private storage, and launches
the first mission.

**EA has not endorsed and does not support this product.**

The deployment must remain free and noncommercial. EA assets remain EA
property and are used under the revocable permission described by the
[Command & Conquer franchise modding guidelines](https://www.ea.com/games/command-and-conquer/command-and-conquer-remastered/news/modding-faq).
The package contains no C&C music or movies.

## Build the sidecar

From the repository root:

```sh
./scripts/build-classic-freeware.sh .cache/classic-freeware
```

The source is OpenRA's music-free “Base Freeware Content” package. The script
uses a mirror URL from OpenRA's published package set and pins both:

- byte length: `7,911,636`;
- SHA-256: `a55b2c160b534f6d1b865ad6120e1f4fde8c418d47bb2fb1a9c72c586a5e1603`.

`CNCWEB_FREEWARE_SOURCE_URL` may select another OpenRA mirror, but the pinned
size and digest cannot be overridden. OpenRA documents the asset boundary in
its [legal notice](https://www.openra.net/legal/) and publishes the current
[mirror list](https://www.openra.net/packages/cnc-mirrors.txt).

The build produces:

```text
classic-freeware-v1.json
classic-freeware-gdi-v1.cncweb
```

Place both files beside the deployed `index.html`. For an integrated build:

```sh
source /path/to/emsdk/emsdk_env.sh
cmake --workflow --preset web-td

cd web
corepack pnpm install --frozen-lockfile
REQUIRE_BROWSER_ENGINE=1 corepack pnpm build
cd ..

./scripts/build-classic-freeware.sh web/dist
```

For external staging, publish the complete `web/dist` tree under one immutable
deployment-directory URL and follow the provider-neutral
[static-host staging contract](staging-deployment.md). The URL may be a
subpath but must resolve relative assets from its trailing `/`. Building and
local acceptance do not themselves publish a release; this checkout has no
configured external hosting target. The staging gate verifies HTTP headers,
every served byte and package entry, local `dist` parity, then runs the remote
desktop browser matrix.

With the Playwright browser dependencies installed, run the complete local
browser/Wasm release acceptance:

```sh
cd web
corepack pnpm test:classic-freeware:release
```

A passing release gate proves one archive download, real Wasm mission startup,
manual save/load and online/offline resume, exclusion from the Cache API,
coarse-pointer portrait play, the winter mission, and reuse of the installed
OPFS revision. Its engine-verifier stage mounts the same package and requires
deterministic public-ABI victories for GDI Missions 1–8, including all three
Mission 4 and Mission 5 variants, Mission 6's Commando sabotage path, Mission
7's carried-state base-building operation, and both Mission 8 variants. Retained
green verifier evidence currently covers Missions 1–7. Both Mission 8 variants
are wired into the gate but remain under route hardening, so either failure
correctly blocks a release. Working notes for Mission 8 live in
[mission-8-hardening.md](mission-8-hardening.md); resume east-b (western SAM)
from [mission-8-east-b-handoff.md](mission-8-east-b-handoff.md).

Campaign starts expose **Easy**, **Normal**, and **Hard**, with Normal as the
default. Because the browser engine is a `REMASTER_BUILD`, its host installs
the classic standalone difficulty table through `CNC_Config` before scenario
startup, then applies the selected profile to the campaign player. Easy uses
the classic 0.8 cost and 0.6 build-speed biases; Normal retains 1.0; Hard uses
the classic 0.9 firepower/ground/air-speed and 1.05 armor/rate-of-fire biases.
The selected value is retained by restart, campaign continuation, save/session
restoration, and offline reload. `test:classic-freeware:difficulty` starts the
real TD Wasm engine at all three levels and proves the exported Minigunner cost
is 80 on Easy and 100 on Normal/Hard.

Missions 1–3 use public production, placement, repair,
clear-selection, select-object, and contextual-order commands. Mission 1
reaches terminal victory at tick 2,137 after 13 Nod kills and two GDI losses.
Mission 2 reaches terminal victory at tick 16,123 after 26 production starts,
two repair orders, 62 Nod unit kills, five Nod structure kills, and 29 GDI
losses. Mission 3 deploys its MCV, constructs and places Power Plant, Barracks,
and Refinery, trains infantry, completes reviewed scout and assault route
milestones, and requires an authoritative win with zero remaining counted Nod
combatants. Mission 4 West A and East A complete every reviewed recovery-route
milestone, reach authoritative victory with a surviving GDI force, and leave
counted Nod combatants alive; East A also loads and unloads its authored APC
cargo and reaches the eastern staging area. West B receives its authored GDI
reinforcements, eliminates every counted Nod combatant, and wins with at least
one protected village structure surviving. Mission 5 completes both authored
relief zones before either protected starting group is eliminated, repairs the
field base, produces a strike force, triggers the Nod counterattack, and wins
only after every counted Nod unit and structure is gone. None uses the debug
victory hook.

Mission 6 destroys the two SAM sites, loads and unloads the Commando through
the Chinook's native cargo actions, infiltrates the Nod base, and issues the
engine-authored **Sabotage** action against the Airstrip. It requires the
Commando to survive, Nod forces to remain, and Airstrip type 11 to be carried
by both authoritative terminal events, proving the campaign's Mission 7 bypass
rather than an elimination victory.

Mission 7 starts through the campaign-transition ABI with Refinery type 7
sabotaged and nuke-piece bits 5. It verifies that the unique Nod Refinery and
matching rebuild node are absent, the authored
`CarryOverMoney=0` rule still starts GDI at 5,000 credits, and the sabotage
marker is consumed. The ordinary-command playthrough receives the authored
landing-craft waves, deploys the MCV, builds a base and strike force, and wins
only after every counted unit and structure has been removed from Nod control
through destruction or capture while GDI remains operational. Its correlated
terminal events retain nuke bits 5 and carry no pending sabotage.

Run the Mission 3 verifier, the complete Mission 4 and Mission 5 variant
suites, the Mission 6 sabotage verifier, the Mission 7 verifier, or the
Mission 8 variant suite independently with:

```sh
cd web
corepack pnpm verify:classic-freeware:mission-three
corepack pnpm verify:classic-freeware:mission-four
corepack pnpm verify:classic-freeware:mission-five
corepack pnpm verify:classic-freeware:mission-six
corepack pnpm verify:classic-freeware:mission-seven
corepack pnpm verify:classic-freeware:mission-eight
```

The Mission 3 alias selects canonical `SCG03EA`; the Mission 4 alias exercises
canonical `SCG04WA`, `SCG04WB`, and `SCG04EA`; the Mission 5 alias exercises
canonical `SCG05EA`, `SCG05WA`, and `SCG05WB`; and the Mission 6 alias selects
canonical `SCG06EA`. The Mission 7 alias selects canonical `SCG07EA`; the
Mission 8 alias exercises canonical `SCG08EA` and `SCG08EB` in the shared
`web/scripts/verify-classic-freeware-mission-one.mjs` verifier.

The browser also displays exact reviewed rules for Missions 1–8. Mission 3's
canonical orders are:

- **Eliminate the Nod force:** “Destroy every counted Nod unit and structure in
  the operation area. Nod production, rebuilt structures, and attack teams can
  add targets.”
- **Keep GDI operational:** “The operation fails if no counted GDI structure,
  infantry, or ground vehicle remains.”

Mission 4's three canonical variants use two reviewed rule sets:

- **West A / East A — Recover the GDI crate:** “Reach the marked recovery area.
  The operation completes when a GDI unit enters the crate cell; destroying Nod
  is not required.” The recovery force must retain counted GDI infantry or a
  ground vehicle; a transport aircraft alone does not prevent defeat.
- **West B — Eliminate the Nod force:** destroy every active counted Nod unit,
  including triggered assault groups. The operation also fails if all four
  protected village structures are destroyed or if no counted GDI infantry or
  ground vehicle remains.

Mission 5's three canonical variants share one reviewed rule set:

- **Eliminate the Nod force:** destroy every counted Nod unit and structure,
  including production, rebuilding, patrols, and timed attack teams.
- **Relieve the separated GDI base:** cross both authored relief zones. Until
  its corresponding zone is crossed, losing the last member of the protected
  starting field force or protected starting base structures immediately
  fails the operation.
- **Keep GDI operational:** the operation fails if every counted GDI unit and
  structure is destroyed. Repairing the damaged base is briefing guidance, not
  an engine completion rule.

Mission 6's canonical orders are:

- **Sabotage the Nod base:** use the Commando's C4 on the Airstrip,
  Construction Yard, Hand of Nod, Refinery, Silo, Power Plant, or Communications
  Center. Destroying every counted Nod unit and structure is an alternate
  victory. Sabotaging the Airstrip bypasses Mission 7; otherwise the sabotaged
  structure type is carried into Mission 7.
- **Keep the Commando alive:** losing the Commando fails the operation; landing
  craft and transport aircraft alone do not keep the GDI ground force active.

Mission 7's canonical orders are:

- **Eliminate the remaining Nod force:** landing-craft reinforcements culminate
  in an MCV; use it to build a base, then remove every counted unit and
  structure from Nod control. Destroy units; destroy or capture structures. Nod
  production, rebuilt structures, timed attack teams, and later autocreated
  teams can add targets.
- **Keep GDI operational:** losing every counted GDI infantry unit, ground unit,
  structure, and regular aircraft fails the operation. Landing craft,
  transport/cargo aircraft, and A-10 strike aircraft alone do not prevent
  defeat.

Mission 8's canonical orders are:

- **East A — Eliminate the Nod force:** remove every counted unit and structure
  from Nod control by destroying units and destroying or capturing structures.
  Nod production can add targets, while timed and autocreated teams organize
  later attacks. The operation fails if every counted GDI unit and structure
  is destroyed; repairing the heavily damaged opening force is briefing
  guidance, not a separate completion condition.
- **East B — Eliminate Nod and protect the village:** remove every counted unit
  and structure from Nod control while keeping GDI operational. Nod production and
  transport reinforcements can add targets. Dr. Moebius and the hospital must
  both survive, and the ninth neutral civilian-unit death immediately fails
  the operation. The map starts with 14 protected neutral civilians, so at
  most eight may be lost.

Missions 1–3, Mission 5, Mission 7, and Mission 8 use combat totals as
elimination progress context. Missions 4 and 6, plus Mission 8 East B's
protected-object and civilian conditions, display cause-neutral state for
conditions that cannot be inferred from sidebar totals. In every reviewed mission, the engine's terminal result alone
decides success or failure. In Mission 1 the browser-visible deploy
acceptance selects the real MCV, consumes its engine-authored deploy action, and
uses **Deploy** until Construction Yard production is available. In Mission 2 it trains a
Minigunner and exercises hold/resume through visible production controls.
Semantic labels identify the selected MCV and resulting Construction Yard
without changing the engine command path.

When that exact canonical Mission 1 starts fresh rather than from a save, a
player with no stored tutorial state is offered the paused **Welcome,
Commander** tutorial. Its progressive coach verifies actual camera, selection,
processed-order, deployment, production, and placement evidence and completes
after the player places a Power Plant. Hiding the coach preserves progress; the
persistent **Controls & tutorial** hub can resume it, restart it in a fresh
Mission 1, or end it while keeping the complete controls reference available.

A separate loopback-only acceptance hook uses the engine's existing
end-game debug request to produce genuine campaign-outcome/game-over events;
the test restores that result after refresh, starts canonical GDI mission 2
with carry state, reloads the continuation offline, and continues through a
second terminal result into GDI mission 3. A fault-injected audio-index read
exhausts the bounded OPFS retry during that offline handoff and proves optional
audio cannot prevent the engine from starting. Normal/public origins never
expose this hook. The normal-command engine verifiers prove combat and
mission completion through the public ABI, the deploy acceptance proves real
canvas selection/order/deployment behavior, and the hook proves browser
terminal recovery and continuation. The combat verifier has engine-level
object knowledge rather than a person's fog-of-war view, so a recorded
human-played combat victory remains open.

The same command runs a 10-second real-mission performance budget and a
desktop browser matrix. Chromium and headed Firefox exercise the hosted
package, save, and OPFS reload. Playwright's Linux WebKit port currently lacks
`navigator.storage`, so it verifies the explicit demo fallback; WebKit
[documents Safari's OPFS support](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/),
and a physical macOS/iOS acceptance run is still required.

The source archive, extracted files, `.cncweb`, and descriptor are generated
or downloaded content. They are ignored release outputs and must not be added
to Git.

## Trust and storage flow

The browser accepts only the fixed `classic-freeware-v1.json` schema. The
descriptor and archive must be same-origin and may not redirect, use
credentials, or contain URL queries/fragments. Before parsing the ZIP, the
browser requires its declared byte length and SHA-256. Before committing any
file, the importer independently checks the package ID, aggregate content
digest, freeware provenance, ZIP limits, manifest inventory, and every file
digest. A failed candidate never replaces a working revision.

The service worker deliberately does not cache the large content archive. The
verified, expanded revision lives once in origin-private storage. A later
online or offline launch uses that installed revision without downloading the
archive again.

## Current content boundary

The normalized mirror contains all 25 canonical GDI campaign roots and only
the opening Nod mission. This release profile therefore publishes the complete
GDI campaign first. Nod requires an additional music-free Gold freeware source
and is not fabricated from missing data.

The mirror strips mission briefing prose, so the catalog uses a neutral
non-story instruction while preserving each original scenario INI/BIN for
simulation. The browser supplies exact objective prose only for the reviewed,
canonical Mission 1–8 identities. Missions 1–3, Mission 5, Mission 7, and
Mission 8 use engine-exported combat totals as elimination progress context;
Missions 4 and 6, plus Mission 8 East B's protected-object and civilian
conditions, use cause-neutral state where sidebar totals cannot prove the
rule. Completion/failure comes only from the engine result. Mission 9 and later
retain the neutral instruction until their rules are authored and reviewed.
The mirror also omits winter-specific icon data; the current MVP aliases
the verified temperate icon archive for the two winter missions. Authentic
winter icons or fully original replacement art are the presentation follow-up.
The winter gate captures the live classic battlefield on a 390×844
coarse-pointer viewport and checks that controls remain usable. A detailed
human visual review on representative phones remains release follow-up.

The optional local Remastered converter and its private acceptance harness
remain supported, but they are not required by the classic-freeware deployment.
