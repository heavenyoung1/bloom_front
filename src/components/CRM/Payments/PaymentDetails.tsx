import React, { useState, useEffect } from 'react';
import { clientPaymentsApi, clientsApi } from '../../../services/api';
import type { ClientPayment, Client } from '../../../services/api';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import styles from './PaymentDetails.module.scss';

interface PaymentDetailsProps {
  paymentId: number;
  onClose: () => void;
}

// Маппинг статусов: английский ключ -> русское название
const statusMap: Record<string, string> = {
  draft: 'Черновик',
  issued: 'Выставлен',
  sent: 'Отправлен',
  pending: 'Ожидание оплаты',
  paid: 'Оплачен',
  partially_paid: 'Частично оплачен',
  overdue: 'Просрочен',
  cancelled: 'Отменен',
  refunded: 'Возвращен',
  failed: 'Ошибка',
};

// Обратный маппинг: русское название -> английский ключ
const statusMapReverse: Record<string, string> = {
  'Черновик': 'draft',
  'Выставлен': 'issued',
  'Отправлен': 'sent',
  'Ожидание оплаты': 'pending',
  'Оплачен': 'paid',
  'Частично оплачен': 'partially_paid',
  'Просрочен': 'overdue',
  'Отменен': 'cancelled',
  'Возвращен': 'refunded',
  'Ошибка': 'failed',
};

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentId, onClose }) => {
  const [paymentData, setPaymentData] = useState<ClientPayment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [paymentId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientPaymentsApi.getClientPayment(paymentId);
      setPaymentData(data);
      
      // Загружаем информацию о клиенте
      if (data.client_id) {
        try {
          const clientData = await clientsApi.getClient(data.client_id);
          setClient(clientData);
        } catch (err) {
          console.error('Ошибка загрузки клиента:', err);
        }
      }
    } catch (err: any) {
      console.error('Ошибка загрузки платежа:', err);
      setError(err.message || 'Не удалось загрузить платеж');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
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
    // Нормализуем статус к русскому формату для сравнения
    const normalizedStatus = getRussianStatus(status).toLowerCase();
    
    switch (normalizedStatus) {
      case 'выставлен':
        return styles.statusIssued;
      case 'оплачен':
        return styles.statusPaid;
      case 'отправлен':
        return styles.statusSent;
      case 'черновик':
        return styles.statusDraft;
      case 'просрочен':
        return styles.statusOverdue;
      case 'ожидание оплаты':
        return styles.statusPending;
      case 'частично оплачен':
        return styles.statusPartiallyPaid;
      case 'отменен':
        return styles.statusCancelled;
      case 'возвращен':
        return styles.statusRefunded;
      case 'ошибка':
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  // Функция для получения русского названия статуса
  const getRussianStatus = (status: string): string => {
    // Если статус уже на русском, возвращаем как есть
    if (statusMapReverse[status]) {
      return status;
    }
    // Если статус на английском, преобразуем в русский
    return statusMap[status] || status;
  };

  // Функция для получения английского ключа статуса
  const getEnglishStatus = (status: string): string => {
    // Если статус на русском, преобразуем в английский
    if (statusMapReverse[status]) {
      return statusMapReverse[status];
    }
    // Если статус уже на английском, возвращаем как есть
    return status;
  };

  const handleEditStatus = () => {
    if (!paymentData) return;
    setIsEditingStatus(true);
    setSaveError(null);
    // Преобразуем статус в русский для отображения в селекте
    setSelectedStatus(getRussianStatus(paymentData.status));
  };

  const handleCancelEdit = () => {
    setIsEditingStatus(false);
    setSelectedStatus('');
  };

  const handleSaveStatus = async () => {
    if (!paymentData) return;

    try {
      setSaving(true);
      setSaveError(null);

      // API ожидает русские значения статусов
      const updatedPayment = await clientPaymentsApi.updateClientPayment(paymentId, {
        status: selectedStatus,
      });

      // Обновляем локальное состояние с данными с сервера
      setPaymentData(updatedPayment);
      setIsEditingStatus(false);
      setSelectedStatus('');
    } catch (err: any) {
      console.error('Ошибка обновления статуса:', err);
      setSaveError(err.message || 'Не удалось обновить статус');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>
            <p>Загрузка платежа...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>
            <p>{error || 'Платеж не найден'}</p>
            <button onClick={onClose} className={styles.closeButton}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Детали платежа</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Название</span>
              <span className={styles.infoValue}>{paymentData.name}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Клиент</span>
              <span className={styles.infoValue}>
                {client ? client.name : `ID: ${paymentData.client_id}`}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Сумма</span>
              <span className={styles.infoValue}>{formatCurrency(paymentData.paid)}</span>
            </div>

            {paymentData.paid_str && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Сумма прописью</span>
                <span className={styles.infoValue}>{paymentData.paid_str}</span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Статус</span>
              <div className={styles.statusContainer}>
                {isEditingStatus ? (
                  <div className={styles.statusEditContainer}>
                    <select
                      className={styles.statusSelect}
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={saving}
                    >
                      {Object.entries(statusMap).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveStatus}
                      disabled={saving}
                      title="Сохранить"
                    >
                      <FiCheck />
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      title="Отменить"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className={styles.statusDisplayContainer}>
                    <span className={`${styles.statusBadge} ${getStatusColor(paymentData.status)}`}>
                      {getRussianStatus(paymentData.status)}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={handleEditStatus}
                      title="Редактировать статус"
                    >
                      <FiEdit2 />
                    </button>
                  </div>
                )}
              </div>
              {saveError && (
                <span className={styles.saveError}>{saveError}</span>
              )}
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата выставления</span>
              <span className={styles.infoValue}>
                {formatDate(paymentData.pade_date)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Срок оплаты</span>
              <span className={styles.infoValue}>
                {formatDate(paymentData.paid_deadline)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Облагается налогом</span>
              <span className={styles.infoValue}>
                {paymentData.taxable ? 'Да' : 'Нет'}
              </span>
            </div>

            {paymentData.condition && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Условия оплаты</span>
                <span className={styles.infoValue}>{paymentData.condition}</span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата создания</span>
              <span className={styles.infoValue}>
                {formatDate(paymentData.created_at)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата обновления</span>
              <span className={styles.infoValue}>
                {formatDate(paymentData.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;

