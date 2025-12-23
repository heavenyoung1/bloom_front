import React, { useState, useEffect } from 'react';
import { eventsApi, casesApi } from '../../../services/api';
import type { CreateEventRequest, Case } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './CreateEventForm.module.scss';

interface CreateEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  event_type?: string;
  event_date?: string;
  case_id?: string;
  submit?: string;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  
  const [formData, setFormData] = useState<CreateEventRequest>({
    attorney_id: user?.id || 0,
    case_id: 0,
    description: '',
    event_date: '',
    event_type: 'Встреча',
    name: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const data = await casesApi.getCases();
      setCases(data);
    } catch (err) {
      console.error('Ошибка загрузки дел:', err);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

    // Название
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    // Описание
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }

    // Тип события
    if (!formData.event_type.trim()) {
      newErrors.event_type = 'Тип события обязателен';
    }

    // Дата и время
    if (!formData.event_date) {
      newErrors.event_date = 'Дата и время обязательны';
    } else {
      const eventDate = new Date(formData.event_date);
      if (isNaN(eventDate.getTime())) {
        newErrors.event_date = 'Некорректная дата';
      }
    }

    // Дело
    if (!formData.case_id || formData.case_id === 0) {
      newErrors.case_id = 'Выберите дело';
    }

    // Attorney ID
    if (!user?.id) {
      newErrors.submit = 'Ошибка: пользователь не авторизован';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setErrors({ submit: 'Ошибка: пользователь не авторизован' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Форматируем дату в ISO формат для отправки на сервер
      const eventDate = new Date(formData.event_date);
      const isoDate = eventDate.toISOString();

      await eventsApi.createEvent({
        ...formData,
        attorney_id: user.id,
        event_date: isoDate,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания события:', error);
      
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
          submit: error.message || 'Не удалось создать событие. Попробуйте еще раз.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Получаем текущую дату и время в формате для datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    // Преобразуем в формат YYYY-MM-DDTHH:mm для datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Создать событие</h2>
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
              Название <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Заседание суда"
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Рассмотрение дела по существу"
              rows={4}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_type" className={styles.label}>
              Тип события <span className={styles.required}>*</span>
            </label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.event_type ? styles.inputError : ''}`}
            >
              <option value="Встреча">Встреча</option>
              <option value="Задача">Задача</option>
              <option value="Судебное заседание">Судебное заседание</option>
              <option value="Дедлайн">Дедлайн</option>
              <option value="Важное">Важное</option>
              <option value="Другое">Другое</option>
            </select>
            {errors.event_type && (
              <span className={styles.errorText}>{errors.event_type}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_date" className={styles.label}>
              Дата и время <span className={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              id="event_date"
              name="event_date"
              value={formData.event_date}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.event_date ? styles.inputError : ''}`}
              min={getCurrentDateTime()}
            />
            {errors.event_date && (
              <span className={styles.errorText}>{errors.event_date}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="case_id" className={styles.label}>
              Дело <span className={styles.required}>*</span>
            </label>
            {loadingCases ? (
              <div className={styles.loading}>Загрузка дел...</div>
            ) : cases.length === 0 ? (
              <div className={styles.noCases}>
                <p>Нет дел. Создайте дело, чтобы добавить событие.</p>
              </div>
            ) : (
              <>
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
                {errors.case_id && (
                  <span className={styles.errorText}>{errors.case_id}</span>
                )}
              </>
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
              disabled={isSubmitting || !user?.id}
            >
              {isSubmitting ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventForm;

