import React, { useState } from 'react';
import styles from './ForgotPasswordForm.module.scss';
import { authApi } from '../../services/api';

// Типы для формы
interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  code: string;
  password: string;
  confirmPassword: string;
}

// Типы для ошибок
interface ForgotPasswordErrors {
  email?: string;
  submit?: string;
}

interface ResetPasswordErrors {
  code?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  initialEmail = '', 
  onBack,
  onSuccess 
}) => {
  // Состояние для отслеживания текущего шага
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');
  const [email, setEmail] = useState<string>(initialEmail);
  
  // Состояние формы "забыли пароль"
  const [forgotFormData, setForgotFormData] = useState<ForgotPasswordFormData>({
    email: initialEmail,
  });
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordErrors>({});
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  
  // Состояние формы "сброс пароля"
  const [resetFormData, setResetFormData] = useState<ResetPasswordFormData>({
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [resetErrors, setResetErrors] = useState<ResetPasswordErrors>({});
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Обработчик изменения полей формы "забыли пароль"
  const handleForgotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setForgotFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (forgotErrors[name as keyof ForgotPasswordErrors]) {
      setForgotErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Обработчик изменения полей формы "сброс пароля"
  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setResetFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (resetErrors[name as keyof ResetPasswordErrors]) {
      setResetErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Валидация формы "забыли пароль"
  const validateForgotForm = (): boolean => {
    const newErrors: ForgotPasswordErrors = {};
    
    if (!forgotFormData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotFormData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    setForgotErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация формы "сброс пароля"
  const validateResetForm = (): boolean => {
    const newErrors: ResetPasswordErrors = {};
    
    if (!resetFormData.code.trim()) {
      newErrors.code = 'Код обязателен';
    }
    
    if (!resetFormData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (resetFormData.password.length < 8) {
      newErrors.password = 'Минимум 8 символов';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(resetFormData.password)) {
      newErrors.password = 'Должны быть: заглавная, строчная буквы, цифра и спецсимвол';
    }
    
    if (!resetFormData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (resetFormData.password !== resetFormData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setResetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы "забыли пароль"
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForgotForm()) {
      return;
    }
    
    setIsSubmittingForgot(true);
    
    try {
      const response = await authApi.forgotPassword(forgotFormData.email);
      
      // Если запрос не выбросил ошибку (статус 200), считаем успешным
      // Проверяем: если success === false, то ошибка, иначе - успех
      // Если response пустой или undefined, но запрос не выбросил ошибку - тоже успех
      const isSuccess = !response || response.success !== false;
      
      if (isSuccess) {
        // Сохраняем email и переходим к следующему шагу
        setEmail(forgotFormData.email);
        setStep('reset');
        setForgotErrors({});
      } else {
        setForgotErrors({
          submit: response?.message || 'Ошибка отправки запроса. Попробуйте еще раз.'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Ошибка отправки запроса. Попробуйте еще раз.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 404) {
        errorMessage = 'Пользователь с таким email не найден.';
      } else if (error.status === 429) {
        errorMessage = 'Слишком много запросов. Попробуйте позже.';
      } else if (error.status === 500) {
        errorMessage = 'Ошибка на сервере. Попробуйте позже.';
      }
      
      setForgotErrors({
        submit: errorMessage
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Обработчик отправки формы "сброс пароля"
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetForm()) {
      return;
    }
    
    setIsSubmittingReset(true);
    
    // Проверяем, что email не пустой
    if (!email || !email.trim()) {
      setResetErrors({
        submit: 'Email не найден. Пожалуйста, вернитесь к предыдущему шагу.'
      });
      setIsSubmittingReset(false);
      return;
    }
    
    try {
      const response = await authApi.resetPassword(
        email,
        resetFormData.code,
        resetFormData.password
      );
      
      // Если запрос не выбросил ошибку (статус 200), считаем успешным
      // Проверяем: если success === false, то ошибка, иначе - успех
      // Если response пустой или undefined, но запрос не выбросил ошибку - тоже успех
      const isSuccess = !response || response.success !== false;
      
      if (isSuccess) {
        setIsSuccess(true);
        
        // Если есть callback, вызываем его
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          // Иначе перенаправляем на страницу входа
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        setResetErrors({
          submit: response?.message || 'Ошибка сброса пароля. Проверьте код и попробуйте еще раз.'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Ошибка сброса пароля. Проверьте код и попробуйте еще раз.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 400) {
        errorMessage = 'Неверный код или пароль не соответствует требованиям.';
      } else if (error.status === 422) {
        // Ошибка валидации - показываем детальное сообщение
        if (error.fullResponse && Array.isArray(error.fullResponse.detail)) {
          const validationErrors = error.fullResponse.detail
            .map((err: any) => {
              const field = err.loc ? err.loc.slice(1).join('.') : 'поле';
              return `${field}: ${err.msg || err}`;
            })
            .join(', ');
          errorMessage = `Ошибка валидации: ${validationErrors}`;
        } else if (error.errors) {
          errorMessage = `Ошибка валидации: ${JSON.stringify(error.errors)}`;
        } else {
          errorMessage = error.message || 'Ошибка валидации данных. Проверьте все поля.';
        }
      } else if (error.status === 404) {
        errorMessage = 'Код не найден или истек срок действия. Запросите новый код.';
      } else if (error.status === 500) {
        errorMessage = 'Ошибка на сервере. Попробуйте позже.';
      }
      
      setResetErrors({
        submit: errorMessage
      });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Обработчик возврата к форме "забыли пароль"
  const handleBackToForgot = () => {
    setStep('forgot');
    setResetFormData({
      code: '',
      password: '',
      confirmPassword: '',
    });
    setResetErrors({});
  };

  // Если успешно
  if (isSuccess) {
    return (
      <div className={styles.successWrapper}>
        <div className={styles.successMessage}>
          <p>✅ Пароль успешно изменен!</p>
          <p>Перенаправляем на страницу входа...</p>
        </div>
      </div>
    );
  }

  // Форма "забыли пароль"
  if (step === 'forgot') {
    return (
      <div className={styles.forgotPasswordForm}>
        <form className={styles.form} onSubmit={handleForgotSubmit}>
          <h2 className={styles.title}>Восстановление пароля</h2>
          <p className={styles.subtitle}>
            Введите ваш email, и мы отправим вам код для восстановления пароля
          </p>
          
          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Электронная почта <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={forgotFormData.email}
              onChange={handleForgotInputChange}
              placeholder="ivan@example.com"
              className={`${styles.input} ${forgotErrors.email ? styles.inputError : ''}`}
              autoComplete="email"
            />
            {forgotErrors.email && <span className={styles.error}>{forgotErrors.email}</span>}
          </div>
          
          {/* Серверная ошибка */}
          {forgotErrors.submit && (
            <div className={styles.serverError}>
              ❌ {forgotErrors.submit}
            </div>
          )}
          
          {/* Кнопки */}
          <div className={styles.buttons}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmittingForgot}
            >
              {isSubmittingForgot ? 'Отправка...' : 'Отправить код'}
            </button>
            
            {onBack && (
              <button
                type="button"
                className={styles.backButton}
                onClick={onBack}
                disabled={isSubmittingForgot}
              >
                Назад к входу
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // Форма "сброс пароля"
  return (
    <div className={styles.forgotPasswordForm}>
      <form className={styles.form} onSubmit={handleResetSubmit}>
        <h2 className={styles.title}>Сброс пароля</h2>
        <p className={styles.subtitle}>
          Введите код, полученный на {email}, и новый пароль
        </p>
        
        {/* Код */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Код подтверждения <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="code"
            value={resetFormData.code}
            onChange={handleResetInputChange}
            placeholder="Введите код из письма"
            className={`${styles.input} ${resetErrors.code ? styles.inputError : ''}`}
            autoComplete="one-time-code"
          />
          {resetErrors.code && <span className={styles.error}>{resetErrors.code}</span>}
        </div>
        
        {/* Новый пароль */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Новый пароль <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={resetFormData.password}
              onChange={handleResetInputChange}
              placeholder="Введите новый пароль"
              className={`${styles.input} ${resetErrors.password ? styles.inputError : ''}`}
              autoComplete="new-password"
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
          {resetErrors.password && <span className={styles.error}>{resetErrors.password}</span>}
          <div className={styles.passwordHint}>
            Минимум 8 символов, заглавная и строчная буквы, цифра, спецсимвол
          </div>
        </div>
        
        {/* Подтверждение пароля */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Подтвердите пароль <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={resetFormData.confirmPassword}
              onChange={handleResetInputChange}
              placeholder="Повторите новый пароль"
              className={`${styles.input} ${resetErrors.confirmPassword ? styles.inputError : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {resetErrors.confirmPassword && (
            <span className={styles.error}>{resetErrors.confirmPassword}</span>
          )}
        </div>
        
        {/* Серверная ошибка */}
        {resetErrors.submit && (
          <div className={styles.serverError}>
            ❌ {resetErrors.submit}
          </div>
        )}
        
        {/* Кнопки */}
        <div className={styles.buttons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmittingReset}
          >
            {isSubmittingReset ? 'Сброс пароля...' : 'Сбросить пароль'}
          </button>
          
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToForgot}
            disabled={isSubmittingReset}
          >
            Назад
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;



