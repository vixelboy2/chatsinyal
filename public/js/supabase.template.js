import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ==========================================
// SUPABASE CONFIGURATION
// Replace these with your actual Supabase URL and Anon Key
// You can find them in your Supabase Project Settings -> API
// ==========================================
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions for our App
export const db = {
  async getUser(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async createUser(id, name) {
    const { data, error } = await supabase.from('users').insert([{ id, name }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateUserName(id, newName) {
    const { error } = await supabase.from('users').update({ name: newName }).eq('id', id);
    if (error) throw error;
  },

  async uploadAvatar(id, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (!data || !data.publicUrl) throw new Error("Gagal mendapatkan URL gambar");

    const { error: updateError } = await supabase.from('users')
      .update({ avatar_url: data.publicUrl })
      .eq('id', id);

    if (updateError) throw updateError;
    return data.publicUrl;
  },

  async removeAvatar(id) {
    const { error } = await supabase.from('users')
      .update({ avatar_url: null })
      .eq('id', id);
    if (error) throw error;
  },

  async addFollow(followerId, followedId) {
    const { error } = await supabase.from('follows').insert([{ follower_id: followerId, followed_id: followedId }]);
    // Ignore duplicate errors if they already follow each other
    if (error && error.code !== '23505') throw error; 
    return true;
  },

  async getMutuals(userId) {
    // A mutual connection means user A follows B AND user B follows A.
    // We can do this with a somewhat complex query or two simpler queries.
    // For simplicity: get all followed by me, and all following me.
    const [{ data: following }, { data: followers }] = await Promise.all([
      supabase.from('follows').select('followed_id').eq('follower_id', userId),
      supabase.from('follows').select('follower_id').eq('followed_id', userId)
    ]);

    const followingIds = following?.map(f => f.followed_id) || [];
    const followerIds = followers?.map(f => f.follower_id) || [];

    const mutualIds = followingIds.filter(id => followerIds.includes(id));
    const pendingIds = followingIds.filter(id => !followerIds.includes(id));
    const incomingIds = followerIds.filter(id => !followingIds.includes(id));

    return { mutualIds, pendingIds, incomingIds };
  },

  async getUsersByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase.from('users').select('*').in('id', ids);
    if (error) return [];
    return data;
  },

  async getMessages(user1, user2) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data;
  },

  async getLastMessage(user1, user2) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  },

  async sendMessage(senderId, receiverId, text) {
    const { error } = await supabase.from('messages').insert([{
      sender_id: senderId,
      receiver_id: receiverId,
      text: text
    }]);
    if (error) throw error;
  },

  async markMessagesAsRead(senderId, receiverId) {
    // senderId = user who sent the messages (the other person)
    // receiverId = user who is reading the messages (me)
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .is('read_at', null);
    
    if (error) console.error("Error marking read", error);
  },

  async clearChat(user1, user2) {
    const { error } = await supabase.from('messages')
      .delete()
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`);
    if (error) throw error;
  },

  async blockUser(blockerId, blockedId) {
    const { error } = await supabase.from('blocks').insert([{ blocker_id: blockerId, blocked_id: blockedId }]);
    if (error && error.code !== '23505') throw error;
  },

  async unblockUser(blockerId, blockedId) {
    const { error } = await supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) throw error;
  },

  async getBlocks(userId) {
    const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
    if (error) throw error;
    return data.map(b => b.blocked_id);
  }
};
