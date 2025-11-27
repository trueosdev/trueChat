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

-- Enable Row Level Security
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_participants table
CREATE POLICY "Users can view participants in their conversations"
    ON public.conversation_participants
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can add participants"
    ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.role = 'admin'
        )
        OR
        -- Allow adding self when creating a new group
        user_id = auth.uid()
    );

CREATE POLICY "Admins can remove participants"
    ON public.conversation_participants
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.role = 'admin'
        )
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
        -- For group chats
        (is_group AND auth.uid() = created_by)
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Function to get conversation participants count
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

