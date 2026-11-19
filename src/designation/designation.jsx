import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiAward,
  FiUsers,
  FiBriefcase,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';
import designationService from '../services/designationService';
import departmentService from '../services/departmentService';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import './designation.css';

const DEFAULT_DEPARTMENTS = ['Maintenance', 'Production', 'Quality', 'Safety', 'Management'];

const DEFAULT_DESIGNATIONS = [
  {
    id: 'desg-1',
    code: 'DESG-ENG',
    title: 'Maintenance Engineer',
    department: 'Maintenance',
    status: 'Active',
    description: 'Diagnoses high-precision mechanical systems, calibrates CNC lathes and leads overhaul tasks.'
  },
  {
    id: 'desg-2',
    code: 'DESG-TECH',
    title: 'Technician',
    department: 'Production',
    status: 'Active',
    description: 'Executes standard assembly sequences, monitors cycle times and performs routine tool changes.'
  },
  {
    id: 'desg-3',
    code: 'DESG-QENG',
    title: 'Quality Engineer',
    department: 'Quality',
    status: 'Active',
    description: 'Ensures ISO compliance, performs non-destructive testing and validates parts tolerances.'
  },
  {
    id: 'desg-4',
    code: 'DESG-SUP',
    title: 'Supervisor',
    department: 'Maintenance',
    status: 'Active',
    description: 'Schedules shift assignments, signs off on work orders and allocates emergency repair teams.'
  },
  {
    id: 'desg-5',
    code: 'DESG-OPR',
    title: 'Operator',
    department: 'Production',
    status: 'Active',
    description: 'Operates hydraulic presses, conveyors and packaging systems in designated floor bays.'
  },
  {
    id: 'desg-6',
    code: 'DESG-ELEC',
    title: 'Electrical Tech',
    department: 'Maintenance',
    status: 'Active',
    description: 'Maintains motor drives, switchgear panels, circuit breakers and plant electrical distribution.'
  },
  {
    id: 'desg-7',
    code: 'DESG-QA',
    title: 'QA Analyst',
    department: 'Quality',
    status: 'Active',
    description: 'Analyzes batch variance charts, defect rate logs and conducts metallurgical checks.'
  },
  {
    id: 'desg-8',
    code: 'DESG-SAF',
    title: 'Safety Officer',
    department: 'Safety',
    status: 'Active',
    description: 'Conducts daily hazard walk-throughs, manages PPE inventories and emergency drill logs.'
  },
  {
    id: 'desg-9',
    code: 'DESG-MGR',
    title: 'Plant Manager',
    department: 'Management',
    status: 'Active',
    description: 'Responsible for complete plant operations, uptime KPIs, safety standards and output targets.'
  },
  {
    id: 'desg-10',
    code: 'DESG-MECH',
    title: 'Mechanical Tech',
    department: 'Maintenance',
    status: 'Active',
    description: 'Replaces bearings, belts, seals, alignments, and lubricates mechanical drives.'
  }
];

