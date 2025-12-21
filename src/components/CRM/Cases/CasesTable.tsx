import React, { useState, useEffect } from 'react';
import { casesApi } from '../../../services/api';
import type { Case } from '../../../services/api';
import CreateCaseForm from './CreateCaseForm';
import styles from './CasesTable.module.scss';

const CasesTable: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const itemsPerPage = 8;

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await casesApi.getCases();
      setCases(data);
    } catch (err: any) {
      console.error('Ошибка загрузки дел:', err);
      setError(err.message || 'Не удалось загрузить дела');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter((caseItem) =>
    caseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedCases = filteredCases.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новое':
        return '#3b82f6'; // синий
      case 'В работе':
        return '#f59e0b'; // оранжевый
      case 'Завершено':
        return '#10b981'; // зеленый
      case 'Отменено':
        return '#ef4444'; // красный
      default:
        return '#6b7280'; // серый
    }
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>Загрузка дел...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.error}>Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Все дела</h2>
          <p className={styles.subtitle}>Активные дела ({filteredCases.length})</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateForm(true)}
          >
            + Создать дело
          </button>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? 'Дела не найдены' : 'Нет дел'}
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                </tr>
              </thead>
              <tbody>
                {displayedCases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td className={styles.nameCell}>{caseItem.name}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(caseItem.status) }}
                      >
                        {caseItem.status}
                      </span>
                    </td>
                    <td>{formatDate(caseItem.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Показано {startIndex + 1} - {Math.min(endIndex, filteredCases.length)} из{' '}
                {filteredCases.length} записей
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
          )}
        </>
      )}

      {showCreateForm && (
        <CreateCaseForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchCases();
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

export default CasesTable;

