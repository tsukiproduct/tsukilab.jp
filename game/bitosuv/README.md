# Bito survivors

Buildless, original Canvas survivor action game. Production path: https://tsukilab.jp/game/bitosuv/ . Serve this folder over HTTP; ES modules do not support launching from file://.

## Play

Move with WASD/arrows or a floating touch joystick. Attacks auto-target nearby enemies. Space or the DASH button performs a 0.2-second dash with 0.35-second invulnerability; cooldown 6 seconds. TAB or 装備 shows the graphical current-build screen and pauses. ESC pauses.

Collect XP gems, choose a capped upgrade at level-up, collect dropped midboss chests, defeat the final boss. Midbosses spawn at 45, 100 and 150 seconds, the final boss at 180 seconds. Boss attacks telegraph for 0.8 seconds; ground hazards telegraph for 0.9 seconds. Chest rewards grant 1–5 actual random upgrades and the same number of levels, without consuming accumulated XP. Base probabilities: 45%, 27%, 16%, 9%, 3%; workshop luck raises multi-upgrade chances. Fully upgraded builds receive healing instead.

## Progression

Five sequential difficulty tiers. Clear tier 1–5 to unlock Red Cape, Opera, UsaBito, Bard and Swimsuit Bito respectively. Characters have distinct stats/start equipment; unlocks are not a simple linear damage ladder. Coins are earned even on defeat. Power, health and luck workshop upgrades each cap at five. Replay any unlocked tier with any unlocked character.

Data key `bito-survivors-v3` stores only cleared-tier booleans, integer currency, best kills, run count and integer workshop ranks. Saves are local to this origin/browser and do not sync across devices. No paid mechanics or real money.

## Performance and animation

Fixed 60 Hz simulation with requestAnimationFrame rendering, device-pixel ratio 1, pre-rendered small sprite canvases, offscreen culling, spatial-grid bullet collision. Limits: 72–96 regular enemies plus bosses, 100 player bullets, 65 hostile bullets, 260 pickups, 90 particles. Player source rectangles are measured from alpha silhouettes, aligned to a shared foot baseline and head center, and scaled consistently per character. Walking is distance-driven with directional front/side/back frames; only left-facing side sprites are mirrored. Includes bat/ghost float, hit flashes, dash afterimage, rotating cards, chest reward reveal and telegraphed boss effects. Reduced-motion preference disables menu transitions.

## Security

No external JS/CSS dependencies, analytics, input forms, accounts, network APIs, eval, secrets or service workers. CSP restricts scripts and images to self; network connections, objects, frames and forms are disabled. Inline styling is allowed for controlled HUD dimensions and reveal delays; inline scripts are forbidden. Save data is normalized to finite bounded integers and strict booleans before use. Menu HTML interpolates only hardcoded strings and normalized game values, never URL/remote input. No auth or leaderboard depends on client-side saves; local save tampering is not prevented. HTTPS and host-wide response headers are hosting concerns; GitHub Pages does not support arbitrary response-header configuration. The game's meta CSP cannot set frame-ancestors.

## Validation

Run `node --test tests/core.test.mjs tests/ui.test.mjs tests/animation.test.mjs` from this folder. Nineteen tests cover save validation, all five unlocks, currency/purchases, timed bosses, chest outcomes, caps, pause/dash, victory/defeat, long-run resource limits mocked DOM menu transitions, isolated sprite bounds, four-way facing, diagonal hysteresis and dash gait cadence. Run `node tests/balance.mjs` for seeded avoidance-bot simulations. Bot results inform tuning but do not replace human playtests. UI tests mock Canvas/DOM and are not browser screenshots. iOS device crash reproduction and visual browser QA remain unverified in this environment.

## Design references

- MDN, Optimizing canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- OWASP, HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- Josh Ge, How to Make a Roguelike: https://www.gamedeveloper.com/design/how-to-make-a-roguelike

