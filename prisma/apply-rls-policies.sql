-- =====================================================
-- RLS Policies for Clerk + Supabase Integration
-- =====================================================

-- Enable Row Level Security on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Allow authenticated insert" ON "User";

-- Policy 1: Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON "User"
FOR SELECT
TO authenticated
USING (auth.jwt()->>'sub' = "clerkUserId");

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON "User"
FOR UPDATE
TO authenticated
USING (auth.jwt()->>'sub' = "clerkUserId")
WITH CHECK (auth.jwt()->>'sub' = "clerkUserId");

-- Policy 3: Allow authenticated users to insert (for sync)
-- This allows the initial user creation when they sign up
CREATE POLICY "Allow authenticated insert" 
ON "User"
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'sub' = "clerkUserId");

-- Policy 4: Service role can do everything (for webhooks)
-- Note: Service role bypasses RLS by default, so this is just for clarity
CREATE POLICY "Service role full access" 
ON "User"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'User';

-- List all policies on User table
SELECT * FROM pg_policies WHERE tablename = 'User';