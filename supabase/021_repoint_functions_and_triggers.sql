-- ============================================================
-- Repoint functions after the table move (migration 019)
-- ------------------------------------------------------------
-- ALTER TABLE ... SET SCHEMA moves tables but does NOT rewrite plpgsql
-- function bodies, which resolve table names at runtime. Every function that
-- touched a moved table must be repointed to the truechats schema or it
-- will error ("relation public.<table> does not exist").
--
-- Two groups:
--  (A) Functions called only by triggers / RLS policies stay in `public` and
--      are CREATE OR REPLACE'd in place. This preserves their OID, so the
--      triggers and policies that bind them by OID keep working untouched.
--  (B) The five functions invoked directly from the client via .rpc() must
--      live in the truechats schema (the JS client uses db.schema =
--      'truechats', so PostgREST resolves RPCs there). They are not
--      referenced by any policy, so we drop the public copies and recreate
--      them in truechats. (get_email_by_username is handled in 022 because
--      it also depends on trueos.profiles + trueChats.members.)
-- ============================================================

-- ============================================================
-- (A) In-place repoint -- triggers & RLS helpers (OID preserved)
-- ============================================================

-- Trigger fn: conversation last_message (latest form incl. attachment_type)
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE truechats.conversations
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

-- Trigger fn: thread last_message (latest form incl. attachment_type)
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE truechats.threads
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

-- RLS helper: membership in a (group) conversation
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM truechats.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    );
END;
$$;

-- RLS helper: admin in a conversation
CREATE OR REPLACE FUNCTION public.is_user_admin_in_conversation(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM truechats.conversation_participants
        WHERE conversation_id = conv_id
          AND user_id = check_user_id
          AND role = 'admin'
    );
END;
$$;

-- Helper: participant count
CREATE OR REPLACE FUNCTION public.get_conversation_participants_count(conversation_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM truechats.conversation_participants
        WHERE conversation_id = conversation_uuid
    );
END;
$$;

-- RLS helper: active loom membership (latest form -- status = 'active')
CREATE OR REPLACE FUNCTION public.is_user_in_loom(p_loom_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM truechats.loom_members
        WHERE loom_id = p_loom_id
          AND user_id = p_user_id
          AND status = 'active'
    );
END;
$$;

-- RLS helper: loom role (regardless of status)
CREATE OR REPLACE FUNCTION public.get_loom_role(p_loom_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    RETURN (
        SELECT role FROM truechats.loom_members
        WHERE loom_id = p_loom_id AND user_id = p_user_id
    );
END;
$$;

-- ============================================================
-- (B) Client RPCs -- relocate into truechats
-- ============================================================

DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID, UUID);
CREATE OR REPLACE FUNCTION truechats.mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    UPDATE truechats.messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND read_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION truechats.mark_messages_as_read(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.mark_thread_messages_as_read(UUID, UUID);
CREATE OR REPLACE FUNCTION truechats.mark_thread_messages_as_read(p_thread_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
BEGIN
    UPDATE truechats.thread_messages
    SET read_at = now()
    WHERE thread_id = p_thread_id
      AND sender_id != p_user_id
      AND read_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION truechats.mark_thread_messages_as_read(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.transfer_loom_ownership(uuid, uuid);
CREATE OR REPLACE FUNCTION truechats.transfer_loom_ownership(p_loom_id uuid, p_new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM truechats.loom_members
    WHERE loom_id = p_loom_id AND user_id = uid AND role = 'owner' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'only the active owner can transfer ownership';
  END IF;

  IF p_new_owner_id = uid THEN
    RAISE EXCEPTION 'choose a different member';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM truechats.loom_members
    WHERE loom_id = p_loom_id AND user_id = p_new_owner_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'new owner must be an active member of this loom';
  END IF;

  UPDATE truechats.loom_members
  SET role = 'admin'
  WHERE loom_id = p_loom_id AND user_id = uid;

  UPDATE truechats.loom_members
  SET role = 'owner'
  WHERE loom_id = p_loom_id AND user_id = p_new_owner_id;

  UPDATE truechats.looms
  SET created_by = p_new_owner_id
  WHERE id = p_loom_id;
END;
$$;
REVOKE ALL ON FUNCTION truechats.transfer_loom_ownership(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION truechats.transfer_loom_ownership(uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.delete_loom_as_owner(uuid);
CREATE OR REPLACE FUNCTION truechats.delete_loom_as_owner(p_loom_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = truechats, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM truechats.loom_members
    WHERE loom_id = p_loom_id AND user_id = uid AND role = 'owner' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'only the active owner can delete this loom';
  END IF;

  DELETE FROM truechats.looms WHERE id = p_loom_id;
END;
$$;
REVOKE ALL ON FUNCTION truechats.delete_loom_as_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION truechats.delete_loom_as_owner(uuid) TO authenticated;
