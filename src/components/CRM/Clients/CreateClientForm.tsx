import React, { useState } from 'react';
import { clientsApi } from '../../../services/api';
import type { CreateClientRequest } from '../../../services/api';
import styles from './CreateClientForm.module.scss';

interface CreateClientFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  personal_info?: string;
  address?: string;
  messenger?: string;
  messenger_handle?: string;
  submit?: string;
}

const CreateClientForm: React.FC<CreateClientFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    type: true,
    email: '',
    phone: '+7',
    personal_info: '',
    address: '',
    messenger: 'Telegram',
    messenger_handle: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    // Мессенджер
    if (!formData.messenger) {
      newErrors.messenger = 'Выберите мессенджер';
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
      await clientsApi.createClient(formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания клиента:', error);
      
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
          submit: error.message || 'Не удалось создать клиента. Попробуйте еще раз.',
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
          <h2 className={styles.title}>Создать клиента</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.submit && (
            <div className={styles.errorMessage}>{errors.submit}</div>
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
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="ООО Рога и Копыта или Иванов Иван Иванович"
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
              placeholder="client@example.com"
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
              placeholder="1212 443443"
            />
            {errors.personal_info && (
              <span className={styles.errorText}>{errors.personal_info}</span>
            )}
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
            {errors.address && (
              <span className={styles.errorText}>{errors.address}</span>
            )}
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
              className={`${styles.select} ${errors.messenger ? styles.inputError : ''}`}
            >
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Viber">Viber</option>
            </select>
            {errors.messenger && (
              <span className={styles.errorText}>{errors.messenger}</span>
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
            {errors.messenger_handle && (
              <span className={styles.errorText}>{errors.messenger_handle}</span>
            )}
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
              {isSubmitting ? 'Создание...' : 'Создать клиента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClientForm;

