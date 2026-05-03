let state = {
    staff: [],
    courses: [],
    records: [],
    recentActivity: []
};

let currentUserRole = null;

function login(role) {
    currentUserRole = role;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('flex');
    
    document.getElementById('app-wrapper').classList.remove('hidden');
    document.getElementById('app-wrapper').classList.add('flex');

    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (role === 'admin') {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });

    document.getElementById('user-role-label').innerText = role === 'admin' ? 'Адміністратор' : 'Глядач';

    Promise.all([loadStaff(), loadCourses(), loadRecords()]).then(() => {
        renderDashboard();
    });
}

function logout() {
    currentUserRole = null;
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-screen').classList.add('flex');
    
    document.getElementById('app-wrapper').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('flex');
    
    switchTab('dashboard');
}

async function loadStaff() {
    try {
        const response = await fetch('/api/staff');
        state.staff = await response.json();
        renderStaff();
    } catch (error) {
        console.error(error);
    }
}

async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        state.courses = await response.json();
        renderCourses();
    } catch (error) {
        console.error(error);
    }
}

async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        state.records = await response.json();
        renderTrackingTable();
    } catch (error) {
        console.error(error);
    }
}

const tabTitles = {
    'dashboard': 'Дашборд',
    'staff': 'Персонал компанії',
    'courses': 'Каталог курсів',
    'tracking': 'Контроль та облік навчання'
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));
    
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-blue-50', 'text-primary');
        el.classList.add('text-gray-600');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-${tabId}`).classList.add('block');
    
    const activeNav = document.getElementById(`nav-${tabId}`);
    if(activeNav) {
        activeNav.classList.remove('text-gray-600');
        activeNav.classList.add('bg-blue-50', 'text-primary');
    }

    document.getElementById('page-title').innerText = tabTitles[tabId];

    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'staff') renderStaff();
    if(tabId === 'courses') renderCourses();
    if(tabId === 'tracking') renderTrackingTable();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    if(modalId === 'modal-assign-course') {
        populateAssignSelects();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    const form = document.querySelector(`#${modalId} form`);
    if(form) form.reset();
}

function renderDashboard() {
    document.getElementById('stat-staff-count').innerText = state.staff.length;
    document.getElementById('stat-courses-count').innerText = state.courses.length;
    
    const totalRecords = state.records.length;
    const completed = state.records.filter(r => r.status === 'completed').length;
    const rate = totalRecords === 0 ? 0 : Math.round((completed / totalRecords) * 100);
    document.getElementById('stat-completed-rate').innerText = `${rate}%`;

    const activityContainer = document.getElementById('recent-activity-list');
    activityContainer.innerHTML = state.recentActivity.map(act => `
        <div class="flex items-start">
            <div class="flex-shrink-0 h-8 w-8 rounded-full ${act.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mt-1">
                <i class="fa-solid ${act.type === 'success' ? 'fa-check' : 'fa-info'} text-sm"></i>
            </div>
            <div class="ml-4">
                <p class="text-sm font-medium text-gray-800">${act.msg}</p>
                <p class="text-xs text-gray-500 mt-1">${act.time}</p>
            </div>
        </div>
    `).join('');
}

