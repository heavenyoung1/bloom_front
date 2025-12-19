import React, { useState, useEffect, useRef } from 'react';
import styles from './EmailVerificationForm.module.scss';

interface EmailVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  onResendCode: () => Promise<{ success: boolean; message?: string }>;
  onBack?: () => void;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  email,
  onVerify,
  onResendCode,
  onBack,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Таймер для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Фокус на первый инпут при монтировании
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Обработка ввода кода
  const handleChange = (index: number, value: string) => {
    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Обработка удаления (Backspace)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Обработка вставки из буфера обмена
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newCode = digits.split('');
          setCode(newCode);
          inputRefs.current[5]?.focus();
        }
      });
    }
  };

  // Обработка вставки (Paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  // Проверка кода
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Введите полный код из 6 цифр');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await onVerify(codeString);
      
      if (response.success) {
        // Успешная верификация - компонент должен обработать это через родителя
        return;
      } else {
        if (response.errors && response.errors.code) {
          setError(response.errors.code[0]);
        } else if (response.message) {
          setError(response.message);
        } else {
          setError('Неверный код. Попробуйте еще раз.');
        }
        // Очищаем поля при ошибке
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error('Ошибка верификации:', error);
      setError(error.message || 'Ошибка верификации. Попробуйте еще раз.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Повторная отправка кода
  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setResendMessage('');
    setError('');

    try {
      const response = await onResendCode();
      
      if (response.success) {
        setResendMessage('Код отправлен повторно');
        setCountdown(60); // 60 секунд до следующей отправки
      } else {
        setError(response.message || 'Не удалось отправить код. Попробуйте позже.');
      }
    } catch (error: any) {
      console.error('Ошибка повторной отправки:', error);
      setError(error.message || 'Не удалось отправить код. Попробуйте позже.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.verificationForm}>
      <div className={styles.header}>
        <h2 className={styles.title}>Подтверждение email</h2>
        <p className={styles.subtitle}>
          Мы отправили код подтверждения на адрес
          <br />
          <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.codeInputs}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`${styles.codeInput} ${error ? styles.codeInputError : ''}`}
              disabled={isSubmitting}
            />
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {resendMessage && <div className={styles.success}>{resendMessage}</div>}

        <div className={styles.buttons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || code.join('').length !== 6}
          >
            {isSubmitting ? 'Проверка...' : 'Подтвердить'}
          </button>

          <div className={styles.resendSection}>
            <button
              type="button"
              onClick={handleResend}
              className={styles.resendButton}
              disabled={isResending || countdown > 0}
            >
              {isResending
                ? 'Отправка...'
                : countdown > 0
                ? `Отправить повторно (${countdown}с)`
                : 'Отправить код повторно'}
            </button>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
              disabled={isSubmitting}
            >
              Назад к регистрации
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EmailVerificationForm;

