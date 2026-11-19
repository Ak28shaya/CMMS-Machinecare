import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiMapPin,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertTriangle
} from 'react-icons/fi';
import departmentService from '../services/departmentService';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import './department.css';

const EMPTY_DEPARTMENTS = [];

export default function Department() {
  const [departments, setDepartments] = useState(null);
  const [departmentStats, setDepartmentStats] = useState({
    plantHeadcount: 0,
    activeEmployees: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const loading = departments === null && !loadError;
  const departmentList = departments || EMPTY_DEPARTMENTS;
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    name: '',
    head: '',
    location: '',
    budgetCenter: '',
    status: 'Active',
    description: ''
  });
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [editingDept, setEditingDept] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    head: '',
    location: '',
    budgetCenter: '',
    status: 'Active',
    description: ''
  });
  const [editError, setEditError] = useState('');

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDepartmentData = useCallback(async () => {
    try {
      const [departmentList, stats] = await Promise.all([
        departmentService.getDepartments(),
        departmentService.getDepartmentStats()
      ]);
      setDepartments(departmentList);
      setDepartmentStats(stats);
      setLoadError('');
      return null;
    } catch (error) {
      setLoadError(error.message);
      return error;
    }
  }, []);

  useEffect(() => {
    loadDepartmentData();
  }, [loadDepartmentData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const error = await loadDepartmentData();
      if (error) {
        showToast(error.message, 'danger');
      } else {
        showToast('Department data refreshed');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered list
  const filteredDepartments = useMemo(() => {
    return departmentList.filter((dept) => {
      if (statusFilter !== 'all' && dept.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (dept.code || '').toLowerCase();
        const name = (dept.name || '').toLowerCase();
        const head = (dept.head || '').toLowerCase();
        const loc = (dept.location || '').toLowerCase();
        return code.includes(q) || name.includes(q) || head.includes(q) || loc.includes(q);
      }
      return true;
    });
  }, [departmentList, searchQuery, statusFilter]);
  const departmentPagination = usePagination(filteredDepartments);

  // KPIs
  const kpis = useMemo(() => {
    return {
      totalDepts: departmentStats.totalDepartments || 0,
      activeDepts: departmentStats.activeDepartments || 0,
      totalStaff: departmentStats.plantHeadcount || 0,
      activeStaff: departmentStats.activeEmployees || 0
    };
  }, [departmentStats]);

  // Handle Add
  const handleOpenAdd = () => {
    setAddForm({
      code: `DEPT-${String(departmentList.length + 1).padStart(2, '0')}`,
      name: '',
      head: '',
      location: 'Plant-1 Main Campus',
      budgetCenter: `CC-40${departmentList.length + 1}`,
      status: 'Active',
      description: ''
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError('Department name is required');
      return;
    }
    if (!addForm.code.trim()) {
      setAddError('Department code is required');
      return;
    }

    const exists = departmentList.some(
      (d) => d.code.toLowerCase() === addForm.code.trim().toLowerCase()
    );
    if (exists) {
      setAddError(`Department code "${addForm.code}" already exists.`);
      return;
    }

    const newDept = {
      code: addForm.code.trim().toUpperCase(),
      name: addForm.name.trim(),
      head: addForm.head.trim() || 'Unassigned',
      location: addForm.location.trim() || 'Plant-1',
      budgetCenter: addForm.budgetCenter.trim() || 'CC-400',
      status: addForm.status,
      description: addForm.description.trim()
    };

    setSaving(true);
    try {
      const createdDepartment = await departmentService.createDepartment(newDept);
      setDepartments((prev) => [createdDepartment, ...(prev || [])]);
      setDepartmentStats((prev) => ({
        ...prev,
        totalDepartments: (prev.totalDepartments || 0) + 1,
        activeDepartments: (prev.activeDepartments || 0) + (createdDepartment.status === 'Active' ? 1 : 0)
      }));
      setShowAddModal(false);
      showToast(`Department "${createdDepartment.name}" created successfully`);
    } catch (error) {
      setAddError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit
  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setEditForm({
      code: dept.code,
      name: dept.name,
      head: dept.head,
      location: dept.location,
      budgetCenter: dept.budgetCenter || '',
      status: dept.status,
      description: dept.description || ''
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Department name is required');
      return;
    }

    const updatedValues = {
      code: editForm.code.trim(),
      name: editForm.name.trim(),
      head: editForm.head.trim() || 'Unassigned',
      location: editForm.location.trim() || 'Plant-1',
      budgetCenter: editForm.budgetCenter.trim(),
      status: editForm.status,
      description: editForm.description.trim()
    };

    setSaving(true);
    try {
      const updatedDepartment = await departmentService.updateDepartment(editingDept.id, updatedValues);
      setDepartments((prev) =>
        prev.map((department) =>
          department.id === editingDept.id
            ? { ...updatedDepartment, teamMembers: department.teamMembers }
            : department
        )
      );
      if (editingDept.status !== updatedDepartment.status) {
        setDepartmentStats((prev) => ({
          ...prev,
          activeDepartments: Math.max(
            0,
            (prev.activeDepartments || 0) + (updatedDepartment.status === 'Active' ? 1 : -1)
          )
        }));
      }
      setEditingDept(null);
      showToast(`Department "${updatedDepartment.name}" updated successfully`);
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const target = departmentList.find((d) => d.id === id);
    setSaving(true);
    try {
      await departmentService.deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      setDepartmentStats((prev) => ({
        ...prev,
        totalDepartments: Math.max(0, (prev.totalDepartments || 0) - 1),
        activeDepartments: Math.max(
          0,
          (prev.activeDepartments || 0) - (target?.status === 'Active' ? 1 : 0)
        )
      }));
      setDeleteConfirmId(null);
      showToast(`Department "${target?.name || ''}" removed`, 'danger');
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dept-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`dept-toast ${toast.type}`}>
          {toast.type === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="dept-header">
        <div className="dept-header-left">
          <div className="dept-title-row">
            <h1>Department</h1>
            <span className="dept-badge-pill">{kpis.totalDepts} Total</span>
          </div>
          <p className="dept-subtitle">
            Manage organizational divisions, cost centers, and team allocations across the plant.
          </p>
        </div>
        <div className="dept-header-actions">
          <button
            type="button"
            className="dept-btn-outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="dept-btn-primary" onClick={handleOpenAdd} disabled={loading}>
            <FiPlus />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="dept-load-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={handleRefresh} disabled={refreshing}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="dept-kpi-grid">
        {/* Card 1: Total Departments */}
        <div className="dept-kpi-card">
          <div className="dept-kpi-info">
            <span className="dept-kpi-label">TOTAL DEPARTMENTS</span>
            <span className="dept-kpi-val">{kpis.totalDepts}</span>
          </div>
          <div className="dept-kpi-icon-box blue">
            <FiBriefcase />
          </div>
        </div>

        {/* Card 2: Active Departments */}
        <div className="dept-kpi-card">
          <div className="dept-kpi-info">
            <span className="dept-kpi-label">ACTIVE DIVISIONS</span>
            <div className="dept-kpi-val-row">
              <span className="dept-kpi-val">{kpis.activeDepts}</span>
              <span className="status-indicator-dot green"></span>
            </div>
          </div>
          <div className="dept-kpi-icon-box green">
            <FiCheckCircle />
          </div>
        </div>

        {/* Card 3: Total Headcount */}
        <div className="dept-kpi-card">
          <div className="dept-kpi-info">
            <span className="dept-kpi-label">PLANT HEADCOUNT</span>
            <span className="dept-kpi-val">{kpis.totalStaff}</span>
          </div>
          <div className="dept-kpi-icon-box amber">
            <FiUsers />
          </div>
        </div>

        {/* Card 4: Active Staff */}
        <div className="dept-kpi-card">
          <div className="dept-kpi-info">
            <span className="dept-kpi-label">ACTIVE STAFF</span>
            <span className="dept-kpi-val">{kpis.activeStaff}</span>
          </div>
          <div className="dept-kpi-icon-box red">
            <FiUsers />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="dept-filter-bar">
        <div className="dept-search-box">
          <FiSearch className="dept-search-icon" />
          <input
            type="text"
            placeholder="Search by department code, name, head, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="dept-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="dept-filter-dropdowns">
          <div className="dept-select-group">
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
        </div>
      </div>

      {/* Data Table */}
      <div className="dept-table-container">
        <table className="dept-table">
          <thead>
            <tr>
              <th>DEPARTMENT CODE</th>
              <th>DEPARTMENT NAME</th>
              <th>HEAD OF DEPARTMENT</th>
              <th>OPERATING LOCATION</th>
              <th>TEAM MEMBERS</th>
              <th>STATUS</th>
              <th className="th-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="td-empty">Loading departments...</td>
              </tr>
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="7" className="td-empty">
                  {loadError ? 'Department data is unavailable.' : 'No departments found matching your criteria.'}
                </td>
              </tr>
            ) : (
              departmentPagination.pageItems.map((dept) => {
                const isActive = dept.status === 'Active';

                return (
                  <tr key={dept.id}>
                    <td>
                      <span className="dept-code-chip">{dept.code}</span>
                    </td>
                    <td>
                      <div className="dept-name-cell">
                        <FiBriefcase className="dept-row-icon" />
                        <div>
                          <span className="dept-name-title">{dept.name}</span>
                          {dept.description && (
                            <span className="dept-name-desc">{dept.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="dept-head-cell">
                        <span className="dept-head-name">{dept.head}</span>
                        {dept.budgetCenter && (
                          <span className="dept-budget-tag">{dept.budgetCenter}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="dept-loc-cell">
                        <FiMapPin className="dept-loc-icon" />
                        <span>{dept.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="dept-members-chip">
                        <FiUsers className="dept-members-icon" />
                        <span>
                          <strong>{dept.teamMembers}</strong> staff
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                        <span className="pill-dot"></span>
                        {dept.status}
                      </span>
                    </td>
                    <td>
                      <div className="dept-actions-group">
                        <button
                          type="button"
                          className="dept-action-btn edit"
                          onClick={() => handleOpenEdit(dept)}
                          title="Edit Department"
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="dept-action-btn delete"
                          onClick={() => setDeleteConfirmId(dept.id)}
                          title="Delete Department"
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
      <Pagination
        totalItems={filteredDepartments.length}
        currentPage={departmentPagination.currentPage}
        totalPages={departmentPagination.totalPages}
        onPageChange={departmentPagination.setCurrentPage}
      />

      {/* ADD DEPARTMENT MODAL */}
      {showAddModal && (
        <div className="dept-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="dept-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h2>Add New Department</h2>
              <button
                type="button"
                className="dept-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <FiX />
              </button>
            </div>

            {addError && <div className="dept-modal-error">{addError}</div>}

            <form onSubmit={handleSaveAdd}>
              <div className="dept-modal-grid">
                <div className="dept-form-group">
                  <label>Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEPT-OPS"
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Head of Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya M"
                    value={addForm.head}
                    onChange={(e) => setAddForm({ ...addForm, head: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Operating Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant-1 Shop Floor B"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Budget / Cost Center</label>
                  <input
                    type="text"
                    placeholder="e.g. CC-405"
                    value={addForm.budgetCenter}
                    onChange={(e) => setAddForm({ ...addForm, budgetCenter: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
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

              <div className="dept-form-group full-width">
                <label>Description / Scope</label>
                <textarea
                  rows="2"
                  placeholder="Brief description of department scope and responsibilities..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />
              </div>

              <div className="dept-modal-footer">
                <button
                  type="button"
                  className="dept-btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dept-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="dept-modal-backdrop" onClick={() => setEditingDept(null)}>
          <div className="dept-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h2>Edit Department ({editingDept.code})</h2>
              <button
                type="button"
                className="dept-modal-close"
                onClick={() => setEditingDept(null)}
              >
                <FiX />
              </button>
            </div>

            {editError && <div className="dept-modal-error">{editError}</div>}

            <form onSubmit={handleSaveEdit}>
              <div className="dept-modal-grid">
                <div className="dept-form-group">
                  <label>Department Code</label>
                  <input type="text" disabled value={editForm.code} className="input-disabled" />
                </div>

                <div className="dept-form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Head of Department</label>
                  <input
                    type="text"
                    value={editForm.head}
                    onChange={(e) => setEditForm({ ...editForm, head: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Operating Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Budget / Cost Center</label>
                  <input
                    type="text"
                    value={editForm.budgetCenter}
                    onChange={(e) => setEditForm({ ...editForm, budgetCenter: e.target.value })}
                  />
                </div>

                <div className="dept-form-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="dept-form-group full-width">
                <label>Description / Scope</label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="dept-modal-footer">
                <button
                  type="button"
                  className="dept-btn-outline"
                  onClick={() => setEditingDept(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="dept-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="dept-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="dept-modal-card delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-box">
              <FiAlertTriangle />
            </div>
            <h3>Delete Department?</h3>
            <p>
              Are you sure you want to delete this department? Departments with assigned employees
              cannot be deleted.
            </p>
            <div className="dept-modal-footer center">
              <button
                type="button"
                className="dept-btn-outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dept-btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

