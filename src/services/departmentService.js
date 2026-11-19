const API_BASE = '/api/departments';

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

function mapDepartment(department) {
  return {
    id: department._id,
    code: department.departmentCode,
    name: department.departmentName,
    head: department.headOfDepartment || '',
    location: department.operatingLocation || '',
    budgetCenter: department.costCenter || '',
    status: department.status,
    description: department.description || '',
    teamMembers: department.teamMembers || 0
  };
}

function toApiDepartment(department) {
  return {
    departmentCode: department.code,
    departmentName: department.name,
    headOfDepartment: department.head,
    operatingLocation: department.location,
    costCenter: department.budgetCenter,
    status: department.status,
    description: department.description
  };
}

const departmentService = {
  async getDepartments() {
    const firstPage = await request('?limit=100&page=1');
    const departments = firstPage.data || [];
    const totalPages = Number(firstPage.pagination?.totalPages) || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await request(`?limit=100&page=${page}`);
      departments.push(...(response.data || []));
    }

    return departments.map(mapDepartment);
  },

  async getDepartmentStats() {
    const response = await request('/stats');
    return response.data || {};
  },

  async createDepartment(department) {
    const response = await request('', {
      method: 'POST',
      body: JSON.stringify(toApiDepartment(department))
    });
    return mapDepartment(response.data);
  },

  async updateDepartment(id, department) {
    const response = await request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiDepartment(department))
    });
    return mapDepartment(response.data);
  },

  async deleteDepartment(id) {
    return request(`/${id}`, { method: 'DELETE' });
  }
};

export default departmentService;
