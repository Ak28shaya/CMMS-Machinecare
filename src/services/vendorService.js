// Vendor API service connecting frontend to backend /api/vendors
const API_BASE = '/api/vendors';

// Initial local fallback vendors matching the screenshot and enterprise requirements
export const DEFAULT_VENDORS = [
  {
    id: 'ven-1',
    vendorCode: 'VEN-001',
    vendorName: 'ABC Bearings Pvt. Ltd.',
    contactPerson: 'Mr. Rajesh',
    phoneNumber: '+91 98765 43210',
    location: 'Coimbatore, Tamil Nadu',
    status: 'Active',
    email: 'rajesh@abcbearings.in',
    category: 'Bearings & Power Transmission'
  },
  {
    id: 'ven-2',
    vendorCode: 'VEN-002',
    vendorName: 'Industrial Supplies',
    contactPerson: 'Ms. Priya',
    phoneNumber: '+91 98450 12345',
    location: 'Chennai, Tamil Nadu',
    status: 'Active',
    email: 'priya@industrialsupplies.com',
    category: 'Hardware & Fasteners'
  },
  {
    id: 'ven-3',
    vendorCode: 'VEN-003',
    vendorName: 'Power Tools India',
    contactPerson: 'Mr. Suresh',
    phoneNumber: '+91 97890 67890',
    location: 'Bengaluru, Karnataka',
    status: 'Active',
    email: 'suresh@powertoolsindia.in',
    category: 'Power Tools & Motors'
  },
  {
    id: 'ven-4',
    vendorCode: 'VEN-004',
    vendorName: 'Techno Spares',
    contactPerson: 'Mr. Kumar',
    phoneNumber: '+91 94432 54321',
    location: 'Hosur, Tamil Nadu',
    status: 'Inactive',
    email: 'kumar@technospares.com',
    category: 'CNC & Precision Spares'
  },
  {
    id: 'ven-5',
    vendorCode: 'VEN-005',
    vendorName: 'Lubricant Co.',
    contactPerson: 'Mr. Mohan',
    phoneNumber: '+91 98230 11223',
    location: 'Mumbai, Maharashtra',
    status: 'Active',
    email: 'mohan@lubricantco.in',
    category: 'Oils, Greases & Coolants'
  },
  {
    id: 'ven-6',
    vendorCode: 'VEN-006',
    vendorName: 'Apex Hydraulics & Pneumatics',
    contactPerson: 'Mr. Anand',
    phoneNumber: '+91 98940 33445',
    location: 'Pune, Maharashtra',
    status: 'Active',
    email: 'anand@apexhydraulics.com',
    category: 'Hydraulic Cylinders & Valves'
  },
  {
    id: 'ven-7',
    vendorCode: 'VEN-007',
    vendorName: 'Schneider Electrics Partner',
    contactPerson: 'Ms. Kavitha',
    phoneNumber: '+91 97100 88990',
    location: 'Hyderabad, Telangana',
    status: 'Active',
    email: 'kavitha@sep-distributors.in',
    category: 'Switchgear & PLCs'
  },
  {
    id: 'ven-8',
    vendorCode: 'VEN-008',
    vendorName: 'Precision Tooling Tech',
    contactPerson: 'Mr. Vikram',
    phoneNumber: '+91 98840 77123',
    location: 'Coimbatore, Tamil Nadu',
    status: 'Active',
    email: 'vikram@precisiontooling.in',
    category: 'Carbide Inserts & Toolholders'
  },
  {
    id: 'ven-9',
    vendorCode: 'VEN-009',
    vendorName: 'Delta Belts & Drives',
    contactPerson: 'Mr. Balaji',
    phoneNumber: '+91 99401 55667',
    location: 'Salem, Tamil Nadu',
    status: 'Active',
    email: 'balaji@deltabelts.com',
    category: 'Timing Belts & Pulleys'
  },
  {
    id: 'ven-10',
    vendorCode: 'VEN-010',
    vendorName: 'Bharat Safety Systems',
    contactPerson: 'Ms. Meera',
    phoneNumber: '+91 98402 44332',
    location: 'Ahmedabad, Gujarat',
    status: 'Active',
    email: 'meera@bharatsafety.com',
    category: 'Safety Gear & PPE'
  },
  {
    id: 'ven-11',
    vendorCode: 'VEN-011',
    vendorName: 'Omron Automation Hub',
    contactPerson: 'Mr. Karthik',
    phoneNumber: '+91 97900 11445',
    location: 'Chennai, Tamil Nadu',
    status: 'Active',
    email: 'karthik@omronhub.in',
    category: 'Sensors & Relays'
  },
  {
    id: 'ven-12',
    vendorCode: 'VEN-012',
    vendorName: 'Pioneer Fluid Seals',
    contactPerson: 'Mr. Ramesh',
    phoneNumber: '+91 96000 77889',
    location: 'Kolkata, West Bengal',
    status: 'Inactive',
    email: 'ramesh@pioneerfluid.com',
    category: 'O-Rings & Mechanical Seals'
  },
  {
    id: 'ven-13',
    vendorCode: 'VEN-013',
    vendorName: 'Sun Electricals & Cables',
    contactPerson: 'Mr. Deepak',
    phoneNumber: '+91 98411 99001',
    location: 'Bengaluru, Karnataka',
    status: 'Active',
    email: 'deepak@suncables.in',
    category: 'Cables & Wire Harnesses'
  },
  {
    id: 'ven-14',
    vendorCode: 'VEN-014',
    vendorName: 'National Fasteners Corp',
    contactPerson: 'Ms. Sangeetha',
    phoneNumber: '+91 99400 33221',
    location: 'Ludhiana, Punjab',
    status: 'Active',
    email: 'sangeetha@nationalfasteners.in',
    category: 'Bolts, Nuts & Studs'
  },
  {
    id: 'ven-15',
    vendorCode: 'VEN-015',
    vendorName: 'Global Flow Pumps',
    contactPerson: 'Mr. Arvind',
    phoneNumber: '+91 98711 22334',
    location: 'Coimbatore, Tamil Nadu',
    status: 'Active',
    email: 'arvind@globalflowpumps.com',
    category: 'Coolant & Centrifugal Pumps'
  },
  {
    id: 'ven-16',
    vendorCode: 'VEN-016',
    vendorName: 'Kirloskar Motors Agency',
    contactPerson: 'Mr. Venkatesh',
    phoneNumber: '+91 98800 66778',
    location: 'Hubballi, Karnataka',
    status: 'Active',
    email: 'venkatesh@kirloskarmotors.in',
    category: 'Induction Motors & Starters'
  },
  {
    id: 'ven-17',
    vendorCode: 'VEN-017',
    vendorName: 'Micro Instruments & Gauges',
    contactPerson: 'Ms. Lakshmi',
    phoneNumber: '+91 94440 88221',
    location: 'Vadodara, Gujarat',
    status: 'Active',
    email: 'lakshmi@microgauges.com',
    category: 'Pressure Gauges & Flow Meters'
  },
  {
    id: 'ven-18',
    vendorCode: 'VEN-018',
    vendorName: 'Zenith Filtration Products',
    contactPerson: 'Mr. Prakash',
    phoneNumber: '+91 99520 77112',
    location: 'Chennai, Tamil Nadu',
    status: 'Inactive',
    email: 'prakash@zenithfiltration.in',
    category: 'Hydraulic & Air Filters'
  }
];

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
    throw new Error('Cannot connect to backend server. Using local fallback.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function mapVendor(item) {
  if (!item) return null;
  return {
    id: item._id || item.id,
    vendorCode: item.vendorCode,
    vendorName: item.vendorName,
    contactPerson: item.contactPerson,
    phoneNumber: item.phoneNumber || '',
    location: item.location || '',
    status: item.status || 'Active',
    email: item.email || '',
    category: item.category || 'General',
    notes: item.notes || ''
  };
}

