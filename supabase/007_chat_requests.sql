-- Create chat_requests table
CREATE TABLE IF NOT EXISTS public.chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    denied_at TIMESTAMPTZ,
    CONSTRAINT fk_requester FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipient FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create partial unique index to prevent multiple pending requests between same users
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request 
    ON public.chat_requests(requester_id, recipient_id) 
    WHERE status = 'pending';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_requests_recipient ON public.chat_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_requester ON public.chat_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_recipient_status ON public.chat_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_requester_status ON public.chat_requests(requester_id, status);

-- Enable Row Level Security
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own chat requests"
    ON public.chat_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

-- RLS Policy: Users can view requests they sent or received
CREATE POLICY "Users can view their chat requests"
    ON public.chat_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RLS Policy: Recipients can update requests (accept/deny)
CREATE POLICY "Recipients can update chat requests"
    ON public.chat_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- RLS Policy: Requesters can delete their own pending requests
CREATE POLICY "Requesters can delete their own pending requests"
    ON public.chat_requests
    FOR DELETE
    TO authenticated
    USING (auth.uid() = requester_id AND status = 'pending');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_request_updated_at_trigger
    BEFORE UPDATE ON public.chat_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_request_updated_at();

-- Function to set denied_at when status changes to denied
CREATE OR REPLACE FUNCTION set_denied_at_on_deny()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'denied' AND OLD.status != 'denied' THEN
        NEW.denied_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set denied_at when request is denied
CREATE TRIGGER set_denied_at_trigger
    BEFORE UPDATE ON public.chat_requests
    FOR EACH ROW
    WHEN (NEW.status = 'denied' AND OLD.status != 'denied')
    EXECUTE FUNCTION set_denied_at_on_deny();

-- Enable real-time for chat_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;

