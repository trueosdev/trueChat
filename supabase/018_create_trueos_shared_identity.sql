-- ============================================================
-- trueOS shared identity layer
-- ------------------------------------------------------------
-- Introduces a `trueos` schema with a `profiles` table keyed 1:1 to
-- auth.users. This is the SHARED trueOS account, readable by every app in
-- the ecosystem (trueChats and future apps). App-specific identity (e.g. a
-- trueChats username + chat avatar) lives in the app's own schema, NOT here.
--
-- profiles holds only the cross-app fields we get for free from the trueOS
-- account: email, display name, and a shared avatar.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS trueos;

GRANT USAGE ON SCHEMA trueos TO anon, authenticated;

CREATE TABLE IF NOT EXISTS trueos.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON trueos.profiles TO authenticated;
GRANT UPDATE ON trueos.profiles TO authenticated;

-- Backfill from existing auth users (idempotent).
INSERT INTO trueos.profiles (id, email, full_name, avatar_url)
SELECT
    id,
    email,
    raw_user_meta_data ->> 'fullname',
    raw_user_meta_data ->> 'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- RLS: profile is readable by any authenticated user (shared identity),
-- but only the owner may update their own row.
-- ------------------------------------------------------------
ALTER TABLE trueos.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON trueos.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
    ON trueos.profiles
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON trueos.profiles;
CREATE POLICY "Users can update their own profile"
    ON trueos.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------
-- Auto-provision a trueos.profiles row whenever a new trueOS account is
-- created. SECURITY DEFINER + empty search_path + fully-qualified names so
-- the trigger is robust regardless of the caller's search_path.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trueos.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO trueos.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'fullname',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_trueos ON auth.users;
CREATE TRIGGER on_auth_user_created_trueos
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION trueos.handle_new_user();
