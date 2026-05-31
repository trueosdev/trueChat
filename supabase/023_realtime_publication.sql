-- ============================================================
-- Ensure moved tables remain in the realtime publication
-- ------------------------------------------------------------
-- Publications track tables by OID, so a table generally stays in
-- supabase_realtime across ALTER TABLE ... SET SCHEMA. This migration is a
-- defensive, idempotent re-add: if a table dropped out it is re-added; if it
-- is still a member, the duplicate_object exception is swallowed.
--
-- Verify afterwards with:
--   SELECT schemaname, tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' ORDER BY 1, 2;
-- ============================================================

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'conversations',
        'messages',
        'conversation_participants',
        'chat_requests',
        'looms',
        'loom_members',
        'threads',
        'thread_messages',
        'thread_folders'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        BEGIN
            EXECUTE format(
                'ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I',
                'truechats', t
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL; -- already a member
            WHEN undefined_object THEN NULL; -- table not present; skip
        END;
    END LOOP;
END
$$;
