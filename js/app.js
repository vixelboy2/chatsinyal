import { db, supabase } from './supabase.js';

// ============ Utils ============
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatId(id) {
  return id ? id.slice(0, 3) + ' ' + id.slice(3) : '';
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function renderAvatarHtml(name, avatar_url) {
  if (avatar_url) {
    return `<div class="avatar"><img src="${escapeHtml(avatar_url)}" alt="${escapeHtml(name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>`;
  }
  return `<div class="avatar">${initials(name)}</div>`;
}

const ICONS = {
  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  send: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#110d0a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  empty: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  checkDouble: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 10 11 21 8 18"></polyline></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  checkmark: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  moreVert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  image: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`
};

// ============ State ============
let state = {
  view: 'loading',       
  onboardMode: 'choice', 
  me: null,
  error: '',
  busy: false,
  showAddPanel: false,
  addFriendInput: '',
  mutualList: [],
  pendingList: [],
  incomingList: [],
  activeChat: null,      
  messages: [],
  draftText: '',
  subscriptions: [],
  presenceChannel: null,
  onlineUsers: new Set(),
  unreadCounts: {},
  showProfileModal: false,
  showChatMenu: false,
  showChatSearch: false,
  searchQuery: '',
  blockedByMe: new Set(),
  typingUsers: new Set(),
  activeChatChannel: null,
  draftMediaUrl: null,
  draftMediaFile: null,
  replyingTo: null,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  recordingInterval: null,
  recordingTime: 0,
  chatWallpaper: JSON.parse(localStorage.getItem('sinyal_wallpaper') || '{}'),
  settings: {
    theme: localStorage.getItem('sinyal_theme') || 'sinyal',
    size: localStorage.getItem('sinyal_size') || 'medium'
  }
};

// Apply saved settings on load
function applySettings() {
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  document.documentElement.setAttribute('data-size', state.settings.size);
}
applySettings();

// ============ Subscriptions ============
function clearSubscriptions() {
  state.subscriptions.forEach(sub => supabase.removeChannel(sub));
  state.subscriptions = [];
  if (state.presenceChannel) {
    supabase.removeChannel(state.presenceChannel);
    state.presenceChannel = null;
  }
  if (state.activeChatChannel) {
    supabase.removeChannel(state.activeChatChannel);
    state.activeChatChannel = null;
  }
  state.typingUsers.clear();
}

function setupPresence() {
  if (!state.me) return;
  state.presenceChannel = supabase.channel('online_users');
  state.presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const stateData = state.presenceChannel.presenceState();
      state.onlineUsers.clear();
      for (const id in stateData) {
        state.onlineUsers.add(stateData[id][0].user_id);
      }
      if (state.view === 'home' || state.view === 'chat') render();
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await state.presenceChannel.track({ user_id: state.me.id });
      }
    });
}

function setupHomeSubscription() {
  clearSubscriptions();
  setupPresence();
  
  if (!state.me) return;

  const channel = supabase.channel('home_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, payload => {
      loadHomeData().then(render);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${state.me.id}` }, payload => {
      loadHomeData().then(render);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${state.me.id}` }, payload => {
      loadHomeData().then(render);
    })
    .subscribe();
  
  state.subscriptions.push(channel);
}

