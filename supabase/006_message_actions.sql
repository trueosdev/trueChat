-- Add reply_to column to messages table for reply threads
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add edited_at column to track when messages were edited
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Add likes column to store array of user IDs who liked the message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_messages_edited_at ON public.messages(edited_at);

-- RLS Policy: Users can update their own messages
CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- Function to automatically set edited_at when content is updated
CREATE OR REPLACE FUNCTION set_edited_at_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set edited_at if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set edited_at on content update
DROP TRIGGER IF EXISTS set_edited_at_trigger ON public.messages;
CREATE TRIGGER set_edited_at_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content)
    EXECUTE FUNCTION set_edited_at_on_update();

