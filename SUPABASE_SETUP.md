# Supabase Setup Guide

## 🎯 Why Supabase?

Your Chingay Parade app now uses Supabase for:
- ✅ **Image Storage** - Reliable cloud storage for float drawings
- ✅ **Database** - Postgres for submission metadata
- ✅ **Real-time** - Live updates when new floats are submitted
- ✅ **Authentication** - Ready for staff dashboard (future)
- ✅ **Auto APIs** - No need to write custom file handling code

## 📋 Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `Chingay2026` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to Singapore (e.g., Southeast Asia)
5. Wait 1-2 minutes for project to initialize

### 2. Run SQL Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

This creates:
- ✅ `submissions` table
- ✅ `float-images` storage bucket
- ✅ Indexes for fast queries
- ✅ Row Level Security policies
- ✅ Real-time subscriptions

### 3. Get API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Find these keys:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (long key)
   - **service_role**: `eyJhbGc...` (different long key)

⚠️ **Keep these keys secret!**

### 4. Create Environment File

Create a file called `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

Replace with your actual keys from Step 3.

### 5. Verify Storage Bucket

1. Go to **Storage** (left sidebar)
2. You should see `float-images` bucket
3. Click on it - it should be empty (for now)
4. Check that it's set to **Public** (click the settings gear icon)

### 6. Test the Setup

Restart your dev server:

```bash
npm run dev
```

Then:
1. Go to `http://localhost:3000`
2. Draw something
3. Click "Send to Parade!"
4. Check Supabase:
   - Go to **Table Editor** → `submissions` (should have 1 row)
   - Go to **Storage** → `float-images` (should have 1 image)
5. Go to `http://localhost:3000/parade` (should see your drawing moving!)

## 🎉 What Changed?

### Before (Local Storage)
```
/submissions/
  ├── dragon_123.png
  ├── dragon_123.json
  ├── lion_456.png
  └── lion_456.json
```
❌ Files lost if server restarts
❌ Hard to scale
❌ Manual backup needed

### After (Supabase)
```
Supabase Cloud:
  Storage: float-images/
    ├── dragon_123.png
    └── lion_456.png
  
  Database: submissions table
    ├── id, template_id, image_url, created_at
    └── Automatic backups
```
✅ Never lose data
✅ Scales automatically
✅ Real-time updates
✅ Ready for auth & dashboard

## 🔄 Real-time Updates (Bonus Feature)

The parade now uses Supabase real-time subscriptions! When someone submits a new drawing:
1. It saves to Supabase
2. Supabase broadcasts the event
3. Parade display receives it instantly
4. New float appears immediately

No need to refresh or wait 5 seconds!

## 🚀 Next Steps (Future)

With Supabase ready, you can now add:
1. **Staff Dashboard** - View all submissions
2. **Authentication** - Login for staff
3. **Analytics** - Track most popular templates
4. **Moderation** - Approve/reject submissions
5. **Leaderboard** - Most creative drawings

## 📊 Monitoring

View usage in Supabase dashboard:
- **Database** → See queries per second
- **Storage** → See bandwidth usage
- **Auth** → See user sessions (when you add auth)

## 💰 Pricing

Free tier includes:
- 500 MB database
- 1 GB storage
- 2 GB bandwidth/month
- 200,000 read requests
- 100,000 write requests

Perfect for your parade! If you outgrow it, paid plans start at $25/month.

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Check `.env.local` keys match Supabase dashboard
- Restart Next.js server after changing `.env.local`

### Error: "Failed to upload image"
- Check storage bucket exists and is **Public**
- Check Row Level Security policies are enabled

### Images not appearing in parade
- Check image URLs in database (should start with `https://`)
- Check browser console for CORS errors
- Verify bucket is **Public**

### Real-time not working
- Check if realtime is enabled: SQL Editor → `ALTER PUBLICATION supabase_realtime ADD TABLE submissions;`
- Check Supabase project isn't paused (free tier)

## 📝 Files Modified

Updated files:
- ✅ `app/api/submissions/route.ts` - Now uses Supabase Storage + DB
- ✅ `app/api/submissions/[id]/route.ts` - Now queries Supabase
- ✅ `app/components/ParadeScene.tsx` - Uses direct image URLs
- ✅ `app/lib/supabase.ts` - New Supabase client config

Removed files:
- ❌ `app/api/submissions/[id]/image/route.ts` - No longer needed (Supabase gives public URLs)
- ❌ `/submissions/` folder - Can delete local files

## 🎊 You're All Set!

Your Chingay Parade app is now running on production-ready infrastructure! 🚀

