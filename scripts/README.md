# Build Scripts

This directory contains build automation scripts for the Astrobot Mobile PWA.

## inject-version.js

Automatically injects the git commit hash into the service worker during build.

### Purpose

Ensures each deployment gets a unique cache version without manual intervention. This prevents users from getting stuck on old cached versions.

### Usage

The script runs automatically as a `prebuild` step when you run:

```bash
npm run build
```

You can also run it manually:

```bash
node scripts/inject-version.js
```

### How It Works

1. Reads the current git commit hash using `git rev-parse --short HEAD`
2. Gets the current date in YYYY-MM-DD format
3. Combines them into a version string: `2025-11-08-a1b2c3d`
4. Finds `const VERSION = 'anything';` in `public/sw.js`
5. Replaces it with the new version
6. Service worker is now ready for build

### Version Format

```
YYYY-MM-DD-commithash
```

Example: `2025-11-08-a1b2c3d`

- **Date**: Helps identify when the version was built
- **Commit hash**: Ensures uniqueness and traceability
- **Short hash** (7 chars): Keeps cache names reasonable length

### Source vs Build

- **Source** (`public/sw.js`): Contains placeholder `VERSION = 'dev-local';`
- **Build** (`dist/sw.js`): Contains actual version `VERSION = '2025-11-08-a1b2c3d';`

This keeps the source clean while ensuring builds are properly versioned.

### GitHub Actions Integration

The script runs automatically in the GitHub Actions workflow:

1. Code is checked out
2. Dependencies installed with `npm ci`
3. `npm run build` executed
4. `prebuild` script runs first, injecting version
5. Build proceeds with versioned service worker
6. Result is deployed to GitHub Pages

### Fallback Behavior

If git is not available (rare edge case), the script falls back to using a timestamp:

```javascript
const version = `${Date.now()}`;
```

This ensures the build always succeeds, even without git.

### Cache Invalidation

Each unique version creates unique cache names:

```javascript
const CACHE_NAME = `astrobot-v2025-11-08-a1b2c3d`;
const RUNTIME_CACHE = `astrobot-runtime-v2025-11-08-a1b2c3d`;
```

When the service worker activates, it deletes all caches that don't match the current version names, ensuring old content is never served.

### Benefits

✅ Zero manual intervention required
✅ Every deployment gets a unique version
✅ Traceable to exact git commit
✅ Impossible to forget to update version
✅ Works in CI/CD pipelines
✅ Clean source code (no version churn)
✅ Automatic cache invalidation
