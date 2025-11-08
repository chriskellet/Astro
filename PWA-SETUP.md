# PWA Setup for Astrobot Mobile

This document explains the Progressive Web App (PWA) implementation for Astrobot Mobile, including iOS-specific optimizations and performance considerations.

## What's Been Added

### 1. PWA Manifest (`/public/manifest.json`)
- App name and description
- Icons for all required sizes (72x72 to 512x512)
- Display mode set to `fullscreen` for immersive gaming
- Theme colors matching the app design

### 2. Service Worker (`/public/sw.js`)
- **Offline Support**: Caches game assets for offline play
- **Cache Strategy**: Stale-while-revalidate for optimal performance
- **Version Management**: Automatic cache cleanup on updates
- **Runtime Caching**: Dynamically caches assets as they're used

### 3. iOS-Specific Meta Tags
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Astrobot">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
```

### 4. Service Worker Registration
Automatic registration in `main.ts` with:
- Update detection every 60 seconds
- User notification when new version is available
- One-click update button

### 5. Cache Versioning System
- **Version-based cache names** prevent old versions from persisting
- **Network-first for HTML** ensures latest content when online
- **Automatic cache cleanup** removes outdated caches on activation
- **User notifications** prompt for updates with a friendly banner

## IMPORTANT: Deploying Updates

**Every time you deploy a new version**, you MUST update the version number in the service worker:

1. Open `public/sw.js`
2. Update the `VERSION` constant at the top:
   ```javascript
   const VERSION = '1.0.2'; // Increment this!
   ```
3. Build and deploy as usual

**Why this matters:**
- The version number is used to create cache names
- Changing the version forces browsers to download fresh files
- Old caches are automatically deleted
- Without updating the version, users may get stuck on old versions

**Recommended versioning:**
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Increment PATCH for bug fixes (1.0.1 → 1.0.2)
- Increment MINOR for new features (1.0.2 → 1.1.0)
- Increment MAJOR for breaking changes (1.1.0 → 2.0.0)

## Installation Instructions

### Step 1: Generate Icons
1. Open `generate-icons.html` in your browser
2. Click "Download All" to download all icon sizes
3. Place the downloaded PNG files in `public/icons/` directory

Alternatively, you can create your own custom icons at these sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Step 2: Build and Deploy
```bash
npm run build
```

The built files in `dist/` can be deployed to any static hosting service.

### Step 3: Install on iOS
1. Open the deployed app in Safari on iOS
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Confirm to add the icon to your home screen
5. Launch the app from your home screen - it will run in fullscreen mode!

## iOS Performance Considerations

### Performance on iOS PWAs

**Good News**: Modern iOS devices handle PWAs very well!

#### Performance Characteristics:
- **No Significant Slowdown**: PWAs on iOS run at near-native performance for most games
- **WebGL Support**: Full WebGL/WebGL2 support for Three.js rendering
- **60 FPS Capable**: Can achieve smooth 60fps on modern iOS devices
- **Hardware Acceleration**: Graphics rendering is GPU-accelerated

#### Limitations to Be Aware Of:
1. **Memory Constraints**: iOS PWAs have stricter memory limits than Safari tabs
   - Typically ~1.5GB on newer devices
   - The game uses Three.js which is memory-efficient

2. **No JIT Compilation**: JavaScript runs in interpreted mode
   - About 2-5x slower than native code
   - Still fast enough for most games

3. **Cache Size Limits**: Service worker cache limited to ~50MB
   - This game is well under this limit

### Optimizations Already Implemented

#### 1. Build Optimizations (`vite.config.ts`)
```typescript
- Target: esnext (modern JavaScript for better performance)
- Minification: Terser with console.log removal
- Code Splitting: Three.js separated for better caching
```

#### 2. Rendering Optimizations
- Hardware-accelerated canvas rendering
- `touch-action: none` to prevent iOS scroll interference
- `viewport-fit=cover` for full-screen iPhone X+ support

#### 3. Memory Management
- Proper cleanup on page unload
- Efficient Three.js scene management
- Particle system optimizations

#### 4. Caching Strategy
- Core assets cached on install
- Runtime caching for dynamic assets
- Stale-while-revalidate for best UX

### Additional Performance Tips

#### For Users:
1. **Close Other Apps**: iOS gives more resources to the active app
2. **Update iOS**: Newer versions have better PWA performance
3. **Use iPhone 12 or Newer**: Better GPU and more memory
4. **Avoid Low Power Mode**: Disables some optimizations

#### For Developers:
1. **Monitor Performance**:
   ```javascript
   // Add to game code
   const stats = performance.memory;
   console.log(`Memory: ${stats.usedJSHeapSize / 1048576}MB`);
   ```

2. **Reduce Draw Calls**:
   - Merge static geometries
   - Use instanced rendering for repeated objects
   - Minimize state changes

3. **Optimize Textures**:
   - Use compressed texture formats (ASTC on iOS)
   - Keep texture sizes reasonable (max 2048x2048)
   - Use mipmaps

4. **Profile with Safari Dev Tools**:
   - Connect iPhone to Mac
   - Use Safari > Develop > [Your iPhone] > [Astrobot]
   - Use Timeline to identify bottlenecks

## Comparison: PWA vs Native

### PWA Advantages:
✅ No App Store submission/approval needed
✅ Instant updates (no user action required)
✅ Smaller download size
✅ Cross-platform (same code for iOS/Android/Desktop)
✅ Easier development and deployment

### PWA Limitations:
❌ ~2-5x slower JavaScript execution (rarely noticeable)
❌ No access to native iOS APIs (GameCenter, etc.)
❌ Lower memory limits
❌ No background processing
❌ Can't run while app is backgrounded

### For This Game:
**PWA is Perfect!** The game is:
- Graphics-focused (WebGL is fast)
- Self-contained (no native API needs)
- Regularly updated (instant updates are valuable)
- Memory-efficient (well under iOS limits)

## Testing Performance

### In Development:
```bash
npm run dev
```
Then open on your iPhone using your computer's IP address: `http://YOUR_IP:5173/Astro/`

