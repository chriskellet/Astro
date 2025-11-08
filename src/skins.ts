import { SkinDefinition, CollectibleType } from './types';

/**
 * Character skin definitions
 * Easily extensible - just add new entries to this array
 */
export const AVAILABLE_SKINS: SkinDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    colors: {
      base: 0xf8f8f8,        // White plastic
      accent: 0x0066ff,      // Blue metal
      secondary: 0x333333,   // Dark metal
      tertiary: 0xdddddd,    // Light metal
      eye: 0x00ffff,         // Cyan
      eyeEmissive: 0x00ffff, // Cyan glow
    },
  },
  {
    id: 'mario',
    name: 'Mario',
    colors: {
      base: 0xff0000,        // Red (Mario's signature color)
      accent: 0x0066ff,      // Blue (overalls)
      secondary: 0x8B4513,   // Brown (shoes/hair)
      tertiary: 0xFFD700,    // Gold (buttons)
      eye: 0x4169E1,         // Royal blue eyes
      eyeEmissive: 0x4169E1, // Blue glow
    },
  },
  {
    id: 'luigi',
    name: 'Luigi',
    colors: {
      base: 0x00FF00,        // Green (Luigi's signature color)
      accent: 0x000080,      // Navy blue (overalls)
      secondary: 0x8B4513,   // Brown (shoes/hair)
      tertiary: 0xFFD700,    // Gold (buttons)
      eye: 0x4169E1,         // Royal blue eyes
      eyeEmissive: 0x4169E1, // Blue glow
    },
  },
  {
    id: 'sonic',
    name: 'Sonic',
    colors: {
      base: 0x0066CC,        // Sonic blue
      accent: 0xFF0000,      // Red (shoes)
      secondary: 0xFFFFFF,   // White (gloves/chest)
      tertiary: 0xFFD700,    // Gold (buckles)
      eye: 0x00FF00,         // Green eyes
      eyeEmissive: 0x00FF00, // Green glow
    },
  },
  {
    id: 'steve',
    name: 'Steve',
    colors: {
      base: 0x5DADE2,        // Light blue (shirt)
      accent: 0x34495E,      // Dark gray (pants)
      secondary: 0xD4A574,   // Tan (skin)
      tertiary: 0x8B4513,    // Brown (hair)
      eye: 0xFFFFFF,         // White eyes
      eyeEmissive: 0x87CEEB, // Light blue glow
    },
  },
  {
    id: 'amy',
    name: 'Amy',
    colors: {
      base: 0xFF69B4,        // Hot pink (Amy's color)
      accent: 0xFF1493,      // Deep pink (dress)
      secondary: 0xFFFFFF,   // White (gloves)
      tertiary: 0xFFD700,    // Gold (accents)
      eye: 0x00FF00,         // Green eyes
      eyeEmissive: 0x00FF00, // Green glow
    },
  },
  {
    id: 'tails',
    name: 'Tails',
    colors: {
      base: 0xFFAA00,        // Orange (Tails' color)
      accent: 0xFF0000,      // Red (shoes)
      secondary: 0xFFFFFF,   // White (gloves/chest)
      tertiary: 0x0066CC,    // Blue (goggles/details)
      eye: 0x0066FF,         // Blue eyes
      eyeEmissive: 0x0066FF, // Blue glow
    },
  },
  {
    id: 'bowser',
    name: 'Bowser',
    colors: {
      base: 0x7CFC00,        // Green (Bowser's body)
      accent: 0xFF4500,      // Orange red (shell/spikes)
      secondary: 0xFFD700,   // Gold (accents/spikes)
      tertiary: 0x8B0000,    // Dark red (details)
      eye: 0xFF0000,         // Red eyes
      eyeEmissive: 0xFF0000, // Red glow
    },
  },
  {
    id: 'toad',
    name: 'Toad',
    colors: {
      base: 0xFFFFFF,        // White (body)
      accent: 0xFF0000,      // Red (mushroom cap)
      secondary: 0x0066FF,   // Blue (vest)
      tertiary: 0xFFD700,    // Gold (buttons)
      eye: 0x000000,         // Black eyes
      eyeEmissive: 0x333333, // Dark glow
    },
  },
  {
    id: 'yoshi',
    name: 'Yoshi',
    colors: {
      base: 0x00CC00,        // Green (Yoshi's body)
      accent: 0xFF0000,      // Red (saddle/shoes)
      secondary: 0xFFFFFF,   // White (belly)
      tertiary: 0xFFAA00,    // Orange (spikes on back)
      eye: 0x000000,         // Black eyes
      eyeEmissive: 0x444444, // Dark glow
    },
  },
];

/**
 * Get a skin by ID, returns classic if not found
 */
export function getSkinById(id: string): SkinDefinition {
  return AVAILABLE_SKINS.find(skin => skin.id === id) || AVAILABLE_SKINS[0];
}

/**
 * Get the default skin
 */
export function getDefaultSkin(): SkinDefinition {
  return AVAILABLE_SKINS[0];
}

/**
 * Get the collectible type for a skin
 * Mario, Luigi collect coins
 * Toad, Yoshi, Bowser collect stars
 * Sonic, Amy, and Tails collect rings
 * Steve collects TNT
 * Others collect orbs
 */
export function getCollectibleTypeForSkin(skinId: string): CollectibleType {
  if (['mario', 'luigi'].includes(skinId)) {
    return 'coin';
  } else if (['toad', 'yoshi', 'bowser'].includes(skinId)) {
    return 'star';
  } else if (['sonic', 'amy', 'tails'].includes(skinId)) {
    return 'ring';
  } else if (skinId === 'steve') {
    return 'tnt';
  } else {
    return 'orb';
  }
}
