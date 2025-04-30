const firebaseConfig = {
  apiKey: "AIzaSyBN-3xZDEgNzNCKd4zTDAsaaOWzjx3z9LM",
  authDomain: "fbquiz-582d3.firebaseapp.com",
  projectId: "fbquiz-582d3",
  storageBucket: "fbquiz-582d3.firebasestorage.app",
  messagingSenderId: "939712254423",
  appId: "1:939712254423:web:8efa55b26740eb30597b92"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let playersData = [];

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('admin-section').style.display = 'block';
      fetchPlayers();
      fetchNationalities();
      fetchClubs();
      populateNationalityDropdown();
      populateClubsCheckboxes();
    })
    .catch(e => alert(e.message));
}

function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert('تم إنشاء الحساب بنجاح'))
    .catch(e => alert(e.message));
}

function addPlayer() {
  const name = document.getElementById('name').value;
  const age = parseInt(document.getElementById('age').value);
  const nationality = document.getElementById('player-nationality').value;
  const type = document.getElementById('type').value;
  const player_image = document.getElementById('player_image').value;

  const selectedClubs = Array.from(document.querySelectorAll('input[name="club-checkbox"]:checked'))
    .map(cb => ({ name: cb.value, img: cb.dataset.img }));

  db.collection('players').add({
    name, age, nationality, type, player_image, clubs: selectedClubs
  }).then(() => {
    alert('تمت إضافة اللاعب');
    fetchPlayers();
  });
}

function fetchPlayers() {
  db.collection('players').get().then(snapshot => {
    playersData = [];
    snapshot.forEach(doc => {
      playersData.push({ id: doc.id, ...doc.data() });
    });
    renderPlayers(playersData);
  });
}

function renderPlayers(data) {
  const container = document.getElementById('players-list');
  container.innerHTML = '';
  data.forEach(player => {
    const clubImgs = player.clubs?.map(club => `<img src="${club.img}" alt="${club.name}">`).join(' ') || '';
    container.innerHTML += `
      <div class="player">
        <img src="${player.player_image}" alt="صورة">
        <div><strong>${player.name}</strong> - ${player.type}</div>
        <div>العمر: ${player.age} | الجنسية: ${player.nationality}</div>
        <div>الأندية: ${clubImgs}</div>
        <button onclick="deletePlayer('${player.id}')">حذف</button>
      </div>
    `;
  });
}

function deletePlayer(id) {
  if (confirm('هل أنت متأكد من حذف هذا اللاعب؟')) {
    db.collection('players').doc(id).delete().then(() => {
      alert('تم الحذف');
      fetchPlayers();
    });
  }
}

function searchPlayers() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = playersData.filter(p => p.name.toLowerCase().includes(query));
  renderPlayers(filtered);
}

function addNationality() {
  const name = document.getElementById('nat-name').value;
  const img = document.getElementById('nat-img').value;

  db.collection('nationalities').add({ name, img }).then(() => {
    alert('تمت إضافة الجنسية');
    document.getElementById('nat-name').value = '';
    document.getElementById('nat-img').value = '';
    fetchNationalities();
    populateNationalityDropdown();
  });
}

function fetchNationalities() {
  db.collection('nationalities').get().then(snapshot => {
    const list = document.getElementById('nat-list');
    list.innerHTML = '';
    snapshot.forEach(doc => {
      const item = doc.data();
      list.innerHTML += `
        <div class="collection-item">
          <img src="${item.img}" width="30" height="30">
          <span>${item.name}</span>
        </div>
      `;
    });
  });
}

function populateNationalityDropdown() {
  const dropdown = document.getElementById('player-nationality');
  dropdown.innerHTML = '';
  db.collection('nationalities').get().then(snapshot => {
    snapshot.forEach(doc => {
      const item = doc.data();
      dropdown.innerHTML += `<option value="${item.name}">${item.name}</option>`;
    });
  });
}

function addClub() {
  const name = document.getElementById('club-name').value;
  const img = document.getElementById('club-img').value;

  db.collection('clubs').add({ name, img }).then(() => {
    alert('تمت إضافة النادي');
    document.getElementById('club-name').value = '';
    document.getElementById('club-img').value = '';
    fetchClubs();
    populateClubsCheckboxes();
  });
}

function fetchClubs() {
  db.collection('clubs').get().then(snapshot => {
    const list = document.getElementById('club-list');
    list.innerHTML = '';
    snapshot.forEach(doc => {
      const item = doc.data();
      list.innerHTML += `
        <div class="collection-item">
          <img src="${item.img}" width="30" height="30">
          <span>${item.name}</span>
        </div>
      `;
    });
  });
}

function populateClubsCheckboxes() {
  const container = document.getElementById('club-checkboxes');
  container.innerHTML = '';
  db.collection('clubs').get().then(snapshot => {
    snapshot.forEach(doc => {
      const item = doc.data();
      container.innerHTML += `
        <label><input type="checkbox" name="club-checkbox" value="${item.name}" data-img="${item.img}"> ${item.name}</label><br>
      `;
    });
  });
}
