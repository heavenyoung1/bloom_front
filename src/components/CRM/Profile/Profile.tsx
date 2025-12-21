import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.container}>
          <h1 className={styles.title}>Личный кабинет</h1>
          
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>
                {user?.first_name || 'User'} {user?.last_name || ''}
              </h2>
              <p className={styles.profileRole}>Юрист</p>
              {user?.email && (
                <p className={styles.profileEmail}>{user.email}</p>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <span className={styles.logoutIcon}>🚪</span>
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

