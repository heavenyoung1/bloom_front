import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import PaymentStatusChart from './PaymentStatusChart';
import CaseStatusChart from './CaseStatusChart';
import NearestEvents from './NearestEvents';
import CustomersTable from '../CustomersTable/CustomersTable';
import styles from './Dashboard.module.scss';

const Dashboard: React.FC = () => {
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
    <div className={styles.dashboard}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        
        <div className={styles.metrics}>
          <CaseStatusChart />
          <PaymentStatusChart />
          <NearestEvents />
        </div>

        <CustomersTable />
      </div>
    </div>
  );
};

export default Dashboard;

