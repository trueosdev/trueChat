-- ============================================================
-- ROLLBACK migration for the trueOS restructure (reverses 018-023)
-- ------------------------------------------------------------
-- !! MANUAL ESCAPE HATCH — do NOT run as part of normal forward migration.
-- Run this only to undo migrations 018-023: it moves the app tables back to
-- `public`, restores the original public functions/RPCs, and drops the
-- `truechats` and `trueos` schemas (and their members/profiles/views).
--
-- Data safety notes:
--  * SET SCHEMA back to public restores the 9 tables with all data intact.
--  * Dropping truechats.members loses the per-app rows, BUT usernames/avatars
--    chosen during onboarding were dual-written into auth.users metadata, and
--    the restored public.users view reads username/avatar/bio from there, so
--    identity survives the rollback.
--  * Dropping trueos.profiles is non-destructive to identity for the same
--    reason (email/name live in auth.users).
-- Take a snapshot/branch before running, regardless.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Move the nine tables back to public (reverses 019).
-- ------------------------------------------------------------
ALTER TABLE truechats.conversations             SET SCHEMA public;
ALTER TABLE truechats.messages                  SET SCHEMA public;
ALTER TABLE truechats.conversation_participants SET SCHEMA public;
ALTER TABLE truechats.chat_requests             SET SCHEMA public;
ALTER TABLE truechats.looms                     SET SCHEMA public;
ALTER TABLE truechats.loom_members              SET SCHEMA public;
ALTER TABLE truechats.threads                   SET SCHEMA public;
ALTER TABLE truechats.thread_messages           SET SCHEMA public;
ALTER TABLE truechats.thread_folders            SET SCHEMA public;

-- ------------------------------------------------------------
-- 2. Restore the in-place (group A) functions to reference public.* again.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'sender_id', NEW.sender_id,
        'created_at', NEW.created_at,
        'attachment_type', NEW.attachment_type
    )
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.threads
    SET last_message = jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'sender_id', NEW.sender_id,
        'created_at', NEW.created_at,
        'attachment_type', NEW.attachment_type
    )
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_admin_in_conversation(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id
          AND user_id = check_user_id
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_conversation_participants_count(conversation_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.conversation_participants
        WHERE conversation_id = conversation_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_in_loom(p_loom_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.loom_members
        WHERE loom_id = p_loom_id
          AND user_id = p_user_id
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_loom_role(p_loom_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.loom_members
        WHERE loom_id = p_loom_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 3. Move the client RPCs (group B) back to public.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS truechats.mark_messages_as_read(UUID, UUID);
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS truechats.mark_thread_messages_as_read(UUID, UUID);
CREATE OR REPLACE FUNCTION public.mark_thread_messages_as_read(p_thread_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.thread_messages
    SET read_at = now()
    WHERE thread_id = p_thread_id
      AND sender_id != p_user_id
      AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.mark_thread_messages_as_read(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS truechats.transfer_loom_ownership(uuid, uuid);
CREATE OR REPLACE FUNCTION public.transfer_loom_ownership(p_loom_id uuid, p_new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.loom_members
    WHERE loom_id = p_loom_id AND user_id = uid AND role = 'owner' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'only the active owner can transfer ownership';
  END IF;
  IF p_new_owner_id = uid THEN
    RAISE EXCEPTION 'choose a different member';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.loom_members
    WHERE loom_id = p_loom_id AND user_id = p_new_owner_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'new owner must be an active member of this loom';
  END IF;
  UPDATE public.loom_members SET role = 'admin' WHERE loom_id = p_loom_id AND user_id = uid;
  UPDATE public.loom_members SET role = 'owner' WHERE loom_id = p_loom_id AND user_id = p_new_owner_id;
  UPDATE public.looms SET created_by = p_new_owner_id WHERE id = p_loom_id;
END;
$$;
REVOKE ALL ON FUNCTION public.transfer_loom_ownership(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_loom_ownership(uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS truechats.delete_loom_as_owner(uuid);
CREATE OR REPLACE FUNCTION public.delete_loom_as_owner(p_loom_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.loom_members
    WHERE loom_id = p_loom_id AND user_id = uid AND role = 'owner' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'only the active owner can delete this loom';
  END IF;
  DELETE FROM public.looms WHERE id = p_loom_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_loom_as_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_loom_as_owner(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 4. Restore public.get_email_by_username (reads the public.users view) and
--    drop the truechats copy + views.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS truechats.get_email_by_username(TEXT);
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.users
    WHERE LOWER(username) = LOWER(p_username)
    LIMIT 1;
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon;

DROP VIEW IF EXISTS truechats.users;
DROP VIEW IF EXISTS truechats.usernames;

-- ------------------------------------------------------------
-- 5. Drop the per-app members table and the truechats schema.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS truechats.members;
DROP SCHEMA IF EXISTS truechats CASCADE;

-- ------------------------------------------------------------
-- 6. Reverse 018: drop the trueos shared-identity layer.
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created_trueos ON auth.users;
DROP FUNCTION IF EXISTS trueos.handle_new_user();
DROP SCHEMA IF EXISTS trueos CASCADE;

COMMIT;

-- After running this, revert the app: set db.schema back to 'public' in
-- client.ts/server.ts, restore schema:'public' in the realtime subscriptions,
-- and remove trueos/truechats from the dashboard Exposed Schemas list.
