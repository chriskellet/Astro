# Deployment Checklist for Astrobot Mobile

Use this checklist every time you deploy a new version to ensure users get the latest updates.

## Pre-Deployment

- [ ] All changes tested locally (`npm run dev`)
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)

## CRITICAL: Update Service Worker Version

**⚠️ REQUIRED STEP - DO NOT SKIP ⚠️**

- [ ] Open `public/sw.js`
- [ ] Increment the `VERSION` constant:
  ```javascript
  // Before: const VERSION = '1.0.1';
  // After:  const VERSION = '1.0.2';  // ← Increment this!
  ```
- [ ] Choose version increment based on changes:
  - **Bug fixes only**: Increment PATCH (1.0.1 → 1.0.2)
  - **New features**: Increment MINOR (1.0.2 → 1.1.0)
  - **Breaking changes**: Increment MAJOR (1.1.0 → 2.0.0)

**Why this matters:**
- Without updating the version, users will remain on the old cached version
- The version number is used to create cache names
- Old caches are only deleted when the version changes

## Build and Deploy

- [ ] Run `npm run build`
- [ ] Verify `dist/` folder was created
- [ ] Check that `dist/sw.js` contains the new version number
- [ ] Deploy `dist/` folder to hosting service

## Post-Deployment Verification

- [ ] Visit deployed URL in browser
- [ ] Check browser console for "ServiceWorker registered" message
- [ ] Verify service worker version in DevTools:
  - Open DevTools (F12)
  - Go to Application > Service Workers
  - Check the version matches your update
- [ ] Test on actual iOS device:
  - Open in Safari
  - Check that changes are visible
  - If installed as PWA, check for update notification

## Update Notification

After deployment, existing users will:
1. See an update banner within 60 seconds of opening the app
2. Click "Update Now" to reload and get the latest version
3. Automatically get fresh caches with the new content

## Troubleshooting

### Users Report Seeing Old Version

1. **Check if version was updated**:
   - Look at deployed `sw.js` file
   - Verify VERSION constant was incremented

2. **Manual cache clear** (as last resort):
   - Ask user to clear browser cache
   - Or remove and re-add PWA on iOS

### Changes Not Visible After Deploy

1. **Hard refresh** in browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check DevTools** > Application > Service Workers
3. **Unregister** old service worker if needed
4. **Clear caches** in Application > Cache Storage
5. **Verify** VERSION in deployed sw.js

## Quick Deploy Script

For convenience, you can use this command sequence:

```bash
# Update version first (manually edit public/sw.js)
# Then run:
npm test && npm run build && echo "✓ Ready to deploy dist/ folder"
```

## Notes

- The service worker checks for updates every 60 seconds
- Updates only install when all tabs are closed or user clicks "Update Now"
- Network-first strategy for HTML ensures fresh content when online
- Assets use stale-while-revalidate for optimal performance
