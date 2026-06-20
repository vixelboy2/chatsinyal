-- =======================================================
-- UPDATED SCRIPT FOR SINYAL CHAT
-- =======================================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create follows table to track mutual connections
CREATE TABLE IF NOT EXISTS follows (
    follower_id text REFERENCES users(id) ON DELETE CASCADE,
    followed_id text REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, followed_id)
);

-- 3. Create messages table (UPDATED WITH read_at)
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id text REFERENCES users(id) ON DELETE CASCADE,
    receiver_id text REFERENCES users(id) ON DELETE CASCADE,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at timestamp with time zone
);

-- =======================================================
-- MIGRATION SCRIPT (RUN THIS IF YOU ALREADY CREATED TABLES)
-- =======================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- 4. Set up Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all follows" ON follows;
DROP POLICY IF EXISTS "Enable insert access for all follows" ON follows;
DROP POLICY IF EXISTS "Enable read access for all messages" ON messages;
DROP POLICY IF EXISTS "Enable insert access for all messages" ON messages;
DROP POLICY IF EXISTS "Enable update access for all messages" ON messages;

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all follows" ON follows FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all messages" ON messages FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Enable Realtime subscriptions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
