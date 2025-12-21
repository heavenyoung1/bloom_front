import React, { useState, useEffect } from 'react';
import { clientsApi } from '../../../services/api';
import type { Client } from '../../../services/api';
import CreateClientForm from './CreateClientForm';
import ClientDetails from './ClientDetails';
import styles from './ClientsTable.module.scss';

const ClientsTable: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const itemsPerPage = 8;

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.getClients();
      setClients(data);
    } catch (err: any) {
      console.error('Ошибка загрузки клиентов:', err);
      setError(err.message || 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedClients = filteredClients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const getMessengerIcon = (messenger: string) => {
    switch (messenger.toLowerCase()) {
      case 'telegram':
        return '✈️';
      case 'whatsapp':
        return '💬';
      case 'viber':
        return '💜';
      default:
        return '📱';
    }
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>Загрузка клиентов...</div>
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
          <h2 className={styles.title}>Все клиенты</h2>
          <p className={styles.subtitle}>Активные клиенты ({filteredClients.length})</p>
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
            + Создать клиента
          </button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? 'Клиенты не найдены' : 'Нет клиентов'}
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Мессенджер</th>
                  <th>Никнейм</th>
                </tr>
              </thead>
              <tbody>
                {displayedClients.map((client) => (
                  <tr 
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={styles.tableRow}
                  >
                    <td className={styles.nameCell}>{client.name}</td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>
                      <span className={styles.messenger}>
                        {getMessengerIcon(client.messenger)} {client.messenger}
                      </span>
                    </td>
                    <td>
                      {client.messenger_handle ? (
                        <span className={styles.handle}>@{client.messenger_handle}</span>
                      ) : (
                        <span className={styles.noHandle}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Показано {startIndex + 1} - {Math.min(endIndex, filteredClients.length)} из{' '}
                {filteredClients.length} записей
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
        <CreateClientForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchClients();
            setShowCreateForm(false);
          }}
        />
      )}

      {selectedClientId && (
        <ClientDetails
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
          onUpdate={() => {
            fetchClients();
          }}
          onDelete={() => {
            fetchClients();
            setSelectedClientId(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientsTable;

