// Simple icon generator for PWA
// This creates basic placeholder PNG icons using Canvas API
// For production, you should replace these with proper designed icons

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = './public/icons/icon.svg';
const outputDir = './public/icons';

// Ensure output directory exists
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

console.log('Generating PWA icons...');

// For each size, create a PNG
sizes.forEach(async (size) => {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create a simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw a simple robot icon
    const scale = size / 512;
    ctx.save();
    ctx.translate(size / 2, size * 0.55);
    ctx.scale(scale, scale);

    // Body
    ctx.fillStyle = '#00a8ff';
    ctx.fillRect(-60, -40, 120, 100);

    // Head
    ctx.beginPath();
    ctx.arc(0, -70, 40, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-15, -75, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -75, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-15, -75, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -75, 4, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.lineTo(0, -130);
    ctx.stroke();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(0, -135, 8, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.fillStyle = '#00a8ff';
    ctx.fillRect(-90, -20, 30, 60);
    ctx.fillRect(60, -20, 30, 60);

    // Legs
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(-45, 60, 30, 70);
    ctx.fillRect(15, 60, 30, 70);

    // Chest detail
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-3, -8, 6, 16);
    ctx.fillRect(-8, -3, 16, 6);

    ctx.restore();

    // Save the canvas as PNG
    const buffer = canvas.toBuffer('image/png');
    const outputPath = `${outputDir}/icon-${size}x${size}.png`;
    writeFileSync(outputPath, buffer);
    console.log(`✓ Generated ${size}x${size} icon`);
  } catch (err) {
    console.error(`✗ Failed to generate ${size}x${size} icon:`, err.message);
  }
});

console.log('\nIcon generation complete!');
console.log('Note: For production, consider creating professionally designed icons.');
