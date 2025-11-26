# PixiJS Layer System - Visual Guide

## 📊 Layer Stack Visualization

Here's how your parade layers are organized from the viewer's perspective:

```
┌─────────────────────────────────────────────────┐
│  VIEWER'S PERSPECTIVE                           │
│  (Looking at the screen)                        │
└─────────────────────────────────────────────────┘

        🎈 CLOSEST TO VIEWER 🎈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 6: 🎪 FLOATS FRONT LAYER
         ↑ Floats render here in SECOND HALF (50-100%)
         ↑ In front of everything
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 5: 🌳 FOREGROUND
         ↑ Trees, buildings, close objects
         ↑ This is the "transition layer"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 4: 🎪 FLOATS BEHIND LAYER
         ↑ Floats render here in FIRST HALF (0-50%)
         ↑ Creates depth effect
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 3: 🏘️ MIDGROUND
         ↑ Medium-distance scenery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 2: 🏔️ BACKGROUND
         ↑ Far-distance scenery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 1: ☁️ SKY
         ↑ Static background (bottom)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🏔️ FARTHEST FROM VIEWER 🏔️
```

---

## 🎪 Float Movement Animation

### Journey of a Float:

```
START (0%)                                    END (100%)
════════════════════════════════════════════════════════

Right Side                                    Left Side
of Screen                                     of Screen
    ↓                                              ↓
    
    🎪 ──────────────➤ | ──────────────➤ 🎪
    
    Float spawns      |     Float exits
    off-screen        |     off-screen
                      |
                      ↓
                TRANSITION POINT
                (layerSwitchPoint)
                Default: 50%


Phase 1: Progress 0% → 50%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         🌳 FOREGROUND
         ↑ Float appears BEHIND this
    🎪   ↑ Float is in "FLOATS BEHIND LAYER"
         ↑ 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visual effect: Float looks "far away"


Phase 2: Progress 50% → 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🎪   ↑ Float is now IN FRONT
         ↑ Float is in "FLOATS FRONT LAYER"
         ↑
         🌳 FOREGROUND (behind float now)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visual effect: Float looks "close to viewer"
```

---

## 🎯 Configuring the Transition Point

### Default Configuration (50% transition):

```typescript
layerSwitchPoint: 0.5
```

```
Path: |━━━━━━━━━━|━━━━━━━━━━|
      0%         50%        100%
      
      [BEHIND]   [FRONT]
      
Float transitions at halfway point
```

### Early Transition (30%):

```typescript
layerSwitchPoint: 0.3
```

```
Path: |━━━━|━━━━━━━━━━━━━━━━|
      0%  30%               100%
      
      [BEHIND] [FRONT]
      
Float moves to front earlier
Good for: Float "emerging" effect
```

### Late Transition (70%):

```typescript
layerSwitchPoint: 0.7
```

```
Path: |━━━━━━━━━━━━━━|━━━━━━|
      0%              70%   100%
      
      [BEHIND]        [FRONT]
      
Float stays behind longer
Good for: Float "passing by" effect
```

---

## 🛤️ Path Examples

### Example 1: Straight Path (Default)

```
Screen View:
┌─────────────────────────────────────────┐
│                                         │
│  🎪 ──────────────────────────➤ 🎪     │
│  (Start)                    (End)       │
│                                         │
└─────────────────────────────────────────┘

Path moves from right to left horizontally
```

### Example 2: Wave Path

```
Screen View:
┌─────────────────────────────────────────┐
│                    🎪                   │
│        🎪        /   \        🎪        │
│          \      /     \      /          │
│           \    /       \    /           │
│            🎪           🎪              │
└─────────────────────────────────────────┘

Sine wave motion (vertical oscillation)
```

### Example 3: Circular Path

```
Screen View:
┌─────────────────────────────────────────┐
│                                         │
│              🎪        🎪               │
│           🎪              🎪            │
│         🎪        ⭕       🎪          │
│           🎪              🎪            │
│              🎪        🎪               │
│                                         │
└─────────────────────────────────────────┘

Float circles around center point
```

---

## 🎨 Multiple Layer Transitions

### Two Transitions (Behind → Front → Behind):

