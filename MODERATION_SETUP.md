# Moderation Dashboard Setup Guide

## 🎯 Features

Your Chingay Parade app now has a **full moderation dashboard** for staff:

✅ **Staff Authentication** - Secure login with Supabase Auth  
✅ **View All Submissions** - Grid view with thumbnails  
✅ **Remove Floats** - Soft delete (keeps records, removes images)  
✅ **Real-time Updates** - Instant updates when floats are added/removed  
✅ **Search & Filter** - By template name, ID, status  
✅ **Sort** - By newest or oldest first  
✅ **Toggle View** - Show/hide removed floats  
✅ **Detailed Stats** - Total, active, removed counts  

## 📋 Setup Steps

### 1. Update Database Schema (5 minutes)

If you **already ran** `supabase-schema.sql`, run the migration:

```sql
-- In Supabase SQL Editor, run:
```

Copy and paste contents of `supabase-migration-moderation.sql`

This adds:
- `status` column (active/removed)
- `removed_at` timestamp
- `removed_by` user reference
- Makes `image_url` nullable

**OR** if you're setting up fresh, just run the updated `supabase-schema.sql` (already has these fields).

### 2. Create Staff Account (3 minutes)

Two options:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `staff@chingay.com` (or your email)
   - Password: `your-secure-password`
   - Auto Confirm User: **✅ Checked**
4. Click **Create user**

#### Option B: Via SQL
```sql
-- In Supabase SQL Editor:
INSERT INTO auth.users (
  email, 
  email_confirmed_at,
  encrypted_password
) VALUES (
  'staff@chingay.com',
  NOW(),
  crypt('your-password-here', gen_salt('bf'))
);
```

### 3. Test Login (2 minutes)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/dashboard/login`

3. Login with your staff credentials

4. You should see the moderation dashboard! 🎉

## 🎨 Dashboard Features

### Main Interface

```
┌─────────────────────────────────────────────┐
│  Moderation Dashboard    staff@chingay.com  │
│  Manage parade float submissions  [Logout]  │
├─────────────────────────────────────────────┤
│  [Total: 42] [Active: 38] [Removed: 4]     │
├─────────────────────────────────────────────┤
│  [Search...] [Template: All] [Sort: Newest]│
│  [Show Removed]                              │
├─────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Dragon │ │  Lion  │ │Phoenix │  ...     │
│  │ [img]  │ │ [img]  │ │ [img]  │          │
│  │[Remove]│ │[Remove]│ │[Remove]│          │
│  └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────┘
```

### Search & Filter

- **Search**: Type ID or template name
- **Filter by Template**: Dragon, Lion, Phoenix, etc.
- **Sort**: Newest first or Oldest first
- **Toggle**: Show/hide removed floats

### Remove Float

1. Click **Remove** button on any float
2. Confirm the action
3. Float disappears from parade **immediately**
4. Record kept in database (status: removed, image_url: null)

## 🔄 How It Works

### Soft Delete Process

When staff removes a float:

1. **Image Deleted** from Supabase Storage
2. **Database Updated**:
   - `image_url` → `null`
   - `status` → `"removed"`
   - `removed_at` → current timestamp
   - `removed_by` → staff user ID
3. **Real-time Broadcast** to all connected clients
4. **Parade Display** filters out removed floats instantly

### Why Soft Delete?

✅ **Keep Records** - Track all submissions (audit trail)  
✅ **Analytics** - Count removed vs. active  
✅ **Recovery** - Staff can see what was removed and when  
✅ **Compliance** - Meet data retention requirements  

## 🚀 Usage

### For Staff (Moderators)

1. **Login**: Go to `/dashboard/login`
2. **Monitor**: View all submissions in real-time
3. **Remove**: Click remove on inappropriate content
4. **Filter**: Use search/filters to find specific floats
5. **Logout**: Click logout when done

### For Admins

1. **Create Staff Accounts**: Via Supabase dashboard
2. **Monitor Usage**: Check Supabase dashboard for stats
3. **Audit Trail**: Query `removed_at` and `removed_by` in database

## 🔐 Security

### Row Level Security (RLS)

Already configured in `supabase-schema.sql`:

```sql
-- Anyone can read submissions (for parade)
Allow public read access

-- Anyone can insert (for drawing app)
Allow public insert

-- Only authenticated users can delete (for staff)
Allow authenticated delete
```

### Authentication

- Uses Supabase Auth (secure, battle-tested)
- Session-based (cookies, not localStorage)
- Auto-logout on session expiry
- Protected routes (redirects to login if not authenticated)

## 📊 Database Schema

### submissions table

```sql
id               TEXT PRIMARY KEY
template_id      TEXT NOT NULL
template_name    TEXT NOT NULL
image_url        TEXT NULL            -- ← Nullable for removed images
created_at       TIMESTAMPTZ
metadata         JSONB
status           TEXT                 -- ← 'active' or 'removed'
removed_at       TIMESTAMPTZ          -- ← When was it removed?
removed_by       UUID                 -- ← Which staff removed it?
```