The design uses a short core loop, legible attack tells, capped build choices and replay rewards. Difficulty adjusts health, movement, damage, density, XP efficiency and boss bullet count; it does not rely solely on larger health pools.

## Halloween 2026 update

The Bito page is the Halloween edition. `/game/halotei/` is a separate title/roster variant sharing the same tested engine and assets. Bito remains initially playable. Cat Girl (猫娘, ID 6) unlocks after difficulty 1; Don (ドン, ID 7) after difficulty 2. Existing clears unlock them automatically. Original characters remain in the Bito edition; Halotei's roster contains Bito, Cat Girl and Don. Each has distinct starting stats. The new Halloween atlas has 21 alpha-inspected source rectangles, including front/side/back poses. Don's generated opposite-facing side frame is corrected when caching.

Campaign: 3 minutes plus final boss, workshop bonuses enabled, clears unlock characters and difficulty. Ranked survival: maximum 480 seconds, workshop bonuses disabled, boss kills do not end the run, extra bosses appear after minute 4, and the clock always ends the run at 8 minutes. A ranked clear does not unlock campaign tiers. During upgrade/chest/pause screens the simulation clock stops. Scores sort by survival milliseconds descending, kills descending, remaining HP percentage descending, then submission date ascending. Boards are separated by edition and difficulty. Name and score are posted only after the player clicks the submission button.

Shared API: https://bito-ranking.tsukiyomigame.chatgpt.site . D1 stores server-created sessions and public scores. Session token hashes, 4-hour expiry, one submission per session, allowed game origins, JSON/body-size validation, name character/length checks, score bounds, server elapsed-time checks, parameterized SQL and IP-day-hash session rate limits reduce abuse. No raw IP is stored by application code. Nicknames are escaped before rendering. Session tokens stay in memory. HTTPS, persistence and actual leaderboard/session requests were verified after deployment.

The leaderboard is a casual leaderboard, not a server-authoritative replay system. These checks do not fully prevent a modified game client from forging a plausible score. No accounts, sensitive data, rewards or money depend on rankings. Browser/device-specific animation and iPhone QA remain unverified.

The earlier "no network APIs" statement applies to v3. v4 explicitly allows only the shared API in connect-src; all other external connections remain blocked by CSP. Player progress remains device-local and the shared API stores only ranking records/sessions. Run all game tests with `node --test tests/*.test.mjs`. The API has separate validation/CORS/SQL/error-handling tests in its source repository.

## Character weapons (v5)

Each character now has a distinct primary attack and matching upgrade/build-screen labels: Bito fires a piercing glasses laser; Red Cape sends homing bats and heals slightly on kills; Opera throws a fan of piercing mask blades; UsaBito throws carrots that hit once outbound and once returning; Bard emits an expanding sound ring; Swimsuit Bito fires bubbles with splash damage; Cat Girl strikes a forward flame cone with a two-second burn; Don slams the ground for radial damage and knockback. Projectile-count upgrades increase reach for sound/flame/slam instead. Secondary aura/orbit equipment uses character-specific names, colors and graphics.

Don requires a normal campaign difficulty-2 clear. Ranked survival never grants campaign unlocks. Existing difficulty-2 clears immediately make Don available.

Validation: `node --test tests/*.test.mjs` passes 35 tests including all eight weapons, piercing, tracking, return-leg hits, splash, burn, knockback, area upgrades, progression and mocked UI transitions. Real-device/iPhone visual validation remains unverified.

## Nightfall / v6 design and verification

Research informed the following specific decisions. Matthew Davis's *Into the Breach Design Postmortem* (GDC 2019, https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf) emphasizes readable telegraphs, constrained interfaces and clear rewards. Here, skeleton charges and aimed fans lock their target at warning start; bosses alternate a gapped ring, fan and delayed ground fields. A second phase raises pressure below half health. The approach applies its clarity principles to this action game, rather than reproducing its turn-based rules.

