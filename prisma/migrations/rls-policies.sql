-- Enable Row Level Security on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = "clerkUserId");

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = "clerkUserId");

-- Service role can insert users (for webhook sync)
-- This is handled automatically by service role key