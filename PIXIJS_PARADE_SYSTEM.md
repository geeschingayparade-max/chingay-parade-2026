# PixiJS Parade System Documentation

## Overview

The parade display has been migrated from ThreeJS to **PixiJS** for optimal 2D sprite rendering performance. PixiJS is specifically designed for handling many 2D images with smooth animations and effects.

## Why PixiJS?

- **Performance**: Built for 2D sprite rendering with WebGL (canvas fallback)
- **Efficiency**: Can handle 50+ floats on screen comfortably
- **Flexibility**: No rigid game framework structure - we keep our custom spawn/queue logic
- **Simplicity**: Better suited than ThreeJS for 2D stage shows
- **Better than Konva**: Konva is great for editor tools, but PixiJS excels at "stage show" animations

## Layer System Architecture

The parade uses a **6-layer rendering system** with proper depth management:

### Layer Order (Bottom to Top)

1. **Sky Layer** (`skyLayerRef`)
   - Static background
   - Full-screen image
   - No parallax or animation

2. **Background Layer** (`backgroundLayerRef`)
   - Far distant scenery
   - Optional: Can add slow parallax effect
   - Full-screen image

3. **Midground Layer** (`midgroundLayerRef`)
   - Middle-distance scenery
   - Optional: Can add medium parallax effect
   - Full-screen image

4. **Floats Behind Layer** (`floatsBehindLayerRef`)
   - **Floats render here in the first half of their journey**
   - Positioned between midground and foreground
   - Creates depth effect - floats appear "behind" foreground elements

5. **Foreground Layer** (`foregroundLayerRef`)
   - Near elements (trees, buildings, crowds, etc.)
   - Optional: Can add fast parallax effect
   - Full-screen image

6. **Floats Front Layer** (`floatsFrontLayerRef`)
   - **Floats render here in the second half of their journey**
   - In front of all other layers
   - Floats appear to "emerge" from behind the foreground

## Float Movement & Layer Transitions

### Path Configuration

```typescript
const pathConfig = {
  startX: -400,           // Start off-screen right
  endX: 1600,             // End off-screen left
  centerY: 400,           // Middle of screen vertically
  amplitude: 50,          // Vertical wave motion
  layerSwitchPoint: 0.5,  // When to switch from behind to front (0-1)
};
```

### Movement Phases

**Phase 1: Progress 0% → 50%**
- Float is in `floatsBehindLayer`
- Moves behind the foreground
- Creates depth illusion

**Phase 2: Progress 50% → 100%**
- Float automatically moves to `floatsFrontLayer`
- Now renders in front of foreground
- Appears to "emerge" or "pass by" the viewer

### Smooth Layer Transition

The transition happens automatically based on `progress`:

```typescript
if (floatSprite.progress < pathConfig.layerSwitchPoint) {
  // Behind foreground
  floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
} else {
  // In front of foreground
  floatsFrontLayerRef.current?.addChild(floatSprite.sprite);
}
```

## Customizing the Path

### Simple Adjustments

Edit `pathConfig` in `ParadeScenePixi.tsx`:

```typescript
// Make floats start from left instead of right
startX: 1600,
endX: -400,

// Change vertical position
centerY: 300, // Higher on screen

// More dramatic wave motion
amplitude: 100,

// Change when floats move to front
layerSwitchPoint: 0.7, // Now switches at 70% progress
```

### Advanced Path Customization

Modify the `calculatePathPosition` function for custom paths:

```typescript
const calculatePathPosition = (progress: number): { x: number; y: number } => {
  // Example: Circular path
  const angle = progress * Math.PI * 2;
  const radius = 400;
  return {
    x: window.innerWidth / 2 + Math.cos(angle) * radius,
    y: window.innerHeight / 2 + Math.sin(angle) * radius,
  };
};
```

### Multi-Segment Paths

For different paths in different sections:

```typescript
const calculatePathPosition = (progress: number): { x: number; y: number } => {
  if (progress < 0.3) {
    // First 30%: Straight line from right
    return {
      x: pathConfig.startX + progress * 1000,
      y: pathConfig.centerY,
    };
  } else if (progress < 0.7) {
    // Middle 40%: Curved path
    const curveProgress = (progress - 0.3) / 0.4;
    return {
      x: 600 + curveProgress * 400,
      y: pathConfig.centerY + Math.sin(curveProgress * Math.PI) * 100,
    };
  } else {
    // Last 30%: Straight exit to left
    const exitProgress = (progress - 0.7) / 0.3;
    return {
      x: 1000 - exitProgress * 1400,
      y: pathConfig.centerY,
    };
  }
};
```

## Adding Multiple Layer Switches

To make floats switch layers multiple times:

```typescript
// In updateFloats function
if (floatSprite.progress < 0.33) {
  // First third: behind foreground
  if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
    floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
  }
} else if (floatSprite.progress < 0.66) {
  // Middle third: in front of foreground
  if (floatSprite.sprite.parent !== floatsFrontLayerRef.current) {
    floatsFrontLayerRef.current?.addChild(floatSprite.sprite);
  }
} else {
  // Final third: back behind foreground
  if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
    floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
  }
}
```

