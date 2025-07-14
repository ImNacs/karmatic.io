# Fix Database Permissions for Messages

## Problem
The application is encountering the following error when trying to save messages:
```
Error saving message: {
  code: '42501',
  message: 'permission denied for sequence messages_id_seq'
}
```

## Solution
You need to grant permissions to the sequences used by the messages table. Run these commands in the Supabase SQL Editor:

```sql
-- Grant permissions for messages sequence
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO service_role;

-- Ensure proper permissions on tables
GRANT ALL ON TABLE messages TO authenticated;
GRANT ALL ON TABLE messages TO anon;
GRANT ALL ON TABLE messages TO service_role;

GRANT ALL ON TABLE conversations TO authenticated;
GRANT ALL ON TABLE conversations TO anon;
GRANT ALL ON TABLE conversations TO service_role;
```

**Note:** The `conversations` table uses CUID generation (not a sequence), so only the `messages` table needs sequence permissions.

## Alternative: Use Supabase Dashboard
1. Go to the Supabase Dashboard
2. Navigate to Database > Tables
3. Click on the `messages` table
4. Go to the "Permissions" tab
5. Enable all permissions for `authenticated`, `anon`, and `service_role` roles
6. Repeat for the `conversations` table

## Why This Happens
When tables are created with `SERIAL` or `BIGSERIAL` columns, PostgreSQL automatically creates sequences to generate the IDs. However, these sequences need explicit permissions granted to them, which is often overlooked.

## Verification
After applying the fix, test by sending a message in the chat. You should no longer see the permission denied error.