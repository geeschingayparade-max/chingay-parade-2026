-- Chingay Parade Float Submissions Table
-- Run this in your Supabase SQL Editor

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  image_url TEXT, -- Nullable for removed images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active', -- 'active' or 'removed'
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_template_id ON submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_template_name ON submissions(template_name);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read submissions (for parade display)
CREATE POLICY "Allow public read access"
  ON submissions
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated insert (for drawing app)
CREATE POLICY "Allow public insert"
  ON submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow authenticated delete (for staff dashboard later)
CREATE POLICY "Allow authenticated delete"
  ON submissions
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- Create storage bucket for float images
INSERT INTO storage.buckets (id, name, public)
VALUES ('float-images', 'float-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Allow public read
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'float-images');

-- Storage policies: Allow public upload
CREATE POLICY "Allow public upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'float-images');

-- Storage policies: Allow authenticated delete
CREATE POLICY "Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'float-images' AND auth.role() = 'authenticated');

