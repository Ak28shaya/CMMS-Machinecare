import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import spareService from '../services/spareService';
import './maintenance.css';

const formatDateTime = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError('');
    }

    try {
      const data = await spareService.getMaintenanceHistory({ limit: 500 });
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance records.');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    spareService.getMaintenanceHistory({ limit: 500 })
      .then((data) => {
        if (isActive) setRecords(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (isActive) {
          setError(err.message || 'Failed to load maintenance records.');
          setRecords([]);
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) => {
      const machine = record.machine?.code || record.machine?.name || '';
      const technician = record.technicianName || '';
      const sparesUsed = (record.sparesUsed || [])
        .map((item) => item.spare?.name || item.spare?.code || '')
        .join(' ');
      return [
        machine,
        record.maintenanceType,
        technician,
        record.description,
        record.statusAfter,
        sparesUsed
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [records, searchQuery]);
  const pagination = usePagination(filteredRecords);

  return (
    <section className="maintenance-page">
      <header className="maintenance-header">
        <div>
          <div className="maintenance-title-row">
            <h1>Work Orders</h1>
            <span className="maintenance-total">{records.length} Total</span>
          </div>
          <p>Review completed maintenance work, technicians, and spare parts used.</p>
        </div>
        <button
          type="button"
          className="maintenance-refresh"
          onClick={() => fetchRecords(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </header>

      <div className="maintenance-toolbar">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search machine, type, technician, or description..."
          aria-label="Search maintenance records"
        />
      </div>

      {error && <div className="maintenance-error" role="alert">{error}</div>}

      <div className="maintenance-table-card">
        <div className="maintenance-table-responsive">
          <table className="maintenance-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Machine</th>
                <th>Type</th>
                <th>Technician</th>
                <th>Description</th>
                <th>Spares Used</th>
                <th>Status After</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="maintenance-table-state">Loading maintenance records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="maintenance-table-state">
                    {error ? 'Maintenance records are unavailable.' : 'No maintenance records found.'}
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((record) => (
                  <tr key={record._id}>
                    <td className="maintenance-date">{formatDateTime(record.performedAt)}</td>
                    <td>
                      <strong>{record.machine?.code || record.machine?.name || 'Unknown machine'}</strong>
                      {record.machine?.name && record.machine?.code && (
                        <span className="maintenance-machine-name">{record.machine.name}</span>
                      )}
                    </td>
                    <td>
                      <span className="maintenance-type">{record.maintenanceType || 'Other'}</span>
                    </td>
                    <td>{record.technicianName || '—'}</td>
                    <td className="maintenance-description">{record.description || 'No description'}</td>
                    <td>
                      {(record.sparesUsed || []).length > 0
                        ? record.sparesUsed.map((item) => {
                            const spareName = item.spare?.name || item.spare?.code || 'Spare part';
                            return `${spareName} × ${item.quantity}`;
                          }).join(', ')
                        : '—'}
                    </td>
                    <td>{record.statusAfter || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            totalItems={filteredRecords.length}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        )}
      </div>
    </section>
  );
}
