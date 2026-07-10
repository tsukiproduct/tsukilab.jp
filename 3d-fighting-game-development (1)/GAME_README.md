# 3D Fighting Arena

A 3D fighting game built with React, Three.js, and Tailwind CSS.

## Game Overview

Two fighters face off in a 3D arena in an intense battle. Control your fighter and defeat your opponent by landing punches and kicks!

## Controls

### Fighter 1 (Red)
- **W/A/S/D** - Move around the arena
- **Space** - Punch (10 damage, 15 frame cooldown)
- **Shift** - Kick (15 damage, 20 frame cooldown)

### Fighter 2 (Cyan)
- **↑/←/↓/→** (Arrow Keys) - Move around the arena
- **Enter** - Punch (10 damage, 15 frame cooldown)
- **Ctrl** - Kick (15 damage, 20 frame cooldown)

## Game Mechanics

1. **Health System**: Each fighter starts with 100 HP
2. **Combat**: Get close to your opponent to land attacks
3. **Damage**: Kicks deal more damage (15) than punches (10), but have longer cooldowns
4. **Victory**: Reduce your opponent's health to 0 to win the match

## How to Play

1. Click "START GAME" from the main menu
2. Use your designated controls to move and attack
3. Position yourself strategically to land hits
4. Avoid your opponent's attacks while landing your own
5. Reduce their health to 0 to claim victory

## Tips

- **Get close**: You need to be within attack range to deal damage
- **Watch cooldowns**: Wait for your attack cooldown to finish before attacking again
- **Positioning**: Keep distance when your attack is on cooldown
- **Mix attacks**: Use both punches and kicks for tactical variety
- **Movement**: Use arena walls strategically to corner your opponent

## Technologies Used

- **React 19** - UI framework
- **Three.js** - 3D graphics
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety

## Build and Run

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

Enjoy your 3D fighting experience! 🥊
