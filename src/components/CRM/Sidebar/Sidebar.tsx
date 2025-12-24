import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Sidebar.module.scss';
import CaseOneLogo from './CaseOneLogo';
import {
  FiBarChart2,
  FiBriefcase,
  FiUsers,
  FiPhone,
  FiCalendar,
  FiCreditCard,
  FiZap,
  FiHelpCircle,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronRight,
  FiChevronLeft,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import C1Logo from './C1Logo';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  isDivider?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: <FiBarChart2 />, path: '/dashboard' },
  { id: 'cases', label: 'Дела', icon: <FiBriefcase />, path: '/cases' },
  { id: 'clients', label: 'Клиенты', icon: <FiUsers />, path: '/clients' },
  { id: 'contacts', label: 'Контакты', icon: <FiPhone />, path: '/contacts' },
  { id: 'calendar', label: 'Календарь', icon: <FiCalendar />, path: '/calendar' },
  { id: 'payments', label: 'Платежи', icon: <FiCreditCard />, path: '/payments' },
  { id: 'assistant', label: 'Универсальный помощник юриста', icon: <FiZap />, path: '/assistant' },
  { id: 'divider1', label: '', icon: <></>, path: '', isDivider: true },
  { id: 'help', label: 'Поддержка', icon: <FiHelpCircle />, path: '/help' },
  { id: 'settings', label: 'Настройки', icon: <FiSettings />, path: '/settings' },
  { id: 'divider2', label: '', icon: <></>, path: '', isDivider: true },
  { id: 'profile', label: 'Личный кабинет', icon: <FiUser />, path: '/profile' },
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
        <div className={styles.logo}><C1Logo /></div>
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
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {/* Белая панель с навигацией */}
      <div className={`${styles.navPanel} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.navHeader}>
          <CaseOneLogo />
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
                      <span className={styles.navArrow}><FiChevronRight /></span>
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
              {isProfileOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            
            {/* Выпадающее меню */}
            {isProfileOpen && (
              <div className={styles.profileMenu}>
                <button
                  className={styles.profileMenuItem}
                  onClick={handleLogout}
                >
                  <span className={styles.menuIcon}><FiLogOut /></span>
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


