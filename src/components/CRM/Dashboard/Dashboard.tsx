import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import MetricCard from '../MetricCard/MetricCard';
import NearestEvents from './NearestEvents';
import CustomersTable from '../CustomersTable/CustomersTable';
import { FiBriefcase, FiClock } from 'react-icons/fi';
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
          <MetricCard
            title="Активные дела"
            value="—"
            icon={<FiBriefcase />}
          />
          <MetricCard
            title="Платежей в ожидании"
            value="—"
            icon={<FiClock />}
          />
          <NearestEvents />
        </div>

        <CustomersTable />
      </div>
    </div>
  );
};

export default Dashboard;

