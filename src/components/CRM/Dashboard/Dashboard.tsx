import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import MetricCard from '../MetricCard/MetricCard';
import CustomersTable from '../CustomersTable/CustomersTable';
import styles from './Dashboard.module.scss';

const Dashboard: React.FC = () => {
  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.content}>
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

