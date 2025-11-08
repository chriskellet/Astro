# Astrobot Mobile

A mobile-optimized 3D platformer inspired by Astrobot, built for iPad and iPhone devices. Play directly in your browser with intuitive touch controls!

## Features

- **PWA Support**: Install on iOS home screen and play offline! 📱
- **3D Graphics**: Built with Three.js for smooth 3D gameplay
- **Touch Controls**: Virtual gamepad with D-pad and jump button
- **Physics**: Realistic jumping, gravity, and collision detection
- **Double Jump**: Master the double jump mechanic to reach higher platforms
- **Collectibles**: Gather coins and stars to increase your score
- **Offline Mode**: Play anytime, anywhere with service worker caching
- **Responsive**: Optimized for both iPad and iPhone screens
- **GitHub Pages**: Deployed and playable online

## Controls

- **Left D-pad**: Move Astrobot in 8 directions
- **Right A Button**: Jump (tap twice for double jump)

## Installing on iOS

This game is a Progressive Web App (PWA) and can be installed on your iOS device:

1. Open the game in Safari on your iPhone or iPad
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. Launch from your home screen for a fullscreen, app-like experience!

**Benefits of Installing:**
- ✅ Fullscreen gameplay (no browser UI)
- ✅ Play offline after first visit
- ✅ Faster loading times
- ✅ App icon on your home screen

See [PWA-SETUP.md](./PWA-SETUP.md) for detailed PWA documentation and performance information.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Three.js**: 3D rendering engine
- **Vitest**: Unit testing framework

## Game Architecture

- `Game.ts`: Main game loop and orchestration
- `Player.ts`: Astrobot character with movement and animation
- `Level.ts`: Platform and collectible management
- `Physics.ts`: Collision detection and physics simulation
- `VirtualGamepad.ts`: Touch-based controller interface

## Future Expansion

The game is designed with future expansion in mind:

- Multiple levels with increasing difficulty
- Power-ups and special abilities
- Enemy characters
- Boss battles
- Level editor
- Leaderboards
- Sound effects and music
- Additional playable characters

## License

MIT