function renderStaff() {
    const tbody = document.getElementById('table-staff-body');
    tbody.innerHTML = state.staff.map(person => {
        let actionsHtml = '';
        if (currentUserRole === 'admin') {
            actionsHtml = `
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button onclick="deleteStaff(${person.id})" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash"></i></button>
            </td>
            `;
        }
        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold uppercase">
                        ${person.name.charAt(0)}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${person.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${person.position}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${person.department}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${person.email}</td>
            ${actionsHtml}
        </tr>
        `;
    }).join('');
}

async function handleAddStaff(e) {
    e.preventDefault();
    const newStaff = {
        name: document.getElementById('staff-name').value,
        position: document.getElementById('staff-position').value,
        department: document.getElementById('staff-department').value,
        email: document.getElementById('staff-email').value
    };

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStaff)
        });
        const savedStaff = await response.json();
        state.staff.push(savedStaff);
        closeModal('modal-add-staff');
        renderStaff();
        addActivity(`Додано нового співробітника: ${savedStaff.name}`, 'info');
    } catch (error) {
        console.error(error);
    }
}

async function deleteStaff(id) {
    if(confirm('Видалити працівника?')) {
        try {
            await fetch(`/api/staff/${id}`, { method: 'DELETE' });
            state.staff = state.staff.filter(s => s.id !== id);
            
            const relatedRecords = state.records.filter(r => r.staffId === id);
            for(let rec of relatedRecords) {
                await fetch(`/api/records/${rec.id}`, { method: 'DELETE' });
            }
            state.records = state.records.filter(r => r.staffId !== id);
            
            renderStaff();
            renderTrackingTable();
            renderDashboard();
        } catch (error) {
            console.error(error);
        }
    }
}

function renderCourses() {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = state.courses.map(course => {
        let deleteBtn = '';
        if (currentUserRole === 'admin') {
            deleteBtn = `
            <div class="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer" onclick="deleteCourse(${course.id})">
                <i class="fa-solid fa-trash text-sm"></i>
            </div>
            `;
        }
        return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative">
            ${deleteBtn}
            <div class="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <i class="fa-solid fa-book-open text-xl"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">${course.title}</h3>
            <p class="text-sm text-gray-500 mb-4">${course.provider}</p>
            <p class="text-sm text-gray-600 mb-4 h-10 overflow-hidden">${course.desc}</p>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
                <span class="flex items-center text-gray-500"><i class="fa-regular fa-clock mr-1"></i> ${course.duration} год.</span>
                <span class="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">${course.level}</span>
            </div>
        </div>
        `;
    }).join('');
}

async function handleAddCourse(e) {
    e.preventDefault();
    const newCourse = {
        title: document.getElementById('course-title').value,
        provider: document.getElementById('course-provider').value,
        duration: parseInt(document.getElementById('course-duration').value),
        level: document.getElementById('course-level').value,
        desc: document.getElementById('course-desc').value
    };
    
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
        });
        const savedCourse = await response.json();
        state.courses.push(savedCourse);
        closeModal('modal-add-course');
        renderCourses();
        addActivity(`Створено новий курс: ${savedCourse.title}`, 'info');
    } catch (error) {
        console.error(error);
    }
}

async function deleteCourse(id) {
    if(confirm('Видалити цей курс?')) {
        try {
            await fetch(`/api/courses/${id}`, { method: 'DELETE' });
            state.courses = state.courses.filter(c => c.id !== id);
            
            const relatedRecords = state.records.filter(r => r.courseId === id);
            for(let rec of relatedRecords) {
                await fetch(`/api/records/${rec.id}`, { method: 'DELETE' });
            }
            state.records = state.records.filter(r => r.courseId !== id);

            renderCourses();
            renderTrackingTable();
            renderDashboard();
        } catch (error) {
            console.error(error);
        }
    }
}