function setupChatSubscription(chatPartnerId) {
  clearSubscriptions();
  setupPresence();
  
  if (!state.me) return;

  const channelId = `chat_${Math.min(state.me.id, chatPartnerId)}_${Math.max(state.me.id, chatPartnerId)}`;
  const channel = supabase.channel(channelId)
    .on('broadcast', { event: 'typing' }, payload => {
      if (payload.payload.user_id === chatPartnerId) {
        state.typingUsers.add(chatPartnerId);
        render();
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
          state.typingUsers.delete(chatPartnerId);
          render();
        }, 3000);
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${state.me.id}` }, payload => {
      if (payload.new.sender_id === chatPartnerId) {
        db.markMessagesAsRead(chatPartnerId, state.me.id);
        state.messages.push({
          id: payload.new.id,
          from: payload.new.sender_id,
          text: payload.new.text,
          ts: payload.new.created_at,
          read_at: new Date().toISOString(),
          media_url: payload.new.media_url,
          media_type: payload.new.media_type,
          reply_to: payload.new.reply_to,
          reactions: payload.new.reactions || {}
        });
        render();
        scrollMessagesToBottom();
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${state.me.id}` }, payload => {
      if (payload.new.receiver_id === chatPartnerId) {
        const msg = state.messages.find(m => m.id === payload.new.id);
        if (msg) {
          msg.read_at = payload.new.read_at;
          msg.reactions = payload.new.reactions || {};
          render();
        } else {
          refreshMessages().then(() => {
            render();
            scrollMessagesToBottom();
          });
        }
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${state.me.id}` }, payload => {
      // Handle reactions from the other person on their own messages
      if (payload.new.sender_id === chatPartnerId) {
        const msg = state.messages.find(m => m.id === payload.new.id);
        if (msg) {
          msg.reactions = payload.new.reactions || {};
          render();
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        state.activeChatChannel = channel;
      }
    });
    
  state.subscriptions.push(channel);
}

// ============ Core Logic ============
async function init() {
  try {
    const saved = localStorage.getItem('sinyal_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      const user = await db.getUser(parsed.id);
      if (user) {
        state.me = { id: user.id, name: user.name, avatar_url: user.avatar_url };
        await goHome();
        return;
      } else {
        localStorage.removeItem('sinyal_profile');
      }
    }
  } catch (e) {
    console.error(e);
  }
  state.view = 'onboarding';
  render();
}

function setOnboardMode(mode) {
  state.error = '';
  state.onboardMode = mode;
  render();
}

async function createAccount() {
  const nameInput = document.getElementById('name-input');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) { state.error = 'Nama tidak boleh kosong.'; render(); return; }
  
  state.busy = true; state.error = ''; render();

  try {
    let id, exists = true;
    while (exists) {
      id = String(Math.floor(100000 + Math.random() * 900000));
      const user = await db.getUser(id);
      if (!user) exists = false;
    }
    
    await db.createUser(id, name);
    state.me = { id, name, avatar_url: null };
    localStorage.setItem('sinyal_profile', JSON.stringify(state.me));
    
    state.onboardMode = 'created';
  } catch (err) {
    state.error = 'Terjadi kesalahan jaringan atau Supabase belum dikonfigurasi.';
  } finally {
    state.busy = false;
    render();
  }
}

async function loginWithId() {
  const idInput = document.getElementById('login-id-input');
  const id = idInput ? idInput.value.replace(/\s+/g, '') : '';
  if (!/^\d{6}$/.test(id)) { state.error = 'Masukkan ID 6 digit yang valid.'; render(); return; }
  
  state.busy = true; state.error = ''; render();
  
  try {
    const user = await db.getUser(id);
    if (!user) {
      state.error = 'ID tidak ditemukan.';
    } else {
      state.me = { id: user.id, name: user.name, avatar_url: user.avatar_url };
      localStorage.setItem('sinyal_profile', JSON.stringify(state.me));
      await goHome();
      return;
    }
  } catch (err) {
    state.error = 'Terjadi kesalahan jaringan.';
  }
  
  state.busy = false;
  render();
}

async function logout() {
  clearSubscriptions();
  localStorage.removeItem('sinyal_profile');
  state.me = null;
  state.view = 'onboarding';
  state.onboardMode = 'choice';
  state.error = '';
  render();
}

// ============ Home ============
async function goHome() {
  state.view = 'home';
  state.showAddPanel = false;
  state.error = '';
  await loadHomeData();
  setupHomeSubscription();
  render();
}

function goSettings() {
  state.view = 'settings';
  render();
}

function setTheme(theme) {
  state.settings.theme = theme;
  localStorage.setItem('sinyal_theme', theme);
  applySettings();
  render();
}

function setSize(size) {
  state.settings.size = size;
  localStorage.setItem('sinyal_size', size);
  applySettings();
  render();
}

async function editNameAction() {
  const newName = prompt("Masukkan nama baru Anda:", state.me.name);
  if (!newName || newName.trim() === '' || newName === state.me.name) return;
  
  const oldName = state.me.name;
  state.me.name = newName.trim();
  render(); // Optimistic update
  
  try {
    await db.updateUserName(state.me.id, state.me.name);
    localStorage.setItem('sinyal_profile', JSON.stringify(state.me));
  } catch (err) {
    console.error("Gagal mengganti nama", err);
    alert("Gagal mengganti nama. Pastikan koneksi internet aktif.");
    state.me.name = oldName;
    render();
  }
}

async function loadHomeData() {
  if (!state.me) return;
  
  try {
    const { mutualIds, pendingIds, incomingIds } = await db.getMutuals(state.me.id);
    
    const [mutualUsers, pendingUsers, incomingUsers, unreadRes, blocksRes] = await Promise.all([
      db.getUsersByIds(mutualIds),
      db.getUsersByIds(pendingIds),
      db.getUsersByIds(incomingIds),
      supabase.from('messages').select('sender_id').eq('receiver_id', state.me.id).is('read_at', null),
      db.getBlocks(state.me.id)
    ]);
    
    state.blockedByMe = new Set(blocksRes || []);
    
    // Count unread messages
    state.unreadCounts = {};
    if (unreadRes.data) {
      unreadRes.data.forEach(m => {
        state.unreadCounts[m.sender_id] = (state.unreadCounts[m.sender_id] || 0) + 1;
      });
    }

    state.mutualList = await Promise.all(mutualUsers.map(async u => {
      const lastMsg = await db.getLastMessage(state.me.id, u.id);
      return {
        id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        lastText: lastMsg ? lastMsg.text : null,
        lastTs: lastMsg ? lastMsg.created_at : 0,
        lastMine: lastMsg ? lastMsg.sender_id === state.me.id : false,
        lastRead: lastMsg ? !!lastMsg.read_at : false
      };
    }));
    
    state.mutualList.sort((a, b) => new Date(b.lastTs || 0) - new Date(a.lastTs || 0));
    
    state.pendingList = pendingUsers.map(u => ({ id: u.id, name: u.name, avatar_url: u.avatar_url }));
    state.incomingList = incomingUsers.map(u => ({ id: u.id, name: u.name, avatar_url: u.avatar_url }));
  } catch (e) {
    console.error("Error loading home data", e);
  }
}

function toggleAddPanel() {
  state.showAddPanel = !state.showAddPanel;
  state.error = '';
  state.addFriendInput = '';
  render();
}

async function addFriendAction() {
  const input = document.getElementById('add-friend-input');
  const targetId = input ? input.value.replace(/\s+/g, '') : '';
  
  if (!/^\d{6}$/.test(targetId)) { state.error = 'Masukkan ID 6 digit yang valid.'; render(); return; }
  if (targetId === state.me.id) { state.error = 'Tidak bisa menambahkan ID sendiri.'; render(); return; }

  state.busy = true; render();
  
  try {
    const targetUser = await db.getUser(targetId);
    if (!targetUser) {
      state.error = 'ID tidak ditemukan.';
    } else {
      await db.addFollow(state.me.id, targetId);
      state.showAddPanel = false;
      state.error = '';
      await loadHomeData();
    }
  } catch (err) {
    state.error = 'Gagal menambahkan teman.';
  }
  
  state.busy = false;
  render();
}

async function addBack(id) {
  state.busy = true; render();
  try {
    await db.addFollow(state.me.id, id);
    await loadHomeData();
  } catch (e) {}
  state.busy = false;
  render();
}

function copyMyId() {
  const text = state.me.id;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  const el = document.getElementById('copy-feedback');
  if (el) { 
    el.textContent = 'Disalin!'; 
    setTimeout(() => { if (el) el.textContent = 'Salin'; }, 1500); 
  }
}

async function uploadAvatarAction(file) {
  if (!file) return;
  state.busy = true; render();
  
  try {
    const url = await db.uploadAvatar(state.me.id, file);
    state.me.avatar_url = url;
    localStorage.setItem('sinyal_profile', JSON.stringify(state.me));
  } catch (err) {
    alert("Gagal mengunggah foto profil: " + err.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function removeAvatarAction() {
  if (!confirm("Hapus foto profil?")) return;
  state.busy = true; render();
  try {
    await db.removeAvatar(state.me.id);
    state.me.avatar_url = null;
    localStorage.setItem('sinyal_profile', JSON.stringify(state.me));
  } catch(e) {
    alert("Gagal menghapus foto: " + e.message);
  } finally {
    state.busy = false;
    render();
  }
}

let cropperInstance = null;

function toggleAvatarActionMenu() {
  let menu = document.getElementById('avatar-action-menu-overlay');
  if (menu) {
    menu.remove();
  } else {
    const html = `
      <div class="modal-overlay" id="avatar-action-menu-overlay">
        <div class="avatar-action-menu fade-in">
          <button class="avatar-action-btn" id="action-change-avatar">${ICONS.edit} Ubah Foto</button>
          <button class="avatar-action-btn danger" id="action-remove-avatar">${ICONS.logout} Hapus Foto</button>
          <button class="avatar-action-btn" id="action-cancel-avatar" style="justify-content:center;">Batal</button>
        </div>
      </div>
    `;
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
    
    document.getElementById('action-change-avatar').onclick = () => {
      document.getElementById('avatar-action-menu-overlay').remove();
      document.getElementById('avatar-upload-input').click();
    };
    document.getElementById('action-remove-avatar').onclick = () => {
      document.getElementById('avatar-action-menu-overlay').remove();
      removeAvatarAction();
    };
    document.getElementById('action-cancel-avatar').onclick = () => {
      document.getElementById('avatar-action-menu-overlay').remove();
    };
  }
}

// ============ Chat Actions ============

function toggleChatSearch() {
  state.showChatSearch = !state.showChatSearch;
  if (!state.showChatSearch) {
    state.searchQuery = '';
  }
  render();
}

function toggleChatMenu() {
  let menu = document.getElementById('chat-action-menu-overlay');
  if (menu) {
    menu.remove();
  } else {
    const isBlocked = state.blockedByMe.has(state.activeChat.id);
    const hasWallpaper = !!state.chatWallpaper[state.activeChat.id];
    const html = `
      <div class="modal-overlay" id="chat-action-menu-overlay">
        <div class="avatar-action-menu fade-in">
          ${hasWallpaper ? `<button class="avatar-action-btn danger" id="action-remove-wallpaper">${ICONS.trash} Hapus Wallpaper</button>` : ''}
          <button class="avatar-action-btn" id="action-wallpaper">${ICONS.image} Atur Wallpaper</button>
          <button class="avatar-action-btn" id="action-view-user">${ICONS.user} Lihat User</button>
          <button class="avatar-action-btn" id="action-search-chat">${ICONS.search} Cari Pesan</button>
          <button class="avatar-action-btn ${isBlocked ? '' : 'danger'}" id="action-block-user">${ICONS.shield} ${isBlocked ? 'Buka Blokir' : 'Blokir'}</button>
          <button class="avatar-action-btn danger" id="action-clear-chat">${ICONS.trash} Bersihkan Obrolan</button>
          <button class="avatar-action-btn" id="action-cancel-chat-menu" style="justify-content:center;">Batal</button>
        </div>
      </div>
    `;
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
    
    if (hasWallpaper) {
      document.getElementById('action-remove-wallpaper').onclick = () => {
        document.getElementById('chat-action-menu-overlay').remove();
        delete state.chatWallpaper[state.activeChat.id];
        localStorage.setItem('sinyal_wallpaper', JSON.stringify(state.chatWallpaper));
        render();
      };
    }
    
    document.getElementById('action-wallpaper').onclick = () => {
      document.getElementById('chat-action-menu-overlay').remove();
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              state.chatWallpaper[state.activeChat.id] = dataUrl;
              localStorage.setItem('sinyal_wallpaper', JSON.stringify(state.chatWallpaper));
              render();
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    };
    
    document.getElementById('action-view-user').onclick = () => {
      document.getElementById('chat-action-menu-overlay').remove();
      toggleProfileModal();
    };
    
    document.getElementById('action-search-chat').onclick = () => {
      document.getElementById('chat-action-menu-overlay').remove();
      toggleChatSearch();
    };
    
    document.getElementById('action-block-user').onclick = async () => {
      document.getElementById('chat-action-menu-overlay').remove();
      state.busy = true; render();
      try {
        if (isBlocked) {
          await db.unblockUser(state.me.id, state.activeChat.id);
          state.blockedByMe.delete(state.activeChat.id);
        } else {
          await db.blockUser(state.me.id, state.activeChat.id);
          state.blockedByMe.add(state.activeChat.id);
        }
      } catch(e) {
        alert("Gagal mengubah status blokir: " + e.message);
      } finally {
        state.busy = false;
        render();
      }
    };
    
    document.getElementById('action-clear-chat').onclick = async () => {
      document.getElementById('chat-action-menu-overlay').remove();
      if (!confirm("Yakin ingin menghapus semua pesan dalam obrolan ini?")) return;
      state.busy = true; render();
      try {
        await db.clearChat(state.me.id, state.activeChat.id);
        state.messages = [];
      } catch(e) {
        alert("Gagal menghapus pesan: " + e.message);
      } finally {
        state.busy = false;
        render();
      }
    };
    
    document.getElementById('action-cancel-chat-menu').onclick = () => {
      document.getElementById('chat-action-menu-overlay').remove();
    };
  }
}

function showCropperModal(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const html = `
      <div class="modal-overlay" id="cropper-modal-overlay" style="z-index:200;">
        <div class="cropper-modal-box fade-in">
          <div class="cropper-container-wrapper">
            <img id="cropper-image" src="${dataUrl}" style="max-width:100%; display:block;">
          </div>
          <div class="cropper-actions">
            <button class="btn btn-ghost" id="cropper-cancel" style="flex:1;">Batal</button>
            <button class="btn btn-primary" id="cropper-apply" style="flex:1;">Simpan</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
    
    const image = document.getElementById('cropper-image');
    cropperInstance = new window.Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      cropBoxMovable: false,
      cropBoxResizable: false,
      guides: false,
      center: false,
      highlight: false,
      background: false
    });
    
    document.getElementById('cropper-cancel').onclick = () => {
      if (cropperInstance) cropperInstance.destroy();
      document.getElementById('cropper-modal-overlay').remove();
      document.getElementById('avatar-upload-input').value = ""; // Reset file input
    };
    
    document.getElementById('cropper-apply').onclick = () => {
      if (!cropperInstance) return;
      cropperInstance.getCroppedCanvas({
        width: 300,
        height: 300,
      }).toBlob((blob) => {
        if (!blob) return;
        blob.name = 'avatar.png';
        document.getElementById('cropper-modal-overlay').remove();
        cropperInstance.destroy();
        cropperInstance = null;
        document.getElementById('avatar-upload-input').value = ""; // Reset file input
        uploadAvatarAction(blob);
      }, 'image/png');
    };
  };
  reader.readAsDataURL(file);
}