*Juice It or Lose It* (Martin Jonasson / Petri Purho, GDC 2012, https://www.gdcvault.com/play/1016487/juice-it-or-lose) motivates consistent visual/audio feedback. *Don't Juice It or Lose It* (Folmer Kelly, GDC 2014, https://www.gdcvault.com/play/1021398/Don-t-Juice-It-or) cautions that polish can reduce immersion. Feedback here is bounded: capped damage labels, throttled audio, character-colored attacks, restrained lantern lighting and optional reduced screen motion. Enemy projectiles and telegraphs retain warm danger colors; rewards use gold/green.

Gameplay additions: eight automatic weapon evolutions (three earned power ranks plus two earned support ranks), visible requirements and numerical upgrade previews, one build-relevant choice when available, and two rerolls per run. Director intervals alternate 25 seconds of ordinary pressure, 15 seconds of a surge and 10 seconds of recovery. Existing boss times and campaign/ranked rules remain intact. Short-range weapons wait for a target in range instead of wasting their cooldown. Boss HP is 3,200 times the difficulty boss multiplier so a developed build can experience attack patterns rather than immediately deleting the encounter; midboss base HP is 310.

The HUD shows the next milestone and stage progress; offscreen arrows locate chests and bosses. The result screen reports actual damage dealt (excluding overkill), incoming damage, evolution state and the last damage source. Dash works from standing still and continues along its chosen direction after touch release. Simulation uses fixed 1/60-second steps with at most six catch-up steps; frame stalls do not fast-forward danger. Player and hostile projectiles use swept segment collisions, including full boss collision radii. New arrays are capped at 12 sound waves, 40 bursts and 28 damage labels. Existing save keys/unlocks and API contracts are retained.

Validation: `node --test tests/*.test.mjs` covers all 8 evolutions, rerolls, aim locking, charge timing, boss patterns, swept hit detection, viewport spawning, damage accounting, Canvas argument validity, stationary dash, long evolved-build runs and mocked 30/60/120-Hz UI transitions, in addition to the earlier game tests. `node tests/balance.mjs` uses six seeded Bito runs for each difficulty; its shared `simulate` function can compare all characters at the same difficulty. The bot now approaches final bosses at the selected weapon's range instead of treating all characters as ranged shooters. Bot wins are diagnostic, not human difficulty ratings. No claim of real-browser frame rate or iPhone visual correctness is made: managed browser QA is unavailable in this environment.

Cat Girl refinement: primary flame hits grant 0.6 seconds of 30% damage reduction, signaled by a small gold guard ring. Repeated flame hits refresh burn duration without postponing the next burn tick. Short-range cooldowns are only spent when a target is in reach. The full frontend suite now contains 51 passing tests.

## Halotei / three stages (v7)

Halotei campaign now has exactly three separately selectable destinations: Pumpkin Graveyard, Yokai Lantern Market, and Dawn Clock Castle. Each has a dedicated pixel scenery palette/decor, enemy mixture and named boss with a distinct opening pattern. Stages 2/3 have modest health/speed/density increases in addition to the existing five difficulty tiers. Each run is 3 minutes plus its final boss; winning offers a next-stage button, and stage 3 has its own ending text. Builds reset between stage runs. Scenery is decorative and passable.

`haloteiStages` stores three strict clear booleans. Stage unlocks are sequential and separate from difficulty/character progression. Legacy saves receive a bounded `haloteiLegacyStages` access allowance from their old sequential difficulty clears on first migration; legacy access does not mark any new destination cleared. New difficulty clears cannot skip destinations. Cat Girl and Don retain their existing difficulty-1/2 clear requirements. Defeat and ranked survival never mark campaign destinations cleared. Ranked play retains the common original arena and unchanged API/board contract. Bito retains its existing arena and progression. New UI/core tests cover stage selection, locked access, all three renderers, save migration, independent progression and fixed ranked-stage behavior.