function renderTrackingTable() {
    const tbody = document.getElementById('table-tracking-body');
    const filterVal = document.getElementById('filter-status').value;

    let filteredRecords = state.records;
    if (filterVal !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.status === filterVal);
    }

    if (filteredRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Записів не знайдено</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredRecords.map(record => {
        const staff = state.staff.find(s => s.id == record.staffId);
        const course = state.courses.find(c => c.id == record.courseId);
        
        let statusObj = { text: 'Невідомо', color: 'bg-gray-100 text-gray-800' };
        if (record.status === 'planned') statusObj = { text: 'Заплановано', color: 'bg-gray-100 text-gray-800' };
        if (record.status === 'in-progress') statusObj = { text: 'В процесі', color: 'bg-yellow-100 text-yellow-800' };
        if (record.status === 'completed') statusObj = { text: 'Завершено', color: 'bg-green-100 text-green-800' };

        let actionsHtml = '';
        if (currentUserRole === 'admin') {
            actionsHtml = `
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div class="flex items-center justify-center space-x-3">
                    <button onclick="openUpdateStatus(${record.id}, '${record.status}')" class="bg-blue-50 text-primary hover:bg-blue-100 px-3 py-1 rounded text-xs transition-colors">
                        Змінити статус
                    </button>
                    <button onclick="deleteRecord(${record.id})" class="text-gray-400 hover:text-red-600 transition-colors" title="Скасувати призначення">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            `;
        }

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${staff ? staff.name : 'Видалений працівник'}</div>
                <div class="text-xs text-gray-500">Дедлайн: ${record.deadline}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                ${course ? course.title : 'Видалений курс'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusObj.color}">
                    ${statusObj.text}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                    <span class="text-xs font-semibold mr-2 w-8">${record.progress}%</span>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${record.progress}%"></div>
                    </div>
                </div>
            </td>
            ${actionsHtml}
        </tr>
        `;
    }).join('');
}

function populateAssignSelects() {
    const staffSelect = document.getElementById('assign-staff-id');
    const courseSelect = document.getElementById('assign-course-id');
    
    staffSelect.innerHTML = '<option value="">Оберіть працівника...</option>' + 
        state.staff.map(s => `<option value="${s.id}">${s.name} (${s.department})</option>`).join('');
    
    courseSelect.innerHTML = '<option value="">Оберіть курс...</option>' + 
        state.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
}

async function handleAssignCourse(e) {
    e.preventDefault();
    const staffId = parseInt(document.getElementById('assign-staff-id').value);
    const courseId = parseInt(document.getElementById('assign-course-id').value);
    const deadline = document.getElementById('assign-deadline').value;

    const exists = state.records.find(r => r.staffId === staffId && r.courseId === courseId);
    if (exists) {
        alert('Цей курс вже призначено даному працівнику!');
        return;
    }

    const newRecord = {
        staffId: staffId,
        courseId: courseId,
        status: 'planned',
        progress: 0,
        deadline: deadline
    };
    
    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord)
        });
        const savedRecord = await response.json();
        state.records.push(savedRecord);
        closeModal('modal-assign-course');
        renderTrackingTable();

        const staff = state.staff.find(s => s.id === staffId);
        const course = state.courses.find(c => c.id === courseId);
        addActivity(`Призначено курс "${course.title}" для ${staff.name}`, 'info');
    } catch (error) {
        console.error(error);
    }
}

function openUpdateStatus(recordId, currentStatus) {
    document.getElementById('update-record-id').value = recordId;
    document.getElementById('update-status-val').value = currentStatus;
    openModal('modal-update-status');
}

async function saveStatusUpdate() {
    const id = parseInt(document.getElementById('update-record-id').value);
    const newStatus = document.getElementById('update-status-val').value;
    
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex !== -1) {
        let newProgress = 0;
        if (newStatus === 'planned') newProgress = 0;
        if (newStatus === 'in-progress') newProgress = 50;
        if (newStatus === 'completed') newProgress = 100;

        const updatedData = {
            status: newStatus,
            progress: newProgress
        };

        try {
            const response = await fetch(`/api/records/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const savedRecord = await response.json();
            
            state.records[recordIndex].status = savedRecord.status;
            state.records[recordIndex].progress = savedRecord.progress;
            
            if (newStatus === 'completed') {
                const staff = state.staff.find(s => s.id === state.records[recordIndex].staffId);
                if(staff) addActivity(`Співробітник ${staff.name} завершив курс!`, 'success');
            }
            
            closeModal('modal-update-status');
            renderTrackingTable();
            renderDashboard();
        } catch (error) {
            console.error(error);
        }
    }
}

async function deleteRecord(id) {
    if(confirm('Скасувати призначення цього курсу?')) {
        try {
            await fetch(`/api/records/${id}`, { method: 'DELETE' });
            state.records = state.records.filter(r => r.id !== id);
            renderTrackingTable();
            renderDashboard();
        } catch (error) {
            console.error(error);
        }
    }
}

function addActivity(msg, type) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    state.recentActivity.unshift({ msg, time: `Сьогодні, ${timeString}`, type });
    if (state.recentActivity.length > 5) state.recentActivity.pop();
    renderDashboard();
}

window.onload = () => {
    document.getElementById('login-screen').classList.remove('hidden');
};