function copyProfileId() {
  if (!state.activeChat) return;
  const text = state.activeChat.id;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  const el = document.getElementById('copy-profile-feedback');
  if (el) { 
    el.textContent = 'Tersalin!'; 
    setTimeout(() => { if (el) el.textContent = 'Salin ID'; }, 1500); 
  }
}

function toggleProfileModal() {
  state.showProfileModal = !state.showProfileModal;
  const overlay = document.getElementById('profile-modal-overlay');
  
  if (state.showProfileModal) {
    if (!overlay && state.activeChat) {
      const c = state.activeChat;
      const modalHtml = `
        <div class="modal-overlay" id="profile-modal-overlay">
          <div class="profile-modal fade-in" id="profile-modal-box">
            <button class="close-btn" id="close-profile-btn">✕</button>
            ${renderAvatarHtml(c.name, c.avatar_url)}
            <div class="profile-name">${escapeHtml(c.name)}</div>
            <div class="profile-id">${formatId(c.id)}</div>
            <button class="btn btn-primary btn-block" id="copy-profile-btn" style="margin-top:16px;">
              <span id="copy-profile-feedback">Salin ID</span>
            </button>
          </div>
        </div>
      `;
      document.getElementById('app').insertAdjacentHTML('beforeend', modalHtml);
      
      document.getElementById('close-profile-btn').onclick = toggleProfileModal;
      document.getElementById('copy-profile-btn').onclick = copyProfileId;
      document.getElementById('profile-modal-overlay').onclick = (e) => {
        if (e.target.id === 'profile-modal-overlay') toggleProfileModal();
      };
    }
  } else {
    if (overlay) overlay.remove();
  }
}

