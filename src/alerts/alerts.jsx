import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiBell,
  FiAlertTriangle,
  FiCheck,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiEye,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import alertService from '../services/alertService';
import machineService from '../services/machineService';
import './alerts.css';

// Formatter for DD/MM/YYYY hh:mm AM/PM matching user's screenshot
const formatDateTime = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, '0') : '12';
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    machineCode: '',
    alertType: 'Machine',
    priority: 'Warning',
    status: 'Open'
  });

  // View / Edit Modal State
  const [viewingAlert, setViewingAlert] = useState(null);
  const [viewEditForm, setViewEditForm] = useState({
    title: '',
    description: '',
    machineCode: '',
    alertType: 'Machine',
    priority: 'Warning',
    status: 'Open'
  });
  const [viewError, setViewError] = useState('');

  // Delete Confirmation State
  const [deleteConfirmAlert, setDeleteConfirmAlert] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch alerts from backend
  const fetchAlertsData = useCallback(async () => {
    try {
      const data = await alertService.getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to load alerts.');
      setAlerts([]);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertsData();
    machineService.getAllMachines()
      .then(setMachines)
      .catch((err) => setError(err.message || 'Failed to load machines.'));
  }, [fetchAlertsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const refreshed = await fetchAlertsData();
    setTimeout(() => {
      setRefreshing(false);
      if (refreshed) showToast('Alerts refreshed');
    }, 400);
  };

  // Live KPI Calculations matching screenshot
  const kpis = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter((a) => a.priority === 'Critical').length;
    const warnings = alerts.filter((a) => a.priority === 'Warning').length;
    const resolved = alerts.filter((a) => a.status === 'Resolved').length;
    return { total, critical, warnings, resolved };
  }, [alerts]);

  // Client-side search and filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (alertTypeFilter !== 'all' && alert.alertType !== alertTypeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && alert.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const alertId = (alert.alertId || '').toLowerCase();
        const title = (alert.title || '').toLowerCase();
        const description = (alert.description || '').toLowerCase();
        const machine = (alert.machineCode || '').toLowerCase();
        return (
          alertId.includes(q) ||
          title.includes(q) ||
          description.includes(q) ||
          machine.includes(q) ||
          (alert.spareCode || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, searchQuery, alertTypeFilter, statusFilter]);
  const alertPagination = usePagination(filteredAlerts);

  // Handle Create Alert
  const handleOpenCreate = () => {
    setCreateForm({
      title: '',
      description: '',
      machineCode: '',
      alertType: 'Machine',
      priority: 'Warning',
      status: 'Open'
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.machineCode.trim()) {
      setCreateError('Title, description and machine code are required.');
      return;
    }

    setIsSubmitting(true);
    setCreateError('');

    try {
      const newAlertPayload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        machineCode: createForm.machineCode.trim().toUpperCase(),
        alertType: createForm.alertType,
        priority: createForm.priority,
        status: createForm.status,
        dateTime: new Date()
      };

      await alertService.createAlert(newAlertPayload);
      await fetchAlertsData();
      setShowCreateModal(false);
      showToast('Alert created successfully!');
    } catch (err) {
      setCreateError(err.message || 'Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle View / Edit
  const handleOpenView = (alert) => {
    setViewingAlert(alert);
    setViewEditForm({
      title: alert.title || '',
      description: alert.description || '',
      machineCode: alert.machineCode || '',
      alertType: alert.alertType || 'Machine',
      priority: alert.priority || 'Warning',
      status: alert.status || 'Open'
    });
    setViewError('');
  };

  const handleSaveViewUpdate = async (e) => {
    e.preventDefault();
    if (!viewEditForm.title.trim() || !viewEditForm.description.trim()) {
      setViewError('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setViewError('');

    try {
      const updatedData = {
        title: viewEditForm.title.trim(),
        description: viewEditForm.description.trim(),
        machineCode: viewEditForm.machineCode.trim().toUpperCase(),
        alertType: viewEditForm.alertType,
        priority: viewEditForm.priority,
        status: viewEditForm.status
      };

      await alertService.updateAlert(viewingAlert._id, updatedData);
      await fetchAlertsData();
      setViewingAlert(null);
      showToast('Alert updated successfully');
    } catch (err) {
      setViewError(err.message || 'Failed to update alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Resolve Alert from View Modal
  const handleQuickResolve = async () => {
    if (!viewingAlert) return;
    setIsSubmitting(true);
    try {
      await alertService.updateAlert(viewingAlert._id, { status: 'Resolved' });
      await fetchAlertsData();
      setViewingAlert(null);
      showToast(`Alert ${viewingAlert.alertId} marked as Resolved`);
    } catch (err) {
      setViewError(err.message || 'Failed to resolve alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Alert
  const handleDeleteAlert = async (alert) => {
    try {
      await alertService.deleteAlert(alert._id);
      await fetchAlertsData();
    } catch (err) {
      setError(err.message || 'Failed to dismiss alert.');
      return;
    }

    setDeleteConfirmAlert(null);
    showToast(`Alert ${alert.alertId} removed`, 'danger');
  };

  return (
    <div className="alerts-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`alerts-toast ${toast.type}`}>
          {toast.type === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header matching screenshot */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <div className="alerts-title-row">
            <h1>Alerts</h1>
            <span className="alerts-badge-pill">{alerts.length} Total</span>
          </div>
          <p className="alerts-subtitle">
            Live alerts from machine status and linked spare stock, plus manually logged notifications.
          </p>
        </div>

        <div className="alerts-header-actions">
          <button
            type="button"
            className="alerts-btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className="alerts-btn-create" onClick={handleOpenCreate}>
            <FiPlus />
            <span>Create Alert</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Matching Screenshot */}
      <div className="alerts-kpi-grid">
        {/* Card 1: Total Alerts */}
        <div className="alerts-kpi-card total-card">
          <div className="alerts-kpi-info">
            <span className="alerts-kpi-label">TOTAL ALERTS</span>
            <span className="alerts-kpi-val">{kpis.total}</span>
          </div>
          <div className="alerts-kpi-icon-box blue">
            <FiBell />
          </div>
        </div>

        {/* Card 2: Critical */}
        <div className="alerts-kpi-card critical-card">
          <div className="alerts-kpi-info">
            <span className="alerts-kpi-label">CRITICAL</span>
            <span className="alerts-kpi-val">{kpis.critical}</span>
          </div>
          <div className="alerts-kpi-icon-box red">
            <FiAlertTriangle />
          </div>
        </div>

        {/* Card 3: Warnings */}
        <div className="alerts-kpi-card warning-card">
          <div className="alerts-kpi-info">
            <span className="alerts-kpi-label">WARNINGS</span>
            <span className="alerts-kpi-val">{kpis.warnings}</span>
          </div>
          <div className="alerts-kpi-icon-box amber">
            <FiAlertTriangle />
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="alerts-kpi-card resolved-card">
          <div className="alerts-kpi-info">
            <span className="alerts-kpi-label">RESOLVED</span>
            <span className="alerts-kpi-val">{kpis.resolved}</span>
          </div>
          <div className="alerts-kpi-icon-box green">
            <FiCheck />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Matching Screenshot */}
      <div className="alerts-filter-bar">
        <div className="alerts-search-box">
          <FiSearch className="alerts-search-icon" />
          <input
            type="text"
            placeholder="Search alert, machine, employee, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="alerts-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="alerts-filter-dropdowns">
          <div className="alerts-select-group">
            <label>Alert Type:</label>
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
            >
              <option value="all">All Alert Types</option>
              <option value="Machine">Machine</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Spare Parts">Spare Parts</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="alerts-select-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alerts-modal-error" role="alert">{error}</div>}

      {/* Data Table Matching Screenshot */}
      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>ALERT ID</th>
              <th>ALERT DETAILS</th>
              <th>MACHINE</th>
              <th>DATE & TIME</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th className="th-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="td-empty">Loading live alerts...</td>
              </tr>
            ) : filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="7" className="td-empty">
                  No alerts found matching your filters.
                </td>
              </tr>
            ) : (
              alertPagination.pageItems.map((alert) => {
                const priorityClass = (alert.priority || 'Info').toLowerCase();
                const statusClass = (alert.status || 'Open').toLowerCase();

                return (
                  <tr key={alert._id || alert.alertId}>
                    {/* ALERT ID */}
                    <td>
                      <span className="alert-id-chip">{alert.alertId}</span>
                    </td>

                    {/* ALERT DETAILS */}
                    <td>
                      <div className="alert-details-cell">
                        <span className="alert-detail-title">{alert.title}</span>
                        <span className="alert-detail-desc">{alert.description}</span>
                      </div>
                    </td>

                    {/* MACHINE */}
                    <td>
                      <span className="alert-machine-chip">{alert.machineCode || '—'}</span>
                    </td>

                    {/* DATE & TIME */}
                    <td>
                      <div className="alert-datetime-cell">
                        <FiCalendar className="alert-cal-icon" />
                        <span>{formatDateTime(alert.dateTime)}</span>
                      </div>
                    </td>

                    {/* PRIORITY */}
                    <td>
                      <span className={`priority-pill ${priorityClass}`}>
                        <span className="pill-dot"></span>
                        {alert.priority}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        <span className="pill-dot"></span>
                        {alert.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      {alert.source ? (
                        <span className="alert-source-label">Live</span>
                      ) : (
                        <div className="alert-actions-group">
                          <button
                            type="button"
                            className="alert-action-btn view"
                            onClick={() => handleOpenView(alert)}
                            title="View / Edit Alert"
                          >
                            <FiEye />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="alert-action-btn delete"
                            onClick={() => setDeleteConfirmAlert(alert)}
                            title="Dismiss / Delete Alert"
                          >
                            <FiX />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <Pagination
          totalItems={filteredAlerts.length}
          currentPage={alertPagination.currentPage}
          totalPages={alertPagination.totalPages}
          onPageChange={alertPagination.setCurrentPage}
        />
      )}

      {/* CREATE ALERT MODAL */}
      {showCreateModal && (
        <div className="alerts-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="alerts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h2>Create New Alert</h2>
              <button
                type="button"
                className="alerts-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <FiX />
              </button>
            </div>

            {createError && <div className="alerts-modal-error">{createError}</div>}

            <form onSubmit={handleSaveCreate}>
              <div className="alerts-modal-grid">
                <div className="alerts-form-group full-width">
                  <label>Alert Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hydraulic pressure below limit"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>

                <div className="alerts-form-group full-width">
                  <label>Description *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Detailed explanation of machine condition or inspection notice..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div className="alerts-form-group">
                  <label>Machine *</label>
                  <select
                    required
                    value={createForm.machineCode}
                    onChange={(e) => setCreateForm({ ...createForm, machineCode: e.target.value })}
                  >
                    <option value="">Select a machine</option>
                    {machines.map((machine) => (
                      <option key={machine._id} value={machine.code}>
                        {machine.code} - {machine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="alerts-form-group">
                  <label>Alert Type *</label>
                  <select
                    value={createForm.alertType}
                    onChange={(e) => setCreateForm({ ...createForm, alertType: e.target.value })}
                  >
                    <option value="Machine">Machine</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="alerts-form-group">
                  <label>Priority *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                  </select>
                </div>

                <div className="alerts-form-group">
                  <label>Initial Status *</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="alerts-modal-footer">
                <button
                  type="button"
                  className="alerts-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="alerts-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & EDIT ALERT MODAL */}
      {viewingAlert && (
        <div className="alerts-modal-backdrop" onClick={() => setViewingAlert(null)}>
          <div className="alerts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <div className="modal-title-with-chip">
                <h2>Alert Details</h2>
                <span className="alert-id-chip">{viewingAlert.alertId}</span>
              </div>
              <button
                type="button"
                className="alerts-modal-close"
                onClick={() => setViewingAlert(null)}
              >
                <FiX />
              </button>
            </div>

            {viewError && <div className="alerts-modal-error">{viewError}</div>}

            <form onSubmit={handleSaveViewUpdate}>
              <div className="alerts-modal-grid">
                <div className="alerts-form-group">
                  <label>Machine Code</label>
                  <select
                    required
                    value={viewEditForm.machineCode}
                    onChange={(e) =>
                      setViewEditForm({ ...viewEditForm, machineCode: e.target.value })
                    }
                  >
                    <option value="">Select a machine</option>
                    {machines.map((machine) => (
                      <option key={machine._id} value={machine.code}>
                        {machine.code} - {machine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="alerts-form-group">
                  <label>Timestamp</label>
                  <input
                    type="text"
                    disabled
                    value={formatDateTime(viewingAlert.dateTime)}
                    className="input-disabled"
                  />
                </div>

                <div className="alerts-form-group full-width">
                  <label>Alert Title</label>
                  <input
                    type="text"
                    required
                    value={viewEditForm.title}
                    onChange={(e) => setViewEditForm({ ...viewEditForm, title: e.target.value })}
                  />
                </div>

                <div className="alerts-form-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    required
                    value={viewEditForm.description}
                    onChange={(e) =>
                      setViewEditForm({ ...viewEditForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="alerts-form-group">
                  <label>Alert Type</label>
                  <select
                    value={viewEditForm.alertType}
                    onChange={(e) =>
                      setViewEditForm({ ...viewEditForm, alertType: e.target.value })
                    }
                  >
                    <option value="Machine">Machine</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="alerts-form-group">
                  <label>Priority</label>
                  <select
                    value={viewEditForm.priority}
                    onChange={(e) =>
                      setViewEditForm({ ...viewEditForm, priority: e.target.value })
                    }
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                  </select>
                </div>

                <div className="alerts-form-group full-width">
                  <label>Current Status</label>
                  <select
                    value={viewEditForm.status}
                    onChange={(e) =>
                      setViewEditForm({ ...viewEditForm, status: e.target.value })
                    }
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="alerts-modal-footer between">
                <div>
                  {viewEditForm.status !== 'Resolved' && (
                    <button
                      type="button"
                      className="alerts-btn-resolve"
                      onClick={handleQuickResolve}
                    >
                      <FiCheckCircle />
                      <span>Mark as Resolved</span>
                    </button>
                  )}
                </div>
                <div className="modal-right-actions">
                  <button
                    type="button"
                    className="alerts-btn-outline"
                    onClick={() => setViewingAlert(null)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="alerts-btn-primary"
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmAlert && (
        <div className="alerts-modal-backdrop" onClick={() => setDeleteConfirmAlert(null)}>
          <div className="alerts-modal-card delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-box">
              <FiAlertTriangle />
            </div>
            <h3>Dismiss Alert?</h3>
            <p>
              Are you sure you want to dismiss alert{' '}
              <strong>{deleteConfirmAlert.alertId}</strong> ({deleteConfirmAlert.title})?
            </p>
            <div className="alerts-modal-footer center">
              <button
                type="button"
                className="alerts-btn-outline"
                onClick={() => setDeleteConfirmAlert(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="alerts-btn-danger"
                onClick={() => handleDeleteAlert(deleteConfirmAlert)}
              >
                Yes, Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

