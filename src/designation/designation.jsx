import { useState, useEffect, useMemo } from 'react';
import {
  FiAward,
  FiUsers,
  FiBriefcase,
  FiShield,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertTriangle
} from 'react-icons/fi';
import employeeService from '../services/employeeService';
import './designation.css';

const DEFAULT_DESIGNATIONS = [
  {
    id: 'desg-1',
    code: 'DESG-ENG',
    title: 'Maintenance Engineer',
    department: 'Maintenance',
    level: 'Senior',
    grade: 'L4',
    status: 'Active',
    description: 'Diagnoses high-precision mechanical systems, calibrates CNC lathes and leads overhaul tasks.'
  },
  {
    id: 'desg-2',
    code: 'DESG-TECH',
    title: 'Technician',
    department: 'Production',
    level: 'Mid-Level',
    grade: 'L2',
    status: 'Active',
    description: 'Executes standard assembly sequences, monitors cycle times and performs routine tool changes.'
  },
  {
    id: 'desg-3',
    code: 'DESG-QENG',
    title: 'Quality Engineer',
    department: 'Quality',
    level: 'Senior',
    grade: 'L4',
    status: 'Active',
    description: 'Ensures ISO compliance, performs non-destructive testing and validates parts tolerances.'
  },
  {
    id: 'desg-4',
    code: 'DESG-SUP',
    title: 'Supervisor',
    department: 'Maintenance',
    level: 'Lead / Supervisory',
    grade: 'L5',
    status: 'Active',
    description: 'Schedules shift assignments, signs off on work orders and allocates emergency repair teams.'
  },
  {
    id: 'desg-5',
    code: 'DESG-OPR',
    title: 'Operator',
    department: 'Production',
    level: 'Junior / Entry',
    grade: 'L1',
    status: 'Active',
    description: 'Operates hydraulic presses, conveyors and packaging systems in designated floor bays.'
  },
  {
    id: 'desg-6',
    code: 'DESG-ELEC',
    title: 'Electrical Tech',
    department: 'Maintenance',
    level: 'Mid-Level',
    grade: 'L3',
    status: 'Active',
    description: 'Maintains motor drives, switchgear panels, circuit breakers and plant electrical distribution.'
  },
  {
    id: 'desg-7',
    code: 'DESG-QA',
    title: 'QA Analyst',
    department: 'Quality',
    level: 'Mid-Level',
    grade: 'L3',
    status: 'Active',
    description: 'Analyzes batch variance charts, defect rate logs and conducts metallurgical checks.'
  },
  {
    id: 'desg-8',
    code: 'DESG-SAF',
    title: 'Safety Officer',
    department: 'Safety',
    level: 'Lead / Supervisory',
    grade: 'L4',
    status: 'Active',
    description: 'Conducts daily hazard walk-throughs, manages PPE inventories and emergency drill logs.'
  },
  {
    id: 'desg-9',
    code: 'DESG-MGR',
    title: 'Plant Manager',
    department: 'Management',
    level: 'Executive',
    grade: 'L6',
    status: 'Active',
    description: 'Responsible for complete plant operations, uptime KPIs, safety standards and output targets.'
  },
  {
    id: 'desg-10',
    code: 'DESG-MECH',
    title: 'Mechanical Tech',
    department: 'Maintenance',
    level: 'Mid-Level',
    grade: 'L3',
    status: 'Active',
    description: 'Replaces bearings, belts, seals, alignments, and lubricates mechanical drives.'
  }
];