// ============ Chat ============
async function openChat(id, name, avatar_url) {
  state.view = 'chat';
  state.activeChat = { id, name, avatar_url };
  state.draftText = '';
  
  setupChatSubscription(id);
  
  // Mark messages as read immediately
  await db.markMessagesAsRead(id, state.me.id);
  state.unreadCounts[id] = 0;
  
  await refreshMessages();
  render();
}

async function refreshMessages() {
  if (!state.activeChat || !state.me) return;
  try {
    const rawMsgs = await db.getMessages(state.me.id, state.activeChat.id);
    state.messages = rawMsgs.map(m => ({
      id: m.id,
      from: m.sender_id,
      text: m.text,
      ts: m.created_at,
      read_at: m.read_at,
      media_url: m.media_url,
      media_type: m.media_type,
      reply_to: m.reply_to,
      reactions: m.reactions || {}
    }));
  } catch (e) {
    state.messages = [];
  }
}

async function sendMessage() {
  const input = document.getElementById('composer-input');
  const text = (input ? input.value : state.draftText).trim();
  
  if ((!text && !state.draftMediaUrl) || !state.activeChat || state.busy) return;
  
  state.busy = true;
  state.draftText = '';
  
  const mediaFile = state.draftMediaFile;
  const replyToId = state.replyingTo ? state.replyingTo.id : null;
  
  // Clear drafts
  state.draftMediaUrl = null;
  state.draftMediaFile = null;
  state.replyingTo = null;
  
  if (input) input.value = '';
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;
  
  const tempId = 'temp-' + Date.now();
  const tempMsg = { 
    id: tempId, 
    from: state.me.id, 
    text, 
    ts: new Date().toISOString(), 
    read_at: null,
    media_url: mediaFile ? 'uploading' : null,
    reply_to: replyToId,
    reactions: {}
  };
  state.messages.push(tempMsg);
  
  const msgContainer = document.getElementById('messages-container');
  if (msgContainer) {
    msgContainer.innerHTML = getChatMessagesHtml();
    scrollMessagesToBottom();
    // Also re-render composer to remove reply/media previews
    render(); 
  }

  try {
    let finalMediaUrl = null;
    let finalMediaType = null;
    
    if (mediaFile) {
      finalMediaUrl = await db.uploadChatMedia(mediaFile);
      finalMediaType = mediaFile.type;
    }
    
    const data = await db.sendMessage(state.me.id, state.activeChat.id, text, finalMediaUrl, finalMediaType, replyToId);
    
    if (data) {
      const msgIndex = state.messages.findIndex(m => m.id === tempId);
      if (msgIndex !== -1) {
        state.messages[msgIndex].id = data.id;
        state.messages[msgIndex].media_url = finalMediaUrl;
        state.messages[msgIndex].media_type = finalMediaType;
      }
      if (msgContainer) msgContainer.innerHTML = getChatMessagesHtml();
    }
  } catch (e) {
    console.error("Failed to send message", e);
    // Remove temp message on failure
    state.messages = state.messages.filter(m => m.id !== tempId);
    if (msgContainer) msgContainer.innerHTML = getChatMessagesHtml();
    alert("Gagal mengirim pesan.");
  }
  
  state.busy = false;
  if (input) input.focus();
}

async function sendReaction(msgId, emoji) {
  try {
    await db.reactToMessage(msgId, emoji, state.me.id);
    // The realtime subscription will update the UI
  } catch (err) {
    console.error("Gagal mengirim reaksi", err);
  }
}

function setReply(msgId) {
  const msg = state.messages.find(m => m.id === msgId);
  if (msg) {
    state.replyingTo = msg;
    render();
    const input = document.getElementById('composer-input');
    if (input) input.focus();
  }
}

function cancelReply() {
  state.replyingTo = null;
  render();
}

function compressAndAttachImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 0.7 quality
      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = file.name || 'image.jpg';
        state.draftMediaFile = blob;
        state.draftMediaUrl = canvas.toDataURL('image/jpeg', 0.7);
        render();
      }, 'image/jpeg', 0.7);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function cancelAttachment() {
  state.draftMediaFile = null;
  state.draftMediaUrl = null;
  render();
}

window.toggleRecording = async function() {
  if (state.isRecording) {
    if (state.mediaRecorder) {
      state.mediaRecorder.stop();
    }
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];
      
      state.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) state.audioChunks.push(e.data);
      };
      
      state.mediaRecorder.onstop = () => {
        clearInterval(state.recordingInterval);
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        // Ensure standard name and type so it sends cleanly
        audioBlob.name = 'voicenote.webm';
        stream.getTracks().forEach(track => track.stop());
        
        state.isRecording = false;
        state.mediaRecorder = null;
        
        state.draftMediaFile = audioBlob;
        state.draftMediaUrl = URL.createObjectURL(audioBlob);
        render();
      };
      
      state.isRecording = true;
      state.recordingTime = 0;
      state.mediaRecorder.start();
      
      state.recordingInterval = setInterval(() => {
        state.recordingTime++;
        const recTimeEl = document.getElementById('recording-time');
        if (recTimeEl) {
          const mins = Math.floor(state.recordingTime / 60);
          const secs = state.recordingTime % 60;
          recTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
      }, 1000);
      
      render();
    } catch (err) {
      alert("Tidak dapat mengakses mikrofon. Pastikan izin telah diberikan.");
      console.error(err);
    }
  }
};

// Update last seen periodically
setInterval(() => {
  if (state.me) db.updateLastSeen(state.me.id);
}, 60000);


// ============ Renderers ============
function waveHtml() {
  return `<div class="waveform"><span></span><span></span><span></span><span></span><span></span></div>`;
}

