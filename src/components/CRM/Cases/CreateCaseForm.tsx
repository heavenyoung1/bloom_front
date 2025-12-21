import React, { useState, useEffect } from 'react';
import { casesApi, clientsApi } from '../../../services/api';
import type { CreateCaseRequest, Client } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import CreateClientForm from '../Clients/CreateClientForm';
import styles from './CreateCaseForm.module.scss';

interface CreateCaseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  client_id?: string;
  submit?: string;
}

const CreateCaseForm: React.FC<CreateCaseFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  
  const [formData, setFormData] = useState<CreateCaseRequest>({
    attorney_id: user?.id || 0,
    client_id: 0,
    description: '',
    name: '',
    status: 'Новое',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientsApi.getClients();
      setClients(data);
    } catch (err) {
      console.error('Ошибка загрузки клиентов:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'client_id' ? parseInt(value, 10) : value,
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

    // Клиент
    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = 'Выберите клиента';
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
      await casesApi.createCase({
        ...formData,
        attorney_id: user.id,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания дела:', error);
      
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
          submit: error.message || 'Не удалось создать дело. Попробуйте еще раз.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientCreated = () => {
    loadClients();
    setShowCreateClientForm(false);
  };

  if (showCreateClientForm) {
    return (
      <CreateClientForm
        onClose={() => setShowCreateClientForm(false)}
        onSuccess={handleClientCreated}
      />
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Создать дело</h2>
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
              placeholder="Споры по недвижимости"
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
              placeholder="Разрешение спора о праве собственности на квартиру"
              rows={4}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <div className={styles.clientSelectHeader}>
              <label htmlFor="client_id" className={styles.label}>
                Клиент <span className={styles.required}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateClientForm(true)}
                className={styles.createClientButton}
              >
                + Создать клиента
              </button>
            </div>
            {loadingClients ? (
              <div className={styles.loading}>Загрузка клиентов...</div>
            ) : clients.length === 0 ? (
              <div className={styles.noClients}>
                <p>Нет клиентов. Создайте клиента, чтобы добавить дело.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateClientForm(true)}
                  className={styles.createClientButtonInline}
                >
                  + Создать клиента
                </button>
              </div>
            ) : (
              <>
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className={`${styles.select} ${errors.client_id ? styles.inputError : ''}`}
                >
                  <option value={0}>Выберите клиента</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <span className={styles.errorText}>{errors.client_id}</span>
                )}
              </>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Статус
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="Новое">Новое</option>
              <option value="В работе">В работе</option>
              <option value="Завершено">Завершено</option>
              <option value="Отменено">Отменено</option>
            </select>
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
              {isSubmitting ? 'Создание...' : 'Создать дело'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCaseForm;

