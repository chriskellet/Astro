import { Game } from './Game';
import { AVAILABLE_SKINS, getSkinById } from './skins';

let selectedSkinId: string | null = null;

// Skin emoji mapping for visual representation
const SKIN_EMOJIS: Record<string, string> = {
  classic: '🤖',
  mario: '🔴',
  luigi: '🟢',
  sonic: '🔵',
  steve: '⛏️',
  amy: '💗',
  tails: '🦊',
  bowser: '🐢',
};

const SKIN_DESCRIPTIONS: Record<string, string> = {
  classic: 'The original Astrobot',
  mario: "It's-a me!",
  luigi: 'Green hero',
  sonic: 'Gotta go fast!',
  steve: 'Blocky builder',
  amy: 'Pink powerhouse',
  tails: 'Flying fox',
  bowser: 'King of the Koopas',
};

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  // Populate skin selection
  populateSkinSelection();

  // Load previously selected skin from localStorage
  const savedSkinId = localStorage.getItem('selectedSkin');
  if (savedSkinId && AVAILABLE_SKINS.find(s => s.id === savedSkinId)) {
    selectedSkinId = savedSkinId;
    updateSelectedSkin(savedSkinId);
  } else {
    // Default to classic
    selectedSkinId = 'classic';
    updateSelectedSkin('classic');
  }

  // Handle start game button
  const startButton = document.getElementById('start-game') as HTMLButtonElement;
  startButton.addEventListener('click', () => {
    if (selectedSkinId) {
      startGame(selectedSkinId);
    }
  });
});

function populateSkinSelection() {
  const skinGrid = document.getElementById('skin-grid');
  if (!skinGrid) return;

  AVAILABLE_SKINS.forEach(skin => {
    const card = document.createElement('div');
    card.className = 'skin-card';
    card.dataset.skinId = skin.id;

    // Create color preview using the skin's base color
    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.style.background = `linear-gradient(135deg, #${skin.colors.base.toString(16).padStart(6, '0')} 0%, #${skin.colors.accent.toString(16).padStart(6, '0')} 100%)`;
    preview.textContent = SKIN_EMOJIS[skin.id] || '🤖';

    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = skin.name;

    const description = document.createElement('div');
    description.className = 'skin-description';
    description.textContent = SKIN_DESCRIPTIONS[skin.id] || '';

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(description);

    card.addEventListener('click', () => {
      selectedSkinId = skin.id;
      updateSelectedSkin(skin.id);
      localStorage.setItem('selectedSkin', skin.id);
    });

    skinGrid.appendChild(card);
  });
}

function updateSelectedSkin(skinId: string) {
  const cards = document.querySelectorAll('.skin-card');
  cards.forEach(card => {
    if (card instanceof HTMLElement && card.dataset.skinId === skinId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function startGame(skinId: string) {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const skinSelection = document.getElementById('skin-selection');
  const loading = document.getElementById('loading');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Hide skin selection, show loading
  if (skinSelection) skinSelection.classList.add('hidden');
  if (loading) loading.classList.remove('hidden');

  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Get the selected skin
  const selectedSkin = getSkinById(skinId);

  // Small delay to show loading animation
  setTimeout(() => {
    // Hide loading
    if (loading) loading.classList.add('hidden');

    // Create and start game with selected skin
    const game = new Game({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
    }, selectedSkin);

    game.start();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      game.cleanup();
    });
  }, 500);
}
