import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import PaymentsTable from './PaymentsTable';
import styles from './Payments.module.scss';

const Payments: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={styles.payments}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        <PaymentsTable />
      </div>
    </div>
  );
};

export default Payments;

