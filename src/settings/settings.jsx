import { useState, useEffect } from 'react';
import {
  FiSettings,
  FiSliders,
  FiBell,
  FiShield,
  FiGlobe,
  FiSave,
  FiRotateCcw,
  FiCheck,
  FiAlertTriangle,
  FiCheckCircle,
  FiTool
} from 'react-icons/fi';
import './settings.css';

const DEFAULT_SETTINGS = {
  // Facility Info
  plantName: 'Plant-1 Main Campus',
  facilityCode: 'FAC-001',
  operatingUnit: 'Heavy Machinery & Precision Assembly',
  contactEmail: 'admin@machinecare.io',
  contactPhone: '+91 98765 43210',
  address: 'Plot 42, Industrial Growth Center, Phase 2',

  // CMMS & Maintenance Rules
  lowStockThreshold: 2,
  preventiveCycleDays: 30,
  workOrderSlaHours: 24,
  autoAlertOnMachineStop: true,
  requireSpareSerialCheck: true,

  // Shifts
  shift1Time: '06:00 - 14:00',
  shift2Time: '14:00 - 22:00',
  shift3Time: '22:00 - 06:00',

  // Notifications
  emailAlertsBreakdown: true,
  emailAlertsLowStock: true,
  dailyShiftDigest: true,
  audioBeepAlerts: false,

  // Localization & System
  timezone: 'Asia/Kolkata (UTC+05:30)',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR (₹)',
  defaultLandingView: 'Employees',
  tablePageSize: '10'
};

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cmms_settings');
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), tablePageSize: '10' }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('cmms_settings', JSON.stringify(settings));
      setTimeout(() => {
        setIsSaving(false);
        showToast('Settings saved successfully!');
      }, 350);
    } catch (err) {
      setIsSaving(false);
      showToast('Failed to save settings: ' + err.message, 'danger');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all settings to factory defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('cmms_settings', JSON.stringify(DEFAULT_SETTINGS));
      showToast('Settings reset to default values');
    }
  };

  return (
    <div className="settings-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          {toast.type === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-left">
          <div className="settings-title-row">
            <h1>Settings</h1>
            <span className="settings-badge-pill">Configuration</span>
          </div>
          <p className="settings-subtitle">
            Configure plant facility profile, maintenance alert thresholds, shifts, and system defaults.
          </p>
        </div>
        <div className="settings-header-actions">
          <button
            type="button"
            className="settings-btn-outline"
            onClick={handleResetDefaults}
          >
            <FiRotateCcw />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            className="settings-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FiSave />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-tabs-bar">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <FiSliders />
          <span>Plant & Facility</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <FiTool />
          <span>CMMS & Inventory</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FiBell />
          <span>Alerts & Notifications</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <FiGlobe />
          <span>System & Regional</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="settings-content-card">
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="settings-section-head">
              <h3>Facility & Plant Profile</h3>
              <p>Primary plant identifiers, operating centers, and administrative contacts.</p>
            </div>

            <div className="settings-grid">
              <div className="settings-form-group">
                <label>Plant / Campus Name</label>
                <input
                  type="text"
                  value={settings.plantName}
                  onChange={(e) => handleInputChange('plantName', e.target.value)}
                  placeholder="e.g. Plant-1 Main Campus"
                />
              </div>

              <div className="settings-form-group">
                <label>Facility Code</label>
                <input
                  type="text"
                  value={settings.facilityCode}
                  onChange={(e) => handleInputChange('facilityCode', e.target.value)}
                  placeholder="e.g. FAC-001"
                />
              </div>

              <div className="settings-form-group">
                <label>Operating Unit / Division</label>
                <input
                  type="text"
                  value={settings.operatingUnit}
                  onChange={(e) => handleInputChange('operatingUnit', e.target.value)}
                  placeholder="e.g. Heavy Machinery & Precision Assembly"
                />
              </div>

              <div className="settings-form-group">
                <label>Primary Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="admin@machinecare.io"
                />
              </div>

              <div className="settings-form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="settings-form-group full-width">
                <label>Facility Physical Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Plant address, city, state and zip"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="settings-section">
            <div className="settings-section-head">
              <h3>Maintenance & Spare Parts Inventory Rules</h3>
              <p>Automated thresholds for restocking, work order resolution, and machine diagnostics.</p>
            </div>

            <div className="settings-grid">
              <div className="settings-form-group">
                <label>Low Stock Warning Threshold (units)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', Number(e.target.value))}
                />
                <span className="field-hint">
                  Spares with available stock at or below this value will trigger Low Stock alerts.
                </span>
              </div>

              <div className="settings-form-group">
                <label>Preventive Maintenance Cycle (days)</label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.preventiveCycleDays}
                  onChange={(e) => handleInputChange('preventiveCycleDays', Number(e.target.value))}
                />
                <span className="field-hint">Default inspection window for scheduled machine servicing.</span>
              </div>

              <div className="settings-form-group">
                <label>Work Order SLA Target (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.workOrderSlaHours}
                  onChange={(e) => handleInputChange('workOrderSlaHours', Number(e.target.value))}
                />
                <span className="field-hint">Target resolution time for high-priority machine tickets.</span>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-section-head">
              <h4>Plant Shift Timings</h4>
            </div>

            <div className="settings-grid three-col">
              <div className="settings-form-group">
                <label>Shift A (Morning)</label>
                <input
                  type="text"
                  value={settings.shift1Time}
                  onChange={(e) => handleInputChange('shift1Time', e.target.value)}
                />
              </div>
              <div className="settings-form-group">
                <label>Shift B (Evening)</label>
                <input
                  type="text"
                  value={settings.shift2Time}
                  onChange={(e) => handleInputChange('shift2Time', e.target.value)}
                />
              </div>
              <div className="settings-form-group">
                <label>Shift C (Night)</label>
                <input
                  type="text"
                  value={settings.shift3Time}
                  onChange={(e) => handleInputChange('shift3Time', e.target.value)}
                />
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-section-head">
              <h4>Automation & Rule Triggers</h4>
            </div>

            <div className="settings-toggle-list">
              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Auto-create Alert when Machine Status is "Stopped"</span>
                  <span className="toggle-desc">
                    Immediately flags high-priority stoppage alerts to maintenance supervisors.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAlertOnMachineStop}
                  onChange={(e) => handleInputChange('autoAlertOnMachineStop', e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Mandatory Stock Transaction Reason</span>
                  <span className="toggle-desc">
                    Requires technicians to select or provide a reason when removing or adding spares.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireSpareSerialCheck}
                  onChange={(e) => handleInputChange('requireSpareSerialCheck', e.target.checked)}
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="settings-section-head">
              <h3>Notification & Alert Channels</h3>
              <p>Configure automated dispatch channels for alarms, low inventory, and shift transitions.</p>
            </div>

            <div className="settings-toggle-list">
              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Email Alerts for Critical Machine Breakdown</span>
                  <span className="toggle-desc">
                    Sends instant notification to maintenance and safety teams when machines stop.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailAlertsBreakdown}
                  onChange={(e) => handleInputChange('emailAlertsBreakdown', e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Low Spare Stock Warning Emails</span>
                  <span className="toggle-desc">
                    Alerts stock keepers when spare part inventory falls below the minimum threshold.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailAlertsLowStock}
                  onChange={(e) => handleInputChange('emailAlertsLowStock', e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Daily Shift Handover Digest</span>
                  <span className="toggle-desc">
                    Summarizes completed work orders, replaced spares, and active machine hours.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dailyShiftDigest}
                  onChange={(e) => handleInputChange('dailyShiftDigest', e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Audio Chime on Critical Alerts</span>
                  <span className="toggle-desc">
                    Plays an in-browser audible chime whenever a critical priority alert arrives.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audioBeepAlerts}
                  onChange={(e) => handleInputChange('audioBeepAlerts', e.target.checked)}
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-section">
            <div className="settings-section-head">
              <h3>Regional & Display Preferences</h3>
              <p>Customize time zones, currency formats, and initial workspace views.</p>
            </div>

            <div className="settings-grid">
              <div className="settings-form-group">
                <label>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="Asia/Kolkata (UTC+05:30)">Asia/Kolkata (UTC+05:30)</option>
                  <option value="UTC (UTC+00:00)">UTC (UTC+00:00)</option>
                  <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                  <option value="Europe/London (UTC+00:00)">Europe/London (UTC+00:00)</option>
                  <option value="Asia/Singapore (UTC+08:00)">Asia/Singapore (UTC+08:00)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label>Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 11/01/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 01/11/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-01-11)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label>Currency Format</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label>Default Workspace View</label>
                <select
                  value={settings.defaultLandingView}
                  onChange={(e) => handleInputChange('defaultLandingView', e.target.value)}
                >
                  <option value="Employees">Employees</option>
                  <option value="Dashboard">Dashboard</option>
                  <option value="Machines">Machines</option>
                  <option value="Spare Parts">Spare Parts</option>
                  <option value="Departments">Departments</option>
                  <option value="Designations">Designations</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label>Default Table Page Size</label>
                <select
                  value={settings.tablePageSize}
                  onChange={(e) => handleInputChange('tablePageSize', e.target.value)}
                >
                  <option value="10">10 records per page</option>
                </select>
              </div>
            </div>

            <div className="settings-system-info-card">
              <div className="sys-info-header">
                <FiCheckCircle className="sys-info-icon" />
                <div>
                  <h4>MachineCare CMMS System Status</h4>
                  <p>All core modules (Machines, Spares, Employees, Auth) connected to Node / MongoDB Atlas.</p>
                </div>
              </div>
              <div className="sys-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Platform Version</span>
                  <span className="spec-value">v2.4.0 (Production)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Environment</span>
                  <span className="spec-value">Industrial Plant Core</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">API Gateway</span>
                  <span className="spec-value">Connected (Port 5000)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Active Database</span>
                  <span className="spec-value">MongoDB Atlas (SSL Encrypted)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="settings-footer">
          <button
            type="button"
            className="settings-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FiSave />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

