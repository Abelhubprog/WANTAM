-- WANTAM.INK Schema Migration
-- Date: 2025-05

-- Enable UUID extension for generating primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pledges Table
-- Stores user pledges with county information
CREATE TABLE IF NOT EXISTS pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  county TEXT NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 1.00,
  payment_method TEXT DEFAULT 'mpesa',
  created_at TIMESTAMPTZ DEFAULT now(),
  transaction_id TEXT UNIQUE,
  verified BOOLEAN DEFAULT false
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pledges_county ON pledges(county);
CREATE INDEX IF NOT EXISTS idx_pledges_created_at ON pledges(created_at);
CREATE INDEX IF NOT EXISTS idx_pledges_transaction_id ON pledges(transaction_id);

-- Row Level Security
-- Only allow access to the pledges table through the service role
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;

-- Anonymous users can only read pledges
CREATE POLICY "Allow anonymous users to read pledges"
  ON pledges FOR SELECT
  TO anon
  USING (true);

-- Only service role can insert pledges (via webhooks)
CREATE POLICY "Only service role can insert pledges"
  ON pledges FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can update pledges
CREATE POLICY "Only service role can update pledges"
  ON pledges FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create view for county aggregation
CREATE OR REPLACE VIEW county_pledge_count AS
  SELECT county, COUNT(*) as pledge_count
  FROM pledges
  GROUP BY county;

-- Enable realtime subscriptions for the pledges table
ALTER PUBLICATION supabase_realtime ADD TABLE pledges;

-- Create function to notify on new pledges
CREATE OR REPLACE FUNCTION notify_new_pledge()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_pledge',
    json_build_object(
      'id', NEW.id,
      'county', NEW.county,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new pledge notifications
DROP TRIGGER IF EXISTS trigger_new_pledge ON pledges;
CREATE TRIGGER trigger_new_pledge
  AFTER INSERT ON pledges
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_pledge();
