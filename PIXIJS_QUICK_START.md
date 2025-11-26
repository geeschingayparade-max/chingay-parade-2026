# PixiJS Parade - Quick Start Guide

## ✅ What's Done

Your parade system has been migrated to **PixiJS** with full multi-layer support!

### Features Implemented:

1. ✅ **6-Layer Rendering System**
   - Sky → Background → Midground → Floats Behind → Foreground → Floats Front
   - Floats automatically transition between layers

2. ✅ **Background Images Integrated**
   - Using your `/public/background/*.png` files
   - Proper layer sequencing

3. ✅ **Automatic Layer Switching**
   - First 50% of path: Floats render behind foreground
   - Last 50% of path: Floats render in front of foreground

4. ✅ **All Existing Features Preserved**
   - Real-time Supabase subscriptions
   - Texture caching for bandwidth optimization
   - Queue system for managing floats
   - Spawn/despawn logic
   - Dummy floats when queue is empty

## 🚀 Running the Parade

```bash
npm run dev
```

Then visit: `http://localhost:3000/parade`

## 🎨 Creating a Custom Path (Visual Tool)

I've created a **Path Editor** tool to help you design your parade path visually:

### Step 1: Enable Path Editor

Edit `/app/parade/page.tsx`:

```typescript
"use client";

import ParadeScenePixi from "../components/ParadeScenePixi";
import PathEditor from "../components/PathEditor"; // Add this

export default function ParadePage() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <PathEditor /> {/* Temporarily add this */}
      {/* <ParadeScenePixi /> Comment this out while using PathEditor */}
    </main>
  );
}
```

### Step 2: Draw Your Path

1. Click **"Start Drawing"**
2. Click on the canvas to create waypoints for your path
3. The path will show in red, with:
   - 🟢 Green dot = Start point
   - 🔴 Red dots = Waypoint
   - 🔵 Blue dot = End point

### Step 3: Generate Code

1. Click **"Generate Code"**
2. Click **"Copy to Clipboard"**
3. Open `/app/components/ParadeScenePixi.tsx`
4. Replace the `calculatePathPosition` function with your generated code

### Step 4: Disable Path Editor

Remove or comment out the `<PathEditor />` component and re-enable `<ParadeScenePixi />`.

## 🎯 Quick Configuration

### Change When Floats Switch Layers

In `/app/components/ParadeScenePixi.tsx`, find `pathConfig`:

```typescript
const pathConfig = {
  // ... other settings
  layerSwitchPoint: 0.5,  // Change this! (0 = always behind, 1 = always front)
};
```

**Examples:**
- `0.3` = Switch to front at 30% progress (earlier)
- `0.7` = Switch to front at 70% progress (later)
- `0.0` = Always in front of foreground
- `1.0` = Always behind foreground

### Change Float Speed

In the `updateFloats` function:

```typescript
floatSprite.progress += 0.001 * deltaTime; // Lower = slower, higher = faster
```

**Examples:**
- `0.0005` = Half speed (slower parade)
- `0.002` = Double speed (faster parade)

### Change Float Size

In the `spawnFloat` function:

```typescript
const targetWidth = 200; // Change this number (pixels)
```

**Examples:**
- `150` = Smaller floats
- `300` = Larger floats
- `400` = Very large floats

## 🔧 Advanced: Multiple Layer Switches

Want floats to weave in and out of the foreground multiple times?

Replace the layer switching logic in `updateFloats`:

```typescript
// Three-phase: behind → front → behind
if (floatSprite.progress < 0.33) {
  // First third: behind
  if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
    floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
  }
} else if (floatSprite.progress < 0.66) {
  // Middle third: in front
  if (floatSprite.sprite.parent !== floatsFrontLayerRef.current) {
    floatsFrontLayerRef.current?.addChild(floatSprite.sprite);
  }
} else {
  // Final third: behind again
  if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
    floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
  }
}
```

## 📊 Monitoring Performance

The parade displays stats in the top-left:
- **Active Floats**: Currently visible on screen
- **Pending Queue**: Waiting to spawn

Watch these numbers:
- If queue grows large → Floats spawning too slowly
- If active floats = 0 → Check Supabase connection

## 🐛 Troubleshooting

### Issue: Black screen / No parade visible

**Check:**
1. Browser console for errors (F12)
2. Background images exist in `/public/background/`
3. PixiJS installed: `npm install pixi.js`

### Issue: Floats not appearing

**Check:**
1. Are there submissions in Supabase with `status='active'`?
2. Do they have `image_url` set?
3. Check browser console for texture loading errors

### Issue: Floats appear in wrong layer

**Check:**
1. `pathConfig.layerSwitchPoint` value (should be 0-1)
2. Float progress is calculating correctly

### Issue: Performance is slow

**Try:**
1. Reduce `maxFloatsOnScreen` (default: 50)
2. Optimize background PNG files (reduce file size)
3. Disable animations temporarily to test

## 📁 File Structure

```
/app/components/
  ParadeScenePixi.tsx     ← Main parade component (PixiJS)
  ParadeScene.tsx         ← Old ThreeJS version (backup)
  PathEditor.tsx          ← Visual path design tool

/public/background/
  sky.png                 ← Bottom layer
  background.png          ← Far background
  midground.png           ← Middle layer
  foreground.png          ← Top layer (floats weave around this)
```

## 🎬 Next Steps

1. **Test the parade**: `npm run dev` → visit `/parade`
2. **Design your path**: Use PathEditor tool
3. **Adjust timing**: Tweak `layerSwitchPoint` and speed
4. **Add effects**: See `PIXIJS_PARADE_SYSTEM.md` for particle effects, glow, etc.

## 📚 Full Documentation

For detailed information:
- **Layer System Details**: `PIXIJS_PARADE_SYSTEM.md`
- **Path Customization**: `PIXIJS_PARADE_SYSTEM.md` → "Customizing the Path"
- **Effects & Animations**: `PIXIJS_PARADE_SYSTEM.md` → "Animation Effects"

## 💡 Tips

1. **Start simple**: Test with the default straight path first
2. **Use PathEditor**: Much easier than manually coding waypoints
3. **Layer switching**: Start with `0.5`, adjust based on what looks good
4. **Test with few floats**: Easier to see layer transitions with 2-3 floats
5. **Background transparency**: Make sure foreground.png has transparency where needed

---

**Questions?** Check the full documentation in `PIXIJS_PARADE_SYSTEM.md`

**Ready to go!** 🎉 Your parade system is now powered by PixiJS with full multi-layer support.

