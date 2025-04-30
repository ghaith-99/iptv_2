// تكوين Supabase (v1)
const SUPABASE_URL     = "https://vavxzfxwwifgabwcqfhl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdnh6Znh3d2lmZ2Fid2NxZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMzgyMjEsImV4cCI6MjA2MTYxNDIyMX0.m7FxpkbEmRQKI5WNbSKJnJu54Wm4xTYJTKxUhtGSDPM";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isAdmin = false;

// عناصر DOM
const loginForm            = document.getElementById('login-form');
const authContainer        = document.getElementById('auth-container');
const adminBtn             = document.getElementById('admin-panel-btn');
const adminPanel           = document.getElementById('admin-panel');

const newUserName          = document.getElementById('new-user-username');
const newUserPassword      = document.getElementById('new-user-password');
const addUserBtn           = document.getElementById('add-user-btn');
const userList             = document.getElementById('user-list');

const nationList           = document.getElementById('nation-list');
const clubList             = document.getElementById('club-list');
const addNationBtn         = document.getElementById('add-nation-btn');
const addClubBtn           = document.getElementById('add-club-btn');
const newNationName        = document.getElementById('new-nation-name');
const newNationImg         = document.getElementById('new-nation-img');
const newClubName          = document.getElementById('new-club-name');
const newClubImg           = document.getElementById('new-club-img');

const playerFormContainer  = document.getElementById('player-form-container');
const playerForm           = document.getElementById('player-form');
const playerFormTitle      = document.getElementById('player-form-title');
const playerIdInput        = document.getElementById('player-id');
const playerName           = document.getElementById('player-name');
const playerAge            = document.getElementById('player-age');
const playerNation         = document.getElementById('player-nation');
const playerType           = document.getElementById('player-type');
const clubsCheckboxes      = document.getElementById('clubs-checkboxes');
const currentClubContainer = document.getElementById('current-club-container');
const currentClubSelect    = document.getElementById('current-club');
const playersContainer     = document.getElementById('players-container');
const cancelPlayerBtn      = document.getElementById('cancel-player');

// 1. تسجيل دخول
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const { user, error } = await supabase.auth.signIn({
    email:    `${username}@example.com`,
    password
  });
  if (error) {
    return alert(error.message);
  }
  await postLoginSetup(user.id);
});

// 2. بعد تسجيل الدخول
async function postLoginSetup(userId) {
  authContainer.style.display = 'none';
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  isAdmin = data.is_admin;
  if (isAdmin) {
    adminBtn.style.display = 'block';
  }
  fetchPlayers();
}

// 3. زر لوحة الإدمن
adminBtn.addEventListener('click', () => {
  adminPanel.style.display =
    adminPanel.style.display === 'none' ? 'block' : 'none';
  loadUsers();
  loadNations();
  loadClubs();
});

// 4. إضافة مستخدم جديد (عبر الإدمن فقط)
addUserBtn.addEventListener('click', async () => {
  const username = newUserName.value;
  const password = newUserPassword.value;
  if (!username || !password) return;
  const { user, error } = await supabase.auth.signUp({
    email:    `${username}@example.com`,
    password
  });
  if (error) {
    return alert(error.message);
  }
  // بعد التسجيل، نحفظ الملف الشخصي في جدول profiles
  await supabase
    .from('profiles')
    .insert([{ id: user.id, username, is_admin: false }]);
  newUserName.value = '';
  newUserPassword.value = '';
  loadUsers();
});

// 5. جلب قائمة المستخدمين
async function loadUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('username');
  userList.innerHTML = data
    .map(u => `<li>${u.username}</li>`)
    .join('');
}

// 6. إضافة جنسية جديدة (الإدمن)
addNationBtn.addEventListener('click', async () => {
  const name = newNationName.value;
  const img  = newNationImg.value;
  if (!name || !img) return;
  await supabase
    .from('nationalities')
    .insert([{ name, img_url: img }]);
  newNationName.value = '';
  newNationImg.value  = '';
  loadNations();
});

// 7. إضافة نادي جديد (الإدمن)
addClubBtn.addEventListener('click', async () => {
  const name = newClubName.value;
  const img  = newClubImg.value;
  if (!name || !img) return;
  await supabase
    .from('clubs')
    .insert([{ name, img_url: img }]);
  newClubName.value = '';
  newClubImg.value  = '';
  loadClubs();
});

