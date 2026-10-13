# Bito survivors

Buildless, original Canvas survivor action game. Production path: https://tsukilab.jp/game/bitosuv/ . Serve this folder over HTTP; ES modules do not support launching from file://.

## Play

Move with WASD/arrows or a floating touch joystick. Attacks auto-target nearby enemies. Space or the DASH button performs a 0.2-second dash with 0.35-second invulnerability; cooldown 6 seconds. TAB or 装備 shows the graphical current-build screen and pauses. ESC pauses.

Collect XP gems, choose a capped upgrade at level-up, collect dropped midboss chests, defeat the final boss. Midbosses spawn at 45, 100 and 150 seconds, the final boss at 180 seconds. Boss attacks telegraph for 0.8 seconds; ground hazards telegraph for 0.9 seconds. Chest rewards grant 1–5 actual random upgrades and the same number of levels, without consuming accumulated XP. Base probabilities: 45%, 27%, 16%, 9%, 3%; workshop luck raises multi-upgrade chances. Fully upgraded builds receive healing instead.

## Progression

Five sequential difficulty tiers. Clear tier 1–5 to unlock Red Cape, Opera, UsaBito, Bard and Swimsuit Bito respectively. Characters have distinct stats/start equipment; unlocks are not a simple linear damage ladder. Coins are earned even on defeat. Power, health and luck workshop upgrades each cap at five. Replay any unlocked tier with any unlocked character.

Data key `bito-survivors-v3` stores only cleared-tier booleans, integer currency, best kills, run count and integer workshop ranks. Saves are local to this origin/browser and do not sync across devices. No paid mechanics or real money.

## Performance and animation

30 fps, device-pixel ratio 1, pre-rendered small sprite canvases, offscreen culling, spatial-grid bullet collision. Limits: 72–96 regular enemies plus bosses, 100 player bullets, 65 hostile bullets, 260 pickups, 90 particles. Player source rectangles are measured from alpha silhouettes, aligned to a shared foot baseline and head center, and scaled consistently per character. Walking is distance-driven with directional front/side/back frames; only left-facing side sprites are mirrored. Includes bat/ghost float, hit flashes, dash afterimage, rotating cards, chest reward reveal and telegraphed boss effects. Reduced-motion preference disables menu transitions.

## Security

No external JS/CSS dependencies, analytics, input forms, accounts, network APIs, eval, secrets or service workers. CSP restricts scripts and images to self; network connections, objects, frames and forms are disabled. Inline styling is allowed for controlled HUD dimensions and reveal delays; inline scripts are forbidden. Save data is normalized to finite bounded integers and strict booleans before use. Menu HTML interpolates only hardcoded strings and normalized game values, never URL/remote input. No auth or leaderboard depends on client-side saves; local save tampering is not prevented. HTTPS and host-wide response headers are hosting concerns; GitHub Pages does not support arbitrary response-header configuration. The game's meta CSP cannot set frame-ancestors.

## Validation

Run `node --test tests/core.test.mjs tests/ui.test.mjs tests/animation.test.mjs` from this folder. Nineteen tests cover save validation, all five unlocks, currency/purchases, timed bosses, chest outcomes, caps, pause/dash, victory/defeat, long-run resource limits mocked DOM menu transitions, isolated sprite bounds, four-way facing, diagonal hysteresis and dash gait cadence. Run `node tests/balance.mjs` for seeded avoidance-bot simulations. Bot results inform tuning but do not replace human playtests. UI tests mock Canvas/DOM and are not browser screenshots. iOS device crash reproduction and visual browser QA remain unverified in this environment.

## Design references

- MDN, Optimizing canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- OWASP, HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- Josh Ge, How to Make a Roguelike: https://www.gamedeveloper.com/design/how-to-make-a-roguelike

The design uses a short core loop, legible attack tells, capped build choices and replay rewards. Difficulty adjusts health, movement, damage, density, XP efficiency and boss bullet count; it does not rely solely on larger health pools.
