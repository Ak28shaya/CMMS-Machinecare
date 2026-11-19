// Designation API service connecting frontend to backend /api/designations
const API_BASE = '/api/designations';

async function request(endpoint = '', options = {}) {
  const token = localStorage.getItem('cmms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error('Cannot connect to backend server. Ensure backend is running.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function mapDesignation(item) {
  if (!item) return null;
  const deptName =
    typeof item.department === 'object' && item.department !== null
      ? item.department.departmentName || item.department.departmentCode || 'General'
      : item.department || 'General';

  const deptId =
    typeof item.department === 'object' && item.department !== null
      ? item.department._id
      : item.department || null;

  return {
    id: item._id,
    code: item.roleCode,
    title: item.designationTitle,
    department: deptName,
    departmentId: deptId,
    status: item.status || 'Active',
    description: item.jobDescription || ''
  };
}

function toApiDesignation(item) {
  return {
    roleCode: item.code || item.roleCode,
    designationTitle: item.title || item.designationTitle,
    department: item.departmentId || item.department,
    status: item.status || 'Active',
    jobDescription: item.description !== undefined ? item.description : item.jobDescription || ''
  };
}

export const designationService = {
  async getDesignations(params = {}) {
    const query = new URLSearchParams();
    query.set('limit', params.limit || '100');
    query.set('page', params.page || '1');
    if (params.search) query.set('search', params.search);
    if (params.department && params.department !== 'all') {
      query.set('department', params.department);
    }

    const firstPage = await request(`?${query.toString()}`);
    const designations = (firstPage.data || []).map(mapDesignation);
    const totalPages = Number(firstPage.pagination?.totalPages) || 1;

    // If more pages exist and no explicit pagination requested, gather remaining
    if (!params.page && totalPages > 1) {
      for (let p = 2; p <= totalPages; p += 1) {
        query.set('page', String(p));
        const res = await request(`?${query.toString()}`);
        designations.push(...(res.data || []).map(mapDesignation));
      }
    }

    return designations;
  },

  async getDesignationStats() {
    const res = await request('/stats');
    return res.data || {};
  },

  async createDesignation(designationData) {
    const res = await request('', {
      method: 'POST',
      body: JSON.stringify(toApiDesignation(designationData))
    });
    return mapDesignation(res.data);
  },

  async updateDesignation(id, designationData) {
    const res = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiDesignation(designationData))
    });
    return mapDesignation(res.data);
  },

  async deleteDesignation(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  }
};

export default designationService;
