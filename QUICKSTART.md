# Quick Start Guide - Next.js Edition

Get the Chingay Drawing App up and running in 3 minutes!

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

**That's it!** No separate backend to start. Everything runs in one server! 🎉

## First Run

1. **Choose a Template**
   - You'll see 5 float templates to choose from
   - Click on any template to start drawing

2. **Draw!**
   - Use the pen tool (selected by default)
   - Pick colors from the right palette
   - Adjust brush size from the toolbar
   - Use eraser to remove mistakes
   - Undo/Redo as needed

3. **Submit Your Drawing**
   - Click "Send to Parade!" button
   - Your drawing will be saved to `/submissions` folder
   - You'll see a success message

## Testing on iPad

### Via WiFi

1. Find your computer's IP address:
```bash
# On Mac/Linux
ifconfig | grep "inet "

# On Windows
ipconfig
```

2. Start dev server on network:
```bash
npm run dev
```

3. Access from iPad Safari:
```
http://YOUR_IP_ADDRESS:3000
```

4. Add to Home Screen for full-screen experience

## Quick Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## File Storage

Drawings are automatically saved to:
```
/submissions/
  ├── dragon_123456789_abc.png
  ├── dragon_123456789_abc.json
  └── ...
```

## Next.js Advantages

✅ **One Command to Start**: No separate frontend/backend  
✅ **No CORS Issues**: API routes on same origin  
✅ **Hot Reload**: Changes reflect instantly  
✅ **TypeScript**: Full type safety across frontend and backend  
✅ **Built-in API**: No Express server needed  

## Common Issues

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Templates not loading
- Check files exist in `public/templates/`
- Verify paths in `app/constants.ts`

### Submissions folder error
- Will be created automatically on first submission
- Check write permissions if on Linux/Mac

## API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:3000/api/health

# Get all submissions
curl http://localhost:3000/api/submissions
```

## Production Build

```bash
npm run build
npm start
```

## Need Help?

- Check browser console (F12) for errors
- Review server logs in terminal
- All API and components are in `/app` folder

Enjoy creating! 🎨✨

## What's Next?

Want to add more features? It's easy with Next.js:

- **Dashboard**: Add `app/dashboard/page.tsx`
- **API endpoint**: Add `app/api/yourRoute/route.ts`
- **New page**: Add `app/yourPage/page.tsx`

Everything in one project, no separate backend needed!