export default function Designation() {
  const [designations, setDesignations] = useState(DEFAULT_DESIGNATIONS);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    title: '',
    department: 'Maintenance',
    status: 'Active',
    description: ''
  });
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [editingDesg, setEditingDesg] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    title: '',
    department: 'Maintenance',
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

  // Fetch designations & departments from backend
  const fetchDesignationData = useCallback(async () => {
    try {
      setLoading(true);
      const [backendDesgs, backendDepts] = await Promise.all([
        designationService.getDesignations(),
        departmentService.getDepartments().catch(() => [])
      ]);

      if (Array.isArray(backendDesgs) && backendDesgs.length > 0) {
        setDesignations(backendDesgs);
      } else {
        setDesignations(DEFAULT_DESIGNATIONS);
      }

      if (Array.isArray(backendDepts) && backendDepts.length > 0) {
        setDepartmentsList(backendDepts);
      }
    } catch (err) {
      console.warn('Backend designations fetch note:', err.message);
      // Fallback
      setDesignations((prev) => (prev && prev.length > 0 ? prev : DEFAULT_DESIGNATIONS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignationData();
  }, [fetchDesignationData]);

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDesignationData();
    setTimeout(() => {
      setRefreshing(false);
      showToast('Designations data refreshed');
    }, 400);
  };

  // Available department names for dropdowns
  const availableDepartmentNames = useMemo(() => {
    if (departmentsList.length > 0) {
      const names = departmentsList.map((d) => d.name).filter(Boolean);
      return Array.from(new Set(names));
    }
    return DEFAULT_DEPARTMENTS;
  }, [departmentsList]);

  // Filtered list
  const filteredDesignations = useMemo(() => {
    return designations.filter((desg) => {
      if (deptFilter !== 'all' && desg.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (desg.code || '').toLowerCase();
        const title = (desg.title || '').toLowerCase();
        const dept = (desg.department || '').toLowerCase();
        return code.includes(q) || title.includes(q) || dept.includes(q);
      }
      return true;
    });
  }, [designations, searchQuery, deptFilter]);

  const designationPagination = usePagination(filteredDesignations);

  // KPIs
  const kpis = useMemo(() => {
    const total = designations.length;
    const engineering = designations.filter(
      (d) => d.department === 'Maintenance' || d.department === 'Quality'
    ).length;
    const departments = new Set(designations.map((d) => d.department)).size;
    const ops = designations.filter((d) => d.department === 'Production').length;
    return {
      total,
      engineering,
      departments,
      ops
    };
  }, [designations]);

  // Handle Add
  const handleOpenAdd = () => {
    const defaultDept = availableDepartmentNames[0] || 'Maintenance';
    setAddForm({
      code: `DESG-${String(designations.length + 1).padStart(2, '0')}`,
      title: '',
      department: defaultDept,
      status: 'Active',
      description: ''
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      setAddError('Designation title is required');
      return;
    }
    if (!addForm.code.trim()) {
      setAddError('Role code is required');
      return;
    }

    const exists = designations.some(
      (d) => (d.code || '').toLowerCase() === addForm.code.trim().toLowerCase()
    );
    if (exists) {
      setAddError(`Designation code "${addForm.code}" already exists.`);
      return;
    }

    setSaving(true);
    setAddError('');

    try {
      const payload = {
        code: addForm.code.trim().toUpperCase(),
        title: addForm.title.trim(),
        department: addForm.department,
        status: addForm.status,
        description: addForm.description.trim()
      };

      let created;
      try {
        created = await designationService.createDesignation(payload);
      } catch (err) {
        console.warn('Remote create failed, saving locally:', err.message);
        created = {
          id: `desg-${Date.now()}`,
          ...payload
        };
      }

      setDesignations((prev) => [created, ...prev]);
      setShowAddModal(false);
      showToast(`Designation "${created.title}" added successfully`);
    } catch (err) {
      setAddError(err.message || 'Failed to add designation');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit
  const handleOpenEdit = (desg) => {
    setEditingDesg(desg);
    setEditForm({
      code: desg.code,
      title: desg.title,
      department: desg.department,
      status: desg.status,
      description: desg.description || ''
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setEditError('Designation title is required');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      const payload = {
        code: editForm.code,
        title: editForm.title.trim(),
        department: editForm.department,
        status: editForm.status,
        description: editForm.description.trim()
      };

      let updated;
      try {
        if (editingDesg.id && !editingDesg.id.startsWith('desg-')) {
          updated = await designationService.updateDesignation(editingDesg.id, payload);
        } else {
          updated = { id: editingDesg.id, ...payload };
        }
      } catch (err) {
        console.warn('Remote update failed, updating locally:', err.message);
        updated = { id: editingDesg.id, ...payload };
      }

      setDesignations((prev) =>
        prev.map((d) => (d.id === editingDesg.id ? updated : d))
      );
      setEditingDesg(null);
      showToast(`Designation "${updated.title}" updated successfully`);
    } catch (err) {
      setEditError(err.message || 'Failed to update designation');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const target = designations.find((d) => d.id === id);
    try {
      if (id && !id.startsWith('desg-')) {
        await designationService.deleteDesignation(id);
      }
    } catch (err) {
      console.warn('Remote delete failed, deleting locally:', err.message);
    }

    setDesignations((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirmId(null);
    showToast(`Designation "${target?.title || ''}" removed`, 'danger');
  };

  return (
    <div className="desg-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`desg-toast ${toast.type}`}>
          {toast.type === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="desg-header">
        <div className="desg-header-left">
          <div className="desg-title-row">
            <h1>Designation</h1>
            <span className="desg-badge-pill">{designations.length} Total</span>
          </div>
          <p className="desg-subtitle">
            Manage job designations, departments, and responsibilities.
          </p>
        </div>
        <div className="desg-header-actions">
          <button
            type="button"
            className="desg-btn-outline"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh designations from backend"
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="desg-btn-primary" onClick={handleOpenAdd}>
            <FiPlus />
            <span>Add Designation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="desg-kpi-grid">
        {/* Card 1: Total Roles */}
        <div className="desg-kpi-card">
          <div className="desg-kpi-info">
            <span className="desg-kpi-label">TOTAL DESIGNATIONS</span>
            <span className="desg-kpi-val">{kpis.total}</span>
          </div>
          <div className="desg-kpi-icon-box blue">
            <FiAward />
          </div>
        </div>

        {/* Card 2: Tech & Engineering */}
        <div className="desg-kpi-card">
          <div className="desg-kpi-info">
            <span className="desg-kpi-label">ENGINEERING & TECH</span>
            <div className="desg-kpi-val-row">
              <span className="desg-kpi-val">{kpis.engineering}</span>
              <span className="status-indicator-dot green"></span>
            </div>
          </div>
          <div className="desg-kpi-icon-box green">
            <FiBriefcase />
          </div>
        </div>

        {/* Card 3: Departments */}
        <div className="desg-kpi-card">
          <div className="desg-kpi-info">
            <span className="desg-kpi-label">DEPARTMENTS</span>
            <span className="desg-kpi-val">{kpis.departments}</span>
          </div>
          <div className="desg-kpi-icon-box amber">
            <FiBriefcase />
          </div>
        </div>

        {/* Card 4: Operations Roles */}
        <div className="desg-kpi-card">
          <div className="desg-kpi-info">
            <span className="desg-kpi-label">PRODUCTION & OPS</span>
            <span className="desg-kpi-val">{kpis.ops}</span>
          </div>
          <div className="desg-kpi-icon-box purple">
            <FiUsers />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="desg-filter-bar">
        <div className="desg-search-box">
          <FiSearch className="desg-search-icon" />
          <input
            type="text"
            placeholder="Search by designation title, code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="desg-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="desg-filter-dropdowns">
          <div className="desg-select-group">
            <label>Department:</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {availableDepartmentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="desg-table-container">
        <table className="desg-table">
          <thead>
            <tr>
              <th>ROLE CODE</th>
              <th>DESIGNATION TITLE</th>
              <th>DEPARTMENT</th>
              <th>STATUS</th>
              <th className="th-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDesignations.length === 0 ? (
              <tr>
                <td colSpan="5" className="td-empty">
                  No designations found matching your criteria.
                </td>
              </tr>
            ) : (
              designationPagination.pageItems.map((desg) => {
                const isActive = desg.status === 'Active';

                return (
                  <tr key={desg.id}>
                    <td>
                      <span className="desg-code-chip">{desg.code}</span>
                    </td>
                    <td>
                      <div className="desg-title-cell">
                        <FiAward className="desg-row-icon" />
                        <div>
                          <span className="desg-title-text">{desg.title}</span>
                          {desg.description && (
                            <span className="desg-title-desc">{desg.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="desg-dept-chip">
                        <FiBriefcase />
                        <span>{desg.department}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                        <span className="pill-dot"></span>
                        {desg.status}
                      </span>
                    </td>
                    <td>
                      <div className="desg-actions-group">
                        <button
                          type="button"
                          className="desg-action-btn edit"
                          onClick={() => handleOpenEdit(desg)}
                          title="Edit Designation"
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="desg-action-btn delete"
                          onClick={() => setDeleteConfirmId(desg.id)}
                          title="Delete Designation"
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
        totalItems={filteredDesignations.length}
        currentPage={designationPagination.currentPage}
        totalPages={designationPagination.totalPages}
        onPageChange={designationPagination.setCurrentPage}
      />

      {/* ADD DESIGNATION MODAL */}
      {showAddModal && (
        <div className="desg-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="desg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="desg-modal-header">
              <h2>Add New Designation</h2>
              <button
                type="button"
                className="desg-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <FiX />
              </button>
            </div>

            {addError && <div className="desg-modal-error">{addError}</div>}

            <form onSubmit={handleSaveAdd}>
              <div className="desg-modal-grid">
                <div className="desg-form-group">
                  <label>Role Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DESG-TECH"
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                  />
                </div>

                <div className="desg-form-group">
                  <label>Designation Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Automation Specialist"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  />
                </div>

                <div className="desg-form-group">
                  <label>Department</label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  >
                    {availableDepartmentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="desg-form-group">
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

              <div className="desg-form-group full-width">
                <label>Job Description / Responsibilities</label>
                <textarea
                  rows="2"
                  placeholder="Key duties, technical skills, and equipment authorization..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />
              </div>

              <div className="desg-modal-footer">
                <button
                  type="button"
                  className="desg-btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="desg-btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DESIGNATION MODAL */}
      {editingDesg && (
        <div className="desg-modal-backdrop" onClick={() => setEditingDesg(null)}>
          <div className="desg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="desg-modal-header">
              <h2>Edit Designation ({editingDesg.code})</h2>
              <button
                type="button"
                className="desg-modal-close"
                onClick={() => setEditingDesg(null)}
              >
                <FiX />
              </button>
            </div>

            {editError && <div className="desg-modal-error">{editError}</div>}

            <form onSubmit={handleSaveEdit}>
              <div className="desg-modal-grid">
                <div className="desg-form-group">
                  <label>Role Code</label>
                  <input type="text" disabled value={editForm.code} className="input-disabled" />
                </div>

                <div className="desg-form-group">
                  <label>Designation Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div className="desg-form-group">
                  <label>Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  >
                    {availableDepartmentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="desg-form-group">
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

              <div className="desg-form-group full-width">
                <label>Job Description / Responsibilities</label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="desg-modal-footer">
                <button
                  type="button"
                  className="desg-btn-outline"
                  onClick={() => setEditingDesg(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="desg-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="desg-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="desg-modal-card delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-box">
              <FiAlertTriangle />
            </div>
            <h3>Delete Designation?</h3>
            <p>
              Are you sure you want to delete this designation? Any employees currently holding
              this title will not be deleted, but the role listing will be removed.
            </p>
            <div className="desg-modal-footer center">
              <button
                type="button"
                className="desg-btn-outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="desg-btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
