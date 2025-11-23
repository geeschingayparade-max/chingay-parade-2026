# Chingay Parade 2026 - Interactive Drawing App

An interactive iPad drawing application that allows kids to create digital art on float templates for the Chingay Parade, with a 3D parade display and staff moderation dashboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-green?logo=supabase)
![Three.js](https://img.shields.io/badge/Three.js-3D-orange)

## 🎨 Features

### Drawing App (Public)
- ✅ **5 Float Templates** - Dragon, Lion, Phoenix, Peacock, Tiger
- ✅ **Drawing Tools** - Pen, eraser, undo/redo, brush sizes
- ✅ **Color Palette** - 12 vibrant colors for kids
- ✅ **Template Overlay** - Draw inside the stencil, template always visible
- ✅ **Export & Submit** - PNG export with template composited on top
- ✅ **Responsive Design** - Works on iPad (landscape/portrait)
- ✅ **Kid-Friendly UI** - Large buttons, bright colors, simple interface

### 3D Parade Display (Public)
- ✅ **Three.js 3D Scene** - Realistic parade environment
- ✅ **Float Animation** - Bouncing, swaying, moving down parade path
- ✅ **Real-time Spawning** - New floats appear as kids submit
- ✅ **Auto Despawn** - Older floats removed when limit reached (50)
- ✅ **Live Counter** - Shows current number of active floats

### Staff Moderation Dashboard (Protected)
- ✅ **Secure Authentication** - Supabase Auth with email/password
- ✅ **Grid View** - Thumbnails of all submissions
- ✅ **Search & Filter** - By template, status, date
- ✅ **Sort Options** - Newest/oldest first
- ✅ **Soft Delete** - Remove images but keep records (audit trail)
- ✅ **Real-time Updates** - WebSocket subscriptions
- ✅ **Stats Dashboard** - Total, active, removed counts
- ✅ **Responsive** - Works on all devices

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (Postgres)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Drawing**: Fabric.js
- **3D Graphics**: Three.js
- **UI Components**: React 18
- **Icons**: Tabler Icons
- **Notifications**: React Toastify
- **Styling**: CSS Modules

## 📂 Project Structure

```
/Chingay2026
├── app/
│   ├── components/          # React components
│   │   ├── TemplateSelector.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ColorPalette.tsx
│   │   └── ParadeScene.tsx
│   ├── dashboard/           # Staff moderation
│   │   ├── page.tsx         # Dashboard interface
│   │   └── login/           # Login page
│   ├── parade/              # 3D parade display
│   │   └── page.tsx
│   ├── api/                 # API routes
│   │   └── submissions/     # CRUD endpoints
│   ├── lib/                 # Utilities
│   │   ├── supabase.ts      # Supabase client
│   │   └── auth.ts          # Auth helpers
│   └── page.tsx             # Main drawing app
├── public/
│   └── templates/           # Float template images
├── supabase-schema.sql      # Database schema
├── supabase-migration-moderation.sql  # Moderation migration
└── [Documentation files]
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works!)

### 2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Chingay2026.git
cd Chingay2026
npm install
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
   - Go to **SQL Editor** in Supabase
   - Copy/paste contents of `supabase-schema.sql`
   - Click **Run**

3. Get your API keys:
   - **Settings** → **API**
   - Copy: Project URL, anon key, service_role key

### 4. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 5. Run Development Server

```bash
npm run dev
```

Open:
- **Drawing App**: http://localhost:3000
- **Parade Display**: http://localhost:3000/parade
- **Staff Dashboard**: http://localhost:3000/dashboard/login

### 6. Create Staff Account

In Supabase:
1. **Authentication** → **Users** → **Add user**
2. Enter email/password
3. ✅ Check **Auto Confirm User**
4. Use these credentials to login at `/dashboard/login`

## 📖 Documentation

- **Quick Setup**: [`QUICKSTART.md`](./QUICKSTART.md)
- **Supabase Setup**: [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
- **Moderation Guide**: [`MODERATION_SETUP.md`](./MODERATION_SETUP.md)
- **Parade Setup**: [`PARADE_SETUP.md`](./PARADE_SETUP.md)
- **Project Summary**: [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)

## 🎯 Usage

### For Kids (Drawing)

1. Go to home page
2. Choose a float template
3. Draw with colors and tools
4. Click "Send to Parade!"
5. Watch it appear in the 3D parade!

### For Staff (Moderation)

1. Login at `/dashboard/login`
2. View all submissions in grid
3. Use search/filters to find specific floats
4. Click "Remove" on inappropriate content
5. Confirm removal
6. Float disappears from parade immediately

### For Display (Parade)

1. Go to `/parade` on a projector/TV
2. Leave it running
3. Floats appear automatically as kids submit
4. Old floats despawn after 50 total

## 🔐 Security

- ✅ Environment variables not committed
- ✅ Row Level Security (RLS) enabled
- ✅ Staff authentication required for moderation
- ✅ Service role key only used server-side
- ✅ Public can only read/insert, not delete

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

Add environment variables in Vercel dashboard.

### Other Platforms

Works on: Netlify, Railway, Fly.io, AWS, Azure, etc.

Just ensure:
1. Node.js 18+ support
2. Environment variables set
3. Build command: `npm run build`
4. Start command: `npm start`

## 📊 Database Schema

### submissions table

```sql
id               TEXT PRIMARY KEY
template_id      TEXT NOT NULL
template_name    TEXT NOT NULL
image_url        TEXT              -- Nullable (null = removed)
created_at       TIMESTAMPTZ
metadata         JSONB
status           TEXT              -- 'active' or 'removed'
removed_at       TIMESTAMPTZ
removed_by       UUID              -- References auth.users
```

## 🎨 API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/submissions` | GET | Public | List all submissions |
| `/api/submissions` | POST | Public | Submit drawing |
| `/api/submissions/[id]` | GET | Public | Get one submission |
| `/api/submissions/[id]` | DELETE | Auth | Hard delete |
| `/api/submissions/[id]/moderate` | DELETE | Auth | Soft delete (remove image) |
| `/api/health` | GET | Public | Health check |

## 🧪 Testing

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint
```

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Fabric.js Docs](http://fabricjs.com/docs/)
- [Three.js Docs](https://threejs.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Chingay Parade Singapore
- Supabase for amazing backend infrastructure
- Fabric.js for canvas drawing capabilities
- Three.js for 3D graphics

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in `/docs` folder
- Review troubleshooting in setup guides

## 🎉 Project Status

**Status**: ✅ Production Ready

**Completed Features**:
- ✅ Drawing app with 5 templates
- ✅ 3D parade display
- ✅ Staff moderation dashboard
- ✅ Supabase integration
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Full documentation

**Future Enhancements**:
- [ ] User roles (Admin, Moderator, Viewer)
- [ ] Bulk actions (remove multiple floats)
- [ ] Analytics dashboard (charts, graphs)
- [ ] Export data (CSV, Excel)
- [ ] Auto-moderation (AI content filter)
- [ ] Approval queue (pending → approved)

---

**Built with ❤️ for Chingay Parade 2026** 🎊

