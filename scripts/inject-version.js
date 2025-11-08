#!/usr/bin/env node

/**
 * Injects git commit hash into service worker VERSION constant
 * This ensures each deployment gets a unique cache version automatically
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

try {
  // Get git commit hash (short version)
  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

  // Get current timestamp for additional uniqueness
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Create version string: date-commithash
  const version = `${timestamp}-${gitHash}`;

  console.log(`📦 Injecting version: ${version}`);

  // Read service worker file
  const swPath = './public/sw.js';
  let swContent = readFileSync(swPath, 'utf8');

  // Replace VERSION constant
  // Matches: const VERSION = 'anything';
  const versionRegex = /const VERSION = ['"][^'"]*['"]/;

  if (!versionRegex.test(swContent)) {
    console.error('❌ Error: Could not find VERSION constant in service worker');
    process.exit(1);
  }

  swContent = swContent.replace(
    versionRegex,
    `const VERSION = '${version}'`
  );

  // Write back
  writeFileSync(swPath, swContent, 'utf8');

  console.log(`✅ Service worker version updated to: ${version}`);
  console.log(`   Cache names will be: astrobot-v${version}`);

} catch (error) {
  console.error('❌ Error injecting version:', error.message);

  // Fallback to timestamp-only if git is not available
  if (error.message.includes('git')) {
    console.log('⚠️  Git not available, using timestamp only');
    const timestamp = Date.now();
    const version = `${timestamp}`;

    const swPath = './public/sw.js';
    let swContent = readFileSync(swPath, 'utf8');

    swContent = swContent.replace(
      /const VERSION = ['"][^'"]*['"]/,
      `const VERSION = '${version}'`
    );

    writeFileSync(swPath, swContent, 'utf8');
    console.log(`✅ Fallback version: ${version}`);
  } else {
    process.exit(1);
  }
}
