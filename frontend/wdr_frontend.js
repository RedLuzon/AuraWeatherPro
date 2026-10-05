// --- 1. NAVIGATION / SWITCH VIEW ---
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const activeBtn = event ? event.target : document.querySelector(`.nav-btn[onclick*="${viewName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const currentUser = getCurrentUser();
    const adminUsersNavBtn = document.getElementById('adminUsersNavBtn');

    // I-display o itago ang Admin Users nav button depende kung admin ang naka-login
    if (currentUser && currentUser.role === 'admin') {
        if (adminUsersNavBtn) adminUsersNavBtn.style.display = 'inline-block';
    } else {
        if (adminUsersNavBtn) adminUsersNavBtn.style.display = 'none';
    }

    if (viewName === 'welcome') {
        document.getElementById('welcome-view').classList.add('active');
    } else if (viewName === 'dashboard') {
        document.getElementById('dashboard-view').classList.add('active');
        fetchWeather("Calapan");
    } else if (viewName === 'radar') {
        document.getElementById('radar-view').classList.add('active');
        searchBarangays(); 
    } else if (viewName === 'chat') {
        const chatNavBtn = document.querySelector('.nav-btn[onclick*="chat"]');
        if (chatNavBtn) chatNavBtn.classList.add('active');

        if (!currentUser) {
            // Kung nag-reset o walang naka-login, ipakita ang Auth/Login screen
            document.getElementById('chat-auth-view').classList.add('active');
            document.getElementById('chat-view').classList.remove('active');
        } else {
            // Kung naka-login na, ipakita ang mismong chat room
            document.getElementById('chat-auth-view').classList.remove('active');
            document.getElementById('chat-view').classList.add('active');
            
            document.getElementById('currentLoggedInName').innerText = currentUser.name;
            document.getElementById('currentUserRoleBadge').innerText = `Role: ${currentUser.role.toUpperCase()}`;
            document.getElementById('currentUserAvatarInitials').innerText = currentUser.name.charAt(0).toUpperCase();
            
            const adminNotice = document.getElementById('adminNotice');
            if (adminNotice) {
                adminNotice.style.display = (currentUser.role === 'admin') ? 'block' : 'none';
            }
            renderChatMessages();
        }
    } else if (viewName === 'adminUsers') {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Access Denied: Admin lamang ang may karapatang tumingin sa pahinang ito!');
            switchView('chat');
            return;
        }
        document.getElementById('admin-users-view').classList.add('active');
        if (adminUsersNavBtn) adminUsersNavBtn.classList.add('active');
        renderAdminUsersTable();
    } else if (viewName === 'developer') {
        document.getElementById('developer-view').classList.add('active');
    }
}

// --- 2. THEME TOGGLE ---
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
}

// --- 3. FILTER RADAR ---
function filterRadar(type) {
    const pills = document.querySelectorAll('.filter-pills .pill');
    pills.forEach(p => p.classList.remove('active'));
    
    const clickedBtn = event ? event.target : null;
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    const grid = document.getElementById('radarGrid');
    if (!grid) return;
    
    const cards = grid.getElementsByClassName('weather-card');
    Array.from(cards).forEach(card => {
        const cardText = card.innerText.toLowerCase();
        
        if (type === 'all') {
            card.style.display = "block";
        } else if (type === 'rainy') {
            if (cardText.includes('rain') || cardText.includes('ulan') || cardText.includes('showers')) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        } else if (type === 'sunny') {
            if (!cardText.includes('rain') && !cardText.includes('ulan') && !cardText.includes('showers')) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        }
    });
}

function getWeatherDetails(code) {
    if (code === 0) return { icon: "☀️", desc: "Mainit / Sunny" };
    if (code >= 1 && code <= 3) return { icon: "⛅", desc: "Makulimlim" };
    if (code >= 51 && code <= 67) return { icon: "🌧️", desc: "Maulan" };
    if (code >= 80 && code <= 99) return { icon: "⛈️", desc: "Ulan na may Kidlat" };
    return { icon: "🌤️", desc: "Maari / Normal" };
}

// --- 4. WEATHER & FORECAST FUNCTIONS ---
async function fetchWeather(city) {
    try {
        // Gumagamit na ito ng window.location.origin para awtomatikong makuha ang tamang host/IP
        const res = await fetch(`${window.location.origin}/api/weather?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        if (res.status !== 200) return;

        const currentDetails = getWeatherDetails(data.current.weather_code);
        
        document.getElementById('cityName').innerText = `${data.name}, Mimaropa, Philippines`;
        const tempRounded = Math.round(data.current.temperature_2m);
        document.getElementById('temperature').innerText = `${tempRounded}°C`;
        document.getElementById('weatherCondition').innerText = currentDetails.desc;
        
        const sidebarIcon = document.querySelector('#dashboard-view .glass-panel div[style*="font-size: 5rem"]');
        if (sidebarIcon) {
            sidebarIcon.innerText = currentDetails.icon;
        }

        if (document.getElementById('humidity')) {
            document.getElementById('humidity').innerText = `${data.current.relative_humidity_2m}%`;
        }
        if (document.getElementById('windSpeed')) {
            document.getElementById('windSpeed').innerText = `${data.current.wind_speed_10m} km/h`;
        }
        if (document.getElementById('uvIndex')) {
            document.getElementById('uvIndex').innerText = data.current.uv_index || '5';
        }

        const weeklyGrid = document.getElementById('dashboardWeeklyGrid');
        if (weeklyGrid && data.daily && data.daily.time) {
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weeklyGrid.innerHTML = "";

            data.daily.time.forEach((dateStr, index) => {
                const dateObj = new Date(dateStr);
                const dayName = daysOfWeek[dateObj.getDay()];
                const code = data.daily.weather_code[index];
                const dayWeather = getWeatherDetails(code);
                const maxTemp = Math.round(data.daily.temperature_2m_max[index]);
                const minTemp = Math.round(data.daily.temperature_2m_min[index]);

                const dayCard = document.createElement('div');
                dayCard.style.cssText = "background: rgba(128,128,128,0.05); padding: 12px 6px; border-radius: 10px; text-align: center; border: 1px solid var(--border-color);";
                dayCard.innerHTML = `
                    <div style="font-size: 11px; font-weight: bold; color: var(--muted-color); text-transform: uppercase; margin-bottom: 6px;">${dayName}</div>
                    <div style="font-size: 22px; margin: 6px 0;" title="${dayWeather.desc}">${dayWeather.icon}</div>
                    <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">${maxTemp}°</div>
                    <div style="font-size: 11px; color: var(--muted-color);">${minTemp}°</div>
                `;
                weeklyGrid.appendChild(dayCard);
            });
        }
    } catch (err) {
        console.error("Fetch error sa dashboard:", err);
    }
}

