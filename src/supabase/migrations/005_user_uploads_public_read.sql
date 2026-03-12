-- Allow anyone to read user_uploads so Community tab can show all uploads for a film
CREATE POLICY "Anyone can read user_uploads" ON user_uploads FOR SELECT USING (true);
