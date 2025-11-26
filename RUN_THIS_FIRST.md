# 🚀 Quick Start - Run This First!

## Step 1: Run the Database Migration

You need to run the database migration to add the new columns and storage bucket.

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of this file:
   ```
   supabase/migrations/003_read_receipts_and_attachments.sql
   ```
5. Click **Run** button
6. You should see: ✅ Success. No rows returned

---

## Step 2: Verify the Migration

Run this SQL query in the SQL Editor to verify:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('read_at', 'attachment_url', 'attachment_type', 'attachment_name', 'attachment_size');

-- Check if attachments bucket exists
SELECT * FROM storage.buckets WHERE id = 'attachments';

-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'mark_messages_as_read';
```

You should see:
- 5 columns listed (read_at, attachment_url, etc.)
- 1 bucket row (attachments)
- 1 function row (mark_messages_as_read)

---

## Step 3: Test the Features!

### Test Typing Indicators
1. Open your app in two different browser windows
2. Log in as different users in each window
3. Start a conversation
4. Type in one window - you should see "User is typing..." in the other!

### Test File Sharing
1. Click the paperclip icon in the chat input
2. Select an image or PDF
3. See the preview appear above the input
4. Click send
5. The file should appear in the chat!

### Test Read Receipts
1. Send a message
2. You should see a single checkmark (✓)
3. When the other user opens the chat, it should change to double checkmark (✓✓) in blue

### Test User Presence
1. Open a chat with another user
2. You should see their status as "Online" or "Offline"
3. A green dot appears if they're online
4. Status updates in real-time!

---

## 🎉 That's It!

All features should now be working. If you see any errors:

1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Make sure the migration ran successfully
4. Verify you're using the latest code

## Common Issues

### "Function mark_messages_as_read does not exist"
→ Run the migration again

### "Bucket attachments does not exist"
→ Check storage buckets in Supabase dashboard, may need to create manually

### "Column does not exist"
→ Migration didn't run, check SQL Editor for errors

### Typing indicator not showing
→ Check browser console, may need to refresh both windows

---

Enjoy your upgraded chat app! 🚀✨

