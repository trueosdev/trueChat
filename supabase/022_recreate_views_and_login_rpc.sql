-- ============================================================
-- Recreate the users/usernames views and the username->email login RPC
-- in the truechats schema, sourced from the new identity model.
-- ------------------------------------------------------------
-- Old model: username/avatar/bio lived in auth.users.raw_user_meta_data and
-- public.users / public.usernames read from there.
-- New model: shared identity (email, full name, shared avatar) in
-- trueos.profiles; trueChats-specific identity (username, chat avatar, bio)
-- in truechats.members.
--
-- We recreate the views/RPC in truechats so the app (db.schema =
-- 'truechats') keeps using .from('users') / .from('usernames') /
-- .rpc('get_email_by_username') unchanged. The old public.* copies are left
-- in place for rollback and dropped in a later cleanup migration.
--
-- These are plain (definer) views so anon can read 'usernames' for signup
-- availability checks without table grants, matching the previous behavior.
-- ============================================================

-- Usernames list (used by signup availability check; readable by anon).
CREATE OR REPLACE VIEW truechats.usernames AS
SELECT username
FROM truechats.members;

GRANT SELECT ON truechats.usernames TO anon, authenticated;

-- Combined user profile view: shared identity + trueChats identity.
-- avatar_url prefers the trueChats chat avatar, falling back to the shared
-- trueOS avatar.
CREATE OR REPLACE VIEW truechats.users AS
SELECT
    p.id,
    p.email,
    m.username,
    p.full_name                       AS fullname,
    COALESCE(m.avatar_url, p.avatar_url) AS avatar_url,
    m.bio
FROM trueos.profiles p
LEFT JOIN truechats.members m ON m.id = p.id;

GRANT SELECT ON truechats.users TO authenticated;

-- ------------------------------------------------------------
-- Username -> email lookup for login. Lives in truechats so the default
-- schema client resolves .rpc('get_email_by_username'). SECURITY DEFINER so
-- anon can resolve a username to an email at the login screen.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_email_by_username(TEXT);
CREATE OR REPLACE FUNCTION truechats.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT p.email INTO v_email
    FROM truechats.members m
    JOIN trueos.profiles p ON p.id = m.id
    WHERE LOWER(m.username) = LOWER(p_username)
    LIMIT 1;

    RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION truechats.get_email_by_username(TEXT) TO anon, authenticated;
