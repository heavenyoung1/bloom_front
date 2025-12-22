import React, { useState, useEffect } from 'react';
import { casesApi, documentsApi, eventsApi } from '../../../services/api';
import type { Case } from '../../../services/api';
import { getStatusColor } from '../../../types/caseStatus';
import CreateCaseForm from './CreateCaseForm';
import CaseDetails from './CaseDetails';
import styles from './CasesTable.module.scss';

const CasesTable: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [documentsCount, setDocumentsCount] = useState<Record<number, number>>({});
  const [loadingDocumentsCount, setLoadingDocumentsCount] = useState<Record<number, boolean>>({});
  const [eventsCount, setEventsCount] = useState<Record<number, number>>({});
  const [loadingEventsCount, setLoadingEventsCount] = useState<Record<number, boolean>>({});
  const itemsPerPage = 8;

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await casesApi.getCases();
      setCases(data);
      // Загружаем количество документов и событий для каждого дела
      loadDocumentsCounts(data);
      loadEventsCounts(data);
    } catch (err: any) {
      console.error('Ошибка загрузки дел:', err);
      setError(err.message || 'Не удалось загрузить дела');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentsCounts = async (casesList: Case[]) => {
    // Загружаем количество документов для всех дел параллельно
    const counts: Record<number, number> = {};
    const loading: Record<number, boolean> = {};
    
    casesList.forEach(caseItem => {
      loading[caseItem.id] = true;
    });
    setLoadingDocumentsCount({ ...loadingDocumentsCount, ...loading });

    const promises = casesList.map(async (caseItem) => {
      try {
        const count = await documentsApi.getCaseDocumentsCount(caseItem.id);
        counts[caseItem.id] = count;
      } catch (err) {
        console.error(`Ошибка загрузки количества документов для дела ${caseItem.id}:`, err);
        counts[caseItem.id] = 0;
      }
    });

    await Promise.all(promises);
    
    setDocumentsCount({ ...documentsCount, ...counts });
    
    // Очищаем флаги загрузки
    const clearedLoading: Record<number, boolean> = {};
    casesList.forEach(caseItem => {
      clearedLoading[caseItem.id] = false;
    });
    setLoadingDocumentsCount({ ...loadingDocumentsCount, ...clearedLoading });
  };

  const loadEventsCounts = async (casesList: Case[]) => {
    // Загружаем количество событий для всех дел параллельно
    const counts: Record<number, number> = {};
    const loading: Record<number, boolean> = {};
    
    casesList.forEach(caseItem => {
      loading[caseItem.id] = true;
    });
    setLoadingEventsCount({ ...loadingEventsCount, ...loading });

    const promises = casesList.map(async (caseItem) => {
      try {
        const count = await eventsApi.getCaseEventsCount(caseItem.id);
        counts[caseItem.id] = count;
      } catch (err) {
        console.error(`Ошибка загрузки количества событий для дела ${caseItem.id}:`, err);
        counts[caseItem.id] = 0;
      }
    });

    await Promise.all(promises);
    
    setEventsCount({ ...eventsCount, ...counts });
    
    // Очищаем флаги загрузки
    const clearedLoading: Record<number, boolean> = {};
    casesList.forEach(caseItem => {
      clearedLoading[caseItem.id] = false;
    });
    setLoadingEventsCount({ ...loadingEventsCount, ...clearedLoading });
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
                  <th>Количество документов</th>
                  <th>Количество событий</th>
                  <th>Дата создания</th>
                </tr>
              </thead>
              <tbody>
                {displayedCases.map((caseItem) => (
                  <tr 
                    key={caseItem.id}
                    onClick={() => setSelectedCaseId(caseItem.id)}
                    className={styles.tableRow}
                  >
                    <td className={styles.nameCell}>{caseItem.name}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(caseItem.status) }}
                      >
                        {caseItem.status}
                      </span>
                    </td>
                    <td>
                      {loadingDocumentsCount[caseItem.id] ? (
                        <span className={styles.loadingCount}>...</span>
                      ) : (
                        <span className={styles.documentsCount}>
                          {documentsCount[caseItem.id] ?? 0}
                        </span>
                      )}
                    </td>
                    <td>
                      {loadingEventsCount[caseItem.id] ? (
                        <span className={styles.loadingCount}>...</span>
                      ) : (
                        <span className={styles.eventsCount}>
                          {eventsCount[caseItem.id] ?? 0}
                        </span>
                      )}
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

      {selectedCaseId && (
        <CaseDetails
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onUpdate={() => {
            fetchCases();
          }}
          onDelete={() => {
            fetchCases();
            setSelectedCaseId(null);
          }}
        />
      )}
    </div>
  );
};

export default CasesTable;

