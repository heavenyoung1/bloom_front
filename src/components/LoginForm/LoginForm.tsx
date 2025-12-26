import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginForm.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import ForgotPasswordForm from '../ForgotPasswordForm/ForgotPasswordForm';

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
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Загружаем сохраненные данные при инициализации
  const loadSavedCredentials = (): LoginFormData => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    const savedRememberMe = localStorage.getItem('remember_me') === 'true';
    
    return {
      email: savedEmail || '',
      password: savedPassword || '',
      rememberMe: savedRememberMe,
    };
  };

  // Состояние формы
  const [formData, setFormData] = useState<LoginFormData>(loadSavedCredentials);

  // Состояние ошибок
  const [errors, setErrors] = useState<LoginFormErrors>({});
  
  // Состояния UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Комбинированное состояние загрузки
  const isActuallySubmitting = isSubmitting || authLoading;

  // Сохранение/удаление учетных данных в зависимости от rememberMe
  const saveCredentials = (email: string, password: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
      localStorage.setItem('remembered_password', password);
      localStorage.setItem('remember_me', 'true');
    } else {
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('remembered_password');
      localStorage.removeItem('remember_me');
    }
  };

  // Отслеживаем изменения isAuthenticated для автоматической навигации
  useEffect(() => {
    console.log('LoginForm useEffect - isAuthenticated:', isAuthenticated, 'isActuallySubmitting:', isActuallySubmitting, 'authLoading:', authLoading);
    if (isAuthenticated) {
      console.log('User authenticated, navigating to dashboard');
      // Используем небольшую задержку для гарантии, что состояние обновилось
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  // Обработчик изменения полей
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setFormData(newFormData);
    
    // При изменении rememberMe обновляем сохраненные данные
    if (name === 'rememberMe') {
      if (checked) {
        // Сохраняем текущие email и password
        saveCredentials(newFormData.email, newFormData.password, true);
      } else {
        // Удаляем сохраненные данные
        saveCredentials('', '', false);
      }
    } else if (newFormData.rememberMe && (name === 'email' || name === 'password')) {
      // Если rememberMe включен и пользователь меняет email или password, обновляем сохраненные данные
      saveCredentials(newFormData.email, newFormData.password, true);
    }
    
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

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Сохраняем учетные данные перед отправкой
      saveCredentials(formData.email, formData.password, formData.rememberMe);
      
      const response = await login(formData.email, formData.password, formData.rememberMe);
      
      // Проверяем успешность входа
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект с токенами
      const isSuccess = response.success === true || 
                        (response as any).access_token || 
                        (response as any).access ||
                        ((response as any).token && (response as any).email);
      
      if (isSuccess) {
        console.log('Login successful, waiting for authentication state update'); // Для отладки
        // Не навигируем сразу - useEffect отследит изменение isAuthenticated
        // и выполнит навигацию автоматически
        // Это гарантирует, что состояние обновилось перед навигацией
        
      } else {
        // Обрабатываем ошибки от сервера
        if (response.errors) {
          const serverErrors: LoginFormErrors = {};
          
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              serverErrors[field as keyof LoginFormErrors] = messages[0];
            }
          });
          
          setErrors(serverErrors);
        } else if (response.message) {
          setErrors({
            ...errors,
            submit: response.message
          });
        } else {
          setErrors({
            ...errors,
            submit: 'Неверный логин или пароль'
          });
        }
      }
      
    } catch (error: any) {
      // Улучшенная обработка ошибок
      let errorMessage = 'Неверный логин или пароль';
      
      // Сначала проверяем ошибки авторизации (неправильный пароль/логин)
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Неверный логин или пароль';
      } 
      // Затем проверяем ошибки валидации - может быть неправильный формат или ошибка авторизации
      else if (error.status === 400) {
        // Проверяем, есть ли в сообщении об ошибке информация о неправильном пароле
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('пароль') || errorMsg.includes('password') || 
            errorMsg.includes('email') || errorMsg.includes('логин') || 
            errorMsg.includes('login') || errorMsg.includes('invalid') ||
            errorMsg.includes('неверный') || errorMsg.includes('incorrect')) {
          errorMessage = 'Неверный логин или пароль';
        } else {
          errorMessage = 'Неверный формат данных. Проверьте email и пароль.';
        }
      }
      // Обработка ошибок сервера (500, 502, 503 и т.д.)
      else if (error.status >= 500) {
        errorMessage = 'Ошибка на сервере. Попробуйте позже или обратитесь в поддержку.';
      }
      // Проверяем на CORS/сетевые ошибки (status 0) - может скрывать ошибку авторизации или сервера
      else if (error.status === 0) {
        // Проверяем сообщение об ошибке, чтобы понять, что это может быть
        const errorMsg = error.message?.toLowerCase() || '';
        
        // Если в сообщении упоминается неправильный логин/пароль или авторизация
        if (errorMsg.includes('неверный логин') || errorMsg.includes('неверный пароль') ||
            errorMsg.includes('неверный email') || errorMsg.includes('неправильный логин') ||
            errorMsg.includes('неправильный пароль') || errorMsg.includes('unauthorized') ||
            errorMsg.includes('не авторизован') || errorMsg.includes('401') || 
            errorMsg.includes('403') || errorMsg.includes('invalid credentials') ||
            errorMsg.includes('неверные учетные данные') || errorMsg.includes('incorrect')) {
          errorMessage = 'Неверный логин или пароль';
        }
        // Если в сообщении упоминается "возможно, неверный логин или пароль" из api.ts
        else if (errorMsg.includes('возможно') && (errorMsg.includes('неверный') || errorMsg.includes('логин') || errorMsg.includes('пароль'))) {
          // Для логина при ошибке подключения/CORS часто это может быть ошибка авторизации
          // Показываем сообщение, которое предполагает обе возможности
          errorMessage = 'Неверный логин или пароль. Если проблема сохраняется, проверьте настройки CORS на бэкенде.';
        }
        // Если просто CORS ошибка
        else if (errorMsg.includes('cors')) {
          // Для логина при CORS часто скрывается ошибка авторизации
          // Показываем более общее сообщение, которое не исключает ошибку авторизации
          errorMessage = 'Неверный логин или пароль. Также проверьте настройки CORS на бэкенде.';
        }
        // Для остальных случаев сетевых ошибок (Failed to fetch и т.д.)
        // Для логина предполагаем, что это может быть ошибка авторизации
        else {
          // При ошибке подключения во время логина это часто может быть ошибка авторизации
          // которую скрывает CORS или сетевая ошибка
          errorMessage = 'Неверный логин или пароль. Если проблема сохраняется, проверьте подключение к серверу и настройки CORS на бэкенде.';
        }
      } 
      else if (error.status === 429) {
        errorMessage = 'Слишком много попыток входа. Попробуйте позже.';
      } 
      else if (error.status === 500) {
        errorMessage = 'Ошибка на сервере. Попробуйте позже или обратитесь в поддержку.';
      } 
      else if (error.message) {
        // Проверяем на ошибки авторизации в сообщении
        const msg = error.message.toLowerCase();
        if (msg.includes('unauthorized') || msg.includes('не авторизован') ||
            msg.includes('401') || msg.includes('403') ||
            msg.includes('пароль') || msg.includes('password') ||
            msg.includes('invalid credentials') || msg.includes('неверные учетные данные') ||
            msg.includes('incorrect') || msg.includes('неверный')) {
          errorMessage = 'Неверный логин или пароль';
        }
        // Проверяем на CORS ошибки в сообщении только если это не ошибка авторизации
        else if (msg.includes('cors') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
          errorMessage = 'Ошибка подключения к серверу. Проверьте настройки CORS на бэкенде.';
        } else {
          errorMessage = error.message;
        }
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
    setShowForgotPassword(true);
  };

  // Обработчик возврата к форме входа
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // Обработчик успешного восстановления пароля
  const handlePasswordResetSuccess = () => {
    setShowForgotPassword(false);
    // Можно показать сообщение об успехе или перенаправить на страницу входа
  };

  // Если показываем форму восстановления пароля
  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        initialEmail={formData.email}
        onBack={handleBackToLogin}
        onSuccess={handlePasswordResetSuccess}
      />
    );
  }

  return (
    <div className={styles.loginForm}>
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
            placeholder="plevako@rambler.ru"
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
    </div>
  );
};

export default LoginForm;