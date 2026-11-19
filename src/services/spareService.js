// Spare Service for interacting with /api/spares backend endpoints
const API_BASE = '/api/spares';

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

export const spareService = {
  /**
   * Fetch all spares with search, status, and machine filters
   */
  async getSpares(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.machineId && params.machineId !== 'all') query.set('machineId', params.machineId);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    query.set('limit', params.limit || 200);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(qs);
    return res.data || [];
  },

  /**
   * Fetch single spare details
   */
  async getSpareById(id) {
    const res = await request(`/${id}`);
    return res.data;
  },

  /**
   * Create a new spare part
   */
  async createSpare(spareData) {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(spareData)
    });
    return res.data;
  },

  /**
   * Update spare part details
   */
  async updateSpare(id, updates) {
    const res = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  /**
   * Delete spare part (soft delete)
   */
  async deleteSpare(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Map spare to a machine with required quantity
   */
  async mapSpareToMachine(spareId, { machineId, requiredQty, notes }) {
    const res = await request(`/${spareId}/map-machine`, {
      method: 'POST',
      body: JSON.stringify({ machineId, requiredQty, notes })
    });
    return res.data;
  },

  /**
   * Unmap spare from a machine
   */
  async unmapSpareFromMachine(machineId, spareId) {
    return await request(`/machine/${machineId}/${spareId}/unmap`, {
      method: 'POST'
    });
  },

  /**
   * Fetch the spare parts currently assigned to a machine
   */
  async getMachineSpares(machineId) {
    const res = await request(`/machine/${machineId}`);
    return res.data || [];
  },

  /**
   * Add stock (Stock IN)
   */
  async addStock(id, quantity, reason = 'Stock received') {
    const res = await request(`/${id}/stock-in`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason })
    });
    return res.data;
  },

  /**
   * Remove stock (Stock OUT)
   */
  async removeStock(id, quantity, reason, machineId) {
    const res = await request(`/${id}/stock-out`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason, machineId })
    });
    return res.data;
  },

  /**
   * Fetch stock ledger transactions
   */
  async getLedger(params = {}) {
    const query = new URLSearchParams();
    if (params.spareId && params.spareId !== 'all') query.set('spareId', params.spareId);
    if (params.type && params.type !== 'all') query.set('type', params.type);
    query.set('limit', params.limit || 100);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/ledger${qs}`);
    return res.data || [];
  },

  /**
   * Fetch maintenance records from the backend
   */
  async getMaintenanceHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.machineId) query.set('machineId', params.machineId);
    query.set('limit', params.limit || 500);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/maintenance-history${qs}`);
    return res.data || [];
  },

  /**
   * Fetch active stock alerts
   */
  async getAlerts() {
    const res = await request('/alerts');
    return res.data || [];
  },

  /**
   * Fetch inventory summary counts
   */
  async getSummary() {
    const res = await request('/summary');
    return res.data || {};
  },

  /**
   * Restore stock to max from an alert
   */
  async restoreFromAlert(alertId) {
    const res = await request(`/alerts/${alertId}/restore`, {
      method: 'POST'
    });
    return res.data;
  }
};

export default spareService;
