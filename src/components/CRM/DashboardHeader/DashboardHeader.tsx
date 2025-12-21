import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './DashboardHeader.module.scss';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className={styles.header}>
      <div className={styles.greeting}>
        <h1>Привет, {user?.first_name || 'User'} 👋</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;


