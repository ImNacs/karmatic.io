-- Note: Extensions in Supabase are pre-installed in specific schemas
-- pg_stat_statements, pgcrypto, uuid-ossp are in 'extensions' schema
-- vector is in 'public' schema
-- This migration acknowledges their existence

-- Ensure vector extension is available (it's already in public schema)
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;