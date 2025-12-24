import React, { useState, useEffect } from 'react';
import { contactsApi, casesApi } from '../../../services/api';
import type { CreateContactRequest, Case } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './CreateContactForm.module.scss';

interface CreateContactFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  case_id?: string;
  personal_info?: string;
  submit?: string;
}

const CreateContactForm: React.FC<CreateContactFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [formData, setFormData] = useState<CreateContactRequest>({
    attorney_id: user?.id || 0,
    case_id: 0,
    email: '',
    name: '',
    personal_info: '',
    phone: '+7',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({
        ...prev,
        attorney_id: user.id,
      }));
    }
  }, [user]);

  const fetchCases = async () => {
    try {
      const data = await casesApi.getCases();
      setCases(data);
    } catch (err: any) {
      console.error('Ошибка загрузки дел:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'case_id' ? parseInt(value, 10) : value,
    }));

    // Очищаем ошибку при изменении поля
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Имя
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    // Телефон
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    // Дело
    if (!formData.case_id || formData.case_id === 0) {
      newErrors.case_id = 'Выберите дело';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setErrors({ submit: 'Пользователь не авторизован' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await contactsApi.createContact({
        ...formData,
        attorney_id: user.id,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания контакта:', error);
      
      // Обрабатываем ошибки валидации от сервера
      if (error.errors) {
        const serverErrors: FormErrors = {};
        Object.keys(error.errors).forEach((key) => {
          if (error.errors[key] && error.errors[key].length > 0) {
            serverErrors[key as keyof FormErrors] = error.errors[key][0];
          }
        });
        setErrors(serverErrors);
      } else {
        setErrors({
          submit: error.message || 'Не удалось создать контакт. Попробуйте еще раз.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Создать контакт</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.submit && (
            <div className={styles.errorMessage}>{errors.submit}</div>
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
              className={`${styles.select} ${errors.case_id ? styles.inputError : ''}`}
            >
              <option value={0}>Выберите дело</option>
              {cases.map((caseItem) => (
                <option key={caseItem.id} value={caseItem.id}>
                  {caseItem.name}
                </option>
              ))}
            </select>
            {errors.case_id && <span className={styles.errorText}>{errors.case_id}</span>}
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
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Петров Пётр Петрович"
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
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
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="contact@example.com"
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
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
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              placeholder="+79991234567"
            />
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
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
            {errors.personal_info && (
              <span className={styles.errorText}>{errors.personal_info}</span>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание...' : 'Создать контакт'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContactForm;

