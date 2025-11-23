# Quick Start: Moderation Dashboard

## 🚀 Get Started in 10 Minutes

### Step 1: Update Database (3 min)

In **Supabase SQL Editor**:

```sql
-- If you already ran supabase-schema.sql before, run this:
```

Copy and paste: `supabase-migration-moderation.sql`

**OR** if setting up fresh, just run: `supabase-schema.sql` (already includes moderation features)

### Step 2: Create Staff Account (2 min)

In **Supabase Dashboard**:
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password
4. ✅ Check **Auto Confirm User**
5. Click **Create user**

### Step 3: Test It! (5 min)

```bash
npm run dev
```

1. Go to `http://localhost:3000/dashboard/login`
2. Login with staff credentials
3. See all submissions in grid view
4. Click **Remove** on any float
5. Watch it disappear from `/parade` immediately! ✨

## 📸 Screenshots

### Login Page
```
┌─────────────────────────┐
│         🔒              │
│     Staff Login         │
│ Chingay Parade Moderation│
│                         │
│  📧 Email               │
│  [staff@chingay.com]    │
│                         │
│  🔒 Password            │
│  [••••••••]             │
│                         │
│      [Login]            │
│                         │
│  Authorized staff only  │
└─────────────────────────┘
```

### Dashboard
```
┌──────────────────────────────────────────┐
│ Moderation Dashboard   staff@chingay.com │
│ Manage parade submissions      [Logout]  │
├──────────────────────────────────────────┤
│ Total: 42 │ Active: 38 │ Removed: 4      │
├──────────────────────────────────────────┤
│ 🔍 [Search...] [Template ▼] [Sort ▼]    │
│    [👁️ Show Removed]                      │
├──────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│ │ Dragon  │  │  Lion   │  │ Phoenix │   │
│ │ [IMAGE] │  │ [IMAGE] │  │ [IMAGE] │   │
│ │ ID: ... │  │ ID: ... │  │ ID: ... │   │
│ │ Jan 15  │  │ Jan 15  │  │ Jan 14  │   │
│ │[Remove] │  │[Remove] │  │[Remove] │   │
│ │[active] │  │[active] │  │[active] │   │
│ └─────────┘  └─────────┘  └─────────┘   │
└──────────────────────────────────────────┘
```

## ✨ Features

✅ **Real-time Updates** - See new submissions instantly  
✅ **Search** - By ID or template name  
✅ **Filter** - By template (Dragon, Lion, etc.)  
✅ **Sort** - Newest or oldest first  
✅ **Soft Delete** - Remove images but keep records  
✅ **Toggle View** - Show/hide removed floats  
✅ **Stats** - Total, active, removed counts  
✅ **Responsive** - Works on desktop, tablet, mobile  

## 🎯 What Happens When You Remove a Float?

1. **Image deleted** from Supabase Storage
2. **Database updated**:
   - `image_url` → `null`
   - `status` → `"removed"`
   - `removed_at` → timestamp
   - `removed_by` → your user ID
3. **Parade display** stops showing it **immediately**
4. **Record kept** for audit trail

## 🔐 Security

- ✅ Supabase Auth (secure, production-ready)
- ✅ Row Level Security (RLS) policies
- ✅ Only authenticated staff can remove
- ✅ Public can still submit and view parade

## 📱 Access

- **Drawing App**: `http://localhost:3000` (public)
- **Parade Display**: `http://localhost:3000/parade` (public)
- **Staff Login**: `http://localhost:3000/dashboard/login` (staff only)
- **Dashboard**: `http://localhost:3000/dashboard` (staff only, auto-redirects to login)

## 🆘 Troubleshooting

### Can't login?
- Check user exists in Supabase: **Authentication** → **Users**
- Verify **Auto Confirm User** was checked
- Try resetting password in Supabase dashboard

### Dashboard not loading?
- Check `.env.local` has correct Supabase keys
- Restart dev server after changing `.env.local`
- Check browser console for errors

### Floats not disappearing from parade?
- Wait 5 seconds (polling interval)
- Refresh parade page
- Check database: `image_url` should be `null`

## 📚 Full Documentation

- **Detailed setup**: `MODERATION_SETUP.md`
- **Supabase setup**: `SUPABASE_SETUP.md`
- **Migration SQL**: `supabase-migration-moderation.sql`

## 🎉 That's It!

Your moderation dashboard is ready to use! 🚀

Add more staff accounts as needed in Supabase Dashboard.

