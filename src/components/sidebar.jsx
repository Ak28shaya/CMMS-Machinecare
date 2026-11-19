import { useState } from 'react';
import {
  FiGrid,
  FiCpu,
  FiUsers,
  FiBriefcase,
  FiAward,
  FiBox,
  FiArchive,
  FiTruck,
  FiClipboard,
  FiCalendar,
  FiTool,
  FiBell,
  FiUserCheck,
  FiUser,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiX
} from 'react-icons/fi';

const menuGroups = [
  {
    title: 'Asset Management',
    items: [
      { label: 'Machines', icon: FiCpu },
      { label: 'Employees', icon: FiUsers },
      { label: 'Departments', icon: FiBriefcase },
      { label: 'Designations', icon: FiAward },
      { label: 'Spare Parts', icon: FiBox },
      { label: 'Inventory', icon: FiArchive },
      { label: 'Vendors', icon: FiTruck }
    ]
  },
  {
    title: 'Maintenance Management',
    items: [
      { label: 'Work Orders', icon: FiClipboard },
      { label: 'Preventive Maintenance', icon: FiCalendar },
      { label: 'Breakdown Maintenance', icon: FiTool },
      { label: 'Maintenance Calendar', icon: FiCalendar },
      { label: 'Alerts & Notifications', icon: FiBell }
    ]
  },
  {
    title: 'Reports & Analytics',
    items: [
      { label: 'Machine Reports', icon: FiCpu },
      { label: 'Maintenance Reports', icon: FiTool },
      { label: 'Inventory Reports', icon: FiArchive },
      { label: 'Employee Reports', icon: FiUsers }
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'User Management', icon: FiUserCheck },
      { label: 'Role & Permissions', icon: FiUserCheck },
      { label: 'Audit Logs', icon: FiClipboard },
      { label: 'Settings', icon: FiSettings }
    ]
  }
];

function Sidebar({ activeSection, onNavigate, onLogout, isOpen, onClose }) {
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(menuGroups.map(({ title }) => [title, true]))
  );

  const navigate = (label) => {
    onNavigate(label);
    if (onClose) onClose();
  };

  const toggleGroup = (title) => {
    setExpandedGroups((groups) => ({
      ...groups,
      [title]: !groups[title]
    }));
  };

  return (
    <aside className={`app-sidebar${isOpen ? ' open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-title">MACHINECARE</span>
            <span className="sidebar-subtitle">Maintenance Management System</span>
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

      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          <div className="sidebar-section-title">Overview</div>
          <button
            type="button"
            className={`sidebar-nav-item${activeSection === 'Dashboard' ? ' active' : ''}`}
            onClick={() => navigate('Dashboard')}
            aria-current={activeSection === 'Dashboard' ? 'page' : undefined}
          >
            <FiGrid className="sidebar-nav-icon" aria-hidden="true" />
            <span className="sidebar-nav-label">Dashboard</span>
            {activeSection === 'Dashboard' && <span className="active-pip" aria-hidden="true" />}
          </button>
        </div>

        {menuGroups.map(({ title, items }) => {
          const isExpanded = expandedGroups[title];
          const submenuId = `sidebar-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          return (
            <div className="sidebar-nav-group" key={title}>
              <button
                type="button"
                className="sidebar-group-toggle"
                onClick={() => toggleGroup(title)}
                aria-expanded={isExpanded}
                aria-controls={submenuId}
              >
                <span>{title}</span>
                <FiChevronDown
                  className={`sidebar-group-arrow${isExpanded ? ' expanded' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={submenuId}
                className={`sidebar-submenu${isExpanded ? ' expanded' : ''}`}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
              >
                <div className="sidebar-submenu-inner">
                  {items.map(({ label, icon: Icon }) => {
                    const isActive = activeSection === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                        onClick={() => navigate(label)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="sidebar-nav-icon" aria-hidden="true" />
                        <span className="sidebar-nav-label">{label}</span>
                        {isActive && <span className="active-pip" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-nav-item${activeSection === 'My Profile' ? ' active' : ''}`}
          onClick={() => navigate('My Profile')}
          aria-current={activeSection === 'My Profile' ? 'page' : undefined}
        >
          <FiUser className="sidebar-nav-icon" aria-hidden="true" />
          <span className="sidebar-nav-label">My Profile</span>
          {activeSection === 'My Profile' && <span className="active-pip" aria-hidden="true" />}
        </button>
        <button type="button" className="sidebar-nav-item" onClick={onLogout}>
          <FiLogOut className="sidebar-nav-icon" aria-hidden="true" />
          <span className="sidebar-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
