-- SQL to create form_submissions table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS form_submissions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    form_type TEXT NOT NULL,
    form_name TEXT NOT NULL,
    form_data JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    user_email TEXT DEFAULT 'anonymous@user.com',
    
    -- Additional metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Indexes for better performance
    CONSTRAINT form_submissions_form_type_check CHECK (char_length(form_type) > 0),
    CONSTRAINT form_submissions_form_name_check CHECK (char_length(form_name) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions (form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_email ON form_submissions (user_email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions (submitted_at);

-- Enable Row Level Security (optional)
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts (you can modify this based on your needs)
CREATE POLICY "Allow public inserts" ON form_submissions
    FOR INSERT TO public
    WITH CHECK (true);

-- Create a policy to allow users to see their own submissions
CREATE POLICY "Users can see own submissions" ON form_submissions
    FOR SELECT TO public
    USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
