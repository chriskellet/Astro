import { Game } from './Game';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create and start game
  const game = new Game({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  game.start();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    game.cleanup();
  });
});
