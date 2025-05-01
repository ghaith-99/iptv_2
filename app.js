// Supabase configuration
const SUPABASE_URL = 'https://yuddtnebiafcyuhcmfoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZGR0bmViaWFmY3l1aGNtZm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDc0ODYsImV4cCI6MjA2MTY4MzQ4Nn0.mA1o_ynHyO2Mn7QAzwvV743vh99hdmWO1OoX7AXjfj4';

// إنشاء عميل Supabase بالطريقة الصحيحة
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const adminNavItem = document.getElementById('adminNavItem');
const adminPanel = document.getElementById('adminPanel');
const userDisplayName = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');

// Login and registration forms
const userLoginForm = document.getElementById('userLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const userRegisterForm = document.getElementById('userRegisterForm');
const showUserRegister = document.getElementById('showUserRegister');
const userRegisterCard = document.getElementById('userRegisterCard');
const cancelRegister = document.getElementById('cancelRegister');

// Player containers
const currentPlayersContainer = document.getElementById('currentPlayersContainer');
const retiredPlayersContainer = document.getElementById('retiredPlayersContainer');
const coachesContainer = document.getElementById('coachesContainer');
const adminTableBody = document.getElementById('adminTableBody');

// Modals
const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
const playerDetailsModal = new bootstrap.Modal(document.getElementById('playerDetailsModal'));
const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));

// Form elements
const personForm = document.getElementById('personForm');
const savePersonBtn = document.getElementById('savePersonBtn');
const addPreviousClubBtn = document.getElementById('addPreviousClubBtn');

// Current user state
let currentUser = null;
let isAdmin = false;

// حفظ جميع بيانات اللاعبين للفلترة
let allCurrentPlayers = [];
let allRetiredPlayers = [];
let allCoaches = [];
let uniqueNationalities = new Set();
let uniqueClubs = new Set();

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // تحديد الوظائف المطلوبة على المستوى العالمي
    window.openImageModal = openImageModal; 
    window.viewPersonDetails = viewPersonDetails;
    window.editCountry = editCountry;
    window.deleteCountry = deleteCountry;
    window.editClub = editClub;
    window.deleteClub = deleteClub;
    window.editLeague = editLeague;
    window.deleteLeague = deleteLeague;
    window.resetFilters = resetFilters;
    
    // استعادة بيانات تسجيل الدخول المحفوظة
    loadRememberedCredentials();
    
    // Check if user is already signed in
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        await handleAuthenticatedUser(user);
    }
    
    // إنشاء وملء جداول البيانات الأساسية إذا لم تكن موجودة
    await setupMasterData();
    
    // Load image preview functionality
    setupImagePreviewHandlers();
    
    // Load countries and clubs
    await loadCountries();
    await loadClubs();
    await loadLeagues();
    
    // تحميل جداول البيانات في نوافذ الإدارة
    if (isAdmin) {
        await loadCountriesTable();
        await loadClubsTable();
        await loadLeaguesTable();
    }
    
    // Set up event listeners
    setupEventListeners();
}

// دالة لاستعادة بيانات تسجيل الدخول المحفوظة
function loadRememberedCredentials() {
    // استعادة بيانات المستخدم العادي
    if (localStorage.getItem('rememberUser') === 'true') {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            document.getElementById('userEmail').value = userEmail;
            document.getElementById('userRememberMe').checked = true;
        }
    }
    
    // استعادة بيانات المسؤول
    if (localStorage.getItem('rememberAdmin') === 'true') {
        const adminEmail = localStorage.getItem('adminEmail');
        if (adminEmail) {
            document.getElementById('adminEmail').value = adminEmail;
            document.getElementById('adminRememberMe').checked = true;
        }
    }
}

function setupEventListeners() {
    // Login forms
    userLoginForm.addEventListener('submit', handleUserLogin);
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Registration
    showUserRegister.addEventListener('click', toggleRegisterForm);
    cancelRegister.addEventListener('click', toggleRegisterForm);
    userRegisterForm.addEventListener('submit', handleUserRegistration);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Admin actions
    savePersonBtn.addEventListener('click', savePerson);
    addPreviousClubBtn.addEventListener('click', addPreviousClubField);
    
    // تحديث عنوان الأندية عند تغيير الفئة
    document.getElementById('personCategory').addEventListener('change', function(e) {
        updatePreviousClubsLabel(e.target.value);
    });
    
    // Country and Club management
    document.getElementById('saveCountryBtn').addEventListener('click', saveCountry);
    document.getElementById('resetCountryForm').addEventListener('click', resetCountryForm);
    document.getElementById('saveClubBtn').addEventListener('click', saveClub);
    document.getElementById('resetClubForm').addEventListener('click', resetClubForm);
    
    // League management
    document.getElementById('saveLeagueBtn').addEventListener('click', saveLeague);
    document.getElementById('resetLeagueForm').addEventListener('click', resetLeagueForm);
    
    // إضافة مستمعي أحداث للإضافة الجماعية
    if (document.getElementById('showBulkCountryModalBtn')) {
        document.getElementById('showBulkCountryModalBtn').addEventListener('click', showBulkCountryModal);
    }
    if (document.getElementById('saveBulkCountriesBtn')) {
        document.getElementById('saveBulkCountriesBtn').addEventListener('click', saveBulkCountries);
    }
    if (document.getElementById('showBulkClubModalBtn')) {
        document.getElementById('showBulkClubModalBtn').addEventListener('click', showBulkClubModal);
    }
    if (document.getElementById('saveBulkClubsBtn')) {
        document.getElementById('saveBulkClubsBtn').addEventListener('click', saveBulkClubs);
    }
    if (document.getElementById('showBulkLeagueModalBtn')) {
        document.getElementById('showBulkLeagueModalBtn').addEventListener('click', showBulkLeagueModal);
    }
    if (document.getElementById('saveBulkLeaguesBtn')) {
        document.getElementById('saveBulkLeaguesBtn').addEventListener('click', saveBulkLeagues);
    }
    
    // إضافة مستمعي أحداث للبحث
    if (document.getElementById('playerSearchBtn')) {
        document.getElementById('playerSearchBtn').addEventListener('click', searchPlayers);
    }
    
    // إضافة مستمع حدث للبحث عند الضغط على Enter في حقل البحث
    if (document.getElementById('playerSearchInput')) {
        document.getElementById('playerSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPlayers();
            }
        });
    }
    
    // إضافة مستمعي أحداث للفلترة المتقدمة
    if (document.getElementById('applyFiltersBtn')) {
        document.getElementById('applyFiltersBtn').addEventListener('click', applyAdvancedFilters);
    }
    
    // إضافة مستمعي أحداث للتبديل بين التبويبات وتحديث الفلترة
    document.querySelectorAll('#categoryTabs .nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            // إعادة تعيين حقول الفلترة عند تغيير التبويبات
            document.getElementById('filterNationality').value = '';
            document.getElementById('filterClub').value = '';
            document.getElementById('filterPosition').value = '';
            document.getElementById('filterClubNumber').value = '';
            document.getElementById('filterNationalNumber').value = '';
            
            // تحديث خيارات الفلترة بناءً على التبويب الجديد
            loadFilterOptions();
        });
    });
    
    // Image previews for Countries, Clubs, and Leagues
    document.getElementById('countryFlag').addEventListener('change', function(e) {
        previewImage(e.target, 'flagPreview', 'flagPreviewContainer');
    });
    
    document.getElementById('clubLogo').addEventListener('change', function(e) {
        previewImage(e.target, 'logoPreview', 'logoPreviewContainer');
    });
    
    document.getElementById('leagueLogo').addEventListener('change', function(e) {
        previewImage(e.target, 'leagueLogoPreview', 'leagueLogoPreviewContainer');
    });
}

