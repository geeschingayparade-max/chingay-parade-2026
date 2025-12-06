# Parade Decorations Guide

## Adding Images and Videos to Your Parade

You can now easily add static images and looping videos to your parade at specific positions and layers!

## How to Add Decorations
n
### 1. Prepare Your Files

Place your images/videos in the public folder:
```
/public/
  └── decorations/
      ├── banner.png
      ├── fireworks.mp4
      ├── lights.gif
      └── mascot.png
```

### 2. Configure in ParadeScenePixi.tsx

Find the `decorativeElements` array (around line 60-95) and add your elements:

```typescript
const decorativeElements: DecorativeElement[] = [
  {
    src: "/decorations/banner.png",
    type: "image",
    x: 1000,      // X position in 3840x2180 space
    y: 500,       // Y position in 3840x2180 space
    width: 800,   // Width in 3840x2180 space
    height: 400,  // Height in 3840x2180 space
    layer: "background",
  },
  
  {
    src: "/decorations/fireworks.mp4",
    type: "video",
    x: 2000,
    y: 300,
    width: 600,
    height: 600,
    layer: "foreground",
    loop: true,  // Video will loop (default: true)
  },
];
```

## Coordinate System

All positions and sizes use the **3840 × 2180** virtual coordinate system:

- **Top-left corner:** (0, 0)
- **Top-right corner:** (3840, 0)
- **Bottom-left corner:** (0, 2180)
- **Bottom-right corner:** (3840, 2180)
- **Center:** (1920, 1090)

The system automatically scales everything to fit any screen!

## Layer Order (Bottom to Top)

Choose the right layer for your decorations:

### 1. `"sky"` - Background Sky
- Use for: Sky decorations, clouds, sun/moon
- Behind everything

### 2. `"background"` - Far Background
- Use for: Distant buildings, mountains, far decorations
- Behind floats and midground

### 3. `"midground"` - Middle Ground
- Use for: Mid-distance objects
- Behind floats in first half of their path

### 4. `"floatsBehind"` - Behind Foreground
- Use for: Objects that should be behind floats in second half
- Between midground and foreground
- **Floats are on this layer during first half (0-36% progress)**

### 5. `"foreground"` - Near Foreground
- Use for: Trees, buildings, foreground elements
- In front of floats in first half

### 6. `"floatsFront"` - Front Layer
- Use for: Elements that should always be in front
- Above everything
- **Floats are on this layer during second half (36-100% progress)**

## Examples

### Example 1: Banner Behind Floats
```typescript
{
  src: "/decorations/welcome-banner.png",
  type: "image",
  x: 1920,      // Centered horizontally
  y: 200,       // Near top
  width: 1000,
  height: 300,
  layer: "background",  // Always behind floats
}
```

### Example 2: Video Screen in Foreground
```typescript
{
  src: "/decorations/led-screen.mp4",
  type: "video",
  x: 500,
  y: 800,
  width: 800,
  height: 600,
  layer: "floatsFront",  // Always in front
  loop: true,
}
```

### Example 3: Tree that Floats Pass Behind
```typescript
{
  src: "/decorations/tree.png",
  type: "image",
  x: 3000,
  y: 800,
  width: 400,
  height: 800,
  layer: "foreground",  // Floats in first half will be behind this
}
```

### Example 4: Multiple Decorations
```typescript
const decorativeElements: DecorativeElement[] = [
  // Left side banner
  {
    src: "/decorations/left-banner.png",
    type: "image",
    x: 100,
    y: 500,
    width: 600,
    height: 1000,
    layer: "background",
  },
  
  // Right side banner
  {
    src: "/decorations/right-banner.png",
    type: "image",
    x: 3200,
    y: 500,
    width: 600,
    height: 1000,
    layer: "background",
  },
  
  // Animated fireworks video
  {
    src: "/decorations/fireworks.mp4",
    type: "video",
    x: 1700,
    y: 100,
    width: 500,
    height: 500,
    layer: "sky",
    loop: true,
  },
  
  // Stage in center
  {
    src: "/decorations/stage.png",
    type: "image",
    x: 1600,
    y: 1500,
    width: 800,
    height: 600,
    layer: "floatsBehind",
  },
];
```

## Tips

### Finding the Right Position

1. **Use the PathEditor** to visualize your 3840×2180 space
2. **Enable it temporarily** in `/app/parade/page.tsx`:
   ```tsx
   <ParadeScenePixi />
   <PathEditor />  // Add this line
   ```
3. Click on the canvas to see coordinates
4. Note the coordinates where you want to place decorations

### Video Best Practices

- **Format:** MP4 (H.264) for best compatibility
- **Size:** Keep file size reasonable (< 10MB recommended)
- **Length:** Short loops (2-5 seconds) work best
- **Audio:** Videos are auto-muted (audio not needed)
- **Resolution:** Match aspect ratio to your width/height settings

### Image Best Practices

- **Format:** PNG with transparency for best results
- **Resolution:** 2-3x your width/height for sharp display
  - Example: For 800×400 display, use 1600×800 or 2400×1200 image
- **Optimization:** Compress images to reduce load time

### Layer Strategy

Think about depth:
- **Background layers** = Far away (smaller, less detail)
- **Midground layers** = Middle distance
- **Foreground layers** = Close up (larger, more detail)

### Performance

- Limit to 10-15 decorations for best performance
- Videos are more demanding than images
- Test on target devices (iPads, displays)

## Common Layouts

### Archway Entrance (Floats pass under)
```typescript
// Left pillar
{ src: "/decorations/pillar-left.png", type: "image", x: 500, y: 800, width: 300, height: 1000, layer: "foreground" },
// Right pillar  
{ src: "/decorations/pillar-right.png", type: "image", x: 3000, y: 800, width: 300, height: 1000, layer: "foreground" },
// Top arch
{ src: "/decorations/arch.png", type: "image", x: 800, y: 600, width: 2200, height: 400, layer: "floatsFront" },
```

### Side Decorations (Borders)
```typescript
// Left border
{ src: "/decorations/border.png", type: "image", x: 0, y: 0, width: 400, height: 2180, layer: "floatsFront" },
// Right border
{ src: "/decorations/border.png", type: "image", x: 3440, y: 0, width: 400, height: 2180, layer: "floatsFront" },
```

### Centerpiece (Behind floats)
```typescript
{ src: "/decorations/fountain.mp4", type: "video", x: 1620, y: 900, width: 600, height: 600, layer: "background", loop: true },
```

## Troubleshooting

### Decoration not showing
- Check file path is correct (starts with `/`)
- Verify file exists in `/public/` folder
- Check browser console for errors

### Decoration in wrong position
- Remember coordinates are in 3840×2180 space
- Use PathEditor to find correct coordinates
- Check x, y, width, height values

### Decoration wrong size
- Verify width and height in virtual space
- Images scale proportionally

### Video not playing
- Ensure MP4 format (H.264 codec)
- Videos must be muted for autoplay
- Check browser console for errors

### Decoration on wrong layer
- Review layer order in this guide
- Consider float path and when they switch layers (36% progress)
- Test with different layer settings

## Next Steps

1. Create your decoration assets (images/videos)
2. Place them in `/public/decorations/`
3. Add them to the `decorativeElements` array
4. Test and adjust positions/sizes
5. Enjoy your enhanced parade! 🎉

