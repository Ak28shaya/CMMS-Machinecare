// Alerts API service connecting to backend /api/alerts
const API_BASE = '/api/alerts';

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

export const alertService = {
  async getAlerts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.priority && params.priority !== 'all') query.set('priority', params.priority);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.alertType && params.alertType !== 'all') query.set('alertType', params.alertType);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(qs);
    return res.alerts || [];
  },

  async getAlertStats() {
    const res = await request('/stats/summary');
    return {
      total: res.total || 0,
      critical: res.critical || 0,
      warnings: res.warnings || 0,
      resolved: res.resolved || 0
    };
  },

  async createAlert(alertData) {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
    return res.alert;
  },

  async updateAlert(id, alertData) {
    const res = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alertData)
    });
    return res.alert;
  },

  async deleteAlert(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  }
};

export default alertService;