// دالة لتحديث عنوان قسم الأندية حسب الفئة المحددة
function updatePreviousClubsLabel(category) {
    let previousClubsLabel = document.querySelector('label[for="previousClubsContainer"]');
    let addPreviousClubBtn = document.getElementById('addPreviousClubBtn');
    
    if (previousClubsLabel) {
        if (category === 'coach') {
            previousClubsLabel.textContent = 'الأندية التي دربها';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي قام بتدريبه';
            }
        } else if (category === 'retired') {
            previousClubsLabel.textContent = 'الأندية التي لعب لها';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي';
            }
        } else {
            previousClubsLabel.textContent = 'الأندية السابقة';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي سابق';
            }
        }
    }
}

// Authentication functions
async function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const rememberMe = document.getElementById('userRememberMe').checked;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // التحقق من تأكيد البريد الإلكتروني
        if (data.user && !data.user.email_confirmed_at) {
            // البريد الإلكتروني غير مؤكد
            alert('لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.');
            // يمكننا إما منع تسجيل الدخول أو السماح به مع قيود
            // للسماح بتسجيل الدخول مع التنبيه، نستمر بتنفيذ الكود
        }
        
        // حفظ خيار "تذكرني" في localStorage
        if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
            localStorage.setItem('userEmail', email);
        } else {
            localStorage.removeItem('rememberUser');
            localStorage.removeItem('userEmail');
        }
        
        await handleAuthenticatedUser(data.user);
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const rememberMe = document.getElementById('adminRememberMe').checked;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // التحقق من تأكيد البريد الإلكتروني
        if (data.user && !data.user.email_confirmed_at) {
            // البريد الإلكتروني غير مؤكد
            alert('لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.');
            // للمسؤولين، قد ترغب في منع تسجيل الدخول تماماً حتى يتم تأكيد البريد الإلكتروني
            // await supabaseClient.auth.signOut();
            // return;
        }
        
        // حفظ خيار "تذكرني" في localStorage
        if (rememberMe) {
            localStorage.setItem('rememberAdmin', 'true');
            localStorage.setItem('adminEmail', email);
        } else {
            localStorage.removeItem('rememberAdmin');
            localStorage.removeItem('adminEmail');
        }
        
        await handleAuthenticatedUser(data.user);
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

async function handleUserRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('كلمات المرور غير متطابقة');
        return;
    }
    
    try {
        // تسجيل المستخدم في نظام المصادقة
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // بعض الإعدادات تستخدم محفز لإنشاء سجل profiles تلقائيًا
        // لتجنب الازدواجية، سنتحقق أولاً مما إذا كان السجل موجودًا
        const { data: existingProfile, error: checkError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
        // إذا لم يكن السجل موجودًا، قم بإدخاله يدويًا
        if (checkError && !existingProfile) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id, 
                        full_name: name, 
                        email: email,
                        is_admin: false
                    }
                ]);
            
            if (profileError && profileError.code !== '23505') { // رمز الخطأ للمفتاح المكرر
                throw profileError;
            }
        }
        
        // عرض رسالة تأكيد مع التنبيه بضرورة تأكيد البريد الإلكتروني
        alert('تم إنشاء الحساب بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.');
        toggleRegisterForm();
    } catch (error) {
        alert('خطأ في إنشاء الحساب: ' + error.message);
    }
}

