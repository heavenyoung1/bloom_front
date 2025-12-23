import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import CasesTable from './CasesTable';
import styles from './Cases.module.scss';

const Cases: React.FC = () => {
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
    <div className={styles.cases}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        <CasesTable />
      </div>
    </div>
  );
};

export default Cases;


