import { useState } from 'react';
import Login from './pages/login';
import Sidebar from './components/sidebar';
import Machines from './machines/machines';
import Maintenance from './maintenance/maintenance';
import Spares from './spares/spares';
import Employees from './employee/employee';
import Department from './department/department';
import Designation from './designation/designation';
import Settings from './settings/settings';
import Alerts from './alerts/alerts';
import Vendors from './vendors/vendors';
import authService from './services/authService';
import { FiMenu } from 'react-icons/fi';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [activeSection, setActiveSection] = useState('Employees');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setProfileData(null);
    setActiveSection('Employees');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setProfileData(null);
    setActiveSection('Dashboard');
    setSidebarOpen(false);
  };

  const handleTestProtectedEndpoint = async () => {
    if (!currentUser?.id) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await authService.getProfile(currentUser.id);
      setProfileData(res.user);
    } catch (err) {
      setProfileError(err.message || 'Failed to fetch protected profile');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area on the Right */}
      <div className="dashboard-content-area">
        {/* Top Command Bar */}
        <header className="dashboard-nav">
          <div className="nav-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <FiMenu aria-hidden="true" />
            </button>
            <h2 className="nav-page-title">{activeSection}</h2>
          </div>

          <div className="nav-user-actions">
            <div className="user-info-chip">
              <span className="user-name">{currentUser.name}</span>
              <span className={`role-badge role-${currentUser.role?.toLowerCase() || 'tech'}`}>
                {currentUser.role || 'User'}
              </span>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="dashboard-main">
          {activeSection === 'Dashboard' && (
            <>
              <div className="welcome-banner">
                <h1>Welcome to MachineCare, {currentUser.name}!</h1>
                <p>
                  Your frontend is successfully connected to the backend authentication system.
                </p>
              </div>

              <div className="cards-grid">
                {/* Card 1: Session & Token Status */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon-box green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <h3>Authentication Status</h3>
                  </div>
                  <div className="card-body">
                    <p className="status-indicator">
                      <span className="status-dot online"></span>
                      <strong>JWT Session Active</strong>
                    </p>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-val">{currentUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned Role:</span>
                      <span className="detail-val">{currentUser.role}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">User ID:</span>
                      <span className="detail-val monospace">{currentUser.id}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Protected Backend API Test */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon-box blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                      </svg>
                    </div>
                    <h3>Backend API Test</h3>
                  </div>
                  <div className="card-body">
                    <p className="card-desc">
                      Test protected route <code>GET /api/auth/:id</code> with your current JWT bearer token.
                    </p>
                    <button
                      type="button"
                      className="api-test-btn"
                      onClick={handleTestProtectedEndpoint}
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Testing Token...' : 'Verify Protected Route'}
                    </button>

                    {profileError && <div className="test-alert error">{profileError}</div>}

                    {profileData && (
                      <div className="test-alert success">
                        <strong>Token Validated!</strong>
                        <div>Created: {new Date(profileData.createdAt).toLocaleDateString()}</div>
                        <div>Status: {profileData.isActive ? 'Active' : 'Disabled'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'Machines' && <Machines />}

          {activeSection === 'Work Orders' && <Maintenance />}

          {activeSection === 'Spare Parts' && <Spares />}

          {activeSection === 'Employees' && <Employees />}

          {activeSection === 'Departments' && <Department />}

          {activeSection === 'Designations' && <Designation />}

          {activeSection === 'Settings' && <Settings />}

          {activeSection === 'Alerts & Notifications' && <Alerts />}

          {activeSection === 'Vendors' && <Vendors />}

          {activeSection !== 'Dashboard' &&
            activeSection !== 'Machines' &&
            activeSection !== 'Work Orders' &&
            activeSection !== 'Spare Parts' &&
            activeSection !== 'Employees' &&
            activeSection !== 'Departments' &&
            activeSection !== 'Designations' &&
            activeSection !== 'Settings' &&
            activeSection !== 'Alerts & Notifications' &&
            activeSection !== 'Vendors' &&
            activeSection !== 'Logout' && (
              <section className="module-placeholder" aria-live="polite">
                <p className="section-kicker">WORKSPACE</p>
                <h1>{activeSection}</h1>
                <p>This section is ready to be connected to its workspace.</p>
              </section>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
