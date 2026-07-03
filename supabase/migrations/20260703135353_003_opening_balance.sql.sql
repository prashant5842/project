-- Add opening_balance column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS opening_balance decimal(12,2) DEFAULT 0;

-- Add a flag to track if the user has completed initial setup
ALTER TABLE settings ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;