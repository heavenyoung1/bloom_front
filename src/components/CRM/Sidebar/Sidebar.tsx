import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Sidebar.module.scss';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isDivider?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊', path: '/dashboard' },
  { id: 'cases', label: 'Дела', icon: '📁', path: '/cases' },
  { id: 'clients', label: 'Клиенты', icon: '👥', path: '/clients' },
  { id: 'contacts', label: 'Контакты', icon: '📇', path: '/contacts' },
  { id: 'calendar', label: 'Календарь', icon: '📅', path: '/calendar' },
  { id: 'payments', label: 'Платежи', icon: '💳', path: '/payments' },
  { id: 'assistant', label: 'Универсальный помощник юриста', icon: '🤖', path: '/assistant' },
  { id: 'divider1', label: '', icon: '', path: '', isDivider: true },
  { id: 'help', label: 'Поддержка', icon: '❓', path: '/help' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', path: '/settings' },
  { id: 'divider2', label: '', icon: '', path: '', isDivider: true },
  { id: 'profile', label: 'Личный кабинет', icon: '👤', path: '/profile' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeItem = navItems.find(item => location.pathname === item.path) || navItems[0];

  // Закрываем выпадающее меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Темная секция с иконками */}
      <div className={styles.iconBar}>
        <div className={styles.logo}>⚡</div>
        {navItems
          .filter(item => !item.isDivider)
          .map((item) => (
            <button
              key={item.id}
              className={`${styles.iconButton} ${activeItem.id === item.id ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        {/* Кнопка сворачивания */}
        <button
          className={styles.toggleButton}
          onClick={onToggle}
          title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Белая панель с навигацией */}
      <div className={`${styles.navPanel} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.navHeader}>
          <h2>Dashboard v.01</h2>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            if (item.isDivider) {
              return !isCollapsed ? (
                <div key={item.id} className={styles.divider} />
              ) : null;
            }
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeItem.id === item.id ? styles.active : ''}`}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {activeItem.id === item.id && (
                      <span className={styles.navArrow}>→</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Профиль пользователя - только если выбран раздел Личный кабинет */}
        {activeItem.id === 'profile' && !isCollapsed && (
          <div className={styles.profile} ref={profileRef}>
            <div className={styles.profileInfo}>
              <div className={styles.profileAvatar}>
                {user?.first_name?.[0] || 'U'}
              </div>
              <div className={styles.profileDetails}>
                <div className={styles.profileName}>
                  {user?.first_name || 'User'} {user?.last_name || ''}
                </div>
                <div className={styles.profileRole}>Юрист</div>
              </div>
            </div>
            <button
              className={styles.profileDropdown}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {isProfileOpen ? '▲' : '▼'}
            </button>
            
            {/* Выпадающее меню */}
            {isProfileOpen && (
              <div className={styles.profileMenu}>
                <button
                  className={styles.profileMenuItem}
                  onClick={handleLogout}
                >
                  <span className={styles.menuIcon}>🚪</span>
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;


