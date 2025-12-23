import React, { useState, useEffect } from 'react';
import { clientPaymentsApi, clientsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { ClientPayment, Client } from '../../../services/api';
import CreatePaymentForm from './CreatePaymentForm';
import styles from './PaymentsTable.module.scss';

const PaymentsTable: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [clients, setClients] = useState<Map<number, Client>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const itemsPerPage = 10;


  const fetchPayments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем платежи и клиентов параллельно
      const [paymentsData, clientsData] = await Promise.all([
        clientPaymentsApi.getClientPaymentsByAttorney(user.id),
        clientsApi.getClients(),
      ]);
      
      setPayments(paymentsData);
      
      // Создаем Map для быстрого доступа к клиентам по ID
      const clientsMap = new Map<number, Client>();
      clientsData.forEach((client) => {
        clientsMap.set(client.id, client);
      });
      setClients(clientsMap);
    } catch (err: any) {
      console.error('Ошибка загрузки платежей:', err);
      setError(err.message || 'Не удалось загрузить платежи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const getClientName = (clientId: number): string => {
    const client = clients.get(clientId);
    return client ? client.name : `ID: ${clientId}`;
  };

  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    const clientName = getClientName(payment.client_id).toLowerCase();
    return (
      payment.name.toLowerCase().includes(searchLower) ||
      payment.status.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPayments = filteredPayments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'выставлен':
        return styles.statusIssued;
      case 'оплачен':
        return styles.statusPaid;
      case 'просрочен':
        return styles.statusOverdue;
      default:
        return styles.statusDefault;
    }
  };

  const handleDelete = async (paymentId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот платеж?')) {
      return;
    }

    try {
      await clientPaymentsApi.deleteClientPayment(paymentId);
      await fetchPayments();
    } catch (err: any) {
      console.error('Ошибка удаления платежа:', err);
      alert(err.message || 'Не удалось удалить платеж');
    }
  };

  const handleDownloadPdf = async (paymentId: number) => {
    try {
      const blob = await clientPaymentsApi.downloadPaymentPdf(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Ошибка скачивания PDF:', err);
      alert(err.message || 'Не удалось скачать PDF');
    }
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>Загрузка платежей...</div>
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
          <h2 className={styles.title}>Все платежи</h2>
          <p className={styles.subtitle}>Платежи клиентов ({filteredPayments.length})</p>
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
            + Создать платеж
          </button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? 'Платежи не найдены' : 'Нет платежей'}
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Клиент</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Срок оплаты</th>
                  <th>Дата выставления</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayedPayments.map((payment) => (
                  <tr key={payment.id} className={styles.tableRow}>
                    <td className={styles.nameCell}>{payment.name}</td>
                    <td className={styles.clientCell}>{getClientName(payment.client_id)}</td>
                    <td className={styles.amountCell}>{formatCurrency(payment.paid)}</td>
                    <td>
                      <span className={`${styles.status} ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{formatDate(payment.paid_deadline)}</td>
                    <td>{formatDate(payment.pade_date)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownloadPdf(payment.id)}
                          title="Скачать PDF"
                        >
                          📄
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(payment.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </button>
              <span className={styles.paginationInfo}>
                Страница {currentPage} из {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <CreatePaymentForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
};

export default PaymentsTable;

