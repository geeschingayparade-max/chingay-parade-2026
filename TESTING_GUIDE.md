# Testing Guide - Responsiveness & Toast Notifications

## Quick Test Steps

### 1. Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Test Cases

### ✅ Test 1: Desktop Responsiveness

**Steps:**
1. Open app in browser
2. Select any template
3. **Resize browser window** (make it narrower/wider)
4. **Observe:** Canvas should resize smoothly

**Expected:**
- Canvas adapts to window size
- Drawing tools remain visible
- No overflow or scrolling issues

---

### ✅ Test 2: iPad Landscape Mode

**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPad Pro" (landscape)
4. Select template and draw

**Expected:**
- Canvas fills available space
- Toolbars on left/right sides
- Header and footer visible
- Drawing works smoothly

---

### ✅ Test 3: iPad Portrait Mode

**Steps:**
1. In DevTools, rotate to portrait mode
2. Or select "iPad" (portrait)
3. Draw something

**Expected:**
- Canvas adapts to vertical layout
- Toolbar moves (if responsive)
- Everything still accessible
- No elements cut off

---

### ✅ Test 4: Device Rotation

**Steps:**
1. Start in landscape mode
2. Draw something
3. Rotate to portrait
4. Drawing should scale proportionally

**Expected:**
- Canvas resizes smoothly
- Drawing content scales correctly
- No distortion
- Can continue drawing

---

### ✅ Test 5: Success Toast

**Steps:**
1. Draw something
2. Click "Send to Parade!"
3. Wait for submission

**Expected:**
- 🟢 Green toast appears at top
- Shows: "🎉 Your drawing has been sent to the parade!"
- Auto-dismisses after 2 seconds
- Returns to template selection

---

### ✅ Test 6: Error Toast

**Steps:**
1. Stop the backend server (Ctrl+C)
2. Draw something
3. Try to submit

**Expected:**
- 🔴 Red toast appears
- Shows: "Oops! Could not send your drawing..."
- Auto-dismisses after 3 seconds
- Can try again

---

### ✅ Test 7: Clear Canvas Toast

**Steps:**
1. Draw something
2. Click "Clear" button
3. Confirm the action

**Expected:**
- 🔵 Blue toast appears
- Shows: "Canvas cleared! Start fresh! 🎨"
- Canvas is cleared
- Auto-dismisses after 2 seconds

---

## Test on Actual iPad

### Via WiFi:

1. **Find your IP:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. **Start server:**
   ```bash
   npm run dev
   ```

3. **On iPad Safari:**
   - Open `http://YOUR_IP:3000`
   - Add to Home Screen
   - Test both orientations

---

## Expected Canvas Sizes

### iPad Pro (12.9") Landscape:
- Screen: 1366x1024
- Canvas: ~1000x750

### iPad Pro Portrait:
- Screen: 1024x1366
- Canvas: ~700x525

### iPad (10.2") Landscape:
- Screen: 1080x810
- Canvas: ~800x600

### iPad Portrait:
- Screen: 810x1080
- Canvas: ~600x450

---

## Troubleshooting

### Canvas not resizing:
- Refresh page (F5)
- Check console for errors
- Ensure window has focus

### Toast not showing:
- Check console for errors
- Verify react-toastify is installed
- Look at top-center of screen

### Drawing not working:
- Check if canvas loaded properly
- Try different browser
- Clear cache and reload

---

## Success Criteria

✅ Canvas adapts to all screen sizes  
✅ Works in landscape and portrait  
✅ Drawing scales correctly on rotation  
✅ Toast notifications appear and dismiss  
✅ Success toast is green  
✅ Error toast is red  
✅ Info toast is blue  
✅ No console errors  
✅ Smooth performance on iPad  
✅ All tools work in all orientations  

---

## Quick Debug Commands

```bash
# Check if dependencies installed
npm list react-toastify

# Reinstall if needed
npm install

# Check for build errors
npm run build

# Test production build
npm run build && npm start
```

---

## Browser Compatibility

✅ Chrome (Desktop + Mobile)  
✅ Safari (iOS + Desktop)  
✅ Edge (Desktop)  
✅ Firefox (Desktop)  

**Best:** Safari on actual iPad

---

**Happy Testing!** 🎨✨
