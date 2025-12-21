import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import MetricCard from '../MetricCard/MetricCard';
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
          <MetricCard
            title="Total Customers"
            value="5,423"
            icon="👥"
            change={{ value: '16% this month', isPositive: true }}
          />
          <MetricCard
            title="Members"
            value="1,893"
            icon="👤"
            change={{ value: '1% this month', isPositive: false }}
          />
          <MetricCard
            title="Active Now"
            value="189"
            icon="💻"
            activeUsers={['A', 'B', 'C', 'D']}
          />
        </div>

        <CustomersTable />
      </div>
    </div>
  );
};

export default Dashboard;