function renderOnboarding() {
  const mode = state.onboardMode;
  const errorHtml = state.error ? `<div class="error-text">${state.error}</div>` : '';

  if (mode === 'choice') {
    return `
      <div class="onboard fade-in">
        <div class="onboard-hero">
          <div class="freq">— S I N Y A L —</div>
          <h1>Sinyal</h1>
          <p>Ngobrol 1-on-1. Tiap orang punya ID sendiri, saling tambahkan ID untuk mulai terhubung.</p>
        </div>
        <div class="onboard-wave">${waveHtml()}</div>
        <div class="onboard-actions" style="margin-top:20px;">
          <button class="btn btn-primary btn-block" id="go-create">Buat ID Baru</button>
          <button class="btn btn-ghost btn-block" id="go-login">Masuk dengan ID</button>
        </div>
      </div>`;
  }

  if (mode === 'create') {
    return `
      <div class="onboard fade-in">
        <div class="onboard-hero">
          <div class="freq">BUAT ID</div>
          <h1 style="font-size:28px;">Siapa nama kamu?</h1>
          <p>Nama ini yang akan dilihat orang lain saat terhubung denganmu.</p>
        </div>
        <div class="field-group">
          <input class="field" id="name-input" placeholder="Nama kamu" autofocus>
          ${errorHtml}
        </div>
        <div class="onboard-actions" style="margin-top:10px;">
          <button class="btn btn-primary btn-block" id="submit-create" ${state.busy?'disabled':''}>
            ${state.busy ? 'Membuat...' : 'Buat ID'}
          </button>
          <div class="link-row"><a id="back-choice">← Kembali</a></div>
        </div>
      </div>`;
  }

  if (mode === 'created') {
    return `
      <div class="onboard fade-in">
        <div class="onboard-hero">
          <div class="freq">BERHASIL</div>
          <h1 style="font-size:28px;">ID kamu siap</h1>
          <p>Simpan ID ini. Bagikan ke teman supaya mereka bisa menambahkanmu.</p>
        </div>
        <div class="id-reveal">
          <div class="muted" style="font-size:12px;letter-spacing:1px;font-weight:700;">ID FREKUENSI KAMU</div>
          <div class="idval">${formatId(state.me.id)}</div>
          <button class="btn btn-ghost btn-sm" id="copy-created-id" style="margin: 0 auto;">Salin ID</button>
        </div>
        <button class="btn btn-primary btn-block" id="enter-app">Lanjut ke Sinyal</button>
      </div>`;
  }

  if (mode === 'login') {
    return `
      <div class="onboard fade-in">
        <div class="onboard-hero">
          <div class="freq">MASUK</div>
          <h1 style="font-size:28px;">Masukkan ID kamu</h1>
          <p>Sudah punya ID dari perangkat lain? Masuk di sini.</p>
        </div>
        <div class="field-group">
          <input class="field field-id" id="login-id-input" placeholder="000000" maxlength="6" inputmode="numeric" autofocus>
          ${errorHtml}
        </div>
        <div class="onboard-actions" style="margin-top:10px;">
          <button class="btn btn-primary btn-block" id="submit-login" ${state.busy?'disabled':''}>
            ${state.busy ? 'Memeriksa...' : 'Masuk'}
          </button>
          <div class="link-row"><a id="back-choice2">← Kembali</a></div>
        </div>
      </div>`;
  }
}

function renderHome() {
  const addPanel = state.showAddPanel ? `
    <div class="add-panel">
      <div class="label">Tambah teman lewat ID</div>
      <input class="field field-id" id="add-friend-input" placeholder="000000" maxlength="6" inputmode="numeric" value="${escapeHtml(state.addFriendInput)}" autofocus>
      ${state.error ? `<div class="error-text">${escapeHtml(state.error)}</div>` : ''}
      <div style="display:flex;gap:12px;margin-top:4px;">
        <button class="btn btn-primary btn-sm" id="submit-add-friend" style="flex:1;" ${state.busy?'disabled':''}>
          ${state.busy ? 'Memeriksa...' : 'Tambahkan'}
        </button>
        <button class="btn btn-ghost btn-sm" id="cancel-add-friend" style="flex:1;">Batal</button>
      </div>
    </div>` : '';

  const incomingHtml = state.incomingList.length ? `
    <div class="section-title">Permintaan masuk</div>
    ${state.incomingList.map(p => `
      <div class="person-row">
        ${renderAvatarHtml(p.name, p.avatar_url)}
        <div class="person-info">
          <div class="person-name">${escapeHtml(p.name)}</div>
          <div class="person-sub">Menambahkanmu lewat ID</div>
        </div>
        <button class="btn btn-primary btn-sm addback-btn" data-id="${p.id}">Tambah balik</button>
      </div>`).join('')}
  ` : '';

  const mutualHtml = `
    <div class="section-title">Terhubung</div>
    ${state.mutualList.length ? state.mutualList.map(p => {
      const isOnline = state.onlineUsers.has(p.id);
      const unread = state.unreadCounts[p.id] || 0;
      
      let subText = '<span style="color:var(--accent-dim);">Ketuk untuk mulai obrolan</span>';
      if (p.lastText) {
        if (p.lastMine) {
          const tick = p.lastRead ? ICONS.checkDouble : ICONS.check;
          subText = `<span class="msg-status ${p.lastRead?'read':''}">${tick}</span> ${escapeHtml(p.lastText)}`;
        } else {
          subText = escapeHtml(p.lastText);
        }
      }
      
      if (unread > 0) {
        subText = `<strong style="color:var(--text);">${subText}</strong>`;
      }

      return `
      <div class="person-row open-chat" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-avatar="${escapeHtml(p.avatar_url || '')}">
        ${renderAvatarHtml(p.name, p.avatar_url)}
        <div class="person-info">
          <div class="person-name">
            <span class="status-dot ${isOnline ? 'online' : ''}"></span>
            ${escapeHtml(p.name)}
            ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
          </div>
          <div class="person-sub">${subText}</div>
        </div>
        <div class="person-meta">${p.lastTs ? fmtTime(p.lastTs) : ''}</div>
      </div>`;
    }).join('') : `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.empty}</div>
        Belum ada koneksi.<br>Tambahkan ID teman untuk mulai mengobrol.
      </div>`}
  `;

  const pendingHtml = state.pendingList.length ? `
    <div class="section-title">Menunggu balasan</div>
    ${state.pendingList.map(p => `
      <div class="person-row" style="opacity: 0.6;">
        ${renderAvatarHtml(p.name, p.avatar_url)}
        <div class="person-info">
          <div class="person-name">${escapeHtml(p.name)}</div>
          <div class="person-sub">Menunggu mereka menambahkanmu balik</div>
        </div>
      </div>`).join('')}
  ` : '';

  return `
    <div class="header fade-in">
      <div class="brand"><span class="dot"></span>SINYAL</div>
      <div style="display:flex;gap:8px;">
        <button class="icon-btn" id="settings-btn" title="Pengaturan">${ICONS.settings}</button>
        <button class="icon-btn" id="logout-btn" title="Keluar">${ICONS.logout}</button>
      </div>
    </div>
    <div class="home-id-bar fade-in">
      <div>
        <div class="idlabel">ID KAMU</div>
        <div class="idtext">${formatId(state.me.id)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" id="copy-home-id"><span id="copy-feedback">Salin</span></button>
    </div>
    <div class="scroll-area fade-in">
      <div style="padding:0 24px;">
        <button class="btn btn-primary btn-block" id="toggle-add-panel" style="margin-top:12px; background: var(--surface-3); color: var(--text); border: 1px dashed var(--line); box-shadow: none;">
          ${state.showAddPanel ? 'Tutup Panel' : '+ Tambah Teman'}
        </button>
      </div>
      <div style="margin-top:12px;">${addPanel}</div>
      ${incomingHtml}
      ${mutualHtml}
      ${pendingHtml}
    </div>`;
}