export default function Designation() {
  const [designations, setDesignations] = useState(() => {
    try {
      const saved = localStorage.getItem('cmms_designations');
      return saved ? JSON.parse(saved) : DEFAULT_DESIGNATIONS;
    } catch {
      return DEFAULT_DESIGNATIONS;
    }
  });

  const [employees, setEmployees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    title: '',
    department: 'Maintenance',
    level: 'Mid-Level',
    grade: 'L3',
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
    level: 'Mid-Level',
    grade: 'L3',
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

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cmms_designations', JSON.stringify(designations));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [designations]);

  // Fetch employees to compute designation counts
  const fetchEmployeesData = async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch employees for designation metrics:', err.message);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployeesData();
    setTimeout(() => {
      setRefreshing(false);
      showToast('Designation data refreshed');
    }, 400);
  };

  // Map employee counts to designations
  const desgEmployeeCounts = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      const title = (emp.designation || '').trim();
      if (!counts[title]) {
        counts[title] = 0;
      }
      counts[title] += 1;
    });
    return counts;
  }, [employees]);

  // Filtered list
  const filteredDesignations = useMemo(() => {
    return designations.filter((desg) => {
      if (deptFilter !== 'all' && desg.department !== deptFilter) return false;
      if (levelFilter !== 'all' && desg.level !== levelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (desg.code || '').toLowerCase();
        const title = (desg.title || '').toLowerCase();
        const dept = (desg.department || '').toLowerCase();
        return code.includes(q) || title.includes(q) || dept.includes(q);
      }
      return true;
    });
  }, [designations, searchQuery, deptFilter, levelFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = designations.length;
    const engineering = designations.filter((d) => d.department === 'Maintenance' || d.department === 'Quality').length;
    const leads = designations.filter((d) => d.level === 'Lead / Supervisory' || d.level === 'Executive').length;
    const ops = designations.filter((d) => d.department === 'Production').length;
    return {
      total,
      engineering,
      leads,
      ops
    };
  }, [designations]);

  // Handle Add
  const handleOpenAdd = () => {
    setAddForm({
      code: `DESG-${String(designations.length + 1).padStart(2, '0')}`,
      title: '',
      department: 'Maintenance',
      level: 'Mid-Level',
      grade: 'L3',
      status: 'Active',
      description: ''
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      setAddError('Designation title is required');
      return;
    }
    if (!addForm.code.trim()) {
      setAddError('Designation code is required');
      return;
    }

    const exists = designations.some(
      (d) => d.code.toLowerCase() === addForm.code.trim().toLowerCase()
    );
    if (exists) {
      setAddError(`Designation code "${addForm.code}" already exists.`);
      return;
    }

    const newDesg = {
      id: `desg-${Date.now()}`,
      code: addForm.code.trim().toUpperCase(),
      title: addForm.title.trim(),
      department: addForm.department,
      level: addForm.level,
      grade: addForm.grade.trim() || 'L1',
      status: addForm.status,
      description: addForm.description.trim()
    };

    setDesignations((prev) => [...prev, newDesg]);
    setShowAddModal(false);
    showToast(`Designation "${newDesg.title}" added successfully`);
  };

  // Handle Edit
  const handleOpenEdit = (desg) => {
    setEditingDesg(desg);
    setEditForm({
      code: desg.code,
      title: desg.title,
      department: desg.department,
      level: desg.level,
      grade: desg.grade || 'L1',
      status: desg.status,
      description: desg.description || ''
    });
    setEditError('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setEditError('Designation title is required');
      return;
    }

    setDesignations((prev) =>
      prev.map((d) =>
        d.id === editingDesg.id
          ? {
              ...d,
              title: editForm.title.trim(),
              department: editForm.department,
              level: editForm.level,
              grade: editForm.grade.trim(),
              status: editForm.status,
              description: editForm.description.trim()
            }
          : d
      )
    );
    setEditingDesg(null);
    showToast(`Designation "${editForm.title}" updated successfully`);
  };

  // Handle Delete
  const handleDelete = (id) => {
    const target = designations.find((d) => d.id === id);
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
            Configure job designations, skill requirements, role bands, and organizational hierarchy.
          </p>
        </div>
        <div className="desg-header-actions">
          <button
            type="button"
            className="desg-btn-outline"
            onClick={handleRefresh}
            disabled={refreshing}
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

        {/* Card 3: Supervisory Roles */}
        <div className="desg-kpi-card">
          <div className="desg-kpi-info">
            <span className="desg-kpi-label">LEAD & SUPERVISORY</span>
            <span className="desg-kpi-val">{kpis.leads}</span>
          </div>
          <div className="desg-kpi-icon-box amber">
            <FiShield />
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
              <option value="Maintenance">Maintenance</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
              <option value="Safety">Safety</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <div className="desg-select-group">
            <label>Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="Executive">Executive</option>
              <option value="Lead / Supervisory">Lead / Supervisory</option>
              <option value="Senior">Senior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Junior / Entry">Junior / Entry</option>
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
              <th>ROLE LEVEL</th>
              <th>PAY GRADE</th>
              <th>ASSIGNED STAFF</th>
              <th>STATUS</th>
              <th className="th-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDesignations.length === 0 ? (
              <tr>
                <td colSpan="8" className="td-empty">
                  No designations found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredDesignations.map((desg) => {
                const assigned = desgEmployeeCounts[desg.title] || 0;
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
                      <span className={`level-badge level-${desg.level.toLowerCase().replace(/[^a-z]/g, '')}`}>
                        {desg.level}
                      </span>
                    </td>
                    <td>
                      <span className="grade-tag">{desg.grade}</span>
                    </td>
                    <td>
                      <span className="desg-staff-count">
                        <strong>{assigned}</strong> {assigned === 1 ? 'member' : 'members'}
                      </span>
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
                    <option value="Maintenance">Maintenance</option>
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Safety">Safety</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div className="desg-form-group">
                  <label>Hierarchy Level</label>
                  <select
                    value={addForm.level}
                    onChange={(e) => setAddForm({ ...addForm, level: e.target.value })}
                  >
                    <option value="Executive">Executive</option>
                    <option value="Lead / Supervisory">Lead / Supervisory</option>
                    <option value="Senior">Senior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Junior / Entry">Junior / Entry</option>
                  </select>
                </div>

                <div className="desg-form-group">
                  <label>Grade Band</label>
                  <input
                    type="text"
                    placeholder="e.g. L3"
                    value={addForm.grade}
                    onChange={(e) => setAddForm({ ...addForm, grade: e.target.value })}
                  />
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
                <button type="submit" className="desg-btn-primary">
                  Add Designation
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
                    <option value="Maintenance">Maintenance</option>
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Safety">Safety</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div className="desg-form-group">
                  <label>Hierarchy Level</label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  >
                    <option value="Executive">Executive</option>
                    <option value="Lead / Supervisory">Lead / Supervisory</option>
                    <option value="Senior">Senior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Junior / Entry">Junior / Entry</option>
                  </select>
                </div>

                <div className="desg-form-group">
                  <label>Grade Band</label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                  />
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
                <button type="submit" className="desg-btn-primary">
                  Save Changes
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

