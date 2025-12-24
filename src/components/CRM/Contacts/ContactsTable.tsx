import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { contactsApi, casesApi } from '../../../services/api';
import type { Contact, Case } from '../../../services/api';
import CreateContactForm from './CreateContactForm';
import ContactDetails from './ContactDetails';
import styles from './ContactsTable.module.scss';

const ContactsTable: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const itemsPerPage = 8;

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsApi.getContacts();
      setContacts(data);
    } catch (err: any) {
      console.error('Ошибка загрузки контактов:', err);
      setError(err.message || 'Не удалось загрузить контакты');
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const data = await casesApi.getCases();
      setCases(data);
    } catch (err: any) {
      console.error('Ошибка загрузки дел:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCases();
  }, []);

  const getCaseName = (caseId: number): string => {
    const caseItem = cases.find((c) => c.id === caseId);
    return caseItem ? caseItem.name : `Дело #${caseId}`;
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedContacts = filteredContacts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>Загрузка контактов...</div>
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
          <h2 className={styles.title}>Все контакты</h2>
          <p className={styles.subtitle}>Активные контакты ({filteredContacts.length})</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.search}>
            <span className={styles.searchIcon}><FiSearch /></span>
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
            + Создать контакт
          </button>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? 'Контакты не найдены' : 'Нет контактов'}
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
                  <th>Дело</th>
                  <th>Личные данные</th>
                </tr>
              </thead>
              <tbody>
                {displayedContacts.map((contact) => (
                  <tr 
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={styles.tableRow}
                  >
                    <td className={styles.nameCell}>{contact.name}</td>
                    <td>{contact.email}</td>
                    <td>{contact.phone}</td>
                    <td>{getCaseName(contact.case_id)}</td>
                    <td>{contact.personal_info || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Показано {startIndex + 1} - {Math.min(endIndex, filteredContacts.length)} из{' '}
                {filteredContacts.length} записей
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
        <CreateContactForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchContacts();
            setShowCreateForm(false);
          }}
        />
      )}

      {selectedContactId && (
        <ContactDetails
          contactId={selectedContactId}
          onClose={() => setSelectedContactId(null)}
          onUpdate={() => {
            fetchContacts();
          }}
          onDelete={() => {
            fetchContacts();
            setSelectedContactId(null);
          }}
        />
      )}
    </div>
  );
};

export default ContactsTable;