window.toggleReactionMenu = function(msgId, event) {
  let menu = document.getElementById('reaction-menu-overlay');
  if (menu) menu.remove();
  
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const html = `
    <div class="modal-overlay" id="reaction-menu-overlay" onclick="this.remove()">
      <div class="reaction-menu fade-in" onclick="event.stopPropagation()">
        ${emojis.map(e => `<button class="reaction-btn" onclick="sendReaction('${msgId}', '${e}'); document.getElementById('reaction-menu-overlay').remove();">${e}</button>`).join('')}
      </div>
    </div>
  `;
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
};

window.handleTyping = function(event) {
  state.draftText = event.target.value; 
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = (!state.draftText.trim() && !state.draftMediaUrl);
  
  if (state.activeChatChannel && state.me && state.activeChat) {
    state.activeChatChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: state.me.id }
    }).catch(e => {}); // ignore errors if channel is not ready
  }
};

function getChatMessagesHtml() {
  const c = state.activeChat;
  let msgs = state.messages;
  
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    msgs = msgs.filter(m => (m.text || '').toLowerCase().includes(q));
  }

  return msgs.length ? msgs.map(m => {
    const mine = m.from === state.me.id;
    let ticks = '';
    if (mine) {
      ticks = `<span class="msg-status ${m.read_at ? 'read' : ''}">${m.read_at ? ICONS.checkDouble : ICONS.check}</span>`;
    }

    let mediaHtml = '';
    if (m.media_url) {
      if (m.media_url === 'uploading') {
         mediaHtml = `<div class="msg-media-loading"><div style="opacity:0.6;font-size:12px;">Mengunggah media...</div></div>`;
      } else if (m.media_type && m.media_type.startsWith('image/')) {
         mediaHtml = `<img src="${escapeHtml(m.media_url)}" class="msg-image" alt="Image" onclick="window.open(this.src)" />`;
      } else if (m.media_type && m.media_type.startsWith('audio/')) {
         mediaHtml = `<audio src="${escapeHtml(m.media_url)}" controls class="msg-audio"></audio>`;
      } else {
         mediaHtml = `<a href="${escapeHtml(m.media_url)}" target="_blank" class="msg-file">📄 File Lampiran</a>`;
      }
    }

    let replyHtml = '';
    if (m.reply_to) {
      const repliedMsg = state.messages.find(msg => msg.id === m.reply_to);
      if (repliedMsg) {
         replyHtml = `<div class="msg-reply" onclick="document.getElementById('msg-${repliedMsg.id}')?.scrollIntoView({behavior:'smooth'})">
           <div class="msg-reply-name">${repliedMsg.from === state.me.id ? 'Anda' : escapeHtml(c.name)}</div>
           <div class="msg-reply-text">${escapeHtml(repliedMsg.text || '📷 Media')}</div>
         </div>`;
      }
    }

    let reactionsHtml = '';
    if (m.reactions && Object.keys(m.reactions).length > 0) {
       reactionsHtml = `<div class="msg-reactions">
         ${Object.entries(m.reactions).map(([emoji, users]) => `
           <span class="reaction-badge" onclick="sendReaction('${m.id}', '${emoji}')">${emoji} <small>${users.length}</small></span>
         `).join('')}
       </div>`;
    }

    return `
      <div class="msg-row ${mine ? 'msg-row-mine' : 'msg-row-theirs'}" id="msg-${m.id}">
        ${!mine ? `<button class="icon-btn reply-btn" onclick="setReply('${m.id}')" title="Balas" style="margin-right:4px;opacity:0.5;">${ICONS.back}</button>` : ''}
        <div class="msg ${mine ? 'msg-mine' : 'msg-theirs'}" 
             oncontextmenu="event.preventDefault(); toggleReactionMenu('${m.id}', event)">
          ${replyHtml}
          ${mediaHtml}
          ${m.text ? `<div>${escapeHtml(m.text)}</div>` : ''}
          <div class="msg-time">${fmtTime(m.ts)} ${ticks}</div>
          ${reactionsHtml}
        </div>
        ${mine ? `<button class="icon-btn reply-btn" onclick="setReply('${m.id}')" title="Balas" style="margin-left:4px;opacity:0.5;">${ICONS.back}</button>` : ''}
      </div>`;
  }).join('') : `
    <div class="chat-empty">
      <div style="margin-bottom:16px; display:flex; justify-content:center;">
        <div class="empty-icon" style="width:64px;height:64px;">${ICONS.empty}</div>
      </div>
      ${state.searchQuery.trim() ? `Tidak ditemukan pesan dengan kata <b>"${escapeHtml(state.searchQuery)}"</b>` : `Belum ada pesan dengan <b>${escapeHtml(c.name)}</b>.<br>Kirim pesan pertama untuk memulai percakapan aman.`}
    </div>`;
}

