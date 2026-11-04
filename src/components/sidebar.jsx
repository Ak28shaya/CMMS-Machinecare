import { FiBell, FiBox, FiGrid, FiSettings, FiUsers, FiX } from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', icon: FiGrid },
  { label: 'Employees', icon: FiUsers },
  { label: 'Machines', icon: FiSettings },
  { label: 'Spare Parts', icon: FiBox },
  { label: 'Alerts', icon: FiBell }
];

function Sidebar({ activeSection, onNavigate, isOpen, onClose }) {
  return (
    <aside className={`app-sidebar${isOpen ? ' open' : ''}`} aria-label="Main navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-title">MachineCare</span>
            <span className="sidebar-badge">CMMS</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="sidebar-section-title">Navigation</div>

      <nav className="sidebar-nav">
        {menuItems.map(({ label, icon: Icon }) => {
          const isActive = activeSection === label;
          return (
            <button
              key={label}
              type="button"
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                onNavigate(label);
                if (onClose) onClose();
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="sidebar-nav-icon" aria-hidden="true" />
              <span className="sidebar-nav-label">{label}</span>
              {isActive && <span className="active-pip" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