async function searchBarangays() {
    const inputEl = document.getElementById('barangaySearchInput');
    const query = inputEl ? inputEl.value.trim() : "";
    const grid = document.getElementById('radarGrid');
    
    if (!grid) return;
    
    grid.innerHTML = `<p style="color: var(--muted-color); grid-column: 1/-1; text-align: center;">Naglo-load ng 7-day forecast sa Oriental Mindoro...</p>`;

    try {
        // Gumagamit na rin ito ng window.location.origin para sa radar / mindoro-search
        const res = await fetch(`${window.location.origin}/api/mindoro-search?q=${encodeURIComponent(query)}`);
        const locations = await res.json();
        
        grid.innerHTML = "";
        
        if (locations.length === 0) {
            grid.innerHTML = `<p style="color: var(--muted-color); grid-column: 1/-1; text-align: center;">Walang nakitang lokasyon.</p>`;
            return;
        }

        locations.forEach(loc => {
            const currentWeather = getWeatherDetails(loc.current.weather_code);
            
            let weeklyHtml = '';
            if (loc.daily && loc.daily.time) {
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                
                weeklyHtml = `<div style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                                <div style="font-size: 11px; color: var(--muted-color); margin-bottom: 6px; font-weight: bold;">7-Day Forecast:</div>
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center;">`;
                
                loc.daily.time.forEach((dateStr, index) => {
                    const dateObj = new Date(dateStr);
                    const dayName = daysOfWeek[dateObj.getDay()];
                    const code = loc.daily.weather_code[index];
                    const dayWeather = getWeatherDetails(code);
                    const maxTemp = Math.round(loc.daily.temperature_2m_max[index]);

                    weeklyHtml += `
                        <div style="background: rgba(128,128,128,0.05); padding: 4px 2px; border-radius: 6px;">
                            <div style="font-size: 9px; color: var(--muted-color); text-transform: uppercase;">${dayName}</div>
                            <div style="font-size: 14px; margin: 2px 0;" title="${dayWeather.desc}">${dayWeather.icon}</div>
                            <div style="font-size: 10px; font-weight: bold;">${maxTemp}°</div>
                        </div>
                    `;
                });

                weeklyHtml += `</div></div>`;
            }

            const card = document.createElement('div');
            card.className = "weather-card glass-panel";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge-mini">${loc.municipality}</span>
                    <span style="font-size: 12px; color: #60a5fa;">${currentWeather.icon} ${currentWeather.desc}</span>
                </div>
                <h4 style="margin: 8px 0 2px 0;">${loc.name}</h4>
                <small style="color: var(--muted-color);">${loc.province}</small>
                <div style="display: flex; align-items: baseline; gap: 10px; margin: 8px 0;">
                    <p style="font-size: 1.8rem; font-weight: bold; margin: 0;">${Math.round(loc.current.temperature_2m)}°C</p>
                </div>
                <div style="font-size: 11px; color: var(--muted-color);">
                    <span>Hangin: ${loc.current.wind_speed_10m} km/h</span> | 
                    <span>Humidity: ${loc.current.relative_humidity_2m}%</span>
                </div>
                ${weeklyHtml}
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error fetching Mindoro locations:", err);
        grid.innerHTML = `<p style="color: #fca5a5; grid-column: 1/-1; text-align: center;">Nabigong makuha ang weather data.</p>`;
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Manila' 
        };
        const currentDate = new Date().toLocaleDateString('en-US', options);
        dateElement.innerText = currentDate;
    }
}

async function searchBarangays() {
    const inputEl = document.getElementById('barangaySearchInput');
    const query = inputEl ? inputEl.value.trim() : "";
    const grid = document.getElementById('radarGrid');
    
    if (!grid) return;
    
    grid.innerHTML = `<p style="color: var(--muted-color); grid-column: 1/-1; text-align: center;">Naglo-load ng 7-day forecast sa Oriental Mindoro...</p>`;

    try {
        const res = await fetch(`http://localhost:3000/api/mindoro-search?q=${encodeURIComponent(query)}`);
        const locations = await res.json();
        
        grid.innerHTML = "";
        
        if (locations.length === 0) {
            grid.innerHTML = `<p style="color: var(--muted-color); grid-column: 1/-1; text-align: center;">Walang nakitang lokasyon.</p>`;
            return;
        }

        locations.forEach(loc => {
            const currentWeather = getWeatherDetails(loc.current.weather_code);
            
            let weeklyHtml = '';
            if (loc.daily && loc.daily.time) {
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                
                weeklyHtml = `<div style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                                <div style="font-size: 11px; color: var(--muted-color); margin-bottom: 6px; font-weight: bold;">7-Day Forecast:</div>
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center;">`;
                
                loc.daily.time.forEach((dateStr, index) => {
                    const dateObj = new Date(dateStr);
                    const dayName = daysOfWeek[dateObj.getDay()];
                    const code = loc.daily.weather_code[index];
                    const dayWeather = getWeatherDetails(code);
                    const maxTemp = Math.round(loc.daily.temperature_2m_max[index]);

                    weeklyHtml += `
                        <div style="background: rgba(128,128,128,0.05); padding: 4px 2px; border-radius: 6px;">
                            <div style="font-size: 9px; color: var(--muted-color); text-transform: uppercase;">${dayName}</div>
                            <div style="font-size: 14px; margin: 2px 0;" title="${dayWeather.desc}">${dayWeather.icon}</div>
                            <div style="font-size: 10px; font-weight: bold;">${maxTemp}°</div>
                        </div>
                    `;
                });

                weeklyHtml += `</div></div>`;
            }

            const card = document.createElement('div');
            card.className = "weather-card glass-panel";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge-mini">${loc.municipality}</span>
                    <span style="font-size: 12px; color: #60a5fa;">${currentWeather.icon} ${currentWeather.desc}</span>
                </div>
                <h4 style="margin: 8px 0 2px 0;">${loc.name}</h4>
                <small style="color: var(--muted-color);">${loc.province}</small>
                <div style="display: flex; align-items: baseline; gap: 10px; margin: 8px 0;">
                    <p style="font-size: 1.8rem; font-weight: bold; margin: 0;">${Math.round(loc.current.temperature_2m)}°C</p>
                </div>
                <div style="font-size: 11px; color: var(--muted-color);">
                    <span>Hangin: ${loc.current.wind_speed_10m} km/h</span> | 
                    <span>Humidity: ${loc.current.relative_humidity_2m}%</span>
                </div>
                ${weeklyHtml}
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error fetching Mindoro locations:", err);
        grid.innerHTML = `<p style="color: #fca5a5; grid-column: 1/-1; text-align: center;">Nabigong makuha ang weather data.</p>`;
    }
}

// --- 5. AUTH & SECURE CHAT SYSTEM (SIGN IN & SIGN UP TABS) ---
function getCurrentUser() {
    // Naka-sessionStorage para mag-reset o mawala ang login tuwing magre-refresh ang site
    return JSON.parse(sessionStorage.getItem('aura_current_user')) || null;
}

function switchAuthTab(tabName) {
    const signInForm = document.getElementById('signInFormContainer');
    const signUpForm = document.getElementById('signUpFormContainer');
    const tabSignInBtn = document.getElementById('tabSignInBtn');
    const tabSignUpBtn = document.getElementById('tabSignUpBtn');

    if (tabName === 'signin') {
        if (signInForm) signInForm.style.display = 'block';
        if (signUpForm) signUpForm.style.display = 'none';
        if (tabSignInBtn) { tabSignInBtn.className = 'btn-primary'; }
        if (tabSignUpBtn) { tabSignUpBtn.className = 'btn-secondary'; }
    } else {
        if (signInForm) signInForm.style.display = 'none';
        if (signUpForm) signUpForm.style.display = 'block';
        if (tabSignInBtn) { tabSignInBtn.className = 'btn-secondary'; }
        if (tabSignUpBtn) { tabSignUpBtn.className = 'btn-primary'; }
    }
}

// Pag-handle ng Sign In gamit ang nakaimbak sa localStorage
function handleSignIn() {
    const usernameInput = document.getElementById('signInUsername');
    const passwordInput = document.getElementById('signInPassword');

    if (!usernameInput || !passwordInput) return;
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('Mangyaring ilagay ang iyong username at password.');
        return;
    }

    const allUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
    const foundUser = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password);

    if (!foundUser) {
        alert('Maling username o password, o kaya ay wala pang account na nakarehistro nito. Mag-sign up muna.');
        return;
    }

    // I-update ang login time at i-save sa sessionStorage (mabubura pag nag-refresh)
    foundUser.loginTime = new Date().toLocaleString();
    sessionStorage.setItem('aura_current_user', JSON.stringify(foundUser));

    usernameInput.value = '';
    passwordInput.value = '';
    switchView('chat');
}

// Pag-handle ng Create Account (Sign Up) at pag-save sa localStorage para makita ng Admin
function handleCreateAccount() {
    const emailInput = document.getElementById('signUpEmail');
    const usernameInput = document.getElementById('signUpUsername');
    const passwordInput = document.getElementById('signUpPassword');
    const roleSelect = document.getElementById('signUpRole');

    if (!usernameInput || !passwordInput) return;
    const email = emailInput ? emailInput.value.trim() : 'N/A';
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleSelect ? roleSelect.value : 'user';

    if (!username || !password) {
        alert('Mangyaring punan ang username at password.');
        return;
    }

    let allUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
    const exists = allUsers.some(u => u.name.toLowerCase() === username.toLowerCase());

    if (exists) {
        alert('Ang username na ito ay nagamit na. Pumili ng iba o mag-sign in.');
        return;
    }

    const newUser = {
        name: username,
        email: email,
        password: password,
        role: role,
        loginTime: new Date().toLocaleString()
    };

    // I-save sa localStorage (permanenteng listahan para sa Admin)
    allUsers.push(newUser);
    localStorage.setItem('aura_registered_users', JSON.stringify(allUsers));

    // I-log in agad ang user sa sessionStorage para makapagsimula na sa chat
    sessionStorage.setItem('aura_current_user', JSON.stringify(newUser));

    if (emailInput) emailInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';

    alert('Matagumpay na nakagawa ng account!');
    switchView('chat');
}

function handleLogout() {
    sessionStorage.removeItem('aura_current_user');
    switchView('chat');
}

// Render ng Admin Users Table (Makikita ang Email, Password, Username, Role, at Oras ng Signup)
function renderAdminUsersTable() {
    const container = document.getElementById('registeredUsersTableContainer');
    if (!container) return;

    const allUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');

    if (allUsers.length === 0) {
        container.innerHTML = `<p style="color: var(--muted-color); text-align: center; padding: 20px;">Walang rehistradong user o admin sa ngayon.</p>`;
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--muted-color);">
                    <th style="padding: 10px;">Username</th>
                    <th style="padding: 10px;">Email</th>
                    <th style="padding: 10px;">Password</th>
                    <th style="padding: 10px;">Role</th>
                    <th style="padding: 10px;">Oras ng Signup / Login</th>
                </tr>
            </thead>
            <tbody>
    `;

    allUsers.forEach(u => {
        const roleBadgeColor = u.role === 'admin' ? '#3b82f6' : '#10b981';
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px; font-weight: bold;">${u.name}</td>
                <td style="padding: 12px; color: var(--muted-color);">${u.email || 'N/A'}</td>
                <td style="padding: 12px; font-family: monospace;">${u.password || 'N/A'}</td>
                <td style="padding: 12px;"><span style="background: ${roleBadgeColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">${u.role.toUpperCase()}</span></td>
                <td style="padding: 12px; color: var(--muted-color);">${u.loginTime}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function clearAllRegisteredUsers() {
    if (confirm('Sigurado ka bang gusto mong burahin ang lahat ng record ng mga user at admin?')) {
        localStorage.removeItem('aura_registered_users');
        renderAdminUsersTable();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const currentUser = getCurrentUser();
    if (!input || !currentUser) return;
    
    const text = input.value.trim();
    if (!text) return;

    let messages = JSON.parse(localStorage.getItem('aura_chat_messages') || '[]');
    
    const newMessage = {
        sender: currentUser.name,
        role: currentUser.role,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    localStorage.setItem('aura_chat_messages', JSON.stringify(messages));
    
    input.value = '';
    renderChatMessages();
}

function renderChatMessages() {
    const box = document.getElementById('chatMessagesBox');
    const currentUser = getCurrentUser();
    if (!box || !currentUser) return;

    let messages = JSON.parse(localStorage.getItem('aura_chat_messages') || '[]');
    box.innerHTML = '';

    if (messages.length === 0) {
        box.innerHTML = `<div style="text-align: center; color: var(--muted-color); margin-top: 130px; font-size: 13px;">Walang pang mensahe. Magsimula nang makipag-usap!</div>`;
        return;
    }

    messages.forEach(msg => {
        const bubble = document.createElement('div');
        const isOutgoing = msg.sender === currentUser.name;
        
        bubble.className = isOutgoing ? 'chat-bubble-outgoing' : 'chat-bubble-incoming';
        
        const roleLabel = msg.role === 'admin' ? '🛡️ Admin' : '👤 User';
        bubble.innerHTML = `
            <div class="chat-meta">${msg.sender} (${roleLabel}) • ${msg.time}</div>
            <div>${msg.text}</div>
        `;
        box.appendChild(bubble);
    });

    box.scrollTop = box.scrollHeight;
}

// --- 6. INITIALIZATION (DOM LOADED) ---
document.addEventListener("DOMContentLoaded", () => {
    updateCurrentDate();

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }

    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 800);
    }

    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');

    if (searchBtn && cityInput) {
        searchBtn.addEventListener('click', () => {
            const cityName = cityInput.value.trim();
            if (cityName) {
                fetchWeather(cityName);
            }
        });

        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cityName = cityInput.value.trim();
                if (cityName) {
                    fetchWeather(cityName);
                }
            }
        });
    }

    fetchWeather("Calapan");
    
    // Suriin kung may active session sa sessionStorage o mag-reset sa Sign In form
    const currentUser = getCurrentUser();
    const adminUsersNavBtn = document.getElementById('adminUsersNavBtn');

    if (!currentUser) {
        if (adminUsersNavBtn) adminUsersNavBtn.style.display = 'none';
    } else {
        if (currentUser.role === 'admin') {
            if (adminUsersNavBtn) adminUsersNavBtn.style.display = 'inline-block';
        } else {
            if (adminUsersNavBtn) adminUsersNavBtn.style.display = 'none';
        }
    }
});
