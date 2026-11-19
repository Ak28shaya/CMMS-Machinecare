import { useState, useEffect, useMemo } from 'react';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import machineService from '../services/machineService';
import spareService from '../services/spareService';
import employeeService from '../services/employeeService';
import './machines.css';

function Machines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [spareOptions, setSpareOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedSpareIds, setSelectedSpareIds] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loadingSpareOptions, setLoadingSpareOptions] = useState(false);
  const [spareOptionsError, setSpareOptionsError] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    status: 'Running',
  });

  // Fetch machines from backend
  const fetchMachines = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await machineService.getAllMachines();
      setMachines(data);
    } catch (err) {
      setError(err.message || 'Failed to load machines from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  // Compute live KPIs
  const kpis = useMemo(() => {
    const total = machines.length;
    const running = machines.filter((m) => m.status === 'Running').length;
    const maintenance = machines.filter((m) => m.status === 'Under maintenance').length;
    const stopped = machines.filter((m) => m.status === 'Stopped').length;
    return { total, running, maintenance, stopped };
  }, [machines]);

  // Extract unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    machines.forEach((m) => {
      if (m.location) locs.add(m.location.trim());
    });
    return Array.from(locs).sort();
  }, [machines]);

  // Filtered and searched machines
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const matchesSearch =
        searchTerm === '' ||
        machine.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.assignedEmployees?.some((employee) =>
          employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === 'ALL' || machine.status === statusFilter;

      const matchesLocation =
        locationFilter === 'ALL' || machine.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [machines, searchTerm, statusFilter, locationFilter]);
  const machinePagination = usePagination(filteredMachines);

  // Open Modal for Add
  const handleOpenAddModal = async () => {
    setEditingMachine(null);
    setFormData({
      code: '',
      name: '',
      location: '',
      status: 'Running',
    });
    setSpareOptions([]);
    setEmployeeOptions([]);
    setSelectedSpareIds([]);
    setSelectedEmployeeIds([]);
    setSpareOptionsError(false);
    setModalError('');
    setIsModalOpen(true);
    setLoadingSpareOptions(true);
    try {
      const [spares, employees] = await Promise.all([
        spareService.getSpares({ limit: 200 }),
        employeeService.getEmployees({ status: 'Active' })
      ]);
      setSpareOptions(spares);
      setEmployeeOptions(employees);
    } catch (err) {
      setSpareOptionsError(true);
      setModalError(err.message || 'Failed to load spare parts.');
    } finally {
      setLoadingSpareOptions(false);
    }
  };

  // Open Modal for Edit
  const handleOpenEditModal = async (machine) => {
    setEditingMachine(machine);
    setFormData({
      code: machine.code || '',
      name: machine.name || '',
      location: machine.location || '',
      status: machine.status || 'Running',
    });
    setSpareOptions([]);
    setEmployeeOptions([]);
    setSelectedSpareIds([]);
    setSelectedEmployeeIds([]);
    setSpareOptionsError(false);
    setModalError('');
    setIsModalOpen(true);
    setLoadingSpareOptions(true);
    try {
      const [spares, mappings, employees] = await Promise.all([
        spareService.getSpares({ limit: 200 }),
        spareService.getMachineSpares(machine._id),
        employeeService.getEmployees({ status: 'Active' })
      ]);
      const mappedSpares = mappings
        .map((mapping) => mapping.spare)
        .filter((spare) => spare && typeof spare === 'object');
      const optionsById = new Map(spares.map((spare) => [String(spare._id), spare]));
      mappedSpares.forEach((spare) => optionsById.set(String(spare._id), spare));
      setSpareOptions(Array.from(optionsById.values()));
      setSelectedSpareIds(mappedSpares.map((spare) => String(spare._id)));
      setEmployeeOptions(employees);
      const activeEmployeeIds = new Set(employees.map((employee) => String(employee._id)));
      setSelectedEmployeeIds(
        (machine.assignedEmployees || [])
          .filter((employee) => employee && activeEmployeeIds.has(String(employee._id)))
          .map((employee) => String(employee._id))
      );
    } catch (err) {
      setSpareOptionsError(true);
      setModalError(err.message || 'Failed to load machine spare parts.');
    } finally {
      setLoadingSpareOptions(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
    setModalError('');
    setSpareOptions([]);
    setEmployeeOptions([]);
    setSelectedSpareIds([]);
    setSelectedEmployeeIds([]);
    setSpareOptionsError(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
  };

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.code.trim() || !formData.name.trim() || !formData.location.trim()) {
      setModalError('Code, name, and location are required fields.');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      status: formData.status,
      spares: selectedSpareIds.length,
      spareIds: selectedSpareIds,
      assignedEmployees: selectedEmployeeIds
    };

    setModalLoading(true);

    try {
      if (editingMachine) {
        // Update Machine
        const updated = await machineService.updateMachine(editingMachine._id, payload);
        setMachines((prev) =>
          prev.map((m) => (m._id === editingMachine._id ? updated : m))
        );
      } else {
        // Create Machine
        const created = await machineService.createMachine(payload);
        setMachines((prev) => [created, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await machineService.deleteMachine(id);
      setMachines((prev) => prev.filter((m) => m._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="machines-page">
      {/* Top Page Header */}
      <div className="machines-header">
        <div className="header-text">
          <div className="title-row">
            <h1>Machines & Equipment</h1>
            <span className="total-badge">{machines.length} Total</span>
          </div>
          <p className="subtitle">
            Manage asset lifecycle, monitor live status, spares, and assigned technician teams.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="refresh-btn"
            onClick={fetchMachines}
            title="Refresh machines from database"
            disabled={loading}
          >
            <svg
              className={`refresh-icon ${loading ? 'spinning' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="add-machine-btn"
            onClick={handleOpenAddModal}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Machine</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-info">
            <span className="kpi-label">Total Machines</span>
            <span className="kpi-val">{kpis.total}</span>
          </div>
          <div className="kpi-icon-wrap total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>

        <div className="kpi-card running">
          <div className="kpi-info">
            <span className="kpi-label">Running</span>
            <div className="kpi-val-row">
              <span className="kpi-val">{kpis.running}</span>
              <span className="live-dot" />
            </div>
          </div>
          <div className="kpi-icon-wrap running">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        <div className="kpi-card maintenance">
          <div className="kpi-info">
            <span className="kpi-label">Under Maintenance</span>
            <span className="kpi-val">{kpis.maintenance}</span>
          </div>
          <div className="kpi-icon-wrap maintenance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
        </div>

        <div className="kpi-card stopped">
          <div className="kpi-info">
            <span className="kpi-label">Stopped</span>
            <span className="kpi-val">{kpis.stopped}</span>
          </div>
          <div className="kpi-icon-wrap stopped">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <rect x="9" y="9" width="6" height="6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search code, machine name, location, or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <div className="dropdown-filters">
          {/* Status Filter */}
          <div className="select-wrap">
            <label htmlFor="filter-status">Status:</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Running">Running</option>
              <option value="Under maintenance">Under Maintenance</option>
              <option value="Stopped">Stopped</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="select-wrap">
            <label htmlFor="filter-location">Location:</label>
            <select
              id="filter-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="ALL">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="machines-error-banner" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="error-text">
            <strong>Error connecting to Backend:</strong> {error}
          </div>
          <button className="retry-btn" onClick={fetchMachines}>
            Retry
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="table-container-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="table-spinner" />
            <p>Loading machines from database...</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3>No Machines Found</h3>
            <p>
              {searchTerm || statusFilter !== 'ALL' || locationFilter !== 'ALL'
                ? 'No equipment matches your current filters. Try resetting the filters.'
                : 'There are no machines in the database yet. Click below to add your first machine.'}
            </p>
            {searchTerm || statusFilter !== 'ALL' || locationFilter !== 'ALL' ? (
              <button
                className="reset-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setLocationFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            ) : (
              <button className="add-machine-btn" onClick={handleOpenAddModal}>
                + Add Your First Machine
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="machines-table">
              <thead>
                <tr>
                  <th>Machine Code</th>
                  <th>Machine Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Spares</th>
                  <th>Handled By</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {machinePagination.pageItems.map((machine) => {
                  const statusKey = machine.status?.toLowerCase().replace(/\s+/g, '-') || 'running';

                  return (
                    <tr key={machine._id}>
                      {/* Machine Code */}
                      <td>
                        <span className="code-badge" title="Unique Machine Code">
                          {machine.code}
                        </span>
                      </td>

                      {/* Machine Name */}
                      <td>
                        <div className="name-cell">
                          <span className="machine-name">{machine.name}</span>
                          <span className="created-date">
                            Added: {new Date(machine.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div className="location-cell">
                          <svg
                            className="loc-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{machine.location}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill status-${statusKey}`}>
                          <span className="status-dot-indicator" />
                          {machine.status}
                        </span>
                      </td>

                      {/* Spares Count */}
                      <td>
                        <span className="spares-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                          {machine.spares || 0} spares
                        </span>
                      </td>

                      {/* Handled By (Technicians) */}
                      <td>
                        <div className="handled-by-cell">
                          {Array.isArray(machine.assignedEmployees) && machine.assignedEmployees.length > 0 ? (
                            machine.assignedEmployees.filter(Boolean).map((employee) => (
                              <span
                                key={employee._id}
                                className="tech-chip"
                                title={`${employee.employeeId} - ${employee.designation || 'Employee'}`}
                              >
                                {employee.name}
                              </span>
                            ))
                          ) : (
                            <span className="unassigned-text">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="actions-cell">
                        {deleteConfirmId === machine._id ? (
                          <div className="delete-confirm-box">
                            <span className="confirm-text">Delete?</span>
                            <button
                              type="button"
                              className="confirm-yes-btn"
                              onClick={() => handleDelete(machine._id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="confirm-no-btn"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button
                              type="button"
                              className="edit-action-btn"
                              onClick={() => handleOpenEditModal(machine)}
                              title="Edit machine"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="delete-action-btn"
                              onClick={() => setDeleteConfirmId(machine._id)}
                              title="Delete machine"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination
            totalItems={filteredMachines.length}
            currentPage={machinePagination.currentPage}
            totalPages={machinePagination.totalPages}
            onPageChange={machinePagination.setCurrentPage}
          />
        )}
      </div>

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{editingMachine ? 'Edit Machine Details' : 'Add New Machine'}</h3>
                <p className="modal-sub">
                  {editingMachine
                    ? `Updating parameters for ${editingMachine.code}`
                    : 'Enter equipment metadata according to plant asset schema'}
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            {modalError && (
              <div className="modal-alert-error" role="alert">
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Row 1: Code and Name */}
              <div className="form-row two-cols">
                <div className="form-group">
                  <label htmlFor="m-code">
                    Machine Code <span className="req">*</span>
                  </label>
                  <input
                    id="m-code"
                    type="text"
                    name="code"
                    placeholder="e.g. CNC-101"
                    value={formData.code}
                    onChange={handleFormChange}
                    disabled={modalLoading}
                    required
                  />
                  <small className="field-hint">Unique identifier (auto-uppercased)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="m-name">
                    Machine Name <span className="req">*</span>
                  </label>
                  <input
                    id="m-name"
                    type="text"
                    name="name"
                    placeholder="e.g. 5-Axis CNC Milling Center"
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={modalLoading}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Location and Status */}
              <div className="form-row two-cols">
                <div className="form-group">
                  <label htmlFor="m-location">
                    Location / Work Center <span className="req">*</span>
                  </label>
                  <input
                    id="m-location"
                    type="text"
                    name="location"
                    placeholder="e.g. Shop Floor - Bay 2"
                    value={formData.location}
                    onChange={handleFormChange}
                    disabled={modalLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="m-status">
                    Operating Status <span className="req">*</span>
                  </label>
                  <select
                    id="m-status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={modalLoading}
                  >
                    <option value="Running">Running</option>
                    <option value="Under maintenance">Under maintenance</option>
                    <option value="Stopped">Stopped</option>
                  </select>
                </div>
              </div>

              <div className="form-group machine-spares-picker">
                <div className="machine-spares-heading">
                  <label>Compatible Spare Parts</label>
                  <span>{selectedSpareIds.length} selected</span>
                </div>
                {selectedSpareIds.length > 0 && (
                  <div className="selected-spare-list" aria-label="Selected spare parts">
                    {selectedSpareIds.map((spareId) => {
                      const spare = spareOptions.find((item) => String(item._id) === spareId);
                      return spare ? (
                        <span className="selected-spare-chip" key={spareId}>
                          <b>{spare.code || spare.partCode}</b>
                          <span>{spare.name || spare.partName}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="machine-spare-options">
                  {loadingSpareOptions ? (
                    <span className="field-hint">Loading spare parts…</span>
                  ) : spareOptions.length === 0 ? (
                    <span className="field-hint">No active spare parts are available.</span>
                  ) : (
                    spareOptions.map((spare) => {
                      const spareId = String(spare._id);
                      const isSelected = selectedSpareIds.includes(spareId);
                      return (
                        <label className="machine-spare-option" key={spareId}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={modalLoading || loadingSpareOptions}
                            onChange={(event) => {
                              setSelectedSpareIds((current) =>
                                event.target.checked
                                  ? [...current, spareId]
                                  : current.filter((id) => id !== spareId)
                              );
                            }}
                          />
                          <span className="machine-spare-option-text">
                            <b>{spare.code || spare.partCode}</b>
                            <span>
                              {spare.name || spare.partName}
                              {spare.isActive === false ? ' (inactive)' : ''}
                            </span>
                          </span>
                          <span className="machine-spare-stock">
                            Stock: {spare.stock ?? 0}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <small className="field-hint">Select the spare parts compatible with this machine.</small>
              </div>

              <div className="form-group">
                <label htmlFor="m-assignedEmployees">Assigned Employees</label>
                <select
                  id="m-assignedEmployees"
                  multiple
                  value={selectedEmployeeIds}
                  onChange={(e) =>
                    setSelectedEmployeeIds(
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                  disabled={modalLoading}
                >
                  {employeeOptions.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.employeeId} - {employee.name} ({employee.designation})
                    </option>
                  ))}
                </select>
                <small className="field-hint">
                  Select active employees from the employee records. Use Ctrl/Cmd to select multiple.
                </small>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={modalLoading || loadingSpareOptions || spareOptionsError}
                >
                  {modalLoading ? (
                    <span className="btn-loading-flex">
                      <span className="spinner-micro" />
                      Saving...
                    </span>
                  ) : editingMachine ? (
                    'Save Changes'
                  ) : (
                    'Add Machine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Machines;
