import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import ContactsTable from './ContactsTable';
import styles from './Contacts.module.scss';

const Contacts: React.FC = () => {
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
    <div className={styles.contacts}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        <ContactsTable />
      </div>
    </div>
  );
};

export default Contacts;

