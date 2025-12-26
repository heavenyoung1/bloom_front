import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { dashboardApi } from '../../../services/api';
import type { DashboardData } from '../../../services/api';
import styles from './CustomersTable.module.scss';

const CustomersTable: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('по дате (новейшие)');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardApi.getDashboard();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Ошибка загрузки данных дашборда:', err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredData = dashboardData.filter((item) =>
    item.case_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.event_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedData = filteredData.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const totalEntries = filteredData.length;

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>Все данные</h2>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Загрузка данных...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>Все данные</h2>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
          Ошибка: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Все данные</h2>
        </div>
        <div className={styles.controls}>
          <div className={styles.search}>
            <span className={styles.searchIcon}><FiSearch /></span>
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.sort}>
            <label htmlFor="sort">Сортировка:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="по дате (новейшие)">по дате (новейшие)</option>
              <option value="по названию">по названию</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название дела</th>
              <th>Клиент</th>
              <th>Телефон клиента</th>
              <th>Контакт</th>
              <th>Телефон контакта</th>
              <th>Событие</th>
              <th>Платежей в ожидании</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  Нет данных для отображения
                </td>
              </tr>
            ) : (
              displayedData.map((item, index) => (
                <tr key={index}>
                  <td className={styles.nameCell}>{item.case_name || '—'}</td>
                  <td>{item.client_name || '—'}</td>
                  <td>{item.client_phone || '—'}</td>
                  <td>{item.contact_name || '—'}</td>
                  <td>{item.contact_phone || '—'}</td>
                  <td>{item.event_name || '—'}</td>
                  <td>{item.pending_payments_count ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Показано {startIndex + 1}–{Math.min(endIndex, filteredData.length)} из{' '}
          {totalEntries.toLocaleString()} записей
        </div>
        <div className={styles.paginationControls}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }
            return (
              <button
                key={pageNum}
                className={`${styles.paginationButton} ${
                  currentPage === pageNum ? styles.active : ''
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 7 && currentPage < totalPages - 3 && (
            <>
              <span className={styles.paginationDots}>...</span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomersTable;