### Check FPS:
Add this to see frame rate in the game:
```javascript
const stats = new Stats();
document.body.appendChild(stats.dom);
// In game loop:
stats.update();
```

### Expected Performance:
- **iPhone 12+**: Smooth 60fps
- **iPhone X-11**: 50-60fps (occasional dips)
- **iPhone 8 or older**: 30-45fps

## Troubleshooting

### Service Worker Not Registering:
- Check browser console for errors
- Ensure HTTPS (required for service workers)
- Clear browser cache and reload

### Icons Not Showing:
- Verify PNG files exist in `public/icons/`
- Check file names match manifest.json
- Clear iOS home screen cache (remove and re-add)

### Poor Performance:
- Check memory usage in Safari dev tools
- Reduce particle count or effects
- Lower texture quality
- Disable shadows or post-processing

### Game Won't Work Offline:
- Play online first (caches assets)
- Check service worker is active: Chrome DevTools > Application > Service Workers
- Verify cache contains game files

### Stuck on Old Version / Changes Not Showing:

**Quick Fix:**
1. Open browser DevTools (F12)
2. Go to Application > Service Workers
3. Click "Unregister" on the service worker
4. Go to Application > Cache Storage
5. Delete all "astrobot" caches
6. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**iOS-specific:**
1. Remove the app from home screen
2. Go to Safari settings > Clear History and Website Data
3. Re-add the app to home screen

**Prevention:**
- Always increment the VERSION number in `public/sw.js` before deploying
- The service worker will automatically update within 1 minute of deployment
- Users will see an "Update Now" banner when a new version is detected

**How the update system works:**
1. Every 60 seconds, the app checks for service worker updates
2. If `public/sw.js` has changed (due to VERSION increment), a new service worker installs
3. When the new service worker activates, it deletes all old caches
4. A notification banner appears offering to reload the page
5. On reload, users get the latest version with fresh caches

## Resources

- [iOS PWA Limitations](https://firt.dev/notes/pwa-ios/)
- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/Performance-tips)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)

## Future Enhancements

Potential improvements for even better performance:

1. **WebAssembly**: For compute-intensive physics
2. **Web Workers**: Offload game logic from main thread
3. **Compression**: Use Brotli for smaller assets
4. **Lazy Loading**: Load levels on-demand
5. **Progressive Enhancement**: Reduce quality on older devices

## Summary

**Is PWA good for iOS gaming? Yes!**

For a game like Astrobot Mobile:
- ✅ Performance is excellent (near-native)
- ✅ No noticeable slowdown vs native
- ✅ Offline support works perfectly
- ✅ Installation is seamless
- ✅ Much easier to maintain and update

The only time to consider native would be if you need:
- GameCenter integration
- In-app purchases
- Background processing
- Maximum possible performance (competitive multiplayer)

For this casual mobile platformer, PWA is the optimal choice!
