-- Add group chat support to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create conversation_participants junction table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON public.conversations(is_group);

-- Helper function to check if user is in conversation (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_user_in_conversation(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_user_in_conversation TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_participants table
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
    ON public.conversation_participants
    FOR SELECT
    TO authenticated
    USING (
        -- Use security definer function to avoid recursion
        is_user_in_conversation(conversation_id, auth.uid())
    );

-- Helper function to check if user is admin in conversation
CREATE OR REPLACE FUNCTION is_user_admin_in_conversation(conv_id UUID, check_user_id UUID)
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

GRANT EXECUTE ON FUNCTION is_user_admin_in_conversation TO authenticated;

DROP POLICY IF EXISTS "Admins can add participants" ON public.conversation_participants;
CREATE POLICY "Admins can add participants"
    ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_user_admin_in_conversation(conversation_id, auth.uid())
        OR
        -- Allow adding self when creating a new group
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can remove participants" ON public.conversation_participants;
CREATE POLICY "Admins can remove participants"
    ON public.conversation_participants
    FOR DELETE
    TO authenticated
    USING (
        is_user_admin_in_conversation(conversation_id, auth.uid())
        OR
        -- Users can remove themselves (leave group)
        user_id = auth.uid()
    );

-- Update conversations RLS policies for group support
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;
CREATE POLICY "Users can view conversations they are part of"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        -- For 1-on-1 chats
        (NOT is_group AND (auth.uid() = user1_id OR auth.uid() = user2_id))
        OR
        -- For group chats
        (is_group AND EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = conversations.id
            AND user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- For 1-on-1 chats
        (NOT is_group AND auth.uid() = user1_id)
        OR
        -- For group chats - any authenticated user can create
        is_group
    );

DROP POLICY IF EXISTS "Users can update conversations they are part of" ON public.conversations;
CREATE POLICY "Users can update conversations they are part of"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        -- For 1-on-1 chats
        (NOT is_group AND (auth.uid() = user1_id OR auth.uid() = user2_id))
        OR
        -- For group chats (only admins can update)
        (is_group AND EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = conversations.id
            AND user_id = auth.uid()
            AND role = 'admin'
        ))
    );

-- Update messages RLS policies for group support
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        (
            -- For 1-on-1 chats
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE id = conversation_id
                AND NOT is_group
                AND (user1_id = auth.uid() OR user2_id = auth.uid())
            )
            OR
            -- For group chats
            EXISTS (
                SELECT 1 FROM public.conversation_participants
                WHERE conversation_id = messages.conversation_id
                AND user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        -- For 1-on-1 chats
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND NOT is_group
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
        OR
        -- For group chats
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Enable real-time for conversation_participants
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if already added
END
$$;

-- Function to get conversation participants count
DROP FUNCTION IF EXISTS get_conversation_participants_count(UUID);
CREATE OR REPLACE FUNCTION get_conversation_participants_count(conversation_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.conversation_participants
        WHERE conversation_id = conversation_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conversation_participants_count TO authenticated;

