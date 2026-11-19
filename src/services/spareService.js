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
    if (params.status && params.status !== 'all') {
      const status = String(params.status).toLowerCase();
      const apiStatus = { out: 'Out', low: 'Low', ok: 'OK' }[status] || params.status;
      query.set('status', apiStatus);
    }
    query.set('limit', params.limit || 200);

    const spares = [];
    const spareIds = new Set();
    let page = 1;
    let totalPages = 1;
    let expectedTotal;

    do {
      query.set('page', String(page));
      const res = await request(`?${query.toString()}`);
      const pageCount = Number(res.pagination?.pages);
      const total = Number(res.pagination?.total);

      if (!Array.isArray(res.data) || !Number.isInteger(pageCount) || pageCount < 0 ||
          !Number.isInteger(total) || total < 0) {
        throw new Error('Backend returned invalid spare pagination data.');
      }
      if (expectedTotal !== undefined && expectedTotal !== total) {
        throw new Error('Spare inventory changed while it was being loaded. Refresh and try again.');
      }

      for (const spare of res.data) {
        const id = String(spare._id || '');
        if (!id || spareIds.has(id)) {
          throw new Error('Backend returned missing or duplicate spare records.');
        }
        spareIds.add(id);
      }

      expectedTotal = total;
      spares.push(...res.data);
      totalPages = pageCount;
      page += 1;
    } while (page <= totalPages);

    if (spares.length !== expectedTotal) {
      throw new Error('Backend returned an incomplete spare list.');
    }

    return spares;
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
    if (!Array.isArray(res.data)) {
      throw new Error('Backend returned invalid machine spare mappings.');
    }
    return res.data;
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
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 50));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/ledger${qs}`);
    if (!Array.isArray(res.data) || !res.pagination ||
        !Number.isInteger(Number(res.pagination.total)) ||
        !Number.isInteger(Number(res.pagination.pages))) {
      throw new Error('Backend returned invalid stock ledger data.');
    }

    return {
      data: res.data,
      pagination: res.pagination
    };
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
    const summary = res.data;
    const countFields = ['totalParts', 'inStock', 'lowStock', 'outOfStock'];
    if (!summary || countFields.some((field) =>
      !Number.isInteger(summary[field]) || summary[field] < 0
    )) {
      throw new Error('Backend returned invalid inventory summary data.');
    }
    return summary;
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