## Adding Parallax Effects

To make background layers move with floats for depth:

```typescript
// In updateFloats function, add:
const cameraProgress = calculateAverageCameraPosition(); // Average of all float positions

// Move layers based on camera
backgroundLayerRef.current.x = -cameraProgress * 0.1; // Slow
midgroundLayerRef.current.x = -cameraProgress * 0.3;   // Medium
foregroundLayerRef.current.x = -cameraProgress * 0.5;  // Fast
```

## Performance Optimization

### Texture Caching
The system automatically caches all loaded textures:
- First load: Downloads and caches texture
- Subsequent uses: Returns cached texture instantly
- Reduces bandwidth and improves performance

### Sprite Pooling (Optional Enhancement)

For even better performance with many floats:

```typescript
// Create a pool of reusable sprites
const spritePool: PIXI.Sprite[] = [];

function getSprite(texture: PIXI.Texture): PIXI.Sprite {
  return spritePool.pop() || new PIXI.Sprite(texture);
}

function returnSprite(sprite: PIXI.Sprite) {
  sprite.visible = false;
  spritePool.push(sprite);
}
```

## Animation Effects

### Current Effects

1. **Bounce**: Vertical sine wave motion
   ```typescript
   const bounceOffset = Math.sin(Date.now() * 0.002 + floatSprite.progress * 10) * 20;
   ```

2. **Sway**: Subtle rotation
   ```typescript
   floatSprite.sprite.rotation = Math.sin(Date.now() * 0.001 + floatSprite.progress * 5) * 0.1;
   ```

### Adding More Effects

**Glow Effect:**
```typescript
import { GlowFilter } from 'pixi-filters';

const glowFilter = new GlowFilter({
  distance: 15,
  outerStrength: 2,
});
sprite.filters = [glowFilter];
```

**Scale Pulsing:**
```typescript
const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
sprite.scale.set(scale);
```

**Fade In/Out:**
```typescript
if (progress < 0.1) {
  sprite.alpha = progress / 0.1; // Fade in first 10%
} else if (progress > 0.9) {
  sprite.alpha = (1 - progress) / 0.1; // Fade out last 10%
}
```

## Background Layer Requirements

Place your background images in `/public/background/`:
- `sky.png` - Bottom layer (static sky)
- `background.png` - Far background
- `midground.png` - Middle elements
- `foreground.png` - Near elements (floats pass behind/in front of this)

**Recommended specs:**
- Resolution: 1920×1080 or higher
- Format: PNG with transparency (where needed)
- File size: Optimize for web (aim for <500KB each)

## Testing Layer System

### Visual Debug Helper

Add this to see which layer floats are in:

```typescript
// Add to FloatSprite interface
interface FloatSprite {
  // ... existing fields
  debugText?: PIXI.Text;
}

// In spawnFloat, add debug label:
const text = new PIXI.Text(
  floatData.templateName,
  { fill: 'white', fontSize: 16 }
);
text.position.set(0, -100);
sprite.addChild(text);
floatSprite.debugText = text;

// In updateFloats, update debug info:
if (floatSprite.debugText) {
  const layer = floatSprite.progress < 0.5 ? 'BEHIND' : 'FRONT';
  floatSprite.debugText.text = `${floatSprite.data.templateName}\n${layer}\n${(floatSprite.progress * 100).toFixed(0)}%`;
}
```

## Migration from ThreeJS

The old ThreeJS implementation has been replaced but not deleted. To use it:

1. **Revert to ThreeJS**: Import `ParadeScene` instead of `ParadeScenePixi` in `/app/parade/page.tsx`
2. **Compare**: Both components maintain the same interface and features

Key differences:
- ThreeJS: 3D renderer, heavier, more complex lighting/shadows
- PixiJS: 2D renderer, lighter, faster for sprite-based content

## Troubleshooting

**Problem: Floats not appearing**
- Check browser console for texture loading errors
- Verify image URLs are correct
- Ensure images are in correct format (PNG, JPG, SVG)

**Problem: Floats in wrong layer**
- Check `pathConfig.layerSwitchPoint` value (0-1)
- Add debug labels to visualize layer assignments

**Problem: Performance issues**
- Reduce `maxFloatsOnScreen` (default: 50)
- Optimize background image file sizes
- Check browser's FPS counter (F12 → Performance)

**Problem: Background layers not aligned**
- Ensure all background images are same resolution
- Check that resize handler updates all layers

## Next Steps & Enhancements

1. **Curved paths**: Implement bezier curves for more natural movement
2. **Multiple paths**: Different templates follow different routes
3. **Particle effects**: Add confetti, sparkles using PIXI.ParticleContainer
4. **Interactive elements**: Click floats for details
5. **Camera zoom**: Zoom in on specific floats
6. **Weather effects**: Rain, snow, fog overlays

---

**File Location**: `/app/components/ParadeScenePixi.tsx`
**Last Updated**: 2025-11-25

