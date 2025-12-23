import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import styles from './PlaceholderPage.module.scss';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
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
    <div className={styles.page}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.container}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          <div className={styles.placeholder}>
            <p>Эта страница находится в разработке</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;