// 8. تحميل الجنسيات
async function loadNations() {
  const { data } = await supabase
    .from('nationalities')
    .select();
  nationList.innerHTML = data
    .map(n => `<li><img src="${n.img_url}" width="24"> ${n.name}</li>`)
    .join('');
  playerNation.innerHTML = data
    .map(n => `<option value="${n.id}">${n.name}</option>`)
    .join('');
}

// 9. تحميل الأندية
async function loadClubs() {
  const { data } = await supabase
    .from('clubs')
    .select();
  clubList.innerHTML = data
    .map(c => `<li><img src="${c.img_url}" width="24"> ${c.name}</li>`)
    .join('');
  clubsCheckboxes.innerHTML = data
    .map(c => `<label><input type="checkbox" value="${c.id}"> ${c.name}</label><br>`)
    .join('');
  currentClubSelect.innerHTML = data
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join('');
}

// 10. تغيّر حقول الأندية حسب نوع اللاعب
playerType.addEventListener('change', () => {
  currentClubContainer.style.display =
    playerType.value === 'active' ? 'block' : 'none';
});

// 11. حفظ أو تحديث لاعب
playerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id = playerIdInput.value;
  const payload = {
    name           : playerName.value,
    age            : parseInt(playerAge.value),
    nationality_id : playerNation.value,
    type           : playerType.value,
    clubs          : JSON.stringify(
                       [...clubsCheckboxes.querySelectorAll('input:checked')]
                         .map(cb => cb.value)
                     ),
    current_club   : playerType.value === 'active'
                       ? currentClubSelect.value
                       : null
  };
  if (id) {
    await supabase
      .from('players')
      .update(payload)
      .eq('id', id);
  } else {
    await supabase
      .from('players')
      .insert([payload]);
  }
  resetPlayerForm();
  fetchPlayers();
});

// 12. إلغاء نموذج اللاعب
cancelPlayerBtn.addEventListener('click', resetPlayerForm);
function resetPlayerForm() {
  playerForm.reset();
  playerIdInput.value           = '';
  playerFormContainer.style.display = 'none';
}

// 13. جلب وعرض اللاعبين
async function fetchPlayers() {
  const { data } = await supabase
    .from('players')
    .select(`*, nationalities(name, img_url), clubs`);
  playersContainer.innerHTML = data
    .map(p => {
      const clubsList = JSON.parse(p.clubs || '[]')
        .map(cid => `<span>${cid}</span>`)
        .join(', ');
      const current = p.current_club
        ? `<p>النادي الحالي: ${p.current_club}</p>`
        : '';
      return `
        <div class="player-card">
          <h3>${p.name}</h3>
          <p>العمر: ${p.age}</p>
          <p>الجنسية: <img src="${p.nationalities.img_url}" width="24"> ${p.nationalities.name}</p>
          ${current}
          <p>الأندية السابقة: ${clubsList}</p>
          ${isAdmin
            ? `<button onclick="editPlayer('${p.id}')">تعديل</button>
               <button onclick="deletePlayer('${p.id}')">حذف</button>`
            : ''}
        </div>`;
    })
    .join('');
}

// 14. تعديل لاعب
window.editPlayer = async id => {
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  playerIdInput.value       = data.id;
  playerName.value          = data.name;
  playerAge.value           = data.age;
  playerNation.value        = data.nationality_id;
  playerType.value          = data.type;
  playerType.dispatchEvent(new Event('change'));
  const selectedClubs       = JSON.parse(data.clubs || '[]');
  clubsCheckboxes.querySelectorAll('input')
    .forEach(cb => cb.checked = selectedClubs.includes(cb.value));
  if (data.current_club) {
    currentClubSelect.value = data.current_club;
  }
  playerFormContainer.style.display = 'block';
};

// 15. حذف لاعب
window.deletePlayer = async id => {
  if (confirm('تأكيد الحذف؟')) {  
    await supabase.from('players').delete().eq('id', id);
    fetchPlayers();
  }
};

// 16. مراقبة تغيُّر حالة المصادقة
supabase.auth.onAuthStateChange((_, session) => {
  if (session) {
    postLoginSetup(session.user.id);
  }
});
