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

const ICONS = {
  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  send: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#110d0a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  empty: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  checkDouble: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 10 11 21 8 18"></polyline></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  checkmark: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`
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

  const channel = supabase.channel('chat_updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${state.me.id}` }, payload => {
      if (payload.new.sender_id === chatPartnerId) {
        // Automatically mark as read if chat is active
        db.markMessagesAsRead(chatPartnerId, state.me.id);
        state.messages.push({
          id: payload.new.id,
          from: payload.new.sender_id,
          text: payload.new.text,
          ts: payload.new.created_at,
          read_at: new Date().toISOString()
        });
        render();
        scrollMessagesToBottom();
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${state.me.id}` }, payload => {
      // My message was read by partner
      if (payload.new.receiver_id === chatPartnerId) {
        const msg = state.messages.find(m => m.id === payload.new.id);
        if (msg) {
          msg.read_at = payload.new.read_at;
          render();
        } else {
          // Race condition: UPDATE arrived before INSERT returned the ID. Re-fetch.
          refreshMessages().then(() => {
            render();
            scrollMessagesToBottom();
          });
        }
      }
    })
    .subscribe();
    
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
        state.me = { id: user.id, name: user.name };
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
    state.me = { id, name };
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
      state.me = { id: user.id, name: user.name };
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
    
    const [mutualUsers, pendingUsers, incomingUsers, unreadRes] = await Promise.all([
      db.getUsersByIds(mutualIds),
      db.getUsersByIds(pendingIds),
      db.getUsersByIds(incomingIds),
      supabase.from('messages').select('sender_id').eq('receiver_id', state.me.id).is('read_at', null)
    ]);
    
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
        lastText: lastMsg ? lastMsg.text : null,
        lastTs: lastMsg ? lastMsg.created_at : 0,
        lastMine: lastMsg ? lastMsg.sender_id === state.me.id : false,
        lastRead: lastMsg ? !!lastMsg.read_at : false
      };
    }));
    
    state.mutualList.sort((a, b) => new Date(b.lastTs || 0) - new Date(a.lastTs || 0));
    
    state.pendingList = pendingUsers.map(u => ({ id: u.id, name: u.name }));
    state.incomingList = incomingUsers.map(u => ({ id: u.id, name: u.name }));
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

// ============ Chat ============
async function openChat(id, name) {
  state.view = 'chat';
  state.activeChat = { id, name };
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
      read_at: m.read_at
    }));
  } catch (e) {
    state.messages = [];
  }
}

async function sendMessage() {
  const input = document.getElementById('composer-input');
  const text = (input ? input.value : state.draftText).trim();
  if (!text || !state.activeChat || state.busy) return;
  
  state.busy = true;
  state.draftText = '';
  
  // Clear the input field immediately without re-rendering
  if (input) input.value = '';
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;
  
  const tempId = 'temp-' + Date.now();
  const tempMsg = { id: tempId, from: state.me.id, text, ts: new Date().toISOString(), read_at: null };
  state.messages.push(tempMsg);
  
  // Only update the messages area, not the whole screen
  const msgContainer = document.getElementById('messages-container');
  if (msgContainer) {
    msgContainer.innerHTML = getChatMessagesHtml();
    scrollMessagesToBottom();
  }

  try {
    const { data } = await supabase.from('messages').insert([{
      sender_id: state.me.id,
      receiver_id: state.activeChat.id,
      text: text
    }]).select().single();
    
    if (data) {
      const msgIndex = state.messages.findIndex(m => m.id === tempId);
      if (msgIndex !== -1) state.messages[msgIndex].id = data.id;
      // Update only the messages area after getting real ID
      if (msgContainer) msgContainer.innerHTML = getChatMessagesHtml();
    }
  } catch (e) {
    console.error("Failed to send message", e);
  }
  
  state.busy = false;
  // Focus input back
  if (input) {
    input.focus();
  }
}

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
        <div class="avatar">${initials(p.name)}</div>
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
      <div class="person-row open-chat" data-id="${p.id}" data-name="${escapeHtml(p.name)}">
        <div class="avatar">${initials(p.name)}</div>
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
        <div class="avatar">${initials(p.name)}</div>
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

function getChatMessagesHtml() {
  const c = state.activeChat;
  return state.messages.length ? state.messages.map(m => {
    const mine = m.from === state.me.id;
    let ticks = '';
    if (mine) {
      ticks = `<span class="msg-status ${m.read_at ? 'read' : ''}">${m.read_at ? ICONS.checkDouble : ICONS.check}</span>`;
    }
    return `
      <div class="msg ${mine ? 'msg-mine' : 'msg-theirs'}">
        ${escapeHtml(m.text)}
        <div class="msg-time">${fmtTime(m.ts)} ${ticks}</div>
      </div>`;
  }).join('') : `
    <div class="chat-empty">
      <div style="margin-bottom:16px; display:flex; justify-content:center;">
        <div class="empty-icon" style="width:64px;height:64px;">${ICONS.empty}</div>
      </div>
      Belum ada pesan dengan <b>${escapeHtml(c.name)}</b>.<br>Kirim pesan pertama untuk memulai percakapan aman.
    </div>`;
}

function renderChat() {
  const c = state.activeChat;
  const isOnline = state.onlineUsers.has(c.id);

  return `
    <div class="chat-header fade-in" data-id="${c.id}">
      <button class="icon-btn" id="back-home-btn">${ICONS.back}</button>
      <div class="avatar">${initials(c.name)}</div>
      <div>
        <div class="chat-name">${escapeHtml(c.name)}</div>
        <div class="chat-status" style="color: ${isOnline ? '#22c55e' : 'var(--text-muted)'};">
          <span class="status-dot ${isOnline ? 'online' : ''}" style="margin-right:4px;"></span>
          ${isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
    <div class="messages" id="messages-container">${getChatMessagesHtml()}</div>
    <div class="composer fade-in">
      <input class="field" id="composer-input" placeholder="Tulis pesan..." value="${escapeHtml(state.draftText)}" autocomplete="off">
      <button class="send-btn" id="send-btn" ${!state.draftText.trim() ? 'disabled' : ''}>${ICONS.send}</button>
    </div>`;
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
        <div class="avatar">${initials(state.me?.name || '?')}</div>
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
    row.onclick = () => openChat(row.getAttribute('data-id'), row.getAttribute('data-name'));
  });
}

function attachSettingsHandlers() {
  const byId = id => document.getElementById(id);
  if (byId('back-from-settings')) byId('back-from-settings').onclick = goHome;
  if (byId('settings-logout')) byId('settings-logout').onclick = logout;
  if (byId('edit-name-btn')) byId('edit-name-btn').onclick = editNameAction;

  document.querySelectorAll('.theme-card').forEach(card => {
    card.onclick = () => setTheme(card.getAttribute('data-t'));
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => setSize(btn.getAttribute('data-s'));
  });
}

function attachChatHandlers() {
  const byId = id => document.getElementById(id);
  if (byId('back-home-btn')) byId('back-home-btn').onclick = goHome;
  if (byId('send-btn')) byId('send-btn').onclick = sendMessage;
  
  const input = byId('composer-input');
  const btn = byId('send-btn');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.oninput = e => { 
      state.draftText = e.target.value; 
      if (btn) btn.disabled = !state.draftText.trim();
    };
    input.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };
  }
}

function scrollMessagesToBottom() {
  const el = document.getElementById('messages-container');
  if (el) el.scrollTop = el.scrollHeight;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