async function handleAuthenticatedUser(user) {
    currentUser = user;
    
    // Get user profile
    const { data: userData, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (!error && userData) {
        isAdmin = userData.is_admin;
    }
    
    // Update UI based on user role
    userDisplayName.textContent = user.user_metadata?.full_name || userData?.full_name || user.email;
    adminNavItem.classList.toggle('d-none', !isAdmin);
    
    // Load football personalities data
    await loadFootballData();
    
    // Show app and hide login
    loginSection.classList.add('d-none');
    appSection.classList.remove('d-none');
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        
        // حذف بيانات "تذكرني" عند تسجيل الخروج
        if (localStorage.getItem('rememberUser') !== 'true') {
            localStorage.removeItem('userEmail');
        }
        
        if (localStorage.getItem('rememberAdmin') !== 'true') {
            localStorage.removeItem('adminEmail');
        }
        
        // Reset state
        currentUser = null;
        isAdmin = false;
        
        // Toggle UI
        loginSection.classList.remove('d-none');
        appSection.classList.add('d-none');
        adminNavItem.classList.add('d-none');
        adminPanel.classList.add('d-none');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

function toggleRegisterForm() {
    userRegisterCard.classList.toggle('d-none');
}

// Data loading functions
async function loadFootballData() {
    await Promise.all([
        loadPlayersByCategory('current', currentPlayersContainer),
        loadPlayersByCategory('retired', retiredPlayersContainer),
        loadPlayersByCategory('coach', coachesContainer)
    ]);
    
    if (isAdmin) {
        await loadAdminTable();
    }
}

async function loadPlayersByCategory(category, container) {
    try {
        const { data: persons, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('category', category);
        
        if (error) throw error;
        
        container.innerHTML = '';
        
        if (persons.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>لا توجد بيانات متاحة</p></div>';
            return;
        }
        
        // حفظ البيانات في المتغيرات العالمية للفلترة
        if (category === 'current') {
            allCurrentPlayers = persons;
        } else if (category === 'retired') {
            allRetiredPlayers = persons;
        } else if (category === 'coach') {
            allCoaches = persons;
        }
        
        // جمع الجنسيات والأندية الفريدة
        persons.forEach(person => {
            uniqueNationalities.add(person.nationality);
            if (person.current_club) {
                uniqueClubs.add(person.current_club);
            }
        });
        
        // تحميل خيارات الفلترة بعد جمع البيانات
        if (category === 'current') {
            loadFilterOptions();
        }
        
        persons.forEach(person => {
            container.appendChild(createPersonCard(person));
        });
    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = '<div class="col-12 text-center"><p>حدث خطأ أثناء تحميل البيانات</p></div>';
    }
}

async function loadAdminTable() {
    try {
        const { data: persons, error } = await supabaseClient
            .from('football_persons')
            .select('*');
        
        if (error) throw error;
        
        adminTableBody.innerHTML = '';
        
        persons.forEach(person => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><img src="${person.image_url}" alt="${person.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 5px;"></td>
                <td>${person.name}</td>
                <td class="d-none d-md-table-cell">${person.age}</td>
                <td class="d-none d-md-table-cell">
                    <div class="d-flex align-items-center">
                        <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img" style="width: 35px; height: 25px; object-fit: contain; margin-left: 5px;">
                        ${person.nationality}
                    </div>
                </td>
                <td class="d-none d-md-table-cell">${getCategoryName(person.category)}</td>
                <td class="d-none d-md-table-cell">
                    ${person.current_club ? `
                    <div class="d-flex align-items-center">
                        <img src="${person.current_club_logo}" alt="${person.current_club}" class="club-logo" style="width: 35px; height: 35px; object-fit: contain; margin-left: 5px;">
                        ${person.current_club}
                    </div>` : '-'}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-sm btn-primary me-1" onclick="editPerson('${person.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletePerson('${person.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            adminTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading admin data:', error);
        adminTableBody.innerHTML = '<tr><td colspan="7" class="text-center">حدث خطأ أثناء تحميل البيانات</td></tr>';
    }
}

// دالة createPersonCard لإنشاء بطاقة لاعب
function createPersonCard(person) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 col-6 mb-4';
    
    // تحديد ما إذا كان يجب عرض النادي الحالي (فقط للاعبين الحاليين والمدربين)
    const showCurrentClub = person.category !== 'retired';
    
    col.innerHTML = `
        <div class="card player-card h-100">
            <div class="player-image-container" onclick="openImageModal(event, '${person.image_url}', '${person.name}')">
                <img src="${person.image_url}" class="card-img-top" alt="${person.name}" onclick="event.stopPropagation(); openImageModal(event, '${person.image_url}', '${person.name}')">
                <div class="player-image-overlay">
                    <i class="fas fa-search-plus zoom-icon"></i>
                    <span class="d-none d-md-block">اضغط لتكبير الصورة</span>
                </div>
            </div>
            <div class="card-body player-info">
                <h5 class="card-title player-name">${person.name}</h5>
                <div class="player-details">
                    <div class="nationality">
                        <strong>الجنسية:</strong>
                        <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img">
                        <span>${person.nationality}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-alt me-2"></i>
                        <strong>العمر:</strong>
                        <span>${person.age} سنة</span>
                    </div>
                    ${person.position ? `
                    <div class="detail-item">
                        <i class="fas fa-running me-2"></i>
                        <strong>المركز:</strong>
                        <span>${person.position}</span>
                    </div>` : ''}
                    ${(showCurrentClub && person.current_club) ? `
                    <div class="detail-item">
                        <i class="fas fa-futbol me-2"></i>
                        <strong>النادي:</strong>
                        <div class="d-flex align-items-center">
                            <img src="${person.current_club_logo}" alt="${person.current_club}" class="club-logo">
                            <span>${person.current_club}</span>
                            ${person.club_number ? `<span class="badge bg-primary ms-1">${person.club_number}</span>` : ''}
                        </div>
                    </div>` : ''}
                </div>
                <button class="btn btn-primary w-100 mt-3" onclick="viewPersonDetails('${person.id}')">
                    <i class="fas fa-info-circle me-1 d-none d-sm-inline"></i>عرض التفاصيل
                </button>
            </div>
        </div>
    `;
    
    return col;
}

function getCategoryName(category) {
    switch(category) {
        case 'current': return 'لاعب حالي';
        case 'retired': return 'لاعب معتزل';
        case 'coach': return 'مدرب';
        default: return category;
    }
}

// Modal functions
function openImageModal(event, imageUrl, imageTitle) {
    console.log("Opening modal for image:", imageUrl);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const imgSrc = imageUrl || (event && event.target ? event.target.src : null);
    const title = imageTitle || (event && event.target ? event.target.alt : '');
    
    if (!imgSrc) {
        console.error("No image source found");
        return;
    }
    
    // تغيير مصدر الصورة وعنوان المودال
    const fullscreenImage = document.getElementById('fullscreenImage');
    const imageModalTitle = document.getElementById('imageModalTitle');
    
    if (fullscreenImage) fullscreenImage.src = imgSrc;
    if (imageModalTitle) imageModalTitle.textContent = title;
    
    // استخدام طريقة مباشرة لفتح المودال
    try {
        const modalElement = document.getElementById('imageModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error("Error showing modal:", error);
    }
}

async function viewPersonDetails(id) {
    try {
        const { data: person, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Get league information if available
        let leagueInfo = '';
        let leagueData = null;
        if (person.league_id) {
            const { data, error: leagueError } = await supabaseClient
                .from('leagues')
                .select('*')
                .eq('id', person.league_id)
                .single();
                
            if (!leagueError && data) {
                leagueData = data;
            }
        }
        
        // Fetch previous clubs
        const { data: previousClubs, error: clubsError } = await supabaseClient
            .from('previous_clubs')
            .select('*')
            .eq('person_id', id);
            
        if (clubsError) throw clubsError;
        
        const categoryName = getCategoryName(person.category);
        
        // Create HTML for details modal - تصميم مشابه للنموذج المطلوب
        const detailsHTML = `
            <div class="row mx-0 player-details-new">
                <!-- صورة اللاعب (على اليمين) -->
                <div class="col-md-4 px-0 player-image-section">
                    <img src="${person.image_url || 'https://via.placeholder.com/400'}" 
                        alt="${person.name}" class="player-big-image">
                </div>
                
                <!-- معلومات اللاعب (على اليسار) -->
                <div class="col-md-8 player-info-section">
                    <div class="player-name-header">${person.name}</div>
                    
                    <div class="info-section">
                        <div class="section-title">
                            <div class="section-title-text">المعلومات الشخصية</div>
                            <div class="section-line"></div>
                        </div>
                        
                        <table class="info-table">
                            <tr>
                                <td class="info-label">العمر:</td>
                                <td class="info-value">${person.age} سنة</td>
                            </tr>
                            <tr>
                                <td class="info-label">الجنسية:</td>
                                <td class="info-value">
                                    <img src="${person.nationality_flag || 'https://via.placeholder.com/30'}" alt="${person.nationality}">
                                    ${person.nationality}
                                </td>
                            </tr>
                            ${person.position ? `
                            <tr>
                                <td class="info-label">المركز:</td>
                                <td class="info-value">${person.position}</td>
                            </tr>
                            ` : ''}
                            ${person.height ? `
                            <tr>
                                <td class="info-label">الطول:</td>
                                <td class="info-value">${person.height} سم</td>
                            </tr>
                            ` : ''}
                            ${person.national_number ? `
                            <tr>
                                <td class="info-label">رقم المنتخب:</td>
                                <td class="info-value">${person.national_number}</td>
                            </tr>
                            ` : ''}
                            ${person.club_number ? `
                            <tr>
                                <td class="info-label">رقم النادي:</td>
                                <td class="info-value">${person.club_number}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    ${person.current_club ? `
                    <div class="info-section">
                        <div class="section-title">
                            <div class="section-title-text">النادي الحالي</div>
                            <div class="section-line"></div>
                        </div>
                        
                        <table class="info-table">
                            <tr>
                                <td class="info-label">النادي:</td>
                                <td class="info-value">
                                    <img src="${person.current_club_logo || 'https://via.placeholder.com/30'}" alt="${person.current_club}">
                                    ${person.current_club}
                                </td>
                            </tr>
                            ${leagueData ? `
                            <tr>
                                <td class="info-label">الدوري:</td>
                                <td class="info-value">
                                    <img src="${leagueData.logo_url || 'https://via.placeholder.com/30'}" alt="${leagueData.name}">
                                    ${leagueData.name}
                                </td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    ` : ''}
                    
                    ${previousClubs && previousClubs.length > 0 ? `
                    <div class="info-section">
                        <div class="section-title">
                            <div class="section-title-text">الأندية السابقة</div>
                            <div class="section-line"></div>
                        </div>
                        
                        <div class="previous-clubs-container">
                            ${previousClubs.map(club => `
                                <div class="club-badge">
                                    <img src="${club.logo_url || 'https://via.placeholder.com/30'}" alt="${club.name}">
                                    <span>${club.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${person.achievements ? `
                    <div class="info-section">
                        <div class="section-title">
                            <div class="section-title-text">الإنجازات</div>
                            <div class="section-line"></div>
                        </div>
                        
                        <div class="achievements-container">
                            ${person.achievements.split(',').map(achievement => `
                                <div class="achievement-badge">${achievement.trim()}</div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        const modalContent = document.getElementById('playerDetailsContent');
        const modalTitle = document.getElementById('playerDetailsTitle');
        
        modalContent.innerHTML = detailsHTML;
        modalTitle.textContent = `تفاصيل ${categoryName}`;
        
        // تغيير زر الإغلاق في المودال ليكون على اليسار
        const modalFooter = document.querySelector('#playerDetailsModal .modal-footer');
        if (modalFooter) {
            modalFooter.innerHTML = '<button type="button" class="close-btn" data-bs-dismiss="modal">إغلاق</button>';
        }
        
        const playerDetailsModal = new bootstrap.Modal(document.getElementById('playerDetailsModal'));
        playerDetailsModal.show();
        
        // Add click event for the player image to open fullscreen modal
        const playerImage = modalContent.querySelector('.player-big-image');
        if (playerImage) {
            playerImage.addEventListener('click', function() {
                openImageModal(null, this.src, person.name);
            });
            playerImage.style.cursor = 'pointer';
        }
    } catch (error) {
        console.error('Error fetching person details:', error);
        alert('حدث خطأ أثناء جلب تفاصيل الشخص');
    }
}

// Admin functions
async function savePerson() {
    try {
        const personId = document.getElementById('personId').value;
        const name = document.getElementById('personName').value;
        const age = document.getElementById('personAge').value;
        const position = document.getElementById('personPosition').value;
        const height = document.getElementById('personHeight').value;
        const nationalNumber = document.getElementById('personNationalNumber').value;
        const clubNumber = document.getElementById('personClubNumber').value;
        const nationalityId = document.getElementById('personNationality').value;
        const category = document.getElementById('personCategory').value;
        const currentClubId = document.getElementById('personCurrentClub').value;
        const leagueId = document.getElementById('personLeague').value;
        const achievements = document.getElementById('personAchievements').value;
        const imageFile = document.getElementById('personImage').files[0];
        
        if (!name || !age || !nationalityId || !category) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // Get nationality data
        const { data: nationalityData, error: nationalityError } = await supabaseClient
            .from('countries')
            .select('*')
            .eq('id', nationalityId)
            .single();
            
        if (nationalityError) throw nationalityError;
        
        // Get current club data if selected
        let clubData = null;
        if (currentClubId) {
            const { data: clubResult, error: clubError } = await supabaseClient
                .from('clubs')
                .select('*')
                .eq('id', currentClubId)
                .single();
                
            if (clubError) throw clubError;
            clubData = clubResult;
        }
        
        // Handle image upload if provided
        let imageUrl = null;
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `persons/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(filePath, imageFile);
                
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data } = supabaseClient.storage
                .from('images')
                .getPublicUrl(filePath);
                
            imageUrl = data.publicUrl;
        } else if (document.getElementById('imagePreview') && 
                  document.getElementById('imagePreview').src && 
                  !document.getElementById('imagePreview').src.includes('data:image')) {
            // Keep existing image if no new file is uploaded
            imageUrl = document.getElementById('imagePreview').src;
        }
        
        const personData = {
            name,
            age: parseInt(age),
            nationality: nationalityData.name,
            nationality_flag: nationalityData.flag_url,
            category,
            current_club: clubData ? clubData.name : null,
            current_club_logo: clubData ? clubData.logo_url : null,
            image_url: imageUrl,
            achievements,
            position,
            height: height ? parseInt(height) : null,
            national_number: nationalNumber ? parseInt(nationalNumber) : null,
            club_number: clubNumber ? parseInt(clubNumber) : null,
            league_id: leagueId || null
        };
        
        let result;
        
        if (personId) {
            // Update existing person
            result = await supabaseClient
                .from('football_persons')
                .update(personData)
                .eq('id', personId);
        } else {
            // Add new person
            result = await supabaseClient
                .from('football_persons')
                .insert([personData]);
        }
        
        if (result.error) throw result.error;
        
        // Save previous clubs if any
        if (!personId && result.data && result.data.length > 0) {
            personId = result.data[0].id;
        }
        
        // Handle previous clubs
        const previousClubEntries = document.querySelectorAll('.previous-club-entry');
        if (personId && previousClubEntries.length > 0) {
            // Delete existing previous clubs
            await supabaseClient
                .from('previous_clubs')
                .delete()
                .eq('person_id', personId);
                
            // Add new previous clubs
            const previousClubs = [];
            
            for (const entry of previousClubEntries) {
                const clubSelect = entry.querySelector('.previous-club-select');
                const clubId = clubSelect.value;
                
                if (clubId) {
                    const { data: clubData, error: clubError } = await supabaseClient
                        .from('clubs')
                        .select('*')
                        .eq('id', clubId)
                        .single();
                        
                    if (!clubError && clubData) {
                        previousClubs.push({
                            person_id: personId,
                            name: clubData.name,
                            logo_url: clubData.logo_url
                        });
                    }
                }
            }
            
            if (previousClubs.length > 0) {
                const { error: insertError } = await supabaseClient
                    .from('previous_clubs')
                    .insert(previousClubs);
                    
                if (insertError) throw insertError;
            }
        }
        
        // Close modal and refresh data
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPersonModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('personForm').reset();
        document.getElementById('previousClubsContainer').innerHTML = `
            <div class="row mb-2 previous-club-entry">
                <div class="col-md-10">
                    <select class="form-select previous-club-select">
                        <option value="" selected disabled>اختر النادي</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger remove-club-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        document.getElementById('personId').value = '';
        document.getElementById('personModalTitle').textContent = 'إضافة شخصية جديدة';
        
        // Reload the player lists
        await loadFootballData();
        if (isAdmin) {
            await loadAdminTable();
        }
        
        alert('تم حفظ البيانات بنجاح');
    } catch (error) {
        console.error('Error saving person: ', error);
        alert('حدث خطأ أثناء حفظ البيانات');
    }
}

async function editPerson(id) {
    try {
        const { data, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Populate the form with existing data
        document.getElementById('personId').value = data.id;
        document.getElementById('personName').value = data.name;
        document.getElementById('personAge').value = data.age;
        if (data.position) document.getElementById('personPosition').value = data.position;
        if (data.height) document.getElementById('personHeight').value = data.height;
        if (data.national_number) document.getElementById('personNationalNumber').value = data.national_number;
        if (data.club_number) document.getElementById('personClubNumber').value = data.club_number;
        document.getElementById('personCategory').value = data.category;
        document.getElementById('personAchievements').value = data.achievements || '';
        
        // Update the form title
        document.getElementById('personModalTitle').textContent = 'تعديل بيانات ' + data.name;
        
        // Set nationality if available
        if (data.nationality) {
            const nationalitySelect = document.getElementById('personNationality');
            for (let i = 0; i < nationalitySelect.options.length; i++) {
                if (nationalitySelect.options[i].textContent === data.nationality) {
                    nationalitySelect.value = nationalitySelect.options[i].value;
                    break;
                }
            }
        }
        
        // Set current club if available
        if (data.current_club) {
            const currentClubSelect = document.getElementById('personCurrentClub');
            for (let i = 0; i < currentClubSelect.options.length; i++) {
                if (currentClubSelect.options[i].textContent === data.current_club) {
                    currentClubSelect.value = currentClubSelect.options[i].value;
                    break;
                }
            }
        }
        
        // Set league if available
        if (data.league_id) {
            document.getElementById('personLeague').value = data.league_id;
        }
        
        // Show image preview if available
        if (data.image_url) {
            document.getElementById('imagePreview').src = data.image_url;
            document.getElementById('imagePreviewContainer').classList.remove('d-none');
        }
        
        // Fetch previous clubs
        const { data: previousClubs, error: clubsError } = await supabaseClient
            .from('previous_clubs')
            .select('*')
            .eq('person_id', id);
            
        if (clubsError) throw clubsError;
        
        // Clear existing previous clubs container
        document.getElementById('previousClubsContainer').innerHTML = '';
        
        // Add previous clubs to the form
        if (previousClubs && previousClubs.length > 0) {
            previousClubs.forEach(club => {
                addPreviousClubField(club.name, club.logo_url);
            });
        } else {
            // Add an empty field
            addPreviousClubField();
        }
        
        // Update the previous clubs label based on the category
        updatePreviousClubsLabel(data.category);
        
        // Show the modal
        const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
        addPersonModal.show();
    } catch (error) {
        console.error('Error editing person:', error);
        alert('حدث خطأ أثناء تحميل بيانات الشخص');
    }
}

async function deletePerson(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        return;
    }
    
    try {
        // Delete previous clubs first
        const { error: clubsError } = await supabaseClient
            .from('previous_clubs')
            .delete()
            .eq('person_id', id);
            
        if (clubsError) throw clubsError;
        
        // Then delete the person
        const { error } = await supabaseClient
            .from('football_persons')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف الشخص بنجاح');
        await loadFootballData();
    } catch (error) {
        console.error('Error deleting person:', error);
        alert('حدث خطأ أثناء حذف الشخص: ' + error.message);
    }
}

function addPreviousClubField() {
    const container = document.getElementById('previousClubsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'row mb-2 previous-club-entry';
    
    newRow.innerHTML = `
        <div class="col-md-10">
            <select class="form-select previous-club-select" data-bs-toggle="tooltip" title="اختر نادي سابق">
                <option value="" selected disabled>اختر النادي</option>
            </select>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger remove-club-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // تعبئة القائمة الجديدة بالأندية
    loadClubsForSelect(newRow.querySelector('.previous-club-select'));
    
    // إضافة مستمع لزر الحذف
    newRow.querySelector('.remove-club-btn').addEventListener('click', function() {
        container.removeChild(newRow);
    });
}

// إضافة دوال جديدة للإضافة الجماعية للمنتخبات والأندية
async function showBulkCountryModal() {
    // عرض مودال إضافة دول بشكل جماعي
    const modal = new bootstrap.Modal(document.getElementById('bulkCountryModal'));
    modal.show();
}

async function saveBulkCountries() {
    try {
        const countriesText = document.getElementById('bulkCountriesText').value;
        if (!countriesText.trim()) {
            alert('يرجى إدخال بيانات الدول');
            return;
        }
        
        // تقسيم النص إلى أسطر
        const countriesLines = countriesText.trim().split('\n');
        const countries = [];
        
        // معالجة كل سطر
        for (const line of countriesLines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const countryName = parts[0].trim();
                const flagUrl = parts[1].trim();
                
                if (countryName && flagUrl) {
                    countries.push({
                        name: countryName,
                        flag_url: flagUrl
                    });
                }
            }
        }
        
        if (countries.length === 0) {
            alert('لم يتم العثور على بيانات صالحة. تأكد من الصيغة: اسم الدولة, رابط العلم');
            return;
        }
        
        // إضافة الدول إلى قاعدة البيانات
        const { data, error } = await supabaseClient
            .from('countries')
            .insert(countries);
            
        if (error) throw error;
        
        alert(`تم إضافة ${countries.length} دولة بنجاح`);
        document.getElementById('bulkCountriesText').value = '';
        
        // إغلاق المودال
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkCountryModal'));
        modal.hide();
        
        // تحديث الجداول والقوائم
        await loadCountriesTable();
        await loadCountries();
    } catch (error) {
        console.error('Error adding bulk countries:', error);
        alert('حدث خطأ أثناء إضافة الدول: ' + error.message);
    }
}

async function showBulkClubModal() {
    // عرض مودال إضافة أندية بشكل جماعي
    const modal = new bootstrap.Modal(document.getElementById('bulkClubModal'));
    modal.show();
}

async function saveBulkClubs() {
    try {
        const clubsText = document.getElementById('bulkClubsText').value;
        if (!clubsText.trim()) {
            alert('يرجى إدخال بيانات الأندية');
            return;
        }
        
        // تقسيم النص إلى أسطر
        const clubsLines = clubsText.trim().split('\n');
        const clubs = [];
        
        // معالجة كل سطر
        for (const line of clubsLines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const clubName = parts[0].trim();
                const logoUrl = parts[1].trim();
                
                if (clubName && logoUrl) {
                    clubs.push({
                        name: clubName,
                        logo_url: logoUrl
                    });
                }
            }
        }
        
        if (clubs.length === 0) {
            alert('لم يتم العثور على بيانات صالحة. تأكد من الصيغة: اسم النادي, رابط الشعار');
            return;
        }
        
        // إضافة الأندية إلى قاعدة البيانات
        const { data, error } = await supabaseClient
            .from('clubs')
            .insert(clubs);
            
        if (error) throw error;
        
        alert(`تم إضافة ${clubs.length} نادي بنجاح`);
        document.getElementById('bulkClubsText').value = '';
        
        // إغلاق المودال
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkClubModal'));
        modal.hide();
        
        // تحديث الجداول والقوائم
        await loadClubsTable();
        await loadClubs();
    } catch (error) {
        console.error('Error adding bulk clubs:', error);
        alert('حدث خطأ أثناء إضافة الأندية: ' + error.message);
    }
}

// دالة مساعدة لتعبئة قائمة منسدلة واحدة بالأندية
async function loadClubsForSelect(select) {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        select.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
        
        // إضافة خيار "لا يوجد"
        const noClubOption = document.createElement('option');
        noClubOption.value = "no_club";
        noClubOption.textContent = "لا يوجد";
        select.appendChild(noClubOption);
        
        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;
            option.setAttribute('data-logo', club.logo_url);
            option.textContent = club.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clubs for select:', error);
    }
}

// إضافة دوال لتحميل الدول والأندية
async function loadCountries() {
    try {
        const { data: countries, error } = await supabaseClient
            .from('countries')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const nationalitySelect = document.getElementById('personNationality');
        nationalitySelect.innerHTML = '<option value="" selected disabled>اختر الجنسية</option>';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            
            // تحديث رابط العلم ليستخدم مشروع Supabase الجديد
            let flagUrl = country.flag_url;
            if (flagUrl && flagUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                // استبدال الرابط القديم بالرابط الجديد
                flagUrl = flagUrl.replace(
                    'ubmfyjpqvpihwgzdfwht.supabase.co', 
                    'yuddtnebiafcyuhcmfoo.supabase.co'
                );
            }
            
            option.setAttribute('data-flag', flagUrl);
            option.textContent = country.name;
            nationalitySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading countries:', error);
        alert('حدث خطأ أثناء تحميل قائمة الدول');
    }
}

async function loadClubs() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        // تعبئة قائمة النادي الحالي
        const currentClubSelect = document.getElementById('personCurrentClub');
        currentClubSelect.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
        
        // إضافة خيار "لا يوجد"
        const noClubOption = document.createElement('option');
        noClubOption.value = "no_club";
        noClubOption.textContent = "لا يوجد";
        currentClubSelect.appendChild(noClubOption);
        
        clubs.forEach(club => {
            // تحديث رابط شعار النادي ليستخدم مشروع Supabase الجديد
            let logoUrl = club.logo_url;
            if (logoUrl && logoUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                // استبدال الرابط القديم بالرابط الجديد
                logoUrl = logoUrl.replace(
                    'ubmfyjpqvpihwgzdfwht.supabase.co', 
                    'yuddtnebiafcyuhcmfoo.supabase.co'
                );
            }
            
            const option = document.createElement('option');
            option.value = club.id;
            option.setAttribute('data-logo', logoUrl);
            option.textContent = club.name;
            currentClubSelect.appendChild(option);
        });
        
        // تعبئة قوائم الأندية السابقة
        const previousClubSelects = document.querySelectorAll('.previous-club-select');
        previousClubSelects.forEach(select => {
            select.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
            
            // إضافة خيار "لا يوجد" للقوائم المنسدلة للأندية السابقة
            const noClubOption = document.createElement('option');
            noClubOption.value = "no_club";
            noClubOption.textContent = "لا يوجد";
            select.appendChild(noClubOption);
            
            clubs.forEach(club => {
                // تحديث رابط شعار النادي ليستخدم مشروع Supabase الجديد
                let logoUrl = club.logo_url;
                if (logoUrl && logoUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                    // استبدال الرابط القديم بالرابط الجديد
                    logoUrl = logoUrl.replace(
                        'ubmfyjpqvpihwgzdfwht.supabase.co', 
                        'yuddtnebiafcyuhcmfoo.supabase.co'
                    );
                }
                
                const option = document.createElement('option');
                option.value = club.id;
                option.setAttribute('data-logo', logoUrl);
                option.textContent = club.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading clubs:', error);
        alert('حدث خطأ أثناء تحميل قائمة الأندية');
    }
}

// Image preview handlers
function setupImagePreviewHandlers() {
    // Main player image preview
    document.getElementById('personImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('imagePreview').src = e.target.result;
                document.getElementById('imagePreviewContainer').classList.remove('d-none');
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Add event listeners for existing remove club buttons
    document.querySelectorAll('.remove-club-btn').forEach(button => {
        button.addEventListener('click', function() {
            const entry = this.closest('.previous-club-entry');
            entry.parentNode.removeChild(entry);
        });
    });
}

// Execute these functions after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (this.getAttribute('href') === '#adminPanel') {
                document.getElementById('playerCategories').classList.add('d-none');
                document.getElementById('adminPanel').classList.remove('d-none');
            } else if (this.getAttribute('href') === '#playerCategories') {
                document.getElementById('adminPanel').classList.add('d-none');
                document.getElementById('playerCategories').classList.remove('d-none');
            }
        });
    });
});

// إضافة دالة لإنشاء وملء جداول الدول والأندية
async function setupMasterData() {
    try {
        // Check if countries table exists, otherwise create it
        const { error: countriesError } = await supabaseClient.from('countries').select('id').limit(1);
        
        if (countriesError && countriesError.code === '42P01') { // table does not exist error
            // Create countries table
            await supabaseClient.rpc('create_countries_table');
        }
        
        // Check if clubs table exists, otherwise create it
        const { error: clubsError } = await supabaseClient.from('clubs').select('id').limit(1);
        
        if (clubsError && clubsError.code === '42P01') { // table does not exist error
            // Create clubs table
            await supabaseClient.rpc('create_clubs_table');
        }
        
        // Check if leagues table exists, otherwise create it
        const { error: leaguesError } = await supabaseClient.from('leagues').select('id').limit(1);
        
        if (leaguesError && leaguesError.code === '42P01') { // table does not exist error
            // Create leagues table
            await supabaseClient.rpc('create_leagues_table');
        }
    } catch (error) {
        console.error('Error setting up master data: ', error);
    }
}

// تحديث دالة تنشيط مستمعات أحداث الصور
function attachImageClickEvents(container) {
    // لم نعد بحاجة إلى هذه الدالة لأننا الآن نستخدم onclick مباشرة
    // هذه الدالة موجودة فقط للتوافق مع الكود الموجود
}

// وظائف إدارة الجنسيات
async function loadCountriesTable() {
    try {
        const { data: countries, error } = await supabaseClient
            .from('countries')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const tableBody = document.getElementById('countriesTableBody');
        tableBody.innerHTML = '';
        
        countries.forEach(country => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${country.flag_url}" alt="${country.name}" style="width: 60px; height: 40px; object-fit: contain;"></td>
                <td>${country.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editCountry('${country.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCountry('${country.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading countries table:', error);
        alert('حدث خطأ أثناء تحميل بيانات الدول');
    }
}

async function saveCountry() {
    if (!document.getElementById('countryName').value) {
        alert('يرجى إدخال اسم الدولة');
        return;
    }
    
    try {
        const countryId = document.getElementById('countryId').value;
        const countryName = document.getElementById('countryName').value;
        const countryFlag = document.getElementById('countryFlag').files[0];
        
        const formData = {
            name: countryName
        };
        
        // رفع الصورة إذا تم تحديدها
        if (countryFlag) {
            const flagPath = `flags/${Date.now()}_${countryFlag.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(flagPath, countryFlag);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('images')
                .getPublicUrl(flagPath);
                
            formData.flag_url = publicUrl;
        }
        
        if (countryId) {
            // تحديث دولة موجودة
            const { error } = await supabaseClient
                .from('countries')
                .update(formData)
                .eq('id', countryId);
                
            if (error) throw error;
            
            alert('تم تحديث الدولة بنجاح');
        } else {
            // إضافة دولة جديدة
            const { error } = await supabaseClient
                .from('countries')
                .insert([formData]);
                
            if (error) throw error;
            
            alert('تمت إضافة الدولة بنجاح');
        }
        
        resetCountryForm();
        await loadCountriesTable();
        await loadCountries(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error saving country:', error);
        alert('حدث خطأ أثناء حفظ بيانات الدولة: ' + error.message);
    }
}

function resetCountryForm() {
    document.getElementById('countryId').value = '';
    document.getElementById('countryName').value = '';
    document.getElementById('countryFlag').value = '';
    document.getElementById('flagPreviewContainer').classList.add('d-none');
}

async function editCountry(id) {
    try {
        const { data: country, error } = await supabaseClient
            .from('countries')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('countryId').value = country.id;
        document.getElementById('countryName').value = country.name;
        
        if (country.flag_url) {
            document.getElementById('flagPreview').src = country.flag_url;
            document.getElementById('flagPreviewContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error editing country:', error);
        alert('حدث خطأ أثناء تحميل بيانات الدولة: ' + error.message);
    }
}

async function deleteCountry(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الدولة؟')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('countries')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف الدولة بنجاح');
        await loadCountriesTable();
        await loadCountries(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error deleting country:', error);
        alert('حدث خطأ أثناء حذف الدولة: ' + error.message);
    }
}

// وظائف إدارة الأندية
async function loadClubsTable() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const tableBody = document.getElementById('clubsTableBody');
        tableBody.innerHTML = '';
        
        clubs.forEach(club => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${club.logo_url}" alt="${club.name}" style="width: 60px; height: 60px; object-fit: contain;"></td>
                <td>${club.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editClub('${club.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClub('${club.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading clubs table:', error);
        alert('حدث خطأ أثناء تحميل بيانات الأندية');
    }
}

async function saveClub() {
    if (!document.getElementById('clubName').value) {
        alert('يرجى إدخال اسم النادي');
        return;
    }
    
    try {
        const clubId = document.getElementById('clubId').value;
        const clubName = document.getElementById('clubName').value;
        const clubLogo = document.getElementById('clubLogo').files[0];
        
        const formData = {
            name: clubName
        };
        
        // رفع الصورة إذا تم تحديدها
        if (clubLogo) {
            const logoPath = `clubs/${Date.now()}_${clubLogo.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(logoPath, clubLogo);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('images')
                .getPublicUrl(logoPath);
                
            formData.logo_url = publicUrl;
        }
        
        if (clubId) {
            // تحديث نادي موجود
            const { error } = await supabaseClient
                .from('clubs')
                .update(formData)
                .eq('id', clubId);
                
            if (error) throw error;
            
            alert('تم تحديث النادي بنجاح');
        } else {
            // إضافة نادي جديد
            const { error } = await supabaseClient
                .from('clubs')
                .insert([formData]);
                
            if (error) throw error;
            
            alert('تمت إضافة النادي بنجاح');
        }
        
        resetClubForm();
        await loadClubsTable();
        await loadClubs(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error saving club:', error);
        alert('حدث خطأ أثناء حفظ بيانات النادي: ' + error.message);
    }
}

function resetClubForm() {
    document.getElementById('clubId').value = '';
    document.getElementById('clubName').value = '';
    document.getElementById('clubLogo').value = '';
    document.getElementById('logoPreviewContainer').classList.add('d-none');
}

async function editClub(id) {
    try {
        const { data: club, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('clubId').value = club.id;
        document.getElementById('clubName').value = club.name;
        
        if (club.logo_url) {
            document.getElementById('logoPreview').src = club.logo_url;
            document.getElementById('logoPreviewContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error editing club:', error);
        alert('حدث خطأ أثناء تحميل بيانات النادي: ' + error.message);
    }
}

async function deleteClub(id) {
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('clubs')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف النادي بنجاح');
        await loadClubsTable();
        await loadClubs(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error deleting club:', error);
        alert('حدث خطأ أثناء حذف النادي: ' + error.message);
    }
}

// دوال البحث عن اللاعبين
async function searchPlayers() {
    const searchQuery = document.getElementById('playerSearchInput').value.trim();
    
    if (!searchQuery || searchQuery.length < 2) {
        alert('يرجى إدخال كلمة بحث لا تقل عن حرفين');
        return;
    }
    
    try {
        // البحث في قاعدة البيانات باستخدام الاستعلام
        const { data: results, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .ilike('name', `%${searchQuery}%`);
            
        if (error) throw error;
        
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const searchNoResults = document.getElementById('searchNoResults');
        
        searchResultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            // لا توجد نتائج
            searchNoResults.classList.remove('d-none');
        } else {
            // عرض النتائج
            searchNoResults.classList.add('d-none');
            
            results.forEach(person => {
                const searchCardCol = document.createElement('div');
                searchCardCol.className = 'col-md-4 mb-3';
                searchCardCol.innerHTML = createSearchResultCard(person);
                searchResultsContainer.appendChild(searchCardCol);
            });
        }
        
        // عرض مودال نتائج البحث
        const searchResultsModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
        searchResultsModal.show();
    } catch (error) {
        console.error('Error searching players:', error);
        alert('حدث خطأ أثناء البحث: ' + error.message);
    }
}

// دالة لإنشاء بطاقة نتيجة بحث
function createSearchResultCard(person) {
    // تحديد ما إذا كان يجب عرض النادي الحالي (فقط للاعبين الحاليين والمدربين)
    const showCurrentClub = person.category !== 'retired';
    
    return `
        <div class="card h-100 search-card">
            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                <span class="small">${getCategoryName(person.category)}</span>
                <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img">
            </div>
            <div class="card-body text-center p-2 p-md-3">
                <img src="${person.image_url}" alt="${person.name}" class="img-fluid rounded mb-2" style="cursor: pointer;" onclick="openImageModal(event, '${person.image_url}', '${person.name}')">
                <h5 class="card-title fs-6 fs-md-5 mb-1">${person.name}</h5>
                <p class="card-text small mb-1">
                    العمر: ${person.age} سنة
                    ${person.position ? `<br>المركز: ${person.position}` : ''}
                    ${showCurrentClub && person.current_club ? `<br>النادي: ${person.current_club} ${person.club_number ? `<span class="badge bg-primary">${person.club_number}</span>` : ''}` : ''}
                </p>
                <button class="btn btn-primary btn-sm mt-1" onclick="viewPersonDetails('${person.id}')">
                    <i class="fas fa-info-circle me-1 d-none d-sm-inline"></i>عرض التفاصيل
                </button>
            </div>
        </div>
    `;
}

// إضافة دالة لتحميل خيارات الفلترة
function loadFilterOptions() {
    // تحديد الفئة النشطة حاليًا
    const activeTabId = document.querySelector('#categoryTabs .nav-link.active')?.getAttribute('id');
    let currentPlayersData;
    
    if (activeTabId === 'current-players-tab') {
        currentPlayersData = allCurrentPlayers;
    } else if (activeTabId === 'retired-players-tab') {
        currentPlayersData = allRetiredPlayers;
    } else if (activeTabId === 'coaches-tab') {
        currentPlayersData = allCoaches;
    } else {
        // إذا لم يتم العثور على تبويب نشط، استخدم جميع البيانات
        currentPlayersData = [...allCurrentPlayers, ...allRetiredPlayers, ...allCoaches];
    }
    
    // تجميع الجنسيات والأندية من البيانات الحالية
    const tabNationalities = new Set();
    const tabClubs = new Set();
    
    currentPlayersData.forEach(player => {
        if (player.nationality) {
            tabNationalities.add(player.nationality);
        }
        if (player.current_club) {
            tabClubs.add(player.current_club);
        }
    });
    
    // تحميل قائمة الدول
    const nationalitySelect = document.getElementById('filterNationality');
    if (nationalitySelect) {
        // حفظ القيمة المحددة حاليًا
        const currentValue = nationalitySelect.value;
        
        // مسح القائمة ما عدا الخيار الافتراضي
        while (nationalitySelect.options.length > 1) {
            nationalitySelect.remove(1);
        }
        
        // إضافة الدول المتوفرة
        Array.from(tabNationalities).sort().forEach(nationality => {
            const option = document.createElement('option');
            option.value = nationality;
            option.textContent = nationality;
            nationalitySelect.appendChild(option);
        });
        
        // استعادة القيمة المحددة سابقًا
        if (currentValue && nationalitySelect.querySelector(`option[value="${currentValue}"]`)) {
            nationalitySelect.value = currentValue;
        }
    }
    
    // تحميل قائمة الأندية
    const clubSelect = document.getElementById('filterClub');
    if (clubSelect) {
        // حفظ القيمة المحددة حاليًا
        const currentValue = clubSelect.value;
        
        // مسح القائمة ما عدا الخيار الافتراضي
        while (clubSelect.options.length > 1) {
            clubSelect.remove(1);
        }
        
        // إضافة الأندية المتوفرة
        Array.from(tabClubs).sort().forEach(club => {
            const option = document.createElement('option');
            option.value = club;
            option.textContent = club;
            clubSelect.appendChild(option);
        });
        
        // استعادة القيمة المحددة سابقًا
        if (currentValue && clubSelect.querySelector(`option[value="${currentValue}"]`)) {
            clubSelect.value = currentValue;
        }
    }
}

// إضافة دالة للفلترة المتقدمة
function applyAdvancedFilters() {
    // الحصول على قيم الفلترة
    const nationality = document.getElementById('filterNationality').value;
    const club = document.getElementById('filterClub').value;
    const position = document.getElementById('filterPosition').value;
    const clubNumber = document.getElementById('filterClubNumber').value;
    const nationalNumber = document.getElementById('filterNationalNumber').value;
    
    // تحديد الفئة النشطة حاليًا
    const activeTabId = document.querySelector('#categoryTabs .nav-link.active').getAttribute('id');
    let playersArray, container, categoryName;
    
    if (activeTabId === 'current-players-tab') {
        playersArray = allCurrentPlayers;
        container = currentPlayersContainer;
        categoryName = 'لاعبين حاليين';
    } else if (activeTabId === 'retired-players-tab') {
        playersArray = allRetiredPlayers;
        container = retiredPlayersContainer;
        categoryName = 'لاعبين معتزلين';
    } else if (activeTabId === 'coaches-tab') {
        playersArray = allCoaches;
        container = coachesContainer;
        categoryName = 'مدربين';
    }
    
    // تطبيق الفلترة
    const filteredPlayers = playersArray.filter(player => {
        // فلترة حسب الجنسية
        if (nationality && player.nationality !== nationality) {
            return false;
        }
        
        // فلترة حسب النادي
        if (club && (!player.current_club || player.current_club !== club)) {
            return false;
        }
        
        // فلترة حسب المركز
        if (position && (!player.position || player.position !== position)) {
            return false;
        }
        
        // فلترة حسب رقم النادي
        if (clubNumber && (!player.club_number || player.club_number != clubNumber)) {
            return false;
        }
        
        // فلترة حسب رقم المنتخب
        if (nationalNumber && (!player.national_number || player.national_number != nationalNumber)) {
            return false;
        }
        
        return true;
    });
    
    // عرض النتائج المفلترة
    container.innerHTML = '';
    
    // إضافة ملخص نتائج الفلترة
    const filterSummary = document.createElement('div');
    filterSummary.className = 'col-12 mb-3';
    
    // بناء وصف الفلترة
    let filterDescription = `<div class="alert alert-info">`;
    
    // عدد النتائج
    filterDescription += `<p class="mb-2"><strong>تم العثور على ${filteredPlayers.length} ${categoryName}</strong></p>`;
    
    // معايير الفلترة المستخدمة
    let usedFilters = [];
    if (nationality) usedFilters.push(`الجنسية: ${nationality}`);
    if (club) usedFilters.push(`النادي: ${club}`);
    if (position) usedFilters.push(`المركز: ${position}`);
    if (clubNumber) usedFilters.push(`رقم النادي: ${clubNumber}`);
    if (nationalNumber) usedFilters.push(`رقم المنتخب: ${nationalNumber}`);
    
    if (usedFilters.length > 0) {
        filterDescription += `<p class="mb-0 small">الفلاتر المستخدمة: ${usedFilters.join(' | ')}</p>`;
    }
    
    filterDescription += `<button class="btn btn-sm btn-outline-secondary mt-2" onclick="resetFilters()">إعادة ضبط الفلاتر</button>`;
    filterDescription += `</div>`;
    
    filterSummary.innerHTML = filterDescription;
    container.appendChild(filterSummary);
    
    if (filteredPlayers.length === 0) {
        container.innerHTML += '<div class="col-12 text-center"><p>لا توجد نتائج تطابق معايير البحث</p></div>';
    } else {
        filteredPlayers.forEach(player => {
            container.appendChild(createPersonCard(player));
        });
    }
}

// دالة لإعادة ضبط الفلاتر وعرض جميع البيانات
function resetFilters() {
    document.getElementById('filterNationality').value = '';
    document.getElementById('filterClub').value = '';
    document.getElementById('filterPosition').value = '';
    document.getElementById('filterClubNumber').value = '';
    document.getElementById('filterNationalNumber').value = '';
    
    // تحديد الفئة النشطة حاليًا
    const activeTabId = document.querySelector('#categoryTabs .nav-link.active').getAttribute('id');
    let playersArray, container;
    
    if (activeTabId === 'current-players-tab') {
        playersArray = allCurrentPlayers;
        container = currentPlayersContainer;
    } else if (activeTabId === 'retired-players-tab') {
        playersArray = allRetiredPlayers;
        container = retiredPlayersContainer;
    } else if (activeTabId === 'coaches-tab') {
        playersArray = allCoaches;
        container = coachesContainer;
    }
    
    // عرض جميع اللاعبين
    container.innerHTML = '';
    playersArray.forEach(player => {
        container.appendChild(createPersonCard(player));
    });
}

async function loadLeagues() {
    try {
        const { data, error } = await supabaseClient
            .from('leagues')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            // Populate league dropdowns in the player form
            const leagueSelect = document.getElementById('personLeague');
            if (leagueSelect) {
                // Clear existing options except the first one
                while (leagueSelect.options.length > 1) {
                    leagueSelect.remove(1);
                }
                
                // Add leagues to the select
                data.forEach(league => {
                    const option = document.createElement('option');
                    option.value = league.id;
                    option.textContent = league.name;
                    option.setAttribute('data-logo', league.logo_url || '');
                    leagueSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading leagues: ', error);
    }
}

async function loadLeaguesTable() {
    try {
        const { data, error } = await supabaseClient
            .from('leagues')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const leaguesTableBody = document.getElementById('leaguesTableBody');
        if (leaguesTableBody) {
            leaguesTableBody.innerHTML = '';
            
            if (data && data.length > 0) {
                data.forEach(league => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <img src="${league.logo_url || 'https://via.placeholder.com/50'}" alt="${league.name}" 
                                style="max-width: 50px; max-height: 50px;" class="img-thumbnail">
                        </td>
                        <td>${league.name}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editLeague('${league.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteLeague('${league.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    leaguesTableBody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading leagues table: ', error);
    }
}

async function saveLeague() {
    try {
        const leagueId = document.getElementById('leagueId').value;
        const leagueName = document.getElementById('leagueName').value;
        const leagueLogoFile = document.getElementById('leagueLogo').files[0];
        
        if (!leagueName) {
            alert('الرجاء إدخال اسم الدوري');
            return;
        }
        
        let logoUrl = null;
        
        // Upload logo if provided
        if (leagueLogoFile) {
            const fileExt = leagueLogoFile.name.split('.').pop();
            const fileName = `league_${Date.now()}.${fileExt}`;
            const filePath = `leagues/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(filePath, leagueLogoFile);
                
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data } = supabaseClient.storage
                .from('images')
                .getPublicUrl(filePath);
                
            logoUrl = data.publicUrl;
        } else if (document.getElementById('leagueLogoPreview') && 
                   document.getElementById('leagueLogoPreview').src && 
                   !document.getElementById('leagueLogoPreview').src.includes('data:image')) {
            // Keep existing logo if no new file is uploaded
            logoUrl = document.getElementById('leagueLogoPreview').src;
        }
        
        const leagueData = {
            name: leagueName,
            logo_url: logoUrl
        };
        
        let result;
        
        if (leagueId) {
            // Update existing league
            result = await supabaseClient
                .from('leagues')
                .update(leagueData)
                .eq('id', leagueId);
        } else {
            // Add new league
            result = await supabaseClient
                .from('leagues')
                .insert([leagueData]);
        }
        
        if (result.error) throw result.error;
        
        // Refresh leagues table and form
        await loadLeaguesTable();
        await loadLeagues();
        resetLeagueForm();
        
        alert('تم حفظ الدوري بنجاح');
    } catch (error) {
        console.error('Error saving league: ', error);
        alert('حدث خطأ أثناء حفظ الدوري');
    }
}

function resetLeagueForm() {
    document.getElementById('leagueId').value = '';
    document.getElementById('leagueName').value = '';
    document.getElementById('leagueLogo').value = '';
    document.getElementById('leagueLogoPreviewContainer').classList.add('d-none');
    document.getElementById('leagueLogoPreview').src = '';
}

async function editLeague(id) {
    try {
        const { data, error } = await supabaseClient
            .from('leagues')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('leagueId').value = data.id;
        document.getElementById('leagueName').value = data.name;
        
        if (data.logo_url) {
            document.getElementById('leagueLogoPreview').src = data.logo_url;
            document.getElementById('leagueLogoPreviewContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error editing league: ', error);
        alert('حدث خطأ أثناء تحميل بيانات الدوري');
    }
}

async function deleteLeague(id) {
    if (confirm('هل أنت متأكد من حذف هذا الدوري؟')) {
        try {
            const { error } = await supabaseClient
                .from('leagues')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            await loadLeaguesTable();
            await loadLeagues();
            
            alert('تم حذف الدوري بنجاح');
        } catch (error) {
            console.error('Error deleting league: ', error);
            alert('حدث خطأ أثناء حذف الدوري');
        }
    }
}

async function showBulkLeagueModal() {
    const bulkLeagueModal = new bootstrap.Modal(document.getElementById('bulkLeagueModal'));
    bulkLeagueModal.show();
}

async function saveBulkLeagues() {
    try {
        const bulkText = document.getElementById('bulkLeaguesText').value;
        if (!bulkText.trim()) {
            alert('الرجاء إدخال بيانات الدوريات');
            return;
        }
        
        const lines = bulkText.split('\n').filter(line => line.trim());
        const leaguesData = [];
        
        for (const line of lines) {
            const [name, logoUrl] = line.split(',').map(part => part.trim());
            
            if (name) {
                leaguesData.push({
                    name: name,
                    logo_url: logoUrl || null
                });
            }
        }
        
        if (leaguesData.length === 0) {
            alert('لم يتم العثور على بيانات صالحة للدوريات');
            return;
        }
        
        const { error } = await supabaseClient
            .from('leagues')
            .insert(leaguesData);
            
        if (error) throw error;
        
        await loadLeaguesTable();
        await loadLeagues();
        
        // Close modal and clear input
        const bulkLeagueModal = bootstrap.Modal.getInstance(document.getElementById('bulkLeagueModal'));
        bulkLeagueModal.hide();
        document.getElementById('bulkLeaguesText').value = '';
        
        alert(`تم إضافة ${leaguesData.length} دوري بنجاح`);
    } catch (error) {
        console.error('Error saving bulk leagues: ', error);
        alert('حدث خطأ أثناء حفظ الدوريات');
    }
}