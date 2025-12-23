import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './AuthForm.module.scss';
import LoginForm from '../LoginForm/LoginForm';
import RegistrationForm from '../RegistrationForm/RegistrationForm';

// Тип для активной вкладки
type AuthTab = 'login' | 'register';

const AuthForm: React.FC = () => {
  const location = useLocation();
  // Определяем активную вкладку на основе URL
  const [activeTab, setActiveTab] = useState<AuthTab>(
    location.pathname === '/register' ? 'register' : 'login'
  );

  // Обновляем вкладку при изменении URL
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);
  
  // Обработчики переключения вкладок
  const handleLoginTabClick = () => setActiveTab('login');
  const handleRegisterTabClick = () => setActiveTab('register');
  
  return (
    <div className={styles.authContainer}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className={styles.title}>CRM для юристов</h1>
        <p className={styles.subtitle}>
          {activeTab === 'login' 
            ? 'Войдите в свой аккаунт' 
            : 'Создайте новый аккаунт'
          }
        </p>
      </div>
      
      {/* Переключатель вкладок */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
          onClick={handleLoginTabClick}
        >
          Вход
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
          onClick={handleRegisterTabClick}
        >
          Регистрация
        </button>
      </div>
      
      {/* Индикатор активной вкладки */}
      <div className={styles.tabIndicator}>
        <div 
          className={`${styles.indicator} ${activeTab === 'login' ? styles.indicatorLeft : styles.indicatorRight}`}
        />
      </div>
      
      {/* Контент вкладок */}
      <div className={styles.content}>
        {activeTab === 'login' ? (
          <div className={`${styles.tabContent} ${styles.loginContent}`}>
            <LoginForm />
            <div className={styles.switchAuth}>
              Нет аккаунта?{' '}
              <button 
                className={styles.switchButton}
                onClick={handleRegisterTabClick}
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        ) : (
          <div className={`${styles.tabContent} ${styles.registerContent}`}>
            <RegistrationForm />
            <div className={styles.switchAuth}>
              Уже есть аккаунт?{' '}
              <button 
                className={styles.switchButton}
                onClick={handleLoginTabClick}
              >
                Войти
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Дополнительная информация */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          Система управления делами и клиентами для юридической практики
        </p>
      </div>
    </div>
  );
};

export default AuthForm;