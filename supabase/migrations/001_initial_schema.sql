-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user1_id UUID NOT NULL DEFAULT auth.uid(),
    user2_id UUID NOT NULL,
    last_message JSONB,
    CONSTRAINT fk_user1 FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user2 FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    sender_id UUID NOT NULL DEFAULT auth.uid(),
    conversation_id UUID NOT NULL,
    content TEXT NOT NULL,
    CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Create usernames view
CREATE OR REPLACE VIEW public.usernames AS
SELECT
    raw_user_meta_data ->> 'username' AS username
FROM auth.users
WHERE raw_user_meta_data ->> 'username' IS NOT NULL;

-- Grant access to usernames view for anonymous users
GRANT SELECT ON TABLE public.usernames TO anon;

-- Create users view
CREATE OR REPLACE VIEW public.users AS
SELECT
    id,
    email,
    raw_user_meta_data->>'username' AS username,
    raw_user_meta_data->>'fullname' AS fullname,
    raw_user_meta_data->>'avatar_url' AS avatar_url,
    raw_user_meta_data->>'bio' AS bio
FROM auth.users;

-- Grant access to users view for authenticated users
GRANT SELECT ON TABLE public.users TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table
CREATE POLICY "Users can insert their own conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can view conversations they are part of"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update conversations they are part of"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages table
CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Enable real-time for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to update last_message in conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'sender_id', NEW.sender_id,
        'created_at', NEW.created_at
    )
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_message
CREATE TRIGGER update_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

