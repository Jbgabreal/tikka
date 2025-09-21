# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a region close to your users
4. Set a strong database password

## 2. Get Environment Variables

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy the following values:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## 3. Add to Environment Variables

Add these to your `.env` file or Doppler:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** The service role key bypasses Row Level Security and should be kept secret. Only use it in your backend server.

## 4. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to create all tables and policies

## 5. Verify Setup

The schema creates:
- ✅ `users` table with email/password authentication
- ✅ `wallets` table for user wallet storage
- ✅ `chat_sessions` table for chat history
- ✅ `api_keys` table for service API keys
- ✅ Row Level Security (RLS) policies
- ✅ Proper indexes for performance

## 6. Test the Integration

1. Start your backend server
2. Try registering a new user
3. Check the Supabase dashboard → **Table Editor** to see the data
4. Restart the server and verify login still works

## Benefits of Supabase

- ✅ **Persistent storage** - Data survives server restarts
- ✅ **Scalable** - Handles multiple server instances
- ✅ **Secure** - Row Level Security ensures data isolation
- ✅ **Real-time** - Can sync data across devices
- ✅ **Backup** - Automatic backups and point-in-time recovery
- ✅ **Performance** - Optimized queries and indexes
