-- =======================================================
-- UPDATED SCRIPT FOR SINYAL CHAT
-- =======================================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Create follows table to track mutual connections
CREATE TABLE IF NOT EXISTS follows (
    follower_id text REFERENCES users(id) ON DELETE CASCADE,
    followed_id text REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, followed_id)
);

-- 3. Create messages table (UPDATED WITH ADVANCED FEATURES)
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id text REFERENCES users(id) ON DELETE CASCADE,
    receiver_id text REFERENCES users(id) ON DELETE CASCADE,
    text text,
    media_url text,
    media_type text,
    reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
    reactions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at timestamp with time zone
);

-- =======================================================
-- MIGRATION SCRIPT (RUN THIS IF YOU ALREADY CREATED TABLES)
-- =======================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

-- NEW MIGRATIONS FOR ADVANCED CHAT FEATURES
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- 4. Set up Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable update access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all follows" ON follows;
DROP POLICY IF EXISTS "Enable insert access for all follows" ON follows;
DROP POLICY IF EXISTS "Enable read access for all messages" ON messages;
DROP POLICY IF EXISTS "Enable insert access for all messages" ON messages;
DROP POLICY IF EXISTS "Enable update access for all messages" ON messages;

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true) WITH CHECK (true);

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

-- 6. Table for user blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id text references public.users(id) on delete cascade,
  blocked_id text references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all blocks" ON blocks FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