function toApiVendor(item) {
  return {
    vendorCode: item.vendorCode,
    vendorName: item.vendorName,
    contactPerson: item.contactPerson,
    phoneNumber: item.phoneNumber || '',
    location: item.location || '',
    status: item.status || 'Active',
    email: item.email || '',
    category: item.category || 'General',
    notes: item.notes || ''
  };
}

export const vendorService = {
  // Get all vendors
  async getVendors(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await request(qs);
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map(mapVendor);
    } catch (err) {
      console.warn('Backend fetch note for vendors:', err.message);
      // Retrieve from localStorage or fallback
      const cached = localStorage.getItem('cmms_vendors');
      let vendors = cached ? JSON.parse(cached) : DEFAULT_VENDORS;

      // Filter locally if search or status specified
      if (params.status && params.status !== 'all') {
        vendors = vendors.filter((v) => v.status === params.status);
      }
      if (params.search && params.search.trim()) {
        const s = params.search.trim().toLowerCase();
        vendors = vendors.filter(
          (v) =>
            v.vendorCode.toLowerCase().includes(s) ||
            v.vendorName.toLowerCase().includes(s) ||
            v.contactPerson.toLowerCase().includes(s) ||
            (v.phoneNumber && v.phoneNumber.toLowerCase().includes(s)) ||
            (v.location && v.location.toLowerCase().includes(s))
        );
      }
      return vendors;
    }
  },

  // Get vendor stats
  async getVendorStats() {
    try {
      const res = await request('/stats');
      return res.data;
    } catch {
      const cached = localStorage.getItem('cmms_vendors');
      const vendors = cached ? JSON.parse(cached) : DEFAULT_VENDORS;
      return {
        totalVendors: vendors.length,
        activeVendors: vendors.filter((v) => v.status === 'Active').length,
        inactiveVendors: vendors.filter((v) => v.status === 'Inactive').length
      };
    }
  },

  // Add new vendor
  async createVendor(vendorData) {
    const payload = toApiVendor(vendorData);
    try {
      const res = await request('', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return mapVendor(res.data);
    } catch (err) {
      console.warn('Falling back to local storage creation:', err.message);
      const cached = localStorage.getItem('cmms_vendors');
      const vendors = cached ? JSON.parse(cached) : [...DEFAULT_VENDORS];

      // Check unique code
      if (vendors.some((v) => v.vendorCode.toUpperCase() === payload.vendorCode.toUpperCase())) {
        throw new Error(`Vendor Code "${payload.vendorCode}" already exists.`);
      }

      const newVendor = {
        ...payload,
        id: `ven-${Date.now()}`
      };
      vendors.push(newVendor);
      localStorage.setItem('cmms_vendors', JSON.stringify(vendors));
      return newVendor;
    }
  },

  // Update vendor
  async updateVendor(id, vendorData) {
    const payload = toApiVendor(vendorData);
    try {
      const res = await request(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return mapVendor(res.data);
    } catch (err) {
      console.warn('Falling back to local storage update:', err.message);
      const cached = localStorage.getItem('cmms_vendors');
      const vendors = cached ? JSON.parse(cached) : [...DEFAULT_VENDORS];
      const index = vendors.findIndex((v) => v.id === id || v._id === id);
      if (index === -1) throw new Error('Vendor not found.');

      const updated = { ...vendors[index], ...payload, id };
      vendors[index] = updated;
      localStorage.setItem('cmms_vendors', JSON.stringify(vendors));
      return updated;
    }
  },

  // Delete vendor
  async deleteVendor(id) {
    try {
      await request(`/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.warn('Falling back to local storage deletion:', err.message);
      const cached = localStorage.getItem('cmms_vendors');
      const vendors = cached ? JSON.parse(cached) : [...DEFAULT_VENDORS];
      const filtered = vendors.filter((v) => v.id !== id && v._id !== id);
      localStorage.setItem('cmms_vendors', JSON.stringify(filtered));
      return true;
    }
  }
};

export default vendorService;
