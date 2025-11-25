# Supabase Setup Instructions

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:

### Migration 1: Initial Schema
Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` into the SQL Editor and execute it.

This creates:
- `conversations` table
- `messages` table
- `users` view (from auth.users)
- `usernames` view (from auth.users)
- Row Level Security policies
- Real-time subscriptions
- Trigger to update last_message

### Migration 2: Storage Bucket
Copy and paste the contents of `supabase/migrations/002_storage_bucket.sql` into the SQL Editor and execute it.

This creates:
- `avatars` storage bucket
- Storage policies for avatar uploads

## Step 2: Configure Environment Variables

1. In your Supabase project, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in `apps/www/` directory:

```bash
cd apps/www
touch .env.local
```

4. Add the following to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Replace `your_project_url_here` and `your_anon_key_here` with your actual Supabase credentials.

**Note:** The app will show a warning in development if these variables are not set, but will fail at runtime when trying to use Supabase features.

## Step 3: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `/auth/signup` to create an account
3. After signing up, you'll be redirected to the main chat interface
4. Create conversations and send messages to test the integration

## Features Implemented

- ✅ User authentication (signup/login)
- ✅ Username availability checking
- ✅ Conversations management
- ✅ Real-time messaging
- ✅ Message history
- ✅ User profiles with avatars
- ✅ Protected routes

## Troubleshooting

### Real-time not working?
- Ensure you've enabled real-time in Supabase dashboard
- Check that the tables are added to the `supabase_realtime` publication (done in migration 1)

### RLS policies blocking access?
- Make sure you're authenticated
- Check that the user is logged in via the auth context

### Views not showing data?
- Views are read-only and pull from `auth.users`
- User metadata must be set during signup (username, fullname, etc.)

## Next Steps

- Add user search functionality
- Implement file/image sharing
- Add typing indicators
- Add read receipts
- Implement push notifications