### Indexes

- `idx_submissions_created_at` - Fast sorting by date
- `idx_submissions_template_id` - Fast filtering by template
- `idx_submissions_status` - Fast filtering by status
- `idx_submissions_template_name` - Fast searching by name

## 🎬 Real-time Updates

### How It Works

1. **Dashboard** subscribes to `submissions` table changes
2. **Remove float** → Supabase broadcasts change
3. **All connected dashboards** refresh automatically
4. **Parade display** also receives update (via polling or subscription)

### Enable Real-time (Already done in schema)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
```

## 🌐 Routes

### Public Routes
- `/` - Drawing app (kids draw floats)
- `/parade` - Parade display (3D floats)

### Protected Routes (Staff only)
- `/dashboard` - Moderation interface
- `/dashboard/login` - Staff login

### API Routes
- `POST /api/submissions` - Submit new drawing
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/[id]` - Get one submission
- `DELETE /api/submissions/[id]/moderate` - Remove float (soft delete)

## 🎨 UI/UX Features

### Responsive Design
- Desktop: 4-5 floats per row
- Tablet: 2-3 floats per row
- Mobile: 1-2 floats per row

### Visual Feedback
- Loading spinner on page load
- Toast notifications on actions
- Hover effects on cards
- Color-coded status badges
- Dimmed appearance for removed floats

### Performance
- Optimized queries (indexed)
- Real-time subscriptions (not polling)
- Image lazy loading
- Efficient filters (client-side after initial fetch)

## 🆘 Troubleshooting

### Can't Login

**Problem**: "Invalid credentials" error

**Solution**:
1. Check email/password are correct
2. Verify user exists in Supabase: **Authentication** → **Users**
3. Check `Auto Confirm User` was checked
4. Try resetting password in Supabase dashboard

### Real-time Not Working

**Problem**: Dashboard doesn't update when floats are removed

**Solution**:
1. Check Supabase SQL:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
   ```
2. Verify Supabase project isn't paused (free tier)
3. Check browser console for errors
4. Refresh the page

### Removed Floats Still in Parade

**Problem**: Floats show in parade after removal

**Solution**:
1. Check `image_url` is `null` in database
2. Verify `status` is `'removed'`
3. Clear browser cache
4. Check parade polling interval (currently 5 seconds)

### Images Not Deleting

**Problem**: "Failed to remove float" error

**Solution**:
1. Check storage policies in Supabase
2. Verify staff is authenticated
3. Check browser console for errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

## 💡 Tips & Best Practices

### For Staff
1. **Check regularly** - Monitor submissions frequently
2. **Remove quickly** - Inappropriate content should be removed ASAP
3. **Use filters** - Find specific submissions faster
4. **Don't panic** - Removed floats are soft-deleted, records remain

### For Admins
1. **Regular audits** - Check `removed_by` to track staff actions
2. **Backup data** - Supabase auto-backups, but export periodically
3. **Monitor storage** - Check Supabase dashboard for usage
4. **Add more staff** - Create multiple staff accounts as needed

### For Developers
1. **Test in dev** - Always test moderation before production
2. **Monitor logs** - Check Supabase logs for errors
3. **Update indexes** - If queries are slow, add more indexes
4. **Rate limiting** - Consider adding rate limits for API routes

## 🚀 Future Enhancements

Easy to add with current setup:

1. **User Roles** - Admin vs. Moderator permissions
2. **Bulk Actions** - Remove multiple floats at once
3. **Auto-moderation** - AI to flag inappropriate content
4. **Approval Queue** - Floats need approval before showing
5. **Analytics Dashboard** - Charts and graphs
6. **Export Data** - Download submissions as CSV/Excel
7. **Restore Function** - Undo accidental removals

## 📝 Files Created

```
/app
  /dashboard
    /login
      page.tsx          ← Staff login page
      login.css         ← Login styling
    page.tsx            ← Moderation dashboard
    dashboard.css       ← Dashboard styling
  /lib
    auth.ts             ← Auth helpers
    supabase.ts         ← Supabase client (existing)
  /api
    /submissions
      /[id]
        /moderate
          route.ts      ← Soft delete endpoint

/supabase-migration-moderation.sql  ← Run if DB already exists
/MODERATION_SETUP.md                ← This file
```

## ✅ Checklist

Before going live:

- [ ] Run schema migration in Supabase
- [ ] Create at least one staff account
- [ ] Test login flow
- [ ] Test removing a float
- [ ] Verify float disappears from parade
- [ ] Check database record (status: removed, image_url: null)
- [ ] Test search and filters
- [ ] Test on mobile device
- [ ] Set up production staff accounts
- [ ] Document staff email/password for your team

## 🎉 You're All Set!

Your moderation dashboard is ready! Staff can now:
- ✅ Login securely
- ✅ View all submissions
- ✅ Remove inappropriate content
- ✅ Monitor parade in real-time

Questions? Check the troubleshooting section or Supabase docs!

