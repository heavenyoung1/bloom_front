import React, { useState } from 'react';
import styles from './RegistrationForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';

// Типы для формы
interface FormData {
  license_id: string;
  first_name: string;
  last_name: string;
  patronymic: string;
  email: string;
  phone: string;
  telegram_username: string;
  password: string;
  confirm_password: string;
  agreeToTerms: boolean;
}

// Типы для ошибок
interface FormErrors {
  license_id?: string;
  first_name?: string;
  last_name?: string;
  patronymic?: string;
  email?: string;
  phone?: string;
  telegram_username?: string;
  password?: string;
  confirm_password?: string;
  agreeToTerms?: string;
  submit?: string;
}

const RegistrationForm: React.FC = () => {
  // Хук аутентификации
  const { register, isLoading: authLoading } = useAuth();

  // Состояние формы
  const [formData, setFormData] = useState<FormData>({
    license_id: '',
    first_name: '',
    last_name: '',
    patronymic: '',
    email: '',
    phone: '+7',
    telegram_username: '',
    password: '',
    confirm_password: '',
    agreeToTerms: false,
  });

  // Состояние ошибок
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Состояние отправки
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Комбинированное состояние загрузки
  const isActuallySubmitting = isSubmitting || authLoading;

  // Обработчик изменения полей
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Валидация лицензии (формат: XXX/XXXX)
    if (!formData.license_id) {
      newErrors.license_id = 'Лицензионный номер обязателен';
    } else if (!/^\d{1,5}\/\d{1,5}$/.test(formData.license_id)) {
      newErrors.license_id = 'Формат: 123/4567';
    }
    
    // Имя
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Имя обязательно';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Имя должно быть не менее 2 символов';
    }
    
    // Фамилия
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Фамилия обязательна';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Фамилия должна быть не менее 2 символов';
    }
    
    // Email
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    // Телефон (российский формат)
    if (!formData.phone) {
      newErrors.phone = 'Телефон обязателен';
    } else if (!/^\+7\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Формат: +7 XXX XXX XX XX';
    }
    
    // Telegram (необязательно, но если заполнено - проверяем формат)
    if (formData.telegram_username && !/^@?[a-zA-Z0-9_]{5,32}$/.test(formData.telegram_username)) {
      newErrors.telegram_username = 'Некорректный никнейм Telegram';
    }
    
    // Пароль
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Минимум 8 символов';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Должны быть: заглавная, строчная буквы, цифра и спецсимвол';
    }
    
    // Подтверждение пароля
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Пароли не совпадают';
    }
    
    // Согласие с условиями
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие с условиями';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы с реальным API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await register(formData);
      
      if (response.success) {
        setIsSuccess(true);
        console.log('Регистрация успешна!', response.data);
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
      } else {
        if (response.errors) {
          const serverErrors: FormErrors = {};
          
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              serverErrors[field as keyof FormErrors] = messages[0];
            }
          });
          
          setErrors(serverErrors);
        } else if (response.message) {
          setErrors({
            ...errors,
            submit: response.message
          });
        }
      }
      
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      
      let errorMessage = 'Ошибка регистрации. Попробуйте еще раз.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.errors) {
        const serverErrors: FormErrors = {};
        
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            serverErrors[field as keyof FormErrors] = messages[0];
          }
        });
        
        setErrors(serverErrors);
      } else {
        setErrors({
          ...errors,
          submit: errorMessage
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если успешно
  if (isSuccess) {
    return (
      <div className={styles.successWrapper}>
        <div className={styles.successMessage}>
          <p>✅ Ваша учетная запись успешно создана.</p>
          <p>На ваш email отправлено письмо с подтверждением.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.registrationForm}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Лицензионный номер */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Лицензионный номер адвоката <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="license_id"
            value={formData.license_id}
            onChange={handleInputChange}
            placeholder="153/3232"
            className={`${styles.input} ${errors.license_id ? styles.inputError : ''}`}
          />
          {errors.license_id && <span className={styles.error}>{errors.license_id}</span>}
        </div>
        
        {/* Имя, Фамилия, Отчество в одной строке */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Имя <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Иван"
              className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
            />
            {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Фамилия <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Петров"
              className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
            />
            {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
          </div>
        </div>
        
        {/* Отчество */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Отчество
          </label>
          <input
            type="text"
            name="patronymic"
            value={formData.patronymic}
            onChange={handleInputChange}
            placeholder="Сергеевич"
            className={`${styles.input} ${errors.patronymic ? styles.inputError : ''}`}
          />
          {errors.patronymic && <span className={styles.error}>{errors.patronymic}</span>}
        </div>
        
        {/* Контакты в одной строке */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ivan@example.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Телефон <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+7 999 123 45 67"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            />
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>
        </div>
        
        {/* Telegram */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Никнейм Telegram (опционально)
          </label>
          <input
            type="text"
            name="telegram_username"
            value={formData.telegram_username}
            onChange={handleInputChange}
            placeholder="@username"
            className={`${styles.input} ${errors.telegram_username ? styles.inputError : ''}`}
          />
          {errors.telegram_username && (
            <span className={styles.error}>{errors.telegram_username}</span>
          )}
        </div>
        
        {/* Пароли в одной строке */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Пароль <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="SecurePass123!"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
            <div className={styles.passwordHint}>
              Минимум 8 символов, заглавная и строчная буквы, цифра, спецсимвол
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Подтвердите пароль <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              placeholder="Повторите пароль"
              className={`${styles.input} ${errors.confirm_password ? styles.inputError : ''}`}
            />
            {errors.confirm_password && (
              <span className={styles.error}>{errors.confirm_password}</span>
            )}
          </div>
        </div>
        
        {/* Согласие с условиями */}
        <div className={styles.formGroup}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
            <label htmlFor="agreeToTerms" className={styles.checkboxLabel}>
              Я соглашаюсь с{' '}
              <a href="/terms" className={styles.checkboxLink} target="_blank" rel="noopener noreferrer">
                условиями использования
              </a>{' '}
              и{' '}
              <a href="/privacy" className={styles.checkboxLink} target="_blank" rel="noopener noreferrer">
                политикой конфиденциальности
              </a>
              <span className={styles.required}> *</span>
            </label>
          </div>
          {errors.agreeToTerms && <span className={styles.error}>{errors.agreeToTerms}</span>}
        </div>
        
        {/* Кнопка отправки */}
        <div className={styles.buttons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isActuallySubmitting}
          >
            {isActuallySubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;