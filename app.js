const SUPABASE_URL    = 'https://pszdtriimrmigadinhma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzemR0cmlpbXJtaWdhZGluaG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDU3NzgsImV4cCI6MjA5MDYyMTc3OH0.URfO_-8I4GbmHZ1x3gVPJ2j1xnP_uwJrXS6-CJwa0Xk';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentTab  = 'login';
let currentFilter = 'all';
let allTasks = [];

// ─── AUTH ────────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-btn-text').textContent = tab === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-footer').innerHTML = tab === 'login'
    ? `Don't have an account? <a href="#" onclick="switchTab('signup')">Sign up free</a>`
    : `Already have an account? <a href="#" onclick="switchTab('login')">Sign in</a>`;
  hideMessages();
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('auth-success').classList.add('hidden');
}

function showSuccess(msg) {
  const el = document.getElementById('auth-success');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('auth-error').classList.add('hidden');
}

function hideMessages() {
  document.getElementById('auth-error').classList.add('hidden');
  document.getElementById('auth-success').classList.add('hidden');
}

async function handleAuth() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('auth-btn');
  const btnText  = document.getElementById('auth-btn-text');

  if (!email || !password) { showError('Please enter your email and password.'); return; }

  btn.disabled = true;
  btnText.textContent = '…';
  hideMessages();

  if (currentTab === 'login') {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      showError(error.message);
      btn.disabled = false;
      btnText.textContent = 'Sign In';
    }
  } else {
    const { error } = await sb.auth.signUp({ email, password });
    if (error) {
      showError(error.message);
      btn.disabled = false;
      btnText.textContent = 'Create Account';
      return;
    }
    showSuccess('Account created! Check your email to confirm, then sign in.');
    btn.disabled = false;
    btnText.textContent = 'Create Account';
    switchTab('login');
  }
}

async function logout() {
  await sb.auth.signOut();
  showScreen('auth');
}

// ─── SCREENS ─────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name + '-screen').classList.add('active');
}

// ─── FILTER ──────────────────────────────────────────────

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  renderTasks(allTasks);
}

// ─── TASKS ───────────────────────────────────────────────

async function loadTasks() {
  document.getElementById('task-list').innerHTML = '<div class="loading-tasks">loading…</div>';

  const { data, error } = await sb
    .from('todos')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('inserted_at', { ascending: true });

  if (error) { console.error(error); return; }
  allTasks = data || [];
  renderTasks(allTasks);
  updateStats(allTasks);
}

function renderTasks(tasks) {
  let filtered = tasks;
  if (currentFilter === 'active') filtered = tasks.filter(t => !t.is_complete);
  if (currentFilter === 'done')   filtered = tasks.filter(t => t.is_complete);

  const list = document.getElementById('task-list');
  const clearBar = document.getElementById('clear-bar');

  if (filtered.length === 0) {
    const msgs = { all: 'no tasks yet — add one above', active: 'nothing pending 🎉', done: 'nothing completed yet' };
    list.innerHTML = `<div class="empty-state">${msgs[currentFilter]}</div>`;
  } else {
    list.innerHTML = filtered.map(t => `
      <div class="task-item" id="task-${t.id}">
        <div class="task-check ${t.is_complete ? 'checked' : ''}" onclick="toggleTask('${t.id}', ${t.is_complete})"></div>
        <span class="task-text ${t.is_complete ? 'done' : ''}">${escapeHtml(t.task)}</span>
        <button class="task-delete" onclick="deleteTask('${t.id}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `).join('');
  }

  // Show clear bar only if there are completed tasks
  const hasDone = tasks.some(t => t.is_complete);
  clearBar.classList.toggle('hidden', !hasDone);
}

function updateStats(tasks) {
  const total = tasks.length;
  const done  = tasks.filter(t => t.is_complete).length;
  const left  = total - done;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent  = done;
  document.getElementById('stat-left').textContent  = left;
}

async function addTask() {
  const input = document.getElementById('new-task');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const { error } = await sb
    .from('todos')
    .insert({ task: text, user_id: currentUser.id, is_complete: false });

  if (error) { console.error(error); return; }
  await loadTasks();
}

async function toggleTask(id, current) {
  await sb.from('todos').update({ is_complete: !current }).eq('id', id);
  await loadTasks();
}

async function deleteTask(id) {
  await sb.from('todos').delete().eq('id', id);
  await loadTasks();
}

async function clearCompleted() {
  await sb.from('todos').delete().eq('user_id', currentUser.id).eq('is_complete', true);
  await loadTasks();
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ─── SESSION ─────────────────────────────────────────────

sb.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    const emailEl = document.getElementById('user-email-display');
    const avatarEl = document.getElementById('avatar-letter');
    if (emailEl) emailEl.textContent = currentUser.email;
    if (avatarEl) avatarEl.textContent = currentUser.email[0].toUpperCase();
    showScreen('app');
    await loadTasks();
  } else {
    currentUser = null;
    showScreen('auth');
  }
});