function renderChat() {
  const c = state.activeChat;
  const isOnline = state.onlineUsers.has(c.id);
  const isBlocked = state.blockedByMe.has(c.id);
  const isTyping = state.typingUsers.has(c.id);
  
  const wallpaperBg = state.chatWallpaper[c.id] || '';
  const wallpaperStyle = wallpaperBg ? `background-image: url('${escapeHtml(wallpaperBg)}'); background-size: cover; background-position: center;` : '';

  const searchBarHtml = state.showChatSearch ? `
    <div class="chat-search-bar fade-in">
      <input type="text" class="field" id="chat-search-input" placeholder="Cari pesan..." value="${escapeHtml(state.searchQuery)}" autofocus>
      <button class="icon-btn" id="close-chat-search">${ICONS.back}</button>
    </div>
  ` : '';

  let draftMediaHtml = '';
  if (state.draftMediaUrl) {
    let previewContent = '';
    if (state.draftMediaFile && state.draftMediaFile.type.startsWith('audio/')) {
       previewContent = `<audio src="${state.draftMediaUrl}" controls class="msg-audio"></audio>`;
    } else {
       previewContent = `<img src="${state.draftMediaUrl}" />`;
    }
    draftMediaHtml = `
      <div class="draft-media-preview fade-in">
        ${previewContent}
        <button class="cancel-btn" onclick="cancelAttachment()">✕</button>
      </div>`;
  }
  
  let replyPreviewHtml = '';
  if (state.replyingTo) {
    replyPreviewHtml = `
      <div class="draft-reply-preview fade-in">
        <div class="reply-to-text">Membalas <b>${state.replyingTo.from === state.me.id ? 'Anda' : escapeHtml(c.name)}</b></div>
        <div class="reply-text-preview">${escapeHtml(state.replyingTo.text || '📷 Media')}</div>
        <button class="cancel-btn" onclick="cancelReply()">✕</button>
      </div>`;
  }

  return `
    <div class="chat-header fade-in" data-id="${c.id}" id="chat-header-area" style="cursor: pointer; z-index: 10;">
      <button class="icon-btn" id="back-home-btn" style="z-index: 2;">${ICONS.back}</button>
      ${renderAvatarHtml(c.name, c.avatar_url)}
      <div style="flex:1;">
        <div class="chat-name">${escapeHtml(c.name)}</div>
        <div class="chat-status" style="color: ${isOnline ? '#22c55e' : 'var(--text-muted)'};">
          <span class="status-dot ${isOnline ? 'online' : ''}" style="margin-right:4px;"></span>
          ${isTyping ? 'Sedang mengetik...' : (isOnline ? 'Online' : 'Offline')}
        </div>
      </div>
      <button class="icon-btn" id="chat-menu-btn" style="z-index: 2;">${ICONS.moreVert}</button>
    </div>
    ${searchBarHtml}
    
    <div class="messages" id="messages-container" style="${wallpaperStyle}">
      ${getChatMessagesHtml()}
    </div>
    
    ${isBlocked ? `
      <div class="composer fade-in" style="justify-content:center; padding: 20px;">
        <div style="color: var(--danger); font-size: 14px; font-weight: 600;">Anda telah memblokir pengguna ini.</div>
        <button class="btn btn-ghost btn-sm" id="unblock-btn" style="margin-left: 12px;">Buka Blokir</button>
      </div>
    ` : `
      <div class="composer-container fade-in">
        ${replyPreviewHtml}
        ${draftMediaHtml}
        <div class="composer">
          ${state.isRecording ? `
            <div class="recording-indicator">
              <span class="dot recording-dot" style="margin:0;"></span>
              <span id="recording-time">0:00</span>
              <span style="font-size:13px; font-weight:normal; color:var(--text-muted);">Merekam suara...</span>
            </div>
            <button class="send-btn" style="background:var(--danger);" onclick="toggleRecording()">${ICONS.send}</button>
          ` : `
            <input type="file" id="chat-attachment-input" accept="image/*" style="display:none;" onchange="compressAndAttachImage(this.files[0])">
            <button class="icon-btn" onclick="document.getElementById('chat-attachment-input').click()" title="Kirim Gambar">${ICONS.image}</button>
            <button class="icon-btn" onclick="toggleRecording()" title="Kirim Pesan Suara">${ICONS.mic}</button>
            <input class="field" id="composer-input" placeholder="Tulis pesan..." value="${escapeHtml(state.draftText)}" autocomplete="off" oninput="handleTyping(event)">
            <button class="send-btn" id="send-btn" ${(!state.draftText.trim() && !state.draftMediaUrl) ? 'disabled' : ''}>${ICONS.send}</button>
          `}
        </div>
      </div>
    `}
  `;
}

