-- Check and add missing columns to conversations table
-- Run this in Supabase SQL Editor

-- First check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations';

-- If missing, add these columns:
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS latex TEXT;
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pdf_url TEXT;
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Or create the table properly if it doesn't exist:
-- CREATE TABLE IF NOT EXISTS conversations (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--   title TEXT,
--   prompt TEXT NOT NULL,
--   response TEXT,
--   latex TEXT,
--   pdf_url TEXT,
--   status TEXT DEFAULT 'completed',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Enable RLS
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy
-- CREATE POLICY "Users can manage own conversations" ON conversations
--   FOR ALL USING (auth.uid() = user_id);
