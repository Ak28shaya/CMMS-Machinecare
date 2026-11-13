// Employee API service connecting to backend /api/employees
const API_BASE = '/api/employees';

async function request(endpoint = '', options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('cmms_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error('Cannot connect to backend server. Ensure backend is running.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const employeeService = {
  async getEmployees(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.department && params.department !== 'all') query.set('department', params.department);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(qs);
    return res.data || [];
  },

  async getEmployeeStats() {
    const res = await request('/stats/summary');
    return res.data || {};
  },

  async createEmployee(employeeData) {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
    return res.data;
  },

  async updateEmployee(id, employeeData) {
    const res = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
    return res.data;
  },

  async deleteEmployee(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  }
};

export default employeeService;

