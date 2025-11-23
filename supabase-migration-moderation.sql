-- Migration: Add Moderation Features to Existing Database
-- Run this if you already created your Supabase database from supabase-schema.sql
-- This adds the status, removed_at, and removed_by columns

-- Add new columns to submissions table
ALTER TABLE submissions 
  ALTER COLUMN image_url DROP NOT NULL; -- Make image_url nullable

ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES auth.users(id);

-- Update existing submissions to have 'active' status
UPDATE submissions 
SET status = 'active' 
WHERE status IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_template_name ON submissions(template_name);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Moderation features added.';
END $$;

