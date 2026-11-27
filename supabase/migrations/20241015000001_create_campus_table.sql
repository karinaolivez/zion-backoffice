-- Migration: Create Campus table
-- Description: Creates the campus table with the specified structure and indexes

-- Create Campus table with the specified structure
CREATE TABLE IF NOT EXISTS campus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  organization_id UUID NOT NULL,
  community_group_id VARCHAR(255) NOT NULL,
  community_group_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campus_organization_id ON campus(organization_id);
CREATE INDEX IF NOT EXISTS idx_campus_community_group_id ON campus(community_group_id);
CREATE INDEX IF NOT EXISTS idx_campus_slug ON campus(slug);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_campus_updated_at ON campus;
CREATE TRIGGER update_campus_updated_at 
    BEFORE UPDATE ON campus 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE campus ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust according to your authentication needs)
CREATE POLICY "Enable read access for all users" ON campus
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON campus
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON campus
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON campus
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample data (optional)
-- INSERT INTO campus (name, slug, organization_id, community_group_id, community_group_name) VALUES
-- ('Campus Central', 'campus-central', 'ef688b3c-de1f-413e-a40c-486b976be887', 'group-1', 'Grupo Central'),
-- ('Campus Norte', 'campus-norte', 'ef688b3c-de1f-413e-a40c-486b976be887', 'group-2', 'Grupo Norte');