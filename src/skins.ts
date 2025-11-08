import { SkinDefinition } from './types';

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
