-- ============================================================
-- Move trueChats app tables into a dedicated `truechats` schema
-- ------------------------------------------------------------
-- Part of the trueOS ecosystem restructure: each app owns its own schema so
-- a single shared trueOS project can host many apps. We move IN PLACE with
-- ALTER TABLE ... SET SCHEMA, which preserves data, primary keys, foreign
-- keys, indexes, RLS policies, triggers, defaults and sequence ownership.
--
-- NOTE: plpgsql function BODIES resolve table names at runtime, so the
-- functions that reference these tables are repointed separately in
-- migration 021. RLS policies and triggers bind by OID and survive the move.
--
-- NOTE: the schema is all-lowercase (`truechats`) so it needs no quoting in
-- SQL and is passed as 'truechats' in the JS client db.schema option.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS truechats;

GRANT USAGE ON SCHEMA truechats TO anon, authenticated;

-- Move the nine app tables. Order is irrelevant: FKs travel with the tables.
ALTER TABLE public.conversations            SET SCHEMA truechats;
ALTER TABLE public.messages                 SET SCHEMA truechats;
ALTER TABLE public.conversation_participants SET SCHEMA truechats;
ALTER TABLE public.chat_requests            SET SCHEMA truechats;
ALTER TABLE public.looms                    SET SCHEMA truechats;
ALTER TABLE public.loom_members             SET SCHEMA truechats;
ALTER TABLE public.threads                  SET SCHEMA truechats;
ALTER TABLE public.thread_messages          SET SCHEMA truechats;
ALTER TABLE public.thread_folders           SET SCHEMA truechats;

-- Grant table privileges on the moved tables to authenticated (RLS still
-- governs row visibility). anon keeps no table access beyond what specific
-- views/functions expose.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA truechats TO authenticated;

-- Future tables created in this schema inherit the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA truechats
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
