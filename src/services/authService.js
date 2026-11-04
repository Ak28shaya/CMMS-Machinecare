// Authentication Service to communicate with Backend Auth APIs
const API_BASE = '/api/auth';

/**
 * Helper to execute JSON requests with standard error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = localStorage.getItem('cmms_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(
      'Cannot connect to backend server. Make sure your server is running on port 5000.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const authService = {
  /**
   * Log in an existing user
   */
  async login(email, password) {
    const data = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });

    if (data.token) {
      localStorage.setItem('cmms_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('cmms_user', JSON.stringify(data.user));
    }

    return data;
  },

  /**
   * Register a new user (first user registered automatically becomes Admin)
   */
  async register(name, email, password) {
    const data = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password })
    });

    return data;
  },

  /**
   * Fetch current user profile from server
   */
  async getProfile(userId) {
    return await request(`/${userId}`, {
      method: 'GET'
    });
  },

  /**
   * Get stored current user object from localStorage
   */
  getCurrentUser() {
    try {
      const user = localStorage.getItem('cmms_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem('cmms_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('cmms_token');
  },

  /**
   * Log out user
   */
  logout() {
    localStorage.removeItem('cmms_token');
    localStorage.removeItem('cmms_user');
  }
};

export default authService;

