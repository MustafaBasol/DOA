// Authentication logic
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : `${window.location.protocol}//${window.location.host}/api`;

// Store token in localStorage
function setToken(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function getToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// API call with auth
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Hide error message
    errorMessage.style.display = 'none';

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store tokens and user info
      setToken(data.accessToken, data.refreshToken);
      setUser(data.user);

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/client.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      errorMessage.style.display = 'block';
      
      if (error.message.includes('Invalid credentials')) {
        errorMessage.textContent = translate('login.error.invalid');
      } else if (error.message.includes('inactive')) {
        errorMessage.textContent = translate('login.error.inactive');
      } else {
        errorMessage.textContent = translate('login.error.network');
      }

      // Reset button
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });
});

// Check if already logged in
function checkAuth() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // If on login page, redirect to appropriate dashboard
    if (window.location.pathname === '/login.html') {
      if (user.role === 'ADMIN') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/client.html';
      }
    }
    return true;
  }

  // If on protected page, redirect to login
  const protectedPages = ['/admin.html', '/client.html'];
  if (protectedPages.includes(window.location.pathname)) {
    window.location.href = '/login.html';
    return false;
  }

  return false;
}

// Logout function
function logout() {
  clearTokens();
  window.location.href = '/login.html';
}

// Check auth on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAuth);
} else {
  checkAuth();
}

// Export functions
if (typeof window !== 'undefined') {
  window.apiCall = apiCall;
  window.logout = logout;
  window.getUser = getUser;
  window.checkAuth = checkAuth;
}
