import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiTruck,
  FiCheckCircle,
  FiAlertTriangle,
  FiBox,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiPhone,
  FiMapPin,
  FiUser,
  FiRefreshCw
} from 'react-icons/fi';
import vendorService, { DEFAULT_VENDORS } from '../services/vendorService';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import './vendors.css';

export default function Vendors() {
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State - Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    vendorCode: '',
    vendorName: '',
    contactPerson: '',
    phoneNumber: '',
    location: '',
    status: 'Active',
    category: 'General',
    notes: ''
  });
  const [addError, setAddError] = useState('');

  // Modal State - Edit
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState({
    vendorCode: '',
    vendorName: '',
    contactPerson: '',
    phoneNumber: '',
    location: '',
    status: 'Active',
    category: 'General',
    notes: ''
  });
  const [editError, setEditError] = useState('');

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch vendors from backend
  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorService.getVendors();
      if (Array.isArray(data) && data.length > 0) {
        setVendors(data);
      } else {
        setVendors(DEFAULT_VENDORS);
      }
    } catch (err) {
      console.warn('Vendor fetch notice:', err.message);
      setVendors((prev) => (prev && prev.length > 0 ? prev : DEFAULT_VENDORS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await vendorService.getVendors();
      if (Array.isArray(data) && data.length > 0) {
        setVendors(data);
      }
      showToast('Vendors refreshed from backend');
    } catch (err) {
      showToast(err.message || 'Refresh failed', 'danger');
    } finally {
      setRefreshing(false);
    }
  };

  // Distinct categories list
  const availableCategories = useMemo(() => {
    const set = new Set();
    vendors.forEach((v) => {
      if (v.category && v.category.trim()) set.add(v.category.trim());
    });
    return Array.from(set).sort();
  }, [vendors]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'Active').length;
    const inactive = vendors.filter((v) => v.status === 'Inactive').length;
    const categoriesCount = availableCategories.length || 1;
    return { total, active, inactive, categoriesCount };
  }, [vendors, availableCategories]);

  // Generate next vendor code
  const getNextVendorCode = () => {
    const existingNums = vendors
      .map((v) => {
        const match = (v.vendorCode || '').match(/VEN-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `VEN-${String(nextNum).padStart(3, '0')}`;
  };

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (v.vendorCode && v.vendorCode.toLowerCase().includes(q)) ||
        (v.vendorName && v.vendorName.toLowerCase().includes(q)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.phoneNumber && v.phoneNumber.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || v.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' || v.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, searchQuery, statusFilter, categoryFilter]);

  // Pagination hook
  const vendorPagination = usePagination(filteredVendors);

  // Open Add Modal
  const handleOpenAdd = () => {
    setAddForm({
      vendorCode: getNextVendorCode(),
      vendorName: '',
      contactPerson: '',
      phoneNumber: '',
      location: '',
      status: 'Active',
      category: availableCategories[0] || 'Bearings & Power Transmission',
      notes: ''
    });
    setAddError('');
    setShowAddModal(true);
  };

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.vendorCode.trim()) {
      setAddError('Vendor Code is required.');
      return;
    }
    if (!addForm.vendorName.trim()) {
      setAddError('Vendor Name is required.');
      return;
    }
    if (!addForm.contactPerson.trim()) {
      setAddError('Contact Person is required.');
      return;
    }

    const exists = vendors.some(
      (v) => (v.vendorCode || '').toLowerCase() === addForm.vendorCode.trim().toLowerCase()
    );
    if (exists) {
      setAddError(`Vendor Code "${addForm.vendorCode}" already exists.`);
      return;
    }

    setSaving(true);
    setAddError('');
    try {
      const created = await vendorService.createVendor(addForm);
      setVendors((prev) => [created, ...prev]);
      setShowAddModal(false);
      showToast(`Vendor "${created.vendorName}" added successfully`);
    } catch (err) {
      setAddError(err.message || 'Failed to add vendor.');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (v) => {
    setEditingVendor(v);
    setEditForm({
      vendorCode: v.vendorCode,
      vendorName: v.vendorName,
      contactPerson: v.contactPerson,
      phoneNumber: v.phoneNumber || '',
      location: v.location || '',
      status: v.status || 'Active',
      category: v.category || 'General',
      notes: v.notes || ''
    });
    setEditError('');
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.vendorName.trim()) {
      setEditError('Vendor Name is required.');
      return;
    }
    if (!editForm.contactPerson.trim()) {
      setEditError('Contact Person is required.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      const updated = await vendorService.updateVendor(editingVendor.id, editForm);
      setVendors((prev) =>
        prev.map((v) => (v.id === editingVendor.id ? { ...v, ...updated } : v))
      );
      setEditingVendor(null);
      showToast(`Vendor "${updated.vendorName}" updated successfully`);
    } catch (err) {
      setEditError(err.message || 'Failed to update vendor.');
    } finally {
      setSaving(false);
    }
  };

  // Delete vendor
  const handleDeleteConfirm = async (id) => {
    const target = vendors.find((v) => v.id === id);
    setSaving(true);
    try {
      await vendorService.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setDeleteConfirmId(null);
      showToast(`Vendor "${target?.vendorName || target?.vendorCode}" removed`, 'danger');
    } catch (err) {
      showToast(err.message || 'Failed to delete vendor', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vendors-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`vendors-toast ${toast.type}`}>
          {toast.type === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="vendors-header">
        <div className="vendors-header-left">
          <div className="vendors-title-row">
            <h1>Vendors</h1>
            <span className="vendors-badge-pill">{vendors.length} Total</span>
          </div>
          <p className="vendors-subtitle">
            Manage supplier profiles, contact representatives, and procurement inventory.
          </p>
        </div>
        <div className="vendors-header-actions">
          <button
            type="button"
            className="vendors-btn-outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh vendors from backend"
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="vendors-btn-primary"
            onClick={handleOpenAdd}
          >
            <FiPlus />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Matching Designation 4-card Grid) */}
      <div className="vendors-kpi-grid">
        {/* Card 1: Total Vendors */}
        <div className="vendors-kpi-card">
          <div className="vendors-kpi-info">
            <span className="vendors-kpi-label">TOTAL VENDORS</span>
            <span className="vendors-kpi-val">{kpis.total}</span>
          </div>
          <div className="vendors-kpi-icon-box blue">
            <FiTruck />
          </div>
        </div>

        {/* Card 2: Active Vendors */}
        <div className="vendors-kpi-card">
          <div className="vendors-kpi-info">
            <span className="vendors-kpi-label">ACTIVE VENDORS</span>
            <div className="vendors-kpi-val-row">
              <span className="vendors-kpi-val">{kpis.active}</span>
              <span className="status-indicator-dot green"></span>
            </div>
          </div>
          <div className="vendors-kpi-icon-box green">
            <FiCheckCircle />
          </div>
        </div>

        {/* Card 3: Inactive Vendors */}
        <div className="vendors-kpi-card">
          <div className="vendors-kpi-info">
            <span className="vendors-kpi-label">INACTIVE / ON HOLD</span>
            <span className="vendors-kpi-val">{kpis.inactive}</span>
          </div>
          <div className="vendors-kpi-icon-box amber">
            <FiAlertTriangle />
          </div>
        </div>

        {/* Card 4: Categories */}
        <div className="vendors-kpi-card">
          <div className="vendors-kpi-info">
            <span className="vendors-kpi-label">SUPPLY CATEGORIES</span>
            <span className="vendors-kpi-val">{kpis.categoriesCount}</span>
          </div>
          <div className="vendors-kpi-icon-box purple">
            <FiBox />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Matching Designation Layout) */}
      <div className="vendors-filter-bar">
        <div className="vendors-search-box">
          <FiSearch className="vendors-search-icon" />
          <input
            type="text"
            placeholder="Search by vendor name, code, contact, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="vendors-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="vendors-filter-dropdowns">
          <div className="vendors-select-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="vendors-select-group">
            <label>Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table (Matching Designation Dark Navy Header & Rows) */}
      <div className="vendors-table-container">
        <table className="vendors-table">
          <thead>
            <tr>
              <th>VENDOR CODE</th>
              <th>VENDOR NAME</th>
              <th>CONTACT PERSON</th>
              <th>PHONE NUMBER</th>
              <th>LOCATION</th>
              <th>STATUS</th>
              <th className="th-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="td-empty">
                  <div className="vendors-loading-row">
                    <FiRefreshCw className="spinning" />
                    <span>Loading vendors...</span>
                  </div>
                </td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan="7" className="td-empty">
                  No vendors found matching your search criteria.
                </td>
              </tr>
            ) : (
              vendorPagination.pageItems.map((vendor) => {
                const isActive = vendor.status === 'Active';

                return (
                  <tr key={vendor.id || vendor.vendorCode}>
                    <td>
                      <span className="vendor-code-chip">{vendor.vendorCode}</span>
                    </td>
                    <td>
                      <div className="vendor-title-cell">
                        <FiTruck className="vendor-row-icon" />
                        <div>
                          <span className="vendor-title-text">{vendor.vendorName}</span>
                          {vendor.category && (
                            <span className="vendor-title-desc">{vendor.category}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vendor-contact-chip">
                        <FiUser />
                        <span>{vendor.contactPerson}</span>
                      </div>
                    </td>
                    <td>
                      {vendor.phoneNumber ? (
                        <div className="vendor-phone-chip">
                          <FiPhone />
                          <span>{vendor.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="dash-empty">—</span>
                      )}
                    </td>
                    <td>
                      {vendor.location ? (
                        <div className="vendor-loc-chip">
                          <FiMapPin />
                          <span>{vendor.location}</span>
                        </div>
                      ) : (
                        <span className="dash-empty">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                        <span className="pill-dot"></span>
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <div className="vendors-actions-group">
                        <button
                          type="button"
                          className="vendors-action-btn edit"
                          onClick={() => handleOpenEdit(vendor)}
                          title="Edit Vendor"
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="vendors-action-btn delete"
                          onClick={() => setDeleteConfirmId(vendor.id)}
                          title="Delete Vendor"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        totalItems={filteredVendors.length}
        currentPage={vendorPagination.currentPage}
        totalPages={vendorPagination.totalPages}
        onPageChange={vendorPagination.setCurrentPage}
      />

      {/* ADD VENDOR MODAL */}
      {showAddModal && (
        <div className="vendors-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="vendors-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vendors-modal-header">
              <h2>Add New Vendor</h2>
              <button
                type="button"
                className="vendors-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <FiX />
              </button>
            </div>

            {addError && <div className="vendors-modal-error">{addError}</div>}

            <form onSubmit={handleAddSubmit}>
              <div className="vendors-modal-body">
                <div className="vendors-form-row">
                  <div className="vendors-form-group">
                    <label>Vendor Code *</label>
                    <input
                      type="text"
                      required
                      value={addForm.vendorCode}
                      onChange={(e) =>
                        setAddForm({ ...addForm, vendorCode: e.target.value.toUpperCase() })
                      }
                      placeholder="VEN-001"
                    />
                  </div>
                  <div className="vendors-form-group">
                    <label>Status</label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="vendors-form-group">
                  <label>Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.vendorName}
                    onChange={(e) => setAddForm({ ...addForm, vendorName: e.target.value })}
                    placeholder="e.g. ABC Bearings Pvt. Ltd."
                  />
                </div>

                <div className="vendors-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={addForm.contactPerson}
                    onChange={(e) =>
                      setAddForm({ ...addForm, contactPerson: e.target.value })
                    }
                    placeholder="e.g. Mr. Rajesh"
                  />
                </div>

                <div className="vendors-form-row">
                  <div className="vendors-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={addForm.phoneNumber}
                      onChange={(e) =>
                        setAddForm({ ...addForm, phoneNumber: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="vendors-form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      required
                      value={addForm.location}
                      onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                      placeholder="e.g. Coimbatore, Tamil Nadu"
                    />
                  </div>
                </div>

                <div className="vendors-form-group">
                  <label>Category / Specialization</label>
                  <input
                    type="text"
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    placeholder="e.g. Bearings, Hardware, Lubricants"
                  />
                </div>
              </div>

              <div className="vendors-modal-footer">
                <button
                  type="button"
                  className="vendors-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="vendors-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL */}
      {editingVendor && (
        <div className="vendors-modal-backdrop" onClick={() => setEditingVendor(null)}>
          <div className="vendors-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vendors-modal-header">
              <h2>Edit Vendor</h2>
              <button
                type="button"
                className="vendors-modal-close"
                onClick={() => setEditingVendor(null)}
              >
                <FiX />
              </button>
            </div>

            {editError && <div className="vendors-modal-error">{editError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div className="vendors-modal-body">
                <div className="vendors-form-row">
                  <div className="vendors-form-group">
                    <label>Vendor Code</label>
                    <input
                      type="text"
                      disabled
                      value={editForm.vendorCode}
                      className="input-disabled"
                    />
                  </div>
                  <div className="vendors-form-group">
                    <label>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="vendors-form-group">
                  <label>Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.vendorName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, vendorName: e.target.value })
                    }
                  />
                </div>

                <div className="vendors-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={editForm.contactPerson}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contactPerson: e.target.value })
                    }
                  />
                </div>

                <div className="vendors-form-row">
                  <div className="vendors-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phoneNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="vendors-form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      required
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="vendors-form-group">
                  <label>Category / Specialization</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="vendors-modal-footer">
                <button
                  type="button"
                  className="vendors-btn-secondary"
                  onClick={() => setEditingVendor(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="vendors-btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="vendors-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="vendors-modal-card delete-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vendors-modal-header delete-header">
              <div className="delete-icon-circle">
                <FiTrash2 />
              </div>
              <h2>Confirm Deletion</h2>
              <button
                type="button"
                className="vendors-modal-close"
                onClick={() => setDeleteConfirmId(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="vendors-modal-body">
              <p className="delete-warning-text">
                Are you sure you want to delete vendor{' '}
                <strong>
                  {vendors.find((v) => v.id === deleteConfirmId)?.vendorName ||
                    vendors.find((v) => v.id === deleteConfirmId)?.vendorCode}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="vendors-modal-footer center">
              <button
                type="button"
                className="vendors-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="vendors-btn-danger"
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
