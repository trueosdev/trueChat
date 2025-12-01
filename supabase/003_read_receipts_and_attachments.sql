-- Add read_at column to messages for read receipts
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add attachment columns to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create index for read receipts queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;

-- Create policy for updating read_at
CREATE POLICY "Users can mark messages as read in their conversations"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Create attachments storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    true,
    10485760, -- 10 MB in bytes
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
CREATE POLICY "Attachment files are publicly accessible"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'attachments');

CREATE POLICY "Users can upload attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

