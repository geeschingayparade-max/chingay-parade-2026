# Deployment Guide - Next.js

## Quick Deploy Options

### Option 1: Vercel (Recommended - One Click)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Click "Deploy"
   - Done! ✨

**That's it!** Vercel automatically detects Next.js and configures everything.

### Option 2: Netlify

1. **Build the app:**
```bash
npm run build
```

2. **Deploy:**
   - Go to https://netlify.com
   - Drag and drop the `.next` and `public` folders
   - Or connect to Git for auto-deployment

3. **Configure Build Settings:**
```
Build command: npm run build
Publish directory: .next
```

### Option 3: Self-Hosted (PM2)

1. **On your server:**
```bash
git clone <repo-url>
cd Chingay2026
npm install
npm run build
```

2. **Install PM2:**
```bash
sudo npm install -g pm2
```

3. **Start the app:**
```bash
pm2 start npm --name "chingay-app" -- start
pm2 save
pm2 startup
```

4. **Configure Nginx as reverse proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable HTTPS:**
```bash
sudo certbot --nginx -d your-domain.com
```

### Option 4: Docker

1. **Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build and run:**
```bash
docker build -t chingay-app .
docker run -p 3000:3000 -v $(pwd)/submissions:/app/submissions chingay-app
```

## Environment Variables

Create `.env.local` for production:

```bash
# No environment variables needed by default!
# Add any custom configs here if needed
```

## Advantages Over Separate Backend

| Feature | Old (Vite + Express) | New (Next.js) |
|---------|---------------------|---------------|
| Deployment | 2 separate services | 1 deployment |
| Configuration | 2 configs | 1 config |
| Environment vars | 2 files | 1 file |
| CORS setup | Required | Not needed |
| SSL certificates | 2 domains | 1 domain |
| Monitoring | 2 services | 1 service |
| Cost | 2x hosting | 1x hosting |

## iPad Kiosk Setup

### Guided Access (iOS/iPadOS)

1. **Settings → Accessibility → Guided Access**
   - Enable Guided Access
   - Set passcode
   - Enable Accessibility Shortcut

2. **Configure app:**
   - Open app in Safari
   - Add to Home Screen
   - Launch app
   - Triple-click Home/Side button
   - Start Guided Access

3. **Options:**
   - Disable touch in certain areas
   - Disable hardware buttons
   - Set time limits

### Mobile Device Management (MDM)

For enterprise deployment:

1. **Apple Configurator 2** (Mac only)
2. **Third-party MDM Solutions:**
   - Jamf
   - MobileIron
   - Workspace ONE

## Performance Optimization

### 1. Image Optimization

Next.js automatically optimizes images:
```tsx
import Image from 'next/image'

<Image 
  src="/templates/dragon.svg" 
  width={200} 
  height={200}
  alt="Dragon"
/>
```

### 2. Enable Compression

Add to `next.config.js`:
```javascript
const nextConfig = {
  compress: true,
  // ... other config
}
```

### 3. Static Generation

For template pages that don't change:
```tsx
// Force static generation
export const dynamic = 'force-static'
```

### 4. Caching Headers

Next.js automatically sets optimal caching headers for static assets.

## Scaling

### Horizontal Scaling

Deploy multiple instances behind a load balancer:

1. **AWS Application Load Balancer**
2. **Nginx load balancer**
3. **Vercel** (automatic scaling)

### Database Integration

For larger scale, replace file storage with a database:

```bash
npm install @prisma/client
```

```typescript
// app/api/submissions/route.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  const submission = await prisma.submission.create({
    data: {
      templateId: data.templateId,
      imageData: data.imageData,
      timestamp: new Date(data.timestamp),
    }
  })
  
  return NextResponse.json({ success: true, id: submission.id })
}
```

## Monitoring

### Built-in Next.js Analytics

Vercel provides automatic performance monitoring.

### Custom Monitoring

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.server.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup-submissions.sh
tar -czf submissions-$(date +%Y%m%d).tar.gz submissions/
aws s3 cp submissions-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-submissions.sh
```

## Security Checklist

- [x] HTTPS enabled (automatic with Vercel/Netlify)
- [x] No CORS issues (same origin)
- [ ] Add rate limiting for API routes
- [ ] Validate all inputs
- [ ] Set security headers
- [ ] Regular dependency updates

### Add Rate Limiting

```typescript
// app/api/submissions/route.ts
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

## Future Extensions

With Next.js, it's easy to add:

### 1. Admin Dashboard

```typescript
// app/dashboard/page.tsx
import { getAllSubmissions } from '@/app/api/submissions/route'

export default async function Dashboard() {
  const submissions = await getAllSubmissions()
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Display submissions */}
    </div>
  )
}
```

### 2. Real-time Aquarium Display

```typescript
// app/aquarium/page.tsx
'use client'

import { useEffect } from 'react'
import * as THREE from 'three'

export default function Aquarium() {
  // Three.js aquarium code
}
```

### 3. WebSocket for Real-time Updates

Next.js supports WebSockets out of the box!

## Troubleshooting Production Issues

### App not loading
- Check build logs
- Verify all dependencies installed
- Check Node.js version (18+)

### Submissions not saving
- Check file permissions on `submissions/` folder
- Verify disk space available
- Check server logs

### Performance issues
- Enable compression
- Add CDN for static assets
- Check server resources

## Support

For deployment help:
- Next.js Docs: https://nextjs.org/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: <your-repo-issues>

**The migration to Next.js makes deployment and scaling significantly easier!** 🚀
