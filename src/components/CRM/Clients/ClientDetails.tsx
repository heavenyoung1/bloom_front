import React, { useState, useEffect } from 'react';
import { clientsApi } from '../../../services/api';
import type { Client, UpdateClientRequest } from '../../../services/api';
import styles from './ClientDetails.module.scss';

interface ClientDetailsProps {
  clientId: number;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId, onClose, onUpdate, onDelete }) => {
  const [clientData, setClientData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<UpdateClientRequest>({
    name: '',
    type: true,
    email: '',
    phone: '+7',
    personal_info: '',
    address: '',
    messenger: 'Telegram',
    messenger_handle: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.getClient(clientId);
      setClientData(data);
      setFormData({
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        personal_info: data.personal_info,
        address: data.address,
        messenger: data.messenger,
        messenger_handle: data.messenger_handle,
      });
    } catch (err: any) {
      console.error('Ошибка загрузки клиента:', err);
      setError(err.message || 'Не удалось загрузить клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Имя обязательно';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Введите корректный email';
    }
    
    if (!formData.phone?.trim()) {
      errors.phone = 'Телефон обязателен';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Введите корректный номер телефона';
    }
    
    if (!formData.messenger) {
      errors.messenger = 'Выберите мессенджер';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await clientsApi.updateClient(clientId, formData);
      setIsEditing(false);
      loadClientData();
      onUpdate();
    } catch (err: any) {
      console.error('Ошибка обновления клиента:', err);
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ submit: err.message || 'Не удалось обновить клиента' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этого клиента? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await clientsApi.deleteClient(clientId);
      onDelete();
      onClose();
    } catch (err: any) {
      console.error('Ошибка удаления клиента:', err);
      alert(err.message || 'Не удалось удалить клиента');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessengerIcon = (messenger: string) => {
    switch (messenger.toLowerCase()) {
      case 'telegram':
        return '✈️';
      case 'whatsapp':
        return '💬';
      case 'max':
        return '📱';
      default:
        return '📱';
    }
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Загрузка клиента...</div>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>
            <p>{error || 'Клиент не найден'}</p>
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
          <h2 className={styles.title}>
            {isEditing ? 'Редактирование клиента' : 'Детали клиента'}
          </h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isEditing ? (
            <div className={styles.editForm}>
              {formErrors.submit && (
                <div className={styles.errorMessage}>{formErrors.submit}</div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Имя <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.name ? styles.inputError : ''}`}
                  placeholder="ООО Рога и Копыта или Иванов Иван Иванович"
                />
                {formErrors.name && (
                  <span className={styles.errorText}>{formErrors.name}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
                  placeholder="client@example.com"
                />
                {formErrors.email && (
                  <span className={styles.errorText}>{formErrors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Телефон <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.phone ? styles.inputError : ''}`}
                  placeholder="+79991234567"
                />
                {formErrors.phone && (
                  <span className={styles.errorText}>{formErrors.phone}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="personal_info" className={styles.label}>
                  Личные данные
                </label>
                <input
                  type="text"
                  id="personal_info"
                  name="personal_info"
                  value={formData.personal_info}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="1212 443443"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>
                  Адрес
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="г. Москва, ул. Пушкина, д.1"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="messenger" className={styles.label}>
                  Мессенджер <span className={styles.required}>*</span>
                </label>
                <select
                  id="messenger"
                  name="messenger"
                  value={formData.messenger}
                  onChange={handleInputChange}
                  className={`${styles.select} ${formErrors.messenger ? styles.inputError : ''}`}
                >
                  <option value="Telegram">Telegram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="MAX">MAX</option>
                </select>
                {formErrors.messenger && (
                  <span className={styles.errorText}>{formErrors.messenger}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="messenger_handle" className={styles.label}>
                  Никнейм в мессенджере
                </label>
                <input
                  type="text"
                  id="messenger_handle"
                  name="messenger_handle"
                  value={formData.messenger_handle}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="@client123"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="type"
                    checked={formData.type}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span>Юридическое лицо</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    loadClientData();
                  }}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Имя:</span>
                  <span className={styles.infoValue}>{clientData.name}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Тип:</span>
                  <span className={styles.infoValue}>
                    {clientData.type ? 'Юридическое лицо' : 'Физическое лицо'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{clientData.email}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Телефон:</span>
                  <span className={styles.infoValue}>{clientData.phone}</span>
                </div>
                
                {clientData.personal_info && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Личные данные:</span>
                    <span className={styles.infoValue}>{clientData.personal_info}</span>
                  </div>
                )}
                
                {clientData.address && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Адрес:</span>
                    <span className={styles.infoValue}>{clientData.address}</span>
                  </div>
                )}
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Мессенджер:</span>
                  <span className={styles.infoValue}>
                    {getMessengerIcon(clientData.messenger)} {clientData.messenger}
                  </span>
                </div>
                
                {clientData.messenger_handle && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Никнейм:</span>
                    <span className={styles.infoValue}>@{clientData.messenger_handle}</span>
                  </div>
                )}
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Дата создания:</span>
                  <span className={styles.infoValue}>{formatDate(clientData.created_at)}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Последнее обновление:</span>
                  <span className={styles.infoValue}>{formatDate(clientData.updated_at)}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editButton}
                >
                  Редактировать
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.deleteButton}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;

