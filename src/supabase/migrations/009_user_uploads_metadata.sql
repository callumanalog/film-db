-- Attach shot metadata to each upload for lightbox display and search
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS camera TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS shot_iso TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS lens TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS lab TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS filter TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS scanner TEXT;
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS push_pull TEXT;
