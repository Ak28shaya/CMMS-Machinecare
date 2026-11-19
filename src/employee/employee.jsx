import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiUsers,
  FiPlay,
  FiCalendar,
  FiUserX,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiX,
  FiCheck,
  FiAlertTriangle
} from 'react-icons/fi';
import employeeService from '../services/employeeService';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import './employee.css';

// Helper for DD/MM/YYYY matching screenshot format
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [editingEmp, setEditingEmp] = useState(null);
  const [editForm, setEditForm] = useState({
    employeeId: '',
    name: '',
    department: 'Maintenance',
    designation: '',
    email: '',
    phone: '',
    status: 'Active',
    joiningDate: ''
  });
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Form for New Employee
  const [newEmpForm, setNewEmpForm] = useState({
    employeeId: '',
    name: '',
    department: 'Maintenance',
    designation: '',
    email: '',
    phone: '',
    status: 'Active',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  // Fetch all employees and stats
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [empList, statsRes] = await Promise.all([
        employeeService.getEmployees(),
        employeeService.getEmployeeStats()
      ]);

      setEmployees(empList || []);
      setStats(statsRes || null);
    } catch (err) {
      setError(err.message || 'Failed to load employees data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived KPI metrics
  const metrics = useMemo(() => {
    const total = employees.length;
    let active = 0;
    let onLeave = 0;
    let inactive = 0;

    employees.forEach((emp) => {
      if (emp.status === 'Active') active++;
      else if (emp.status === 'On Leave') onLeave++;
      else if (emp.status === 'Inactive') inactive++;
    });

    return {
      total: stats?.total ?? total,
      active: stats?.active ?? active,
      onLeave: stats?.onLeave ?? onLeave,
      inactive: stats?.inactive ?? inactive
    };
  }, [employees, stats]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return employees.filter((emp) => {
      const id = (emp.employeeId || '').toLowerCase();
      const name = (emp.name || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();

      const matchesSearch =
        !q ||
        id.includes(q) ||
        name.includes(q) ||
        dept.includes(q) ||
        desig.includes(q) ||
        email.includes(q);

      if (!matchesSearch) return false;

      if (departmentFilter !== 'all' && emp.department !== departmentFilter) {
        return false;
      }

      if (statusFilter !== 'all' && emp.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);
  const employeePagination = usePagination(filteredEmployees);

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditError('');
    let dateStr = '';
    if (emp.joiningDate) {
      const d = new Date(emp.joiningDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0];
      }
    }

    setEditForm({
      employeeId: emp.employeeId || '',
      name: emp.name || '',
      department: emp.department || 'Maintenance',
      designation: emp.designation || '',
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || 'Active',
      joiningDate: dateStr
    });

    setEditingEmp(emp);
  };

  // Submit Edit Employee
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('Employee Name is required');
      return;
    }
    if (!editForm.employeeId.trim()) {
      setEditError('Employee ID is required');
      return;
    }

    setIsSavingEdit(true);
    try {
      await employeeService.updateEmployee(editingEmp._id, {
        ...editForm,
        employeeId: editForm.employeeId.trim().toUpperCase(),
        name: editForm.name.trim()
      });

      await fetchData();
      showToast(`Employee "${editForm.name}" updated successfully!`, 'success');
      setEditingEmp(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update employee');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete employee "${emp.name}" (${emp.employeeId})?`
    );
    if (!confirmed) return;

    try {
      await employeeService.deleteEmployee(emp._id);
      await fetchData();
      showToast(`Employee "${emp.name}" deleted successfully!`, 'success');
      if (editingEmp?._id === emp._id) {
        setEditingEmp(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete employee', 'error');
    }
  };

  // Create New Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newEmpForm.name.trim()) {
      setAddError('Employee Name is required');
      return;
    }
    if (!newEmpForm.employeeId.trim()) {
      setAddError('Employee ID is required (e.g. EMP-025)');
      return;
    }
    if (!newEmpForm.email.trim()) {
      setAddError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await employeeService.createEmployee({
        ...newEmpForm,
        employeeId: newEmpForm.employeeId.trim().toUpperCase(),
        name: newEmpForm.name.trim(),
        email: newEmpForm.email.trim().toLowerCase()
      });

      await fetchData();
      showToast(`Employee "${created.name}" registered successfully!`, 'success');
      setShowAddModal(false);
      setNewEmpForm({
        employeeId: '',
        name: '',
        department: 'Maintenance',
        designation: '',
        email: '',
        phone: '',
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setAddError(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="employees-view-wrapper">
      {/* 1. Header Row */}
      <div className="employees-header-row">
        <div>
          <div className="employees-title-badge-group">
            <h1 className="employees-page-title">Employees</h1>
            <span className="employees-total-pill">{metrics.total} Total</span>
          </div>
          <p className="employees-page-subtitle">
            Manage employee details, roles, assignments, and access to the system.
          </p>
        </div>

        <div className="employees-header-actions">
          <button
            type="button"
            className="employees-refresh-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh employees data"
          >
            <FiRefreshCw className={refreshing ? 'spinning-icon' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="employees-add-btn"
            onClick={() => {
              setAddError('');
              // Suggest next ID based on length
              const nextNum = employees.length + 1;
              const autoId = `EMP-${String(nextNum).padStart(3, '0')}`;
              setNewEmpForm((prev) => ({
                ...prev,
                employeeId: prev.employeeId || autoId
              }));
              setShowAddModal(true);
            }}
          >
            <FiPlus aria-hidden="true" />
            <span> Add Employee</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Summary Cards Grid */}
      <div className="employees-kpi-grid">
        {/* Card 1: TOTAL EMPLOYEES */}
        <div className="emp-kpi-card emp-kpi-total">
          <div className="emp-kpi-text-col">
            <span className="emp-kpi-label">TOTAL EMPLOYEES</span>
            <span className="emp-kpi-value">{metrics.total}</span>
          </div>
          <div className="emp-kpi-icon-box blue">
            <FiUsers aria-hidden="true" />
          </div>
        </div>

        {/* Card 2: ACTIVE EMPLOYEES */}
        <div className="emp-kpi-card emp-kpi-active">
          <div className="emp-kpi-text-col">
            <span className="emp-kpi-label">ACTIVE EMPLOYEES</span>
            <div className="emp-kpi-value-row">
              <span className="emp-kpi-value">{metrics.active}</span>
              <span className="emp-live-dot" title="Active">●</span>
            </div>
          </div>
          <div className="emp-kpi-icon-box green">
            <FiPlay aria-hidden="true" style={{ transform: 'translateX(1px)' }} />
          </div>
        </div>

        {/* Card 3: ON LEAVE */}
        <div className="emp-kpi-card emp-kpi-onleave">
          <div className="emp-kpi-text-col">
            <span className="emp-kpi-label">ON LEAVE</span>
            <span className="emp-kpi-value">{metrics.onLeave}</span>
          </div>
          <div className="emp-kpi-icon-box amber">
            <FiCalendar aria-hidden="true" />
          </div>
        </div>

        {/* Card 4: INACTIVE EMPLOYEES */}
        <div className="emp-kpi-card emp-kpi-inactive">
          <div className="emp-kpi-text-col">
            <span className="emp-kpi-label">INACTIVE EMPLOYEES</span>
            <span className="emp-kpi-value">{metrics.inactive}</span>
          </div>
          <div className="emp-kpi-icon-box red">
            <FiUserX aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="employees-toolbar-card">
        <div className="search-box-wrap">
          <FiSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="employees-search-input"
            placeholder="Search by employee ID, name, department, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filters-group">
          <div className="filter-item-wrap">
            <label htmlFor="emp-dept-filter">Department:</label>
            <select
              id="emp-dept-filter"
              className="emp-filter-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item-wrap">
            <label htmlFor="emp-status-filter">Status:</label>
            <select
              id="emp-status-filter"
              className="emp-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && <div className="employees-error-banner">{error}</div>}

      {/* 4. Employees Table Card */}
      <div className="employees-card">
        <div className="employees-table-responsive">
          <table className="employees-table">
            <thead>
              <tr>
                <th style={{ minWidth: '130px' }}>EMPLOYEE ID</th>
                <th style={{ minWidth: '170px' }}>EMPLOYEE NAME</th>
                <th style={{ minWidth: '150px' }}>DEPARTMENT</th>
                <th style={{ minWidth: '180px' }}>DESIGNATION</th>
                <th style={{ minWidth: '110px' }}>STATUS</th>
                <th style={{ minWidth: '130px' }}>JOINING DATE</th>
                <th style={{ minWidth: '110px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-state-cell">
                    Loading employees directory from database...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-state-cell">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                employeePagination.pageItems.map((emp) => {
                  const statusClass =
                    emp.status === 'Active'
                      ? 'active'
                      : emp.status === 'On Leave'
                      ? 'onleave'
                      : 'inactive';

                  return (
                    <tr key={emp._id}>
                      {/* EMPLOYEE ID */}
                      <td>
                        <span className="emp-id-badge">{emp.employeeId}</span>
                      </td>

                      {/* EMPLOYEE NAME */}
                      <td>
                        <span className="emp-name-text">{emp.name}</span>
                      </td>

                      {/* DEPARTMENT */}
                      <td>
                        <div className="emp-dept-cell">
                          <FiBriefcase className="dept-icon" aria-hidden="true" />
                          <span>{emp.department}</span>
                        </div>
                      </td>

                      {/* DESIGNATION */}
                      <td>
                        <span className="emp-designation-text">{emp.designation}</span>
                      </td>

                      {/* STATUS PILL */}
                      <td>
                        <span className={`emp-status-pill ${statusClass}`}>
                          <span className="dot-indicator">●</span> {emp.status}
                        </span>
                      </td>

                      {/* JOINING DATE */}
                      <td>
                        <div className="emp-date-cell">
                          <FiCalendar className="date-icon" aria-hidden="true" />
                          <span>{formatDate(emp.joiningDate)}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="emp-actions-inline">
                          <button
                            type="button"
                            className="emp-btn-edit"
                            onClick={() => handleOpenEdit(emp)}
                            title={`Edit ${emp.name}`}
                          >
                            <FiEdit2 aria-hidden="true" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="emp-btn-delete"
                            onClick={() => handleDeleteEmployee(emp)}
                            title={`Delete ${emp.name}`}
                          >
                            <FiTrash2 aria-hidden="true" />
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
          totalItems={filteredEmployees.length}
          currentPage={employeePagination.currentPage}
          totalPages={employeePagination.totalPages}
          onPageChange={employeePagination.setCurrentPage}
        />
      </div>

      {/* =========================================================================
          MODALS / DIALOGS
          ========================================================================= */}

      {/* MODAL 1: Add New Employee Modal */}
      {showAddModal && (
        <div
          className="emp-modal-overlay"
          onClick={(e) => e.target.classList.contains('emp-modal-overlay') && setShowAddModal(false)}
        >
          <div className="emp-modal-dialog" role="dialog" aria-modal="true" aria-label="Add New Employee">
            <div className="emp-modal-header">
              <div>
                <h3>Add New Employee</h3>
                <p className="emp-modal-subheading">Register employee profile, department role, and status.</p>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {addError && <div className="emp-modal-error">{addError}</div>}

            <form onSubmit={handleCreateEmployee} className="emp-modal-form">
              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="new-emp-id">Employee ID *</label>
                  <input
                    id="new-emp-id"
                    type="text"
                    placeholder="e.g. EMP-025"
                    value={newEmpForm.employeeId}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, employeeId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-emp-name">Full Name *</label>
                  <input
                    id="new-emp-name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newEmpForm.name}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="new-emp-dept">Department *</label>
                  <select
                    id="new-emp-dept"
                    value={newEmpForm.department}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                    required
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Safety">Safety</option>
                    <option value="Management">Management</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-emp-desig">Designation *</label>
                  <input
                    id="new-emp-desig"
                    type="text"
                    placeholder="e.g. Technician / Engineer"
                    value={newEmpForm.designation}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="new-emp-email">Email Address *</label>
                  <input
                    id="new-emp-email"
                    type="email"
                    placeholder="e.g. rahul@machinecare.io"
                    value={newEmpForm.email}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-emp-phone">Phone Number *</label>
                  <input
                    id="new-emp-phone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={newEmpForm.phone}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="new-emp-status">Status</label>
                  <select
                    id="new-emp-status"
                    value={newEmpForm.status}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-emp-date">Joining Date *</label>
                  <input
                    id="new-emp-date"
                    type="date"
                    value={newEmpForm.joiningDate}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, joiningDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-modal-actions">
                <button
                  type="button"
                  className="emp-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="emp-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Employee Modal */}
      {editingEmp && (
        <div
          className="emp-modal-overlay"
          onClick={(e) => e.target.classList.contains('emp-modal-overlay') && setEditingEmp(null)}
        >
          <div className="emp-modal-dialog" role="dialog" aria-modal="true" aria-label="Edit Employee">
            <div className="emp-modal-header">
              <div>
                <div className="emp-modal-title-row">
                  <h3>Edit Employee</h3>
                  <span className="emp-id-badge">{editingEmp.employeeId}</span>
                </div>
                <p className="emp-modal-subheading">Update role, department, status, or contact details.</p>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setEditingEmp(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {editError && <div className="emp-modal-error">{editError}</div>}

            <form onSubmit={handleSaveEdit} className="emp-modal-form">
              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="edit-emp-id">Employee ID *</label>
                  <input
                    id="edit-emp-id"
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-emp-name">Full Name *</label>
                  <input
                    id="edit-emp-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="edit-emp-dept">Department *</label>
                  <select
                    id="edit-emp-dept"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    required
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Safety">Safety</option>
                    <option value="Management">Management</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-emp-desig">Designation *</label>
                  <input
                    id="edit-emp-desig"
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="edit-emp-email">Email Address *</label>
                  <input
                    id="edit-emp-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-emp-phone">Phone Number *</label>
                  <input
                    id="edit-emp-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-grid-two">
                <div>
                  <label htmlFor="edit-emp-status">Status</label>
                  <select
                    id="edit-emp-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-emp-date">Joining Date *</label>
                  <input
                    id="edit-emp-date"
                    type="date"
                    value={editForm.joiningDate}
                    onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="emp-modal-actions">
                <button
                  type="button"
                  className="emp-btn-cancel"
                  onClick={() => setEditingEmp(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="emp-btn-submit"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {toast && (
        <div className={`emp-toast ${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheck /> : <FiAlertTriangle />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

