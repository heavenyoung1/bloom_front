import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegistrationForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import EmailVerificationForm from '../EmailVerificationForm/EmailVerificationForm';

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
  const { register, verifyEmail, resendVerificationCode, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

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
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Комбинированное состояние загрузки
  const isActuallySubmitting = isSubmitting || authLoading;


  // Функция форматирования телефона: +7 999 888 77 88
  const formatPhoneNumber = (value: string): string => {
    // Удаляем все символы кроме цифр и +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Если не начинается с +7, добавляем +7
    if (!cleaned.startsWith('+7')) {
      if (cleaned.startsWith('7')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('+')) {
        cleaned = '+7' + cleaned.slice(1);
      } else {
        cleaned = '+7' + cleaned;
      }
    }
    
    // Извлекаем только цифры после +7
    const digits = cleaned.slice(2).replace(/\D/g, '');
    
    // Ограничиваем до 10 цифр (российский номер)
    const limitedDigits = digits.slice(0, 10);
    
    // Форматируем: +7 XXX XXX XX XX
    let formatted = '+7';
    if (limitedDigits.length > 0) {
      formatted += ' ' + limitedDigits.slice(0, 3);
    }
    if (limitedDigits.length > 3) {
      formatted += ' ' + limitedDigits.slice(3, 6);
    }
    if (limitedDigits.length > 6) {
      formatted += ' ' + limitedDigits.slice(6, 8);
    }
    if (limitedDigits.length > 8) {
      formatted += ' ' + limitedDigits.slice(8, 10);
    }
    
    return formatted;
  };

  // Обработчик изменения полей
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Специальная обработка для поля телефона
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
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
    
    // Валидация номера удостоверения (формат: XXX/XXXX)
    if (!formData.license_id) {
      newErrors.license_id = 'Номер удостоверения обязателен';
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
      // Очищаем номер телефона от пробелов перед отправкой
      const dataToSend = {
        ...formData,
        phone: formData.phone.replace(/\s/g, '')
      };
      const response = await register(dataToSend);
      
      console.log('Registration response:', response); // Для отладки
      console.log('Response type:', typeof response); // Для отладки
      console.log('Response keys:', Object.keys(response || {})); // Для отладки
      
      // Если есть явные ошибки валидации, показываем их
      if (response && (response as any).errors && Object.keys((response as any).errors).length > 0) {
        console.log('Registration has errors, not showing verification form'); // Для отладки
        const serverErrors: FormErrors = {};
        
        Object.entries((response as any).errors).forEach(([field, messages]: [string, any]) => {
          if (messages && messages.length > 0) {
            serverErrors[field as keyof FormErrors] = messages[0];
          }
        });
        
        setErrors(serverErrors);
        return; // Не показываем форму верификации при ошибках
      }
      
      // Если success явно false, показываем ошибку
      if (response && (response as any).success === false) {
        console.log('Registration failed (success: false), not showing verification form'); // Для отладки
        setErrors({
          ...errors,
          submit: (response as any).message || 'Ошибка регистрации. Попробуйте еще раз.'
        });
        return;
      }
      
      // Если регистрация успешна (нет ошибок), всегда показываем форму верификации
      // Это может быть либо { success: true, data: {...} }, либо напрямую объект пользователя { id, email, ... }
      console.log('Registration successful, setting showVerificationForm to true'); // Для отладки
      setShowVerificationForm(true);
      
    } catch (error: any) {
      console.log('Registration error:', error); // Для отладки
      
      // Проверяем, может быть это успешная регистрация, но с ошибкой HTTP
      // Некоторые серверы могут возвращать 201 или другой статус при успешной регистрации
      const isRegistrationSuccess = error.status === 201 || 
                                    (error.status >= 200 && error.status < 300) ||
                                    (error.message && (
                                      error.message.toLowerCase().includes('created') ||
                                      error.message.toLowerCase().includes('успешно') ||
                                      error.message.toLowerCase().includes('success') ||
                                      error.message.toLowerCase().includes('отправлен') ||
                                      error.message.toLowerCase().includes('sent')
                                    )) ||
                                    // Если в fullResponse есть данные, возможно регистрация успешна
                                    (error.fullResponse && (error.fullResponse.id || error.fullResponse.email));
      
      if (isRegistrationSuccess) {
        console.log('Showing verification form (from error handler)'); // Для отладки
        // Показываем форму верификации, если считаем регистрацию успешной
        setShowVerificationForm(true);
        return; // Важно: выходим, чтобы не показывать ошибку
      }
      
      // Если это не успешная регистрация, показываем ошибку
      let errorMessage = 'Ошибка регистрации. Попробуйте еще раз.';
        
        // Улучшенная обработка CORS ошибок
        if (error.status === 0) {
          errorMessage = 'Ошибка подключения к серверу. Проверьте настройки CORS на бэкенде или попробуйте позже.';
        } else if (error.message) {
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

  // Обработчик верификации email
  const handleVerify = async (code: string) => {
    try {
      const response = await verifyEmail(formData.email, code);
      
      // Проверяем успешность верификации
      // Сервер может вернуть либо { success: true }, либо напрямую объект пользователя
      const isSuccess = response.success === true || 
                        ((response as any).id && (response as any).email);
      
      if (isSuccess) {
        // После успешной верификации перенаправляем на dashboard
        // Задержка позволяет показать сообщение об успехе
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Неверный код подтверждения. Проверьте код и попробуйте еще раз.' 
        };
      }
    } catch (error: any) {
      // Обрабатываем ошибки от сервера
      // По умолчанию для верификации считаем, что код неверный
      let errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
      
      // Обрабатываем различные статусы ошибок
      if (error.status === 400) {
        errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
      } else if (error.status === 404) {
        errorMessage = 'Код не найден или истек срок действия. Запросите новый код.';
      } else if (error.status === 500) {
        errorMessage = 'Ошибка на сервере. Попробуйте позже или обратитесь в поддержку.';
      } else if (error.status === 0) {
        // Статус 0 обычно означает CORS ошибку или реальную ошибку сети
        // Но для верификации скорее всего это неверный код (CORS блокирует ответ)
        errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
      } else if (error.message && !error.message.toLowerCase().includes('failed to fetch')) {
        // Используем сообщение от сервера, если это не ошибка сети
        errorMessage = error.message;
      }
      
      if (error.errors) {
        return {
          success: false,
          errors: error.errors,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // Обработчик повторной отправки кода
  const handleResendCode = async () => {
    return await resendVerificationCode(formData.email);
  };

  // Обработчик возврата к форме регистрации
  const handleBackToRegistration = () => {
    setShowVerificationForm(false);
    setErrors({});
  };

  // Если нужно показать форму верификации, показываем её независимо от состояния загрузки
  // Это важно, чтобы форма не исчезала во время загрузки
  if (showVerificationForm) {
    return (
      <EmailVerificationForm
        email={formData.email}
        onVerify={handleVerify}
        onResendCode={handleResendCode}
        onBack={handleBackToRegistration}
      />
    );
  }

  return (
    <div className={styles.registrationForm}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Номер удостоверения */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Номер удостоверения <span className={styles.required}>*</span>
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
        
        {/* Фамилия, Имя, Отчество в одной строке */}
        <div className={styles.row}>
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
        </div>
        
        {/* Отчество и Телефон в одной строке */}
        <div className={styles.row}>
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
        
        {/* Email */}
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
        
        {/* Пароль */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Пароль <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="SecurePass123!"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className={styles.error}>{errors.password}</span>}
          <div className={styles.passwordHint}>
            Минимум 8 символов, заглавная и строчная буквы, цифра, спецсимвол
          </div>
        </div>
        
        {/* Подтвердите пароль */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Подтвердите пароль <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              placeholder="Повторите пароль"
              className={`${styles.input} ${errors.confirm_password ? styles.inputError : ''}`}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <span className={styles.error}>{errors.confirm_password}</span>
          )}
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