import React, { useState, useEffect } from 'react';
import { clientPaymentsApi, clientsApi } from '../../../services/api';
import type { ClientPayment, Client } from '../../../services/api';
import styles from './PaymentDetails.module.scss';

interface PaymentDetailsProps {
  paymentId: number;
  onClose: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentId, onClose }) => {
  const [paymentData, setPaymentData] = useState<ClientPayment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    switch (status.toLowerCase()) {
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
      default:
        return styles.statusDefault;
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
              <span className={`${styles.statusBadge} ${getStatusColor(paymentData.status)}`}>
                {paymentData.status}
              </span>
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

