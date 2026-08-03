const API_BASE = window.location.origin + '/api';

let adminToken = localStorage.getItem('adminToken');
let currentView = 'overview';
let ordersPage = 1;
let usersPage = 1;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize
function init() {
  if (adminToken) {
    showDashboard();
    loadView('overview');
  } else {
    showLogin();
  }

  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      switchView(view);
    });
  });

  // Filter listeners
  document.getElementById('order-status-filter')?.addEventListener('change', () => { ordersPage = 1; loadOrders(); });
  document.getElementById('order-tier-filter')?.addEventListener('change', () => { ordersPage = 1; loadOrders(); });
  document.getElementById('user-search')?.addEventListener('input', debounce(() => { usersPage = 1; loadUsers(); }, 300));
  document.getElementById('user-tier-filter')?.addEventListener('change', () => { usersPage = 1; loadUsers(); });
}

function showLogin() {
  loginScreen.classList.add('active');
  dashboardScreen.classList.remove('active');
}

function showDashboard() {
  loginScreen.classList.remove('active');
  dashboardScreen.classList.add('active');
}

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed';
      return;
    }

    adminToken = data.token;
    localStorage.setItem('adminToken', adminToken);
    document.getElementById('admin-name').textContent = data.admin.firstName || data.admin.email;
    showDashboard();
    loadView('overview');
  } catch (err) {
    loginError.textContent = 'Network error. Please try again.';
  }
}

function handleLogout() {
  adminToken = null;
  localStorage.removeItem('adminToken');
  showLogin();
}

