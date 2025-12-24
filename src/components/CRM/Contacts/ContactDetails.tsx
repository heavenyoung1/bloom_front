import React, { useState, useEffect } from 'react';
import { contactsApi, casesApi } from '../../../services/api';
import type { Contact, UpdateContactRequest, Case } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ContactDetails.module.scss';

interface ContactDetailsProps {
  contactId: number;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({ contactId, onClose, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [contactData, setContactData] = useState<Contact | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<UpdateContactRequest>({
    case_id: 0,
    email: '',
    name: '',
    personal_info: '',
    phone: '+7',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadContactData();
    fetchCases();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsApi.getContact(contactId);
      setContactData(data);
      setFormData({
        case_id: data.case_id,
        email: data.email,
        name: data.name,
        personal_info: data.personal_info,
        phone: data.phone,
      });
    } catch (err: any) {
      console.error('Ошибка загрузки контакта:', err);
      setError(err.message || 'Не удалось загрузить контакт');
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

  const getCaseName = (caseId: number): string => {
    const caseItem = cases.find((c) => c.id === caseId);
    return caseItem ? caseItem.name : `Дело #${caseId}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'case_id' ? parseInt(value, 10) : value,
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
    
    if (!formData.case_id || formData.case_id === 0) {
      errors.case_id = 'Выберите дело';
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
      await contactsApi.updateContact(contactId, formData);
      setIsEditing(false);
      loadContactData();
      onUpdate();
    } catch (err: any) {
      console.error('Ошибка обновления контакта:', err);
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ submit: err.message || 'Не удалось обновить контакт' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот контакт? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await contactsApi.deleteContact(contactId);
      onDelete();
      onClose();
    } catch (err: any) {
      console.error('Ошибка удаления контакта:', err);
      alert(err.message || 'Не удалось удалить контакт');
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

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Загрузка контакта...</div>
        </div>
      </div>
    );
  }

  if (error || !contactData) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>
            <p>{error || 'Контакт не найден'}</p>
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
            {isEditing ? 'Редактирование контакта' : 'Детали контакта'}
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
                <label htmlFor="case_id" className={styles.label}>
                  Дело <span className={styles.required}>*</span>
                </label>
                <select
                  id="case_id"
                  name="case_id"
                  value={formData.case_id}
                  onChange={handleInputChange}
                  className={`${styles.select} ${formErrors.case_id ? styles.inputError : ''}`}
                >
                  <option value={0}>Выберите дело</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.name}
                    </option>
                  ))}
                </select>
                {formErrors.case_id && (
                  <span className={styles.errorText}>{formErrors.case_id}</span>
                )}
              </div>

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
                  placeholder="Петров Пётр Петрович"
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
                  placeholder="contact@example.com"
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
                  placeholder="1515421842"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    loadContactData();
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
                  <span className={styles.infoValue}>{contactData.name}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{contactData.email}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Телефон:</span>
                  <span className={styles.infoValue}>{contactData.phone}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Дело:</span>
                  <span className={styles.infoValue}>{getCaseName(contactData.case_id)}</span>
                </div>
                
                {contactData.personal_info && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Личные данные:</span>
                    <span className={styles.infoValue}>{contactData.personal_info}</span>
                  </div>
                )}
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Дата создания:</span>
                  <span className={styles.infoValue}>{formatDate(contactData.created_at)}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Последнее обновление:</span>
                  <span className={styles.infoValue}>{formatDate(contactData.updated_at)}</span>
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

export default ContactDetails;

