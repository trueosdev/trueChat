-- ============================================================
-- trueChats per-app identity: members
-- ------------------------------------------------------------
-- The shared trueOS account (trueos.profiles) gives us email + name + a
-- shared avatar. trueChats-specific identity -- the chosen username and chat
-- profile picture -- lives here, keyed 1:1 to the trueOS account.
--
-- A row is created the first time a user uses trueChats (the onboarding
-- flow). The absence of a row is how the app detects "first use".
-- ============================================================

CREATE TABLE IF NOT EXISTS truechats.members (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    TEXT NOT NULL,
    avatar_url  TEXT,
    bio         TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Case-insensitive uniqueness for usernames.
CREATE UNIQUE INDEX IF NOT EXISTS idx_truechats_members_username_lower
    ON truechats.members (lower(username));

GRANT SELECT, INSERT, UPDATE ON truechats.members TO authenticated;

-- Backfill from existing auth.users metadata for users who already picked a
-- username under the old model.
INSERT INTO truechats.members (id, username, avatar_url, bio)
SELECT
    id,
    raw_user_meta_data ->> 'username',
    raw_user_meta_data ->> 'avatar_url',
    raw_user_meta_data ->> 'bio'
FROM auth.users
WHERE raw_user_meta_data ->> 'username' IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- RLS: every trueChats user can read members (usernames/avatars are visible
-- within the app); only the owner may create/update their own row.
-- ------------------------------------------------------------
ALTER TABLE truechats.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members are readable by authenticated users" ON truechats.members;
CREATE POLICY "Members are readable by authenticated users"
    ON truechats.members
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can create their own member row" ON truechats.members;
CREATE POLICY "Users can create their own member row"
    ON truechats.members
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own member row" ON truechats.members;
CREATE POLICY "Users can update their own member row"
    ON truechats.members
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