```
Path: |━━━━━━|━━━━━━|━━━━━━|
      0%    33%    66%   100%
      
      [BEHIND][FRONT][BEHIND]

Code:
if (progress < 0.33) {
  // Behind foreground
} else if (progress < 0.66) {
  // In front of foreground
} else {
  // Behind foreground again
}
```

Visual effect:
```
🎪 ──➤ passes behind tree 🌳
      ╰─➤ emerges in front
          ╰─➤ goes behind again
```

### Three Transitions (Behind → Front → Behind → Front):

```
Path: |━━━━|━━━━|━━━━|━━━━|
      0%  25% 50% 75% 100%
      
      [B] [F] [B] [F]

Creates weaving effect through scenery
```

---

## 🎭 Real-World Parade Scenario

Imagine you have a foreground with **trees and buildings**:

```
Your foreground.png:
┌─────────────────────────────────────────┐
│     🌳         🏢      🌳               │
│                                         │
│  (transparent)    (transparent)         │
│                                         │
└─────────────────────────────────────────┘

With layerSwitchPoint = 0.5:

Animation sequence:
────────────────────────────────────────────

Frame 1 (Progress 0-40%):
┌─────────────────────────────────────────┐
│     🌳         🏢      🌳               │
│  🎪                                     │
│ (float appears behind buildings)        │
└─────────────────────────────────────────┘

Frame 2 (Progress 50-60%):
┌─────────────────────────────────────────┐
│     🌳   🎪    🏢      🌳               │
│ (float emerges in front!)               │
│                                         │
└─────────────────────────────────────────┘

Frame 3 (Progress 70-100%):
┌─────────────────────────────────────────┐
│     🌳         🏢      🌳          🎪   │
│                     (float passes by)   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Debug Visualization

Add this code to see layers in real-time:

```typescript
// Add colored overlays to see each layer
skyLayerRef.current.alpha = 0.2;           // Dim layers
backgroundLayerRef.current.alpha = 0.3;
midgroundLayerRef.current.alpha = 0.4;
foregroundLayerRef.current.alpha = 0.5;

// Add text labels
const createLabel = (text: string, y: number) => {
  const label = new PIXI.Text(text, {
    fill: 'yellow',
    fontSize: 20,
    fontFamily: 'Arial',
    stroke: 'black',
    strokeThickness: 4,
  });
  label.position.set(10, y);
  return label;
};

floatsFrontLayerRef.current.addChild(createLabel('FRONT LAYER', 10));
foregroundLayerRef.current.addChild(createLabel('FOREGROUND', 50));
floatsBehindLayerRef.current.addChild(createLabel('FLOATS BEHIND', 90));
midgroundLayerRef.current.addChild(createLabel('MIDGROUND', 130));
backgroundLayerRef.current.addChild(createLabel('BACKGROUND', 170));
skyLayerRef.current.addChild(createLabel('SKY', 210));
```

---

## 💡 Design Tips

### For Dramatic Effect:
- Use transparent areas in `foreground.png`
- Make floats switch layers when passing "between" foreground objects
- Set `layerSwitchPoint` at natural transition areas in your path

### For Smooth Motion:
- Keep transitions around 0.4-0.6 (middle of path)
- Avoid switching too early or too late
- Test with slow speed first to see the effect

### For Depth Illusion:
- Scale floats smaller when in "behind" layer (optional enhancement)
- Add slight blur when behind (optional with filters)
- Foreground objects should have good contrast

---

## 📱 Testing Checklist

- [ ] Can see background layers loading
- [ ] Floats spawn and move along path
- [ ] Floats appear behind foreground initially
- [ ] Floats transition to front layer at switch point
- [ ] Layer transition is smooth (no flickering)
- [ ] Path looks natural and smooth
- [ ] Performance is good (check FPS)

---

## 🎬 Ready to Customize!

Now that you understand the layer system:

1. **Test default setup**: `npm run dev` → `/parade`
2. **Use PathEditor**: Design your custom path
3. **Adjust layerSwitchPoint**: Find what looks best
4. **Enjoy your multi-layer parade!** 🎉

---

**Tip**: The layer system is already working! You just need to:
1. Make sure your `foreground.png` has interesting elements
2. Set the `layerSwitchPoint` to transition at the right moment
3. Design a path that showcases the depth effect

Happy parade building! 🎊

