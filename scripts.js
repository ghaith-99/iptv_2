const supabaseUrl = 'https://cvvjmioklaabxdydgikl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dmptaW9rbGFhYnhkeWRnaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NjQ5ODEsImV4cCI6MjA2MTU0MDk4MX0.cOG5zuDlUlkJhwPrAciblTAF15pyJd6aaQXVEogH0QY'; // استبدل بchlave الأنون (anon key) الخاص بك
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let isAdmin = false;

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { user, session, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
        return;
    }

    // Check if the user is an admin
    const { data, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError) {
        alert('خطأ في جلب دور المستخدم: ' + profileError.message);
        return;
    }

    isAdmin = data.role === 'admin';
    if (isAdmin) {
        document.getElementById('add-button').style.display = 'block';
        document.getElementById('manage-users-button').style.display = 'block';
    }

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    populateNationalities();
    populateClubs();
    loadUsersList();
}

async function populateNationalities() {
    const { data, error } = await supabase.from('nationalities').select('*');
    if (error) {
        console.error('خطأ في جلب الجنسيات:', error);
        return;
    }

    const selectElement = document.getElementById('new-nationality');
    data.forEach(nationality => {
        const option = document.createElement('option');
        option.value = nationality.id;
        option.textContent = nationality.name;
        selectElement.appendChild(option);
    });
}

async function populateClubs() {
    const { data, error } = await supabase.from('clubs').select('*');
    if (error) {
        console.error('خطأ في جلب الأندية:', error);
        return;
    }

    const container = document.getElementById('clubs-container');
    container.innerHTML = ''; // Clear existing checkboxes

    data.forEach(club => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${club.id}">
                ${club.name}
            </label>
        `;
        container.appendChild(div);
    });
}

async function showPlayers(type) {
    let query = supabase.from('persons').select('*').eq('type', type);

    if (type === 'retired') {
        query = query.eq('type', 'retired_player');
    } else if (type === 'active') {
        query = query.eq('type', 'current_player');
    }

    const { data, error } = await query;
    if (error) {
        console.error('خطأ في جلب اللاعبين:', error);
        return;
    }

    displayPersons(data);
}

async function showCoaches() {
    const { data, error } = await supabase.from('persons').select('*').eq('type', 'coach');
    if (error) {
        console.error('خطأ في جلب مدربين:', error);
        return;
    }

    displayPersons(data);
}

function displayPersons(persons) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';

    persons.forEach(person => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <img src="${person.profile_image_url}" alt="${person.name}" onclick="showModal('${person.profile_image_url}')">
            <p><strong>${person.name}</strong></p>
            <p>${calculateAge(person.birth_date)} سنة</p>
            <p>${getNationalityName(person.nationality_id)}</p>
            <p>${getPreviousClubs(person.id)}</p>
        `;
        contentDiv.appendChild(card);
    });
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

async function getNationalityName(nationalityId) {
    if (!nationalityId) return '';
    const { data, error } = await supabase.from('nationalities').select('name').eq('id', nationalityId).single();
    if (error) {
        console.error('خطأ في جلب اسم الجنسية:', error);
        return '';
    }
    return data.name;
}

async function getPreviousClubs(personId) {
    const { data, error } = await supabase.from('player_club_history')
        .select('clubs(name)')
        .eq('player_id', personId)
        .innerJoin('clubs', 'player_club_history.club_id', '=', 'clubs.id');
    if (error) {
        console.error('خطأ في جلب الأندية السابقة:', error);
        return '';
    }
    return data.map(item => item.clubs.name).join(', ');
}

function showModal(imageUrl) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageUrl;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function showAddForm() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('add-form').style.display = 'block';
}

async function addPerson() {
    const name = document.getElementById('new-name').value;
    const nationalityId = document.getElementById('new-nationality').value;
    const birthDate = document.getElementById('new-birth-date').value;
    const profileImageFile = document.getElementById('new-profile-image').files[0];
    const type = document.getElementById('new-type').value;

    if (!profileImageFile) {
        alert('يرجى اختيار صورة الشخصية.');
        return;
    }

    // Upload the profile image to Supabase Storage
    const { data: imageData, error: uploadError } = await supabase.storage.from('profile_images').upload(profileImageFile.name, profileImageFile);
    if (uploadError) {
        alert('خطأ في رفع الصورة: ' + uploadError.message);
        return;
    }

    const profileImageUrl = `${supabaseUrl}/storage/v1/object/public/profile_images/${imageData.path}`;

    // Insert the new person into the persons table
    const { data: personData, error: insertError } = await supabase.from('persons').insert([
        {
            name: name,
            nationality_id: nationalityId,
            birth_date: birthDate,
            profile_image_url: profileImageUrl,
            type: type
        }
    ]);

    if (insertError) {
        alert('خطأ في إضافة الشخص: ' + insertError.message);
        return;
    }

    // Get the newly inserted person ID
    const personId = personData[0].id;

    // Insert the selected clubs into the player_club_history table
    const clubCheckboxes = document.querySelectorAll('#clubs-container input[type="checkbox"]:checked');
    const clubIds = Array.from(clubCheckboxes).map(checkbox => checkbox.value);

    for (const clubId of clubIds) {
        const { error: historyError } = await supabase.from('player_club_history').insert([
            {
                player_id: personId,
                club_id: clubId,
                start_date: new Date().toISOString().split('T')[0], // Current date
                end_date: null // Assuming the player is currently at the club
            }
        ]);

        if (historyError) {
            alert('خطأ في إضافة تاريخ النادي: ' + historyError.message);
            return;
        }
    }

    alert('لقد تم إضافة الشخص بنجاح!');
    document.getElementById('add-form').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

function showManageUsers() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('manage-users-form').style.display = 'block';
}

async function addUser() {
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if (!email || !password) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
        return;
    }

    const { user, session, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        alert('خطأ في إنشاء المستخدم: ' + error.message);
        return;
    }

    // Insert the new user into the profiles table
    const { error: profileError } = await supabase.from('profiles').insert([
        {
            id: user.id,
            role: role
        }
    ]);

    if (profileError) {
        alert('خطأ في إضافة بيانات المستخدم: ' + profileError.message);
        return;
    }

    alert('لقد تم إضافة المستخدم بنجاح!');
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-password').value = '';
    loadUsersList();
}

async function loadUsersList() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('خطأ في جلب قائمة المستخدمين:', error);
        return;
    }

    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';

    data.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-details">
                <p><strong>البريد الإلكتروني:</strong> ${user.id}</p>
                <p><strong>الدور:</strong> ${user.role}</p>
            </div>
            <div class="user-actions">
                <button onclick="deleteUser('${user.id}')">حذف</button>
            </div>
        `;
        usersList.appendChild(userItem);
    });
}

async function deleteUser(userId) {
    // Delete user from profiles table
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) {
        alert('خطأ في حذف المستخدم: ' + profileError.message);
        return;
    }

    // Delete user from auth.users table
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
        alert('خطأ في حذف المستخدم من Auth: ' + authError.message);
        return;
    }

    alert('لقد تم حذف المستخدم بنجاح!');
    loadUsersList();
}
