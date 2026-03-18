-- Add optional metadata columns to user_logged_rolls for camera/processing details
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS camera TEXT;
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS lens TEXT;
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS shot_iso TEXT;
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS lab TEXT;
ALTER TABLE user_logged_rolls ADD COLUMN IF NOT EXISTS date_loaded DATE;
