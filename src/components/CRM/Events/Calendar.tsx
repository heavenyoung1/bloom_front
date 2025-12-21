import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import CreateEventForm from './CreateEventForm';
import styles from './Calendar.module.scss';

const Calendar: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleEventCreated = () => {
    // Здесь можно будет обновить список событий, когда он будет реализован
    console.log('Событие создано');
  };

  return (
    <div className={styles.calendar}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        
        <div className={styles.calendarContainer}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>Календарь событий</h2>
              <p className={styles.subtitle}>Управление событиями и встречами</p>
            </div>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              + Создать событие
            </button>
          </div>

          <div className={styles.calendarContent}>
            <p className={styles.placeholderText}>
              Календарь событий находится в разработке. Вы можете создавать события с помощью кнопки выше.
            </p>
          </div>
        </div>

        {showCreateForm && (
          <CreateEventForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              handleEventCreated();
              setShowCreateForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar;

