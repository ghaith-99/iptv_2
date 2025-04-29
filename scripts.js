const supabaseUrl = 'https://ugjzykrhwkwkxshcmrev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnanp5a3Jod2t3a3hzaGNtcmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDg0NDcsImV4cCI6MjA2MTUyNDQ0N30.w915S7rpjvjvGDm8LFbWCsOuxmdZSUFxzoAXPZmnY4Y';
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
    }

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    populateNationalities();
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
    const profileImageUrl = document.getElementById('new-profile-image-url').value;
    const type = document.getElementById('new-type').value;

    const { data, error } = await supabase.from('persons').insert([
        {
            name: name,
            nationality_id: nationalityId,
            birth_date: birthDate,
            profile_image_url: profileImageUrl,
            type: type
        }
    ]);

    if (error) {
        alert('خطأ في إضافة الشخص: ' + error.message);
    } else {
        alert('لقد تم إضافة الشخص بنجاح!');
        document.getElementById('add-form').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }
}
