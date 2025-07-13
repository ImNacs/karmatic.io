-- Check extension states
SELECT 
    e.extname,
    e.extversion,
    n.nspname as schema,
    r.rolname as owner
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
JOIN pg_roles r ON e.extowner = r.oid
WHERE e.extname IN ('pg_stat_statements', 'pgcrypto', 'uuid-ossp', 'vector', 'pg_graphql', 'supabase_vault')
ORDER BY e.extname;

-- Check if extensions are in different schemas
SELECT 
    proname,
    pronamespace::regnamespace
FROM pg_proc
WHERE proname IN ('gen_random_uuid', 'crypt', 'digest')
LIMIT 5;
EOF < /dev/null