import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Sidebar.module.scss';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { id: 'product', label: 'Product', icon: '📦', path: '/product' },
  { id: 'customers', label: 'Customers', icon: '👥', path: '/customers' },
  { id: 'income', label: 'Income', icon: '💰', path: '/income' },
  { id: 'promote', label: 'Promote', icon: '📢', path: '/promote' },
  { id: 'help', label: 'Help', icon: '❓', path: '/help' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const activeItem = navItems.find(item => location.pathname === item.path) || navItems[0];

  return (
    <div className={styles.sidebar}>
      {/* Темная секция с иконками */}
      <div className={styles.iconBar}>
        <div className={styles.logo}>⚡</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.iconButton} ${activeItem.id === item.id ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Белая панель с навигацией */}
      <div className={styles.navPanel}>
        <div className={styles.navHeader}>
          <h2>Dashboard v.01</h2>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeItem.id === item.id ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {activeItem.id === item.id && (
                <span className={styles.navArrow}>→</span>
              )}
            </button>
          ))}
        </nav>

        {/* PRO Upgrade Box */}
        <div className={styles.upgradeBox}>
          <div className={styles.upgradeContent}>
            <p className={styles.upgradeText}>
              Upgrade to PRO to get access all Features!
            </p>
            <button className={styles.upgradeButton}>
              Get Pro Now!
            </button>
          </div>
        </div>

        {/* Профиль пользователя */}
        <div className={styles.profile}>
          <div className={styles.profileInfo}>
            <div className={styles.profileAvatar}>
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className={styles.profileDetails}>
              <div className={styles.profileName}>
                {user?.first_name || 'User'} {user?.last_name || ''}
              </div>
              <div className={styles.profileRole}>Project Manager</div>
            </div>
          </div>
          <button
            className={styles.profileDropdown}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


