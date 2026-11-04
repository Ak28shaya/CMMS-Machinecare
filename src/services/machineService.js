// Machine Service for interacting with /api/machines endpoints
const API_BASE = '/api/machines';

/**
 * Helper to make authorized JSON requests
 */
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

export const machineService = {
  /**
   * Fetch all machines from backend
   */
  async getAllMachines() {
    const res = await request('');
    return res.data || [];
  },

  /**
   * Fetch single machine by ID
   */
  async getMachineById(id) {
    const res = await request(`/${id}`);
    return res.data;
  },

  /**
   * Create a new machine
   * @param {Object} machineData - { code, name, location, status, spares, handledBy }
   */
  async createMachine(machineData) {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(machineData)
    });
    return res.data;
  },

  /**
   * Update an existing machine
   * @param {string} id
   * @param {Object} updates
   */
  async updateMachine(id, updates) {
    const res = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  /**
   * Delete a machine by ID
   * @param {string} id
   */
  async deleteMachine(id) {
    const res = await request(`/${id}`, {
      method: 'DELETE'
    });
    return res;
  }
};

export default machineService;