function switchView(view) {
  currentView = view;
  
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${view}`);
  });

  loadView(view);
}

function loadView(view) {
  switch(view) {
    case 'overview':
      loadStats();
      loadRecentOrders();
      loadRecentUsers();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'users':
      loadUsers();
      break;
    case 'analytics':
      loadAnalytics();
      break;
  }
}

async function apiCall(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (res.status === 401 || res.status === 403) {
    handleLogout();
    throw new Error('Session expired');
  }

  return res.json();
}

// Stats
async function loadStats() {
  try {
    const stats = await apiCall('/admin/stats');
    document.getElementById('stat-users').textContent = formatNumber(stats.totalUsers);
    document.getElementById('stat-orders').textContent = formatNumber(stats.totalOrders);
    document.getElementById('stat-revenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('stat-subs').textContent = formatNumber(stats.activeSubscriptions);
    document.getElementById('stat-free').textContent = formatNumber(stats.freeUsers);
    document.getElementById('stat-resumes').textContent = formatNumber(stats.totalResumes);

    document.getElementById('stat-users-change').textContent = `+${stats.recentUsers} this week`;
    document.getElementById('stat-orders-change').textContent = `+${stats.recentOrders} this week`;
    document.getElementById('stat-revenue-change').textContent = `+${formatCurrency(stats.recentRevenue)} this week`;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Recent Orders
async function loadRecentOrders() {
  try {
    const data = await apiCall('/admin/orders?limit=5');
    const tbody = document.getElementById('recent-orders');
    tbody.innerHTML = data.orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.email}</td>
        <td><span class="status status-${order.tier}">${order.tier}</span></td>
        <td>${formatCurrency(order.amount)}</td>
        <td><span class="status status-${order.status}">${order.status}</span></td>
        <td>${formatDate(order.created_at)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">No orders yet</td></tr>';
  } catch (err) {
    console.error('Failed to load recent orders:', err);
  }
}

// Recent Users
async function loadRecentUsers() {
  try {
    const data = await apiCall('/admin/users?limit=5');
    const tbody = document.getElementById('recent-users');
    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td>#${user.id}</td>
        <td>${user.email}</td>
        <td><span class="status status-${user.subscription_tier}">${user.subscription_tier}</span></td>
        <td>${formatDate(user.created_at)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" class="text-center">No users yet</td></tr>';
  } catch (err) {
    console.error('Failed to load recent users:', err);
  }
}

// Orders
async function loadOrders() {
  try {
    const status = document.getElementById('order-status-filter').value;
    const tier = document.getElementById('order-tier-filter').value;
    const query = new URLSearchParams({ page: ordersPage, limit: 20, status, tier });
    
    const data = await apiCall(`/admin/orders?${query}`);
    const tbody = document.getElementById('orders-table');
    
    tbody.innerHTML = data.orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.email}<br><small>${order.first_name || ''} ${order.last_name || ''}</small></td>
        <td><span class="status status-${order.tier}">${order.tier}</span></td>
        <td>${formatCurrency(order.amount)}</td>
        <td><span class="status status-${order.status}">${order.status}</span></td>
        <td>${order.description || '-'}</td>
        <td>${formatDate(order.created_at)}</td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">No orders found</td></tr>';

    renderPagination('orders-pagination', ordersPage, data.totalPages, 'orders');
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

// Users
async function loadUsers() {
  try {
    const search = document.getElementById('user-search').value;
    const tier = document.getElementById('user-tier-filter').value;
    const query = new URLSearchParams({ page: usersPage, limit: 20, search, tier });
    
    const data = await apiCall(`/admin/users?${query}`);
    const tbody = document.getElementById('users-table');
    
    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td>#${user.id}</td>
        <td>${user.email}</td>
        <td>${user.first_name || ''} ${user.last_name || ''}</td>
        <td><span class="status status-${user.subscription_tier}">${user.subscription_tier}</span></td>
        <td><span class="status status-${user.subscription_status}">${user.subscription_status}</span></td>
        <td>${formatDate(user.created_at)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center">No users found</td></tr>';

    renderPagination('users-pagination', usersPage, data.totalPages, 'users');
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

// Analytics
async function loadAnalytics() {
  try {
    const [revenueData, userData] = await Promise.all([
      apiCall('/admin/analytics/revenue'),
      apiCall('/admin/analytics/users')
    ]);

    // Revenue chart
    const revenueChart = document.getElementById('revenue-chart');
    revenueChart.innerHTML = renderBarChart(revenueData.daily.slice(0, 14).reverse(), 'revenue', '$');

    // Tier chart
    const tierChart = document.getElementById('tier-chart');
    tierChart.innerHTML = renderBarChart(revenueData.byTier, 'revenue', '$');

    // Growth chart
    const growthChart = document.getElementById('growth-chart');
    growthChart.innerHTML = renderBarChart(userData.daily.slice(0, 14).reverse(), 'count', '');
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

function renderBarChart(data, valueKey, prefix) {
  if (!data || data.length === 0) return '<div style="text-align:center;color:#888;padding:40px;">No data available</div>';
  
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  
  return data.map(item => {
    const value = item[valueKey] || 0;
    const height = Math.max((value / max) * 100, 5);
    const label = item.date ? item.date.slice(5) : item.tier;
    return `
      <div class="chart-bar" style="height: ${height}%;" title="${label}: ${prefix}${value}">
        <div class="chart-bar-value">${prefix}${formatNumber(value)}</div>
        <div class="chart-bar-label">${label}</div>
      </div>
    `;
  }).join('');
}

function renderPagination(containerId, current, total, viewType) {
  const container = document.getElementById(containerId);
  if (total <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button ${current === 1 ? 'disabled' : ''} data-page="${current - 1}" data-view="${viewType}">Prev</button>`;
  
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      html += `<button class="${i === current ? 'active' : ''}" data-page="${i}" data-view="${viewType}">${i}</button>`;
    } else if (i === current - 2 || i === current + 2) {
      html += `<span style="color:#888;padding:8px;">...</span>`;
    }
  }
  
  html += `<button ${current === total ? 'disabled' : ''} data-page="${current + 1}" data-view="${viewType}">Next</button>`;
  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      const view = btn.dataset.view;
      if (view === 'orders') {
        ordersPage = page;
        loadOrders();
      } else {
        usersPage = page;
        loadUsers();
      }
    });
  });
}

// Utilities
function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

function formatCurrency(cents) {
  return '$' + (Number(cents || 0) / 100).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Start
init();