function renderSettings() {
  const themes = [
    { id: 'sinyal', name: 'Sinyal' },
    { id: 'lautmalam', name: 'Laut Malam' },
    { id: 'siang', name: 'Siang Bersih' }
  ];
  const sizes = [
    { id: 'small', label: 'Kecil', icon: 'Aa' },
    { id: 'medium', label: 'Sedang', icon: 'Aa' },
    { id: 'large', label: 'Besar', icon: 'Aa' }
  ];

  return `
    <div class="header fade-in">
      <button class="icon-btn" id="back-from-settings">${ICONS.back}</button>
      <div class="brand" style="flex:1;justify-content:center;">PENGATURAN</div>
      <div style="width:38px;"></div>
    </div>
    <div class="settings-page">
      <div class="settings-user-card">
        <div style="position:relative; cursor:pointer;" id="settings-avatar-btn">
          ${renderAvatarHtml(state.me?.name || '?', state.me?.avatar_url)}
          <div class="avatar-edit-overlay">${ICONS.edit}</div>
        </div>
        <input type="file" id="avatar-upload-input" accept="image/*" style="display:none;">
        
        <div style="flex:1;">
          <div class="user-name" style="display:flex;align-items:center;gap:8px;">
            ${escapeHtml(state.me?.name || '')}
            <button class="icon-btn" id="edit-name-btn" style="padding:4px;border-radius:6px;width:24px;height:24px;">${ICONS.edit}</button>
          </div>
          <div class="user-id">${formatId(state.me?.id || '')}</div>
        </div>
      </div>

      <div class="settings-divider" style="margin-top:20px;"></div>

      <div class="settings-section">
        <div class="settings-section-title">Tema Tampilan</div>
        <div class="theme-grid">
          ${themes.map(t => `
            <div class="theme-card ${state.settings.theme === t.id ? 'active' : ''}" data-t="${t.id}" id="theme-${t.id}">
              <div class="theme-card-preview">
                <div class="theme-preview-bubble"></div>
                <div class="theme-preview-bubble mine"></div>
                <div class="theme-preview-bubble"></div>
              </div>
              <div class="theme-card-label">${t.name}</div>
              <div class="theme-check">${ICONS.checkmark}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="settings-divider"></div>

      <div class="settings-section">
        <div class="settings-section-title">Ukuran Tampilan</div>
        <div class="size-options">
          ${sizes.map(s => `
            <button class="size-btn ${state.settings.size === s.id ? 'active' : ''}" data-s="${s.id}" id="size-${s.id}">
              <span class="size-btn-icon">${s.icon}</span>
              <span class="size-btn-label">${s.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="settings-divider"></div>

      <div class="settings-section">
        <button class="btn btn-ghost btn-block" id="settings-logout" style="gap:10px;">
          ${ICONS.logout} Keluar dari Akun
        </button>
      </div>
    </div>`;
}

function render() {
  const app = document.getElementById('app');
  if (state.view === 'loading') {
    app.innerHTML = `<div class="onboard fade-in"><div class="onboard-wave">${waveHtml()}</div></div>`;
  } else if (state.view === 'onboarding') {
    app.innerHTML = renderOnboarding();
    attachOnboardingHandlers();
  } else if (state.view === 'home') {
    app.innerHTML = renderHome();
    attachHomeHandlers();
  } else if (state.view === 'settings') {
    app.innerHTML = renderSettings();
    attachSettingsHandlers();
  } else if (state.view === 'chat') {
    if (app.querySelector(`.chat-header[data-id="${state.activeChat.id}"]`)) {
      // Partial update to avoid flickering and losing input focus
      const isOnline = state.onlineUsers.has(state.activeChat.id);
      
      const msgContainer = document.getElementById('messages-container');
      if (msgContainer) msgContainer.innerHTML = getChatMessagesHtml();
      
      const statusEl = document.querySelector('.chat-status');
      if (statusEl) {
        statusEl.style.color = isOnline ? '#22c55e' : 'var(--text-muted)';
        statusEl.innerHTML = `<span class="status-dot ${isOnline ? 'online' : ''}" style="margin-right:4px;"></span>${isOnline ? 'Online' : 'Offline'}`;
      }
      
      const btn = document.getElementById('send-btn');
      if (btn) btn.disabled = !state.draftText.trim();
      
      scrollMessagesToBottom();
    } else {
      app.innerHTML = renderChat();
      attachChatHandlers();
      scrollMessagesToBottom();
    }
  }
}

// ============ Event Handlers ============
function attachOnboardingHandlers() {
  const byId = id => document.getElementById(id);
  if (byId('go-create')) byId('go-create').onclick = () => setOnboardMode('create');
  if (byId('go-login')) byId('go-login').onclick = () => setOnboardMode('login');
  if (byId('back-choice')) byId('back-choice').onclick = () => setOnboardMode('choice');
  if (byId('back-choice2')) byId('back-choice2').onclick = () => setOnboardMode('choice');
  if (byId('submit-create')) byId('submit-create').onclick = createAccount;
  if (byId('submit-login')) byId('submit-login').onclick = loginWithId;
  if (byId('copy-created-id')) byId('copy-created-id').onclick = copyMyId;
  if (byId('enter-app')) byId('enter-app').onclick = goHome;
  
  const nameInput = byId('name-input');
  if (nameInput) nameInput.onkeydown = e => { if (e.key === 'Enter') createAccount(); };
  
  const loginInput = byId('login-id-input');
  if (loginInput) loginInput.onkeydown = e => { if (e.key === 'Enter') loginWithId(); };
}

function attachHomeHandlers() {
  const byId = id => document.getElementById(id);
  if (byId('logout-btn')) byId('logout-btn').onclick = logout;
  if (byId('settings-btn')) byId('settings-btn').onclick = goSettings;
  if (byId('copy-home-id')) byId('copy-home-id').onclick = copyMyId;
  if (byId('toggle-add-panel')) byId('toggle-add-panel').onclick = toggleAddPanel;
  if (byId('submit-add-friend')) byId('submit-add-friend').onclick = addFriendAction;
  if (byId('cancel-add-friend')) byId('cancel-add-friend').onclick = toggleAddPanel;
  
  const addInput = byId('add-friend-input');
  if (addInput) {
    addInput.oninput = e => { state.addFriendInput = e.target.value; };
    addInput.onkeydown = e => { if (e.key === 'Enter') addFriendAction(); };
  }
  
  document.querySelectorAll('.addback-btn').forEach(btn => {
    btn.onclick = () => addBack(btn.getAttribute('data-id'));
  });
  
  document.querySelectorAll('.open-chat').forEach(row => {
    row.onclick = () => openChat(row.getAttribute('data-id'), row.getAttribute('data-name'), row.getAttribute('data-avatar'));
  });
}

function attachSettingsHandlers() {
  const byId = id => document.getElementById(id);
  if (byId('back-from-settings')) byId('back-from-settings').onclick = goHome;
  if (byId('settings-logout')) byId('settings-logout').onclick = logout;
  if (byId('edit-name-btn')) byId('edit-name-btn').onclick = editNameAction;

  const avatarBtn = byId('settings-avatar-btn');
  const avatarInput = byId('avatar-upload-input');
  if (avatarBtn && avatarInput) {
    avatarBtn.onclick = () => toggleAvatarActionMenu();
    avatarInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) showCropperModal(file);
    };
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.onclick = () => setTheme(card.getAttribute('data-t'));
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => setSize(btn.getAttribute('data-s'));
  });
}

function attachChatHandlers() {
  const byId = id => document.getElementById(id);
  
  if (byId('back-home-btn')) {
    byId('back-home-btn').onclick = (e) => {
      e.stopPropagation(); // prevent opening modal
      goHome();
    };
  }
  
  if (byId('chat-header-area')) {
    byId('chat-header-area').onclick = () => {
      if (!state.showProfileModal) toggleProfileModal();
    };
  }
  
  if (byId('send-btn')) byId('send-btn').onclick = sendMessage;
  
  const input = byId('composer-input');
  const btn = byId('send-btn');
  if (input) {
    if (!state.showProfileModal && !state.showChatSearch) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    input.oninput = e => { 
      state.draftText = e.target.value; 
      if (btn) btn.disabled = !state.draftText.trim();
    };
    input.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };
  }
  
  if (byId('chat-menu-btn')) {
    byId('chat-menu-btn').onclick = (e) => {
      e.stopPropagation();
      toggleChatMenu();
    };
  }
  
  if (byId('close-chat-search')) {
    byId('close-chat-search').onclick = toggleChatSearch;
  }
  
  if (byId('chat-search-input')) {
    byId('chat-search-input').oninput = (e) => {
      state.searchQuery = e.target.value;
      const msgContainer = document.getElementById('messages-container');
      if (msgContainer) msgContainer.innerHTML = getChatMessagesHtml();
    };
  }
  
  if (byId('unblock-btn')) {
    byId('unblock-btn').onclick = async () => {
      state.busy = true; render();
      try {
        await db.unblockUser(state.me.id, state.activeChat.id);
        state.blockedByMe.delete(state.activeChat.id);
      } catch(e) {
        alert("Gagal membuka blokir.");
      } finally {
        state.busy = false;
        render();
      }
    };
  }
}

function scrollMessagesToBottom() {
  const el = document.getElementById('messages-container');
  if (el) el.scrollTop = el.scrollHeight;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
