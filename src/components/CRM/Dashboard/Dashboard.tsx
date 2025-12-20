import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Dashboard.module.scss';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Панель управления</h1>
        <div className={styles.userInfo}>
          <span>
            {user?.first_name} {user?.last_name}
          </span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcome}>
          <h2>Добро пожаловать, {user?.first_name}!</h2>
          <p>Здесь будет ваша панель управления делами и клиентами</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Дела</h3>
            <p className={styles.statValue}>0</p>
          </div>
          <div className={styles.statCard}>
            <h3>Клиенты</h3>
            <p className={styles.statValue}>0</p>
          </div>
          <div className={styles.statCard}>
            <h3>События</h3>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

