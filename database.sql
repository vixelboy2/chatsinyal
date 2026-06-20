-- Copy and paste this script into your Supabase SQL Editor
-- This will set up all tables needed for the Sinyal chat application

-- 1. Create users table
CREATE TABLE users (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create follows table to track mutual connections
CREATE TABLE follows (
    follower_id text REFERENCES users(id) ON DELETE CASCADE,
    followed_id text REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, followed_id)
);

-- 3. Create messages table
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id text REFERENCES users(id) ON DELETE CASCADE,
    receiver_id text REFERENCES users(id) ON DELETE CASCADE,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Set up Row Level Security (RLS) policies
-- For simplicity in this demo, we'll allow anonymous access. 
-- In a real production app, you should use Supabase Auth and restrict RLS policies.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all follows" ON follows FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all messages" ON messages FOR INSERT WITH CHECK (true);

-- 5. Enable Realtime subscriptions
-- This allows the frontend to listen for new messages instantly
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
