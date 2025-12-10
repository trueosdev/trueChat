-- Add icon_name field to conversations table for group icons
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS icon_name TEXT;

