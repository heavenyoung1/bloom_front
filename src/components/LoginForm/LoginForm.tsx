import React, { useState } from 'react';
import styles from './LoginForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';

// Типы для формы
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Типы для ошибок
interface LoginFormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

const LoginForm: React.FC = () => {
  // Хук аутентификации
  const { login, isLoading: authLoading } = useAuth();

  // Состояние формы
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Состояние ошибок
  const [errors, setErrors] = useState<LoginFormErrors>({});
  
  // Состояния UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    
    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    // Пароль
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
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
      // Используем login из AuthContext (не register!)
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        // Успешный вход
        setIsSuccess(true);
        console.log('Вход выполнен успешно!', response.data);
        
        // Перенаправление на dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
      } else {
        // Обработка ошибок
        if (response.errors) {
          const serverErrors: LoginFormErrors = {};
          
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              // Используем правильный тип для field
              serverErrors[field as keyof LoginFormErrors] = messages[0];
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
      console.error('Ошибка входа:', error);
      
      let errorMessage = 'Ошибка входа. Проверьте email и пароль.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.errors) {
        const serverErrors: LoginFormErrors = {};
        
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            serverErrors[field as keyof LoginFormErrors] = messages[0];
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

  // Обработчик "Забыли пароль?"
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Переход к восстановлению пароля для:', formData.email);
    
    // Здесь обычно: открытие модалки или переход на страницу восстановления
    alert(`Инструкция по восстановлению пароля отправлена на ${formData.email || 'ваш email'}`);
  };

  // Обработчик "Восстановить аккаунт"
  const handleRestoreAccount = () => {
    console.log('Восстановление аккаунта');
    
    // Здесь обычно: переход на страницу восстановления/реактивации
    // window.location.href = '/restore-account';
    
    alert('Функция восстановления аккаунта. Свяжитесь с поддержкой: support@legalcrm.com');
  };

  // Если успешно
  if (isSuccess) {
    return (
      <div className={styles.login}>
        <div className={styles.header}>
          <h2 className={styles.title}>Добро пожаловать!</h2>
          <p className={styles.subtitle}>Вход выполнен успешно</p>
        </div>
        
        <div className={styles.successMessage}>
          <p>✅ Вы успешно вошли в систему.</p>
          <p>Перенаправляем в личный кабинет...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.login}>
      <div className={styles.header}>
        <h2 className={styles.title}>Вход в CRM</h2>
        <p className={styles.subtitle}>
          Введите ваши учетные данные для доступа к системе
        </p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Электронная почта <span className={styles.required}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="ivan@example.com"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            autoComplete="username"
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>
        
        {/* Пароль */}
        <div className={styles.formGroup}>
          <div className={styles.label}>
            Пароль <span className={styles.required}>*</span>
          </div>
          
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Введите пароль"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          
          {errors.password && <span className={styles.error}>{errors.password}</span>}
          
          <div className={styles.forgotPassword}>
            <a 
              href="/forgot-password" 
              className={styles.forgotPasswordLink}
              onClick={handleForgotPassword}
            >
              Забыли пароль?
            </a>
          </div>
        </div>
        
        {/* Запомнить меня */}
        <div className={styles.rememberMe}>
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            className={styles.checkbox}
          />
          <label htmlFor="rememberMe" className={styles.checkboxLabel}>
            Запомнить меня
          </label>
        </div>
        
        {/* Серверная ошибка */}
        {errors.submit && (
          <div className={styles.serverError}>
            ❌ {errors.submit}
          </div>
        )}
        
        {/* Кнопка входа */}
        <div className={styles.buttons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isActuallySubmitting}
          >
            {isActuallySubmitting ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
      
      {/* Разделитель */}
      <div className={styles.divider}>
        <span>или</span>
      </div>
      
      {/* Кнопка восстановления аккаунта */}
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.restoreAccountButton}
          onClick={handleRestoreAccount}
        >
          Восстановить аккаунт
        </button>
      </div>
      
      {/* Ссылка на регистрацию */}
      <div className={styles.registerLink}>
        Нет аккаунта? <a href="/register">Зарегистрироваться</a>
      </div>
    </div>
  );
};

export default LoginForm;