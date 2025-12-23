import React, { useState, useEffect } from 'react';
import { clientPaymentsApi, clientsApi, paymentDetailApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { CreateClientPaymentRequest, Client, PaymentDetail } from '../../../services/api';
import styles from './CreatePaymentForm.module.scss';

interface CreatePaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  client_id?: string;
  name?: string;
  paid?: string;
  status?: string;
  submit?: string;
}

const CreatePaymentForm: React.FC<CreatePaymentFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingPaymentDetail, setLoadingPaymentDetail] = useState(false);
  
  const [formData, setFormData] = useState<CreateClientPaymentRequest>({
    attorney_id: user?.id || 0,
    client_id: 0,
    condition: '',
    name: '',
    pade_date: '',
    paid: 0,
    paid_deadline: '',
    paid_str: '',
    status: 'Выставлен',
    taxable: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
    if (user?.id) {
      loadPaymentDetail();
    }
  }, [user]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientsApi.getClients();
      setClients(data);
    } catch (err: any) {
      console.error('Ошибка загрузки клиентов:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadPaymentDetail = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingPaymentDetail(true);
      const data = await paymentDetailApi.getPaymentDetailByAttorney(user.id);
      setPaymentDetail(data);
    } catch (err: any) {
      // Платежная информация может отсутствовать
      console.warn('Платежная информация не найдена:', err);
    } finally {
      setLoadingPaymentDetail(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = 'Выберите клиента';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.paid || formData.paid <= 0) {
      newErrors.paid = 'Сумма должна быть больше нуля';
    }

    if (!formData.status) {
      newErrors.status = 'Статус обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await clientPaymentsApi.createClientPayment(formData);
      onSuccess();
    } catch (err: any) {
      console.error('Ошибка создания платежа:', err);
      setErrors({
        submit: err.message || 'Не удалось создать платеж',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Создать платеж</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {paymentDetail && (
          <div className={styles.paymentInfo}>
            <h3>Платежная информация юриста</h3>
            <div className={styles.paymentInfoContent}>
              {paymentDetail.bank_recipient && (
                <p><strong>Банк:</strong> {paymentDetail.bank_recipient}</p>
              )}
              {paymentDetail.bank_account && (
                <p><strong>Счет:</strong> {paymentDetail.bank_account}</p>
              )}
              {paymentDetail.bik && (
                <p><strong>БИК:</strong> {paymentDetail.bik}</p>
              )}
              {paymentDetail.inn && (
                <p><strong>ИНН:</strong> {paymentDetail.inn}</p>
              )}
              {paymentDetail.kpp && (
                <p><strong>КПП:</strong> {paymentDetail.kpp}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.submit && (
            <div className={styles.errorMessage}>{errors.submit}</div>
          )}

          <div className={styles.formRow}>
            <label className={styles.label}>
              Клиент *
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.client_id ? styles.inputError : ''}`}
                disabled={isSubmitting || loadingClients}
              >
                <option value={0}>Выберите клиента</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <span className={styles.errorText}>{errors.client_id}</span>
              )}
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Название платежа *
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                placeholder="Оплата юридических услуг по уголовному делу № 151093"
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name}</span>
              )}
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Сумма (руб.) *
              <input
                type="number"
                name="paid"
                value={formData.paid}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.paid ? styles.inputError : ''}`}
                placeholder="30000.05"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
              {errors.paid && (
                <span className={styles.errorText}>{errors.paid}</span>
              )}
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Сумма прописью
              <input
                type="text"
                name="paid_str"
                value={formData.paid_str}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Тридцать тысяч рублей, пять копеек"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Статус *
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.status ? styles.inputError : ''}`}
                disabled={isSubmitting}
              >
                <option value="Выставлен">Выставлен</option>
                <option value="Оплачен">Оплачен</option>
                <option value="Просрочен">Просрочен</option>
              </select>
              {errors.status && (
                <span className={styles.errorText}>{errors.status}</span>
              )}
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Дата выставления
              <input
                type="date"
                name="pade_date"
                value={formData.pade_date}
                onChange={handleInputChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Срок оплаты
              <input
                type="date"
                name="paid_deadline"
                value={formData.paid_deadline}
                onChange={handleInputChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Условия оплаты
              <textarea
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Оплата производится в течение пяти дней с момента выставления счета."
                rows={3}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="taxable"
                checked={formData.taxable}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
              <span>Облагается налогом</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание...' : 'Создать платеж'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePaymentForm;

