import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiBox,
  FiLayers,
  FiAlertTriangle,
  FiXCircle,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiCheck,
  FiEdit2,
  FiArrowDownLeft,
  FiArrowUpRight
} from 'react-icons/fi';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import spareService from '../services/spareService';
import machineService from '../services/machineService';
import './spares.css';

// Helper for human-readable dates matching design
const formatDate = (dateStr) => {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Never';
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} ${year} ${time}`;
};

export default function Spares() {
  const [spares, setSpares] = useState([]);
  const [machines, setMachines] = useState([]);
  const [ledgerTxns, setLedgerTxns] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ledgerPartFilter, setLedgerPartFilter] = useState('all');

  // Loading state for async buttons
  const [actionLoading, setActionLoading] = useState({});

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPartError, setAddPartError] = useState('');
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);

  // Edit Spare Modal State
  const [editingSpare, setEditingSpare] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    category: 'Mechanical',
    minStock: 2,
    maxStock: 10,
    unit: 'Nos',
    location: '',
    machineSelections: {}
  });
  const [editStockIn, setEditStockIn] = useState({ qty: 1, reason: 'Stock received' });
  const [editStockOut, setEditStockOut] = useState({ qty: 1, machineId: '', reason: 'Used in maintenance' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Form for New Part Modal
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    code: '',
    category: 'Mechanical',
    stock: 5,
    minStock: 2,
    maxStock: 10,
    unit: 'Nos',
    location: '',
    machineSelections: {}
  });

  // Fetch all initial data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [sparesData, machinesData, ledgerData, summaryRes] = await Promise.all([
        spareService.getSpares({ limit: 200 }),
        machineService.getAllMachines(),
        spareService.getLedger({ limit: 500 }),
        spareService.getSummary()
      ]);

      setSpares(sparesData || []);
      setMachines(machinesData || []);
      setLedgerTxns(ledgerData || []);
      setSummaryData(summaryRes || null);
    } catch (err) {
      setError(err.message || 'Failed to load spare parts data');
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
    const totalParts = spares.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    spares.forEach((s) => {
      const stock = s.stock ?? s.quantity ?? 0;
      const min = s.minStock ?? s.min ?? 0;
      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= min) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      totalParts: summaryData?.totalParts ?? totalParts,
      inStock: summaryData?.inStock ?? inStock,
      lowStock: summaryData?.lowStock ?? lowStock,
      outOfStock: summaryData?.outOfStock ?? outOfStock
    };
  }, [spares, summaryData]);

  // Helper map: spareId -> last transactions
  const spareLastTxnMap = useMemo(() => {
    const map = {};
    spares.forEach((s) => {
      map[s._id] = { lastUsed: null, lastRestocked: null };
    });

    ledgerTxns.forEach((t) => {
      const sId = String(t.spare?._id || t.spare || '');
      if (map[sId]) {
        const isOut = t.type === 'OUT' || t.transactionType === 'OUT';
        const dateVal = t.transactionAt || t.createdAt;

        if (isOut && !map[sId].lastUsed) {
          map[sId].lastUsed = dateVal;
        } else if (!isOut && !map[sId].lastRestocked) {
          map[sId].lastRestocked = dateVal;
        }
      }
    });

    return map;
  }, [spares, ledgerTxns]);

  // Filtered spares for stock table
  const filteredSpares = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return spares.filter((s) => {
      const name = (s.name || s.partName || '').toLowerCase();
      const code = (s.code || s.partCode || '').toLowerCase();
      const stock = s.stock ?? s.quantity ?? 0;
      const min = s.minStock ?? s.min ?? 0;

      const machineCodes = (s.machines || []).map((m) => {
        const mObj = m.machine || m;
        return (mObj.code || mObj.name || '').toLowerCase();
      });

      const matchesSearch =
        !q ||
        name.includes(q) ||
        code.includes(q) ||
        machineCodes.some((mc) => mc.includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ok') return stock > min;
      if (statusFilter === 'low') return stock > 0 && stock <= min;
      if (statusFilter === 'out') return stock <= 0;

      return true;
    });
  }, [spares, searchQuery, statusFilter]);
  const sparePagination = usePagination(filteredSpares);

  // Filtered ledger rows
  const filteredLedger = useMemo(() => {
    if (ledgerPartFilter === 'all') return ledgerTxns;

    return ledgerTxns.filter((t) => {
      const sId = String(t.spare?._id || t.spare || '');
      return sId === String(ledgerPartFilter);
    });
  }, [ledgerTxns, ledgerPartFilter]);
  const ledgerPagination = usePagination(filteredLedger);

  // Open Edit Modal
  const handleOpenEditModal = (spare) => {
    setEditError('');
    const machineSelections = {};
    (spare.machines || []).forEach((m) => {
      const mObj = m.machine || m;
      if (mObj._id) machineSelections[mObj._id] = true;
    });

    setEditForm({
      name: spare.name || spare.partName || '',
      code: spare.code || spare.partCode || '',
      category: spare.category || 'Mechanical',
      minStock: spare.minStock ?? spare.min ?? 2,
      maxStock: spare.maxStock ?? spare.max ?? 10,
      unit: spare.unit || 'Nos',
      location: spare.location || '',
      machineSelections
    });

    setEditStockIn({ qty: 1, reason: 'Stock received' });
    setEditStockOut({
      qty: 1,
      machineId: (spare.machines && spare.machines[0]?.machine?._id) || '',
      reason: 'Used in maintenance'
    });

    setEditingSpare(spare);
  };

  // Add stock from inside Edit Modal
  const handleEditAddStock = async () => {
    if (!editingSpare) return;
    const qty = Number(editStockIn.qty);
    if (!qty || qty <= 0) {
      setEditError('Please enter a valid stock quantity to add.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, editAdd: true }));
    setEditError('');

    try {
      const updated = await spareService.addStock(editingSpare._id, qty, editStockIn.reason || 'Stock received');
      setEditingSpare((prev) => ({ ...prev, stock: updated.stock }));
      await fetchData();
      showToast(`+${qty} added to ${editingSpare.name}. In stock: ${updated.stock}.`, 'success');
      setEditStockIn({ qty: 1, reason: 'Stock received' });
    } catch (err) {
      setEditError(err.message || 'Failed to add stock');
    } finally {
      setActionLoading((prev) => ({ ...prev, editAdd: false }));
    }
  };

  // Remove stock from inside Edit Modal
  const handleEditRemoveStock = async () => {
    if (!editingSpare) return;
    const qty = Number(editStockOut.qty);
    const currentStock = editingSpare.stock ?? 0;

    if (!qty || qty <= 0) {
      setEditError('Please enter a valid stock quantity to remove.');
      return;
    }

    if (qty > currentStock) {
      setEditError(`Cannot remove ${qty}. Only ${currentStock} available in stock.`);
      return;
    }

    let fullReason = editStockOut.reason || 'Used in maintenance';
    if (editStockOut.machineId) {
      const machineObj = machines.find((m) => m._id === editStockOut.machineId);
      if (machineObj) {
        fullReason = `Used in maintenance on ${machineObj.code}`;
      }
    }

    setActionLoading((prev) => ({ ...prev, editRemove: true }));
    setEditError('');

    try {
      const updated = await spareService.removeStock(editingSpare._id, qty, fullReason, editStockOut.machineId);
      setEditingSpare((prev) => ({ ...prev, stock: updated.stock }));
      await fetchData();
      showToast(`-${qty} removed from ${editingSpare.name}. In stock: ${updated.stock}.`, 'success');
      setEditStockOut((prev) => ({ ...prev, qty: 1 }));
    } catch (err) {
      setEditError(err.message || 'Failed to remove stock');
    } finally {
      setActionLoading((prev) => ({ ...prev, editRemove: false }));
    }
  };

  // Save General Updates from Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSpare) return;
    setEditError('');

    const { name, code, category, minStock, maxStock, unit, location, machineSelections } = editForm;
    if (!name.trim()) {
      setEditError('Part name is required.');
      return;
    }
    if (!code.trim()) {
      setEditError('Part code is required.');
      return;
    }
    if (Number(minStock) < 0) {
      setEditError('Minimum stock level cannot be negative.');
      return;
    }
    if (Number(maxStock) < Number(minStock)) {
      setEditError('Maximum stock must be at least minimum stock.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const selectedMIds = Object.keys(machineSelections).filter((mId) => machineSelections[mId]);
      const updated = await spareService.updateSpare(editingSpare._id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        minStock: Number(minStock),
        maxStock: Number(maxStock),
        unit: unit || 'Nos',
        location: location.trim(),
        machineIds: selectedMIds
      });

      await fetchData();
      showToast(`Spare part "${updated.name}" updated successfully!`, 'success');
      setEditingSpare(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update spare part');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Deactivate/Delete Spare from Edit Modal
  const handleDeleteSpare = async () => {
    if (!editingSpare) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to deactivate "${editingSpare.name}" (${editingSpare.code})? It will be removed from active inventory.`
    );
    if (!confirmDelete) return;

    setIsSavingEdit(true);
    setEditError('');
    try {
      await spareService.deleteSpare(editingSpare._id);
      await fetchData();
      showToast(`Spare part "${editingSpare.name}" deactivated successfully!`, 'success');
      setEditingSpare(null);
    } catch (err) {
      setEditError(err.message || 'Failed to deactivate spare');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Add New Part
  const handleCreatePart = async (e) => {
    e.preventDefault();
    setAddPartError('');

    const { name, code, category, stock, minStock, maxStock, unit, location, machineSelections } = newPartForm;
    if (!name.trim()) {
      setAddPartError('Part name is required.');
      return;
    }
    if (!code.trim()) {
      setAddPartError('Part code is required (e.g. CYL-101).');
      return;
    }
    if (Number(minStock) < 0) {
      setAddPartError('Minimum stock level cannot be negative.');
      return;
    }
    if (Number(maxStock) < Number(minStock)) {
      setAddPartError('Maximum stock must be at least minimum stock.');
      return;
    }

    setIsSubmittingPart(true);
    try {
      const selectedMIds = Object.keys(machineSelections).filter((mId) => machineSelections[mId]);
      const created = await spareService.createSpare({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        maxStock: Number(maxStock) || 10,
        unit: unit || 'Nos',
        location: location.trim(),
        machineIds: selectedMIds
      });

      await fetchData();
      showToast(`Spare part "${created.name}" added successfully!`, 'success');
      setShowAddModal(false);
      setNewPartForm({
        name: '',
        code: '',
        category: 'Mechanical',
        stock: 5,
        minStock: 2,
        maxStock: 10,
        unit: 'Nos',
        location: '',
        machineSelections: {}
      });
    } catch (err) {
      setAddPartError(err.message || 'Failed to create spare part');
    } finally {
      setIsSubmittingPart(false);
    }
  };

  return (
    <div className="spares-view-wrapper">
      {/* 1. Header Row */}
      <div className="spares-header-row">
        <div>
          <div className="spares-title-badge-group">
            <h1 className="spares-page-title">Spare Parts &amp; Inventory</h1>
            <span className="spares-total-pill">{metrics.totalParts} Total</span>
          </div>
          <p className="spares-page-subtitle">
            Track stock levels, restocks, usage in maintenance jobs, and the full stock ledger.
          </p>
        </div>

        <div className="spares-header-actions">
          <button
            type="button"
            className="spares-refresh-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh inventory data"
          >
            <FiRefreshCw className={refreshing ? 'spinning-icon' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="spares-add-btn"
            onClick={() => {
              setAddPartError('');
              setShowAddModal(true);
            }}
          >
            <FiPlus aria-hidden="true" />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Summary Cards Grid */}
      <div className="spares-kpi-grid">
        {/* Card 1: TOTAL PARTS */}
        <div className="kpi-card kpi-total">
          <div className="kpi-text-col">
            <span className="kpi-label">TOTAL PARTS</span>
            <span className="kpi-value">{metrics.totalParts}</span>
          </div>
          <div className="kpi-icon-box blue">
            <FiBox aria-hidden="true" />
          </div>
        </div>

        {/* Card 2: IN STOCK (OK) */}
        <div className="kpi-card kpi-instock">
          <div className="kpi-text-col">
            <span className="kpi-label">IN STOCK (OK)</span>
            <span className="kpi-value">{metrics.inStock}</span>
          </div>
          <div className="kpi-icon-box green">
            <FiLayers aria-hidden="true" />
          </div>
        </div>

        {/* Card 3: LOW STOCK */}
        <div className="kpi-card kpi-lowstock">
          <div className="kpi-text-col">
            <span className="kpi-label">LOW STOCK</span>
            <span className="kpi-value">{metrics.lowStock}</span>
          </div>
          <div className="kpi-icon-box amber">
            <FiAlertTriangle aria-hidden="true" />
          </div>
        </div>

        {/* Card 4: OUT OF STOCK */}
        <div className="kpi-card kpi-outofstock">
          <div className="kpi-text-col">
            <span className="kpi-label">OUT OF STOCK</span>
            <span className="kpi-value">{metrics.outOfStock}</span>
          </div>
          <div className="kpi-icon-box red">
            <FiXCircle aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 3. Search & Status Filter Bar */}
      <div className="spares-toolbar-card">
        <div className="search-box-wrap">
          <FiSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="spares-search-input"
            placeholder="Search part name, code, or machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-filter-wrap">
          <label htmlFor="spares-status-select">Status:</label>
          <select
            id="spares-status-select"
            className="spares-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && <div className="spares-error-banner">{error}</div>}

      {/* 4. Spare Parts Stock Table Card */}
      <div className="spares-card">
        <div className="spares-card-header">
          <h2 className="card-heading">Spare parts stock</h2>
          <p className="card-subheading">
            Track stock levels, restocks, usage in maintenance jobs, and edit specifications or adjust stock.
          </p>
        </div>

        <div className="spares-table-responsive">
          <table className="spares-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>PART</th>
                <th style={{ minWidth: '70px', textAlign: 'center' }}>STOCK</th>
                <th style={{ minWidth: '60px', textAlign: 'center' }}>MIN</th>
                <th style={{ minWidth: '95px' }}>LEVEL</th>
                <th style={{ minWidth: '85px' }}>STATUS</th>
                <th style={{ minWidth: '160px' }}>FITS MACHINES</th>
                <th style={{ minWidth: '110px' }}>LAST USED</th>
                <th style={{ minWidth: '110px' }}>LAST RESTOCKED</th>
                <th style={{ minWidth: '120px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="table-state-cell">
                    Loading inventory data from database...
                  </td>
                </tr>
              ) : filteredSpares.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-state-cell">
                    No spare parts found. Click "+ Add Part" above to register a new spare.
                  </td>
                </tr>
              ) : (
                sparePagination.pageItems.map((spare) => {
                  const stock = spare.stock ?? spare.quantity ?? 0;
                  const min = spare.minStock ?? spare.min ?? 0;
                  const max = spare.maxStock ?? spare.max ?? (min ? min * 3 : 10);
                  const isOut = stock <= 0;
                  const isLow = !isOut && stock <= min;
                  const statusClass = isOut ? 'out' : isLow ? 'low' : 'ok';
                  const statusLabel = isOut ? 'Out' : isLow ? 'Low' : 'OK';

                  // Level percentage
                  const levelPct = Math.min(100, Math.max(10, Math.round((stock / max) * 100)));

                  // Machines list
                  const fits = (spare.machines || []).map((m) => {
                    const mObj = m.machine || m;
                    return mObj.code || mObj.name || String(mObj);
                  });

                  // Last transactions
                  const lastUsedDate = spareLastTxnMap[spare._id]?.lastUsed || spare.lastUsed;
                  const lastRestockedDate = spareLastTxnMap[spare._id]?.lastRestocked || spare.lastRestocked;

                  return (
                    <tr key={spare._id}>
                      {/* PART */}
                      <td>
                        <div className="part-info">
                          <span className="part-name">{spare.name || spare.partName}</span>
                          <span className="part-code">{spare.code || spare.partCode}</span>
                        </div>
                      </td>

                      {/* STOCK */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="stock-number">{stock}</span>
                      </td>

                      {/* MIN */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="min-number">{min}</span>
                      </td>

                      {/* LEVEL PROGRESS BAR */}
                      <td>
                        <div className="level-bar-track">
                          <div
                            className={`level-bar-fill ${statusClass}`}
                            style={{ width: `${levelPct}%` }}
                          />
                        </div>
                      </td>

                      {/* STATUS PILL */}
                      <td>
                        <span className={`status-pill ${statusClass}`}>
                          <span className="dot-indicator">●</span> {statusLabel}
                        </span>
                      </td>

                      {/* FITS MACHINES */}
                      <td>
                        <div className="fits-chips-group">
                          {fits.length > 0 ? (
                            fits.map((mCode, idx) => (
                              <span key={idx} className="fits-chip" title={`Compatible with ${mCode}`}>
                                {mCode}
                              </span>
                            ))
                          ) : (
                            <span className="unassigned-text">—</span>
                          )}
                        </div>
                      </td>

                      {/* LAST USED */}
                      <td>
                        <span className="date-cell-text">{formatDate(lastUsedDate)}</span>
                      </td>

                      {/* LAST RESTOCKED */}
                      <td>
                        <span className="date-cell-text">{formatDate(lastRestockedDate)}</span>
                      </td>

                      {/* ACTIONS COLUMN: EDIT & MANAGE STOCK */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-edit-action"
                          onClick={() => handleOpenEditModal(spare)}
                          title="Edit details, add or remove stock"
                        >
                          <FiEdit2 aria-hidden="true" />
                          <span>Edit / Stock</span>
                        </button>
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
            totalItems={filteredSpares.length}
            currentPage={sparePagination.currentPage}
            totalPages={sparePagination.totalPages}
            onPageChange={sparePagination.setCurrentPage}
          />
        )}
      </div>

      {/* 5. Stock Ledger Table Card */}
      <div className="spares-card ledger-card">
        <div className="spares-card-header ledger-header-row">
          <h2 className="card-heading">Stock ledger</h2>

          <div className="ledger-filter-wrap">
            <label htmlFor="ledger-filter-select">Filter by part:</label>
            <select
              id="ledger-filter-select"
              className="spares-status-select"
              value={ledgerPartFilter}
              onChange={(e) => setLedgerPartFilter(e.target.value)}
            >
              <option value="all">All parts</option>
              {spares.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.partName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="spares-table-responsive">
          <table className="spares-table ledger-table">
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>DATE AND TIME</th>
                <th style={{ minWidth: '140px' }}>PART</th>
                <th style={{ minWidth: '75px', textAlign: 'center' }}>TYPE</th>
                <th style={{ minWidth: '65px', textAlign: 'center' }}>QTY</th>
                <th style={{ minWidth: '100px', textAlign: 'center' }}>BALANCE AFTER</th>
                <th style={{ minWidth: '200px' }}>REASON</th>
                <th style={{ minWidth: '110px' }}>DONE BY</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-state-cell">
                    No stock transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledgerPagination.pageItems.map((txn, idx) => {
                  const isOut = txn.type === 'OUT' || txn.transactionType === 'OUT';
                  const partName = txn.partName || txn.spare?.name || txn.sparePart?.partName || 'Spare Part';
                  const performedBy = txn.performedByName || txn.performedBy?.name || 'Storekeeper';

                  return (
                    <tr key={txn._id || idx}>
                      <td>{formatDateTime(txn.transactionAt || txn.createdAt)}</td>
                      <td className="ledger-part-name">{partName}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`txn-badge ${isOut ? 'out' : 'in'}`}>
                          {isOut ? 'OUT' : 'IN'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`txn-qty ${isOut ? 'out' : 'in'}`}>
                          {isOut ? `−${Math.abs(txn.quantity)}` : `+${Math.abs(txn.quantity)}`}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{txn.balanceAfter}</td>
                      <td className="ledger-reason-text">{txn.reason || (isOut ? 'Used in maintenance' : 'Stock received')}</td>
                      <td className="ledger-doneby-text">{performedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            totalItems={filteredLedger.length}
            currentPage={ledgerPagination.currentPage}
            totalPages={ledgerPagination.totalPages}
            onPageChange={ledgerPagination.setCurrentPage}
          />
        )}
      </div>

      {/* =========================================================================
          MODALS / DIALOGS
          ========================================================================= */}

      {/* MODAL 1: Add New Part Modal */}
      {showAddModal && (
        <div className="spares-modal-overlay" onClick={(e) => e.target.classList.contains('spares-modal-overlay') && setShowAddModal(false)}>
          <div className="spares-modal-dialog" role="dialog" aria-modal="true" aria-label="Add New Spare Part">
            <div className="spares-modal-header">
              <h3>Add New Spare Part</h3>
              <button
                type="button"
                className="spares-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {addPartError && <div className="spares-modal-error">{addPartError}</div>}

            <form onSubmit={handleCreatePart} className="spares-modal-form">
              <div className="form-grid-two">
                <div>
                  <label htmlFor="np-name">Part Name *</label>
                  <input
                    id="np-name"
                    type="text"
                    placeholder="e.g. Cylinder 101"
                    value={newPartForm.name}
                    onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="np-code">Part Code *</label>
                  <input
                    id="np-code"
                    type="text"
                    placeholder="e.g. CYL-101"
                    value={newPartForm.code}
                    onChange={(e) => setNewPartForm({ ...newPartForm, code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-three">
                <div>
                  <label htmlFor="np-stock">Opening Stock</label>
                  <input
                    id="np-stock"
                    type="number"
                    min="0"
                    value={newPartForm.stock}
                    onChange={(e) => setNewPartForm({ ...newPartForm, stock: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="np-min">Minimum Stock</label>
                  <input
                    id="np-min"
                    type="number"
                    min="0"
                    value={newPartForm.minStock}
                    onChange={(e) => setNewPartForm({ ...newPartForm, minStock: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="np-max">Maximum Stock</label>
                  <input
                    id="np-max"
                    type="number"
                    min="1"
                    value={newPartForm.maxStock}
                    onChange={(e) => setNewPartForm({ ...newPartForm, maxStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-two">
                <div>
                  <label htmlFor="np-cat">Category</label>
                  <select
                    id="np-cat"
                    value={newPartForm.category}
                    onChange={(e) => setNewPartForm({ ...newPartForm, category: e.target.value })}
                  >
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hydraulic">Hydraulic</option>
                    <option value="Pneumatic">Pneumatic</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Filtration">Filtration</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="np-loc">Storage Location</label>
                  <input
                    id="np-loc"
                    type="text"
                    placeholder="e.g. Plant-1 / Rack A-12"
                    value={newPartForm.location}
                    onChange={(e) => setNewPartForm({ ...newPartForm, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Compatible Machines */}
              <div className="machines-selection-group">
                <label>Compatible Machines</label>
                <div className="machines-checkbox-list">
                  {machines.length === 0 ? (
                    <span className="text-muted">No machines registered in master yet.</span>
                  ) : (
                    machines.map((m) => (
                      <label key={m._id} className="machine-checkbox-item">
                        <input
                          type="checkbox"
                          checked={!!newPartForm.machineSelections[m._id]}
                          onChange={(e) =>
                            setNewPartForm({
                              ...newPartForm,
                              machineSelections: {
                                ...newPartForm.machineSelections,
                                [m._id]: e.target.checked
                              }
                            })
                          }
                        />
                        <span>
                          <b>{m.code}</b> — {m.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="spares-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmittingPart}
                >
                  {isSubmittingPart ? 'Adding...' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Spare Part & Manage Stock Modal (LANDSCAPE) */}
      {editingSpare && (
        <div
          className="spares-modal-overlay"
          onClick={(e) => e.target.classList.contains('spares-modal-overlay') && setEditingSpare(null)}
        >
          <div
            className="spares-modal-dialog spares-modal-landscape"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Spare Part"
          >
            {/* 1. Header */}
            <div className="spares-modal-header">
              <div>
                <div className="modal-title-row">
                  <h3>Edit Spare Part &amp; Stock</h3>
                  <span className="modal-part-tag">{editingSpare.code}</span>
                </div>
                <p className="modal-subheading">
                  Manage specifications, machine mappings, and add/remove stock for <b>{editingSpare.name}</b>.
                </p>
              </div>
              <button
                type="button"
                className="spares-modal-close"
                onClick={() => setEditingSpare(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {editError && <div className="spares-modal-error">{editError}</div>}

            {/* 2. Landscape Two-Column Form */}
            <form onSubmit={handleSaveEdit} className="landscape-modal-content">
              <div className="modal-landscape-grid">
                {/* LEFT COLUMN: Specifications & Compatibility */}
                <div className="modal-col-left">
                  <h4 className="form-section-header">Specifications &amp; Details</h4>

                  <div className="form-grid-two">
                    <div>
                      <label htmlFor="edit-name">Part Name *</label>
                      <input
                        id="edit-name"
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-code">Part Code *</label>
                      <input
                        id="edit-code"
                        type="text"
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-three">
                    <div>
                      <label htmlFor="edit-cat">Category</label>
                      <select
                        id="edit-cat"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Hydraulic">Hydraulic</option>
                        <option value="Pneumatic">Pneumatic</option>
                        <option value="Transmission">Transmission</option>
                        <option value="Filtration">Filtration</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-min">Min Stock</label>
                      <input
                        id="edit-min"
                        type="number"
                        min="0"
                        value={editForm.minStock}
                        onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-max">Max Stock</label>
                      <input
                        id="edit-max"
                        type="number"
                        min="1"
                        value={editForm.maxStock}
                        onChange={(e) => setEditForm({ ...editForm, maxStock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div>
                      <label htmlFor="edit-loc">Storage Location</label>
                      <input
                        id="edit-loc"
                        type="text"
                        placeholder="e.g. Plant-1 / Shelf 4"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-unit">Unit of Measure</label>
                      <select
                        id="edit-unit"
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      >
                        <option value="Nos">Nos</option>
                        <option value="Kit">Kit</option>
                        <option value="Set">Set</option>
                        <option value="Mtr">Mtr</option>
                        <option value="Ltr">Ltr</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>
                  </div>

                  {/* Compatible Machines */}
                  <div className="machines-selection-group">
                    <label>Compatible Machines</label>
                    <div className="machines-checkbox-list">
                      {machines.length === 0 ? (
                        <span className="text-muted">No machines registered in master yet.</span>
                      ) : (
                        machines.map((m) => (
                          <label key={m._id} className="machine-checkbox-item">
                            <input
                              type="checkbox"
                              checked={!!editForm.machineSelections[m._id]}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  machineSelections: {
                                    ...editForm.machineSelections,
                                    [m._id]: e.target.checked
                                  }
                                })
                              }
                            />
                            <span>
                              <b>{m.code}</b> — {m.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Real-Time Stock Operations */}
                <div className="modal-col-right">
                  <h4 className="form-section-header">Live Stock Operations</h4>

                  {/* Stock Status Card */}
                  <div className="landscape-stock-card">
                    <div className="stock-level-display">
                      <span className="stock-display-label">CURRENT INVENTORY</span>
                      <div className="stock-display-value-wrap">
                        <span className="stock-display-val">{editingSpare.stock ?? 0}</span>
                        <span className="stock-display-unit">{editingSpare.unit || 'Nos'}</span>
                        <span
                          className={`status-pill ${
                            (editingSpare.stock ?? 0) <= 0
                              ? 'out'
                              : (editingSpare.stock ?? 0) <= (editingSpare.minStock ?? 0)
                              ? 'low'
                              : 'ok'
                          }`}
                        >
                          <span className="dot-indicator">●</span>{' '}
                          {(editingSpare.stock ?? 0) <= 0
                            ? 'Out of Stock'
                            : (editingSpare.stock ?? 0) <= (editingSpare.minStock ?? 0)
                            ? 'Low Stock'
                            : 'In Stock'}
                        </span>
                      </div>
                    </div>
                    <div className="stock-min-hint">
                      Min Threshold: <b>{editingSpare.minStock ?? 0}</b> | Max: <b>{editingSpare.maxStock ?? 10}</b>
                    </div>
                  </div>

                  {/* Stock IN (+ Add) Panel */}
                  <div className="stock-action-panel in-panel">
                    <div className="panel-badge in">
                      <FiArrowDownLeft />
                      <span>STOCK IN (+ ADD TO STOCK)</span>
                    </div>
                    <div className="panel-controls">
                      <div className="input-group-inline">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          className="quick-stock-qty"
                          value={editStockIn.qty}
                          onChange={(e) =>
                            setEditStockIn({ ...editStockIn, qty: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                        />
                      </div>
                      <div className="input-group-inline">
                        <label>Reason:</label>
                        <select
                          className="quick-stock-reason"
                          value={editStockIn.reason}
                          onChange={(e) => setEditStockIn({ ...editStockIn, reason: e.target.value })}
                        >
                          <option value="Stock received">Stock received</option>
                          <option value="Purchase order restock">Purchase order restock</option>
                          <option value="Inventory adjustment">Inventory adjustment</option>
                          <option value="Returned from line">Returned from line</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn-quick-in"
                        onClick={handleEditAddStock}
                        disabled={actionLoading.editAdd}
                      >
                        {actionLoading.editAdd ? 'Adding...' : '+ Add Stock'}
                      </button>
                    </div>
                  </div>

                  {/* Stock OUT (− Remove) Panel */}
                  <div className="stock-action-panel out-panel">
                    <div className="panel-badge out">
                      <FiArrowUpRight />
                      <span>STOCK OUT (− REMOVE FOR JOB)</span>
                    </div>
                    <div className="panel-controls">
                      <div className="input-group-inline">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max={editingSpare.stock ?? 0}
                          className="quick-stock-qty"
                          value={editStockOut.qty}
                          onChange={(e) =>
                            setEditStockOut({ ...editStockOut, qty: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                        />
                      </div>
                      <div className="input-group-inline">
                        <label>Machine:</label>
                        <select
                          className="quick-stock-reason"
                          value={editStockOut.machineId}
                          onChange={(e) => setEditStockOut({ ...editStockOut, machineId: e.target.value })}
                        >
                          <option value="">General (No machine)</option>
                          {machines.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.code} — {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn-quick-out"
                        onClick={handleEditRemoveStock}
                        disabled={actionLoading.editRemove || (editingSpare.stock ?? 0) <= 0}
                      >
                        {actionLoading.editRemove ? 'Removing...' : '− Remove Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Sticky Bottom Actions Bar */}
              <div className="spares-modal-footer edit-footer-actions">
                <button
                  type="button"
                  className="btn-danger-ghost"
                  onClick={handleDeleteSpare}
                  disabled={isSavingEdit}
                >
                  <FiTrash2 /> Deactivate Part
                </button>

                <div className="right-action-group">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditingSpare(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`spares-toast ${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheck /> : <FiAlertTriangle />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
