import React from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/home';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Не рендерим Footer на страницах авторизации
  if (isAuthPage) {
    return null;
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    if (isLandingPage) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/home#${sectionId}`);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Название продукта + позиционирование */}
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>CaseOne</h3>
            <p className={styles.productDescription}>
              CRM-система для частной юридической практики.<br />
              Управление делами, клиентами, сроками и платежами
            </p>
          </div>

          {/* Основные разделы сайта */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Разделы</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#overview" onClick={(e) => handleNavClick(e, 'overview')}>
                  Обзор
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>
                  Функции
                </a>
              </li>
              <li>
                <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}>
                  Цены
                </a>
              </li>
              <li>
                <a href="#forwhom" onClick={(e) => handleNavClick(e, 'forwhom')}>
                  Для кого
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleNavClick(e, 'about')}>
                  О нас
                </a>
              </li>
              <li>
                <a href="#contacts" onClick={(e) => handleNavClick(e, 'contacts')}>
                  Контакты
                </a>
              </li>
            </ul>
          </div>

          {/* Пользовательские документы */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Документы</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="/user-agreement" target="_blank" rel="noopener noreferrer">
                  Пользовательское соглашение
                </a>
              </li>
              <li>
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="/personal-data" target="_blank" rel="noopener noreferrer">
                  Обработка персональных данных
                </a>
              </li>
            </ul>
          </div>

          {/* Поддержка и помощь */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Поддержка</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="/knowledge-base" target="_blank" rel="noopener noreferrer">
                  База знаний
                </a>
              </li>
              <li>
                <a href="/ask-question" target="_blank" rel="noopener noreferrer">
                  Задать вопрос
                </a>
              </li>
              <li>
                <a href="/feedback" target="_blank" rel="noopener noreferrer">
                  Обратная связь
                </a>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Контакты</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="mailto:support@caseone.app">support@caseone.app</a>
              </li>
              <li>
                <a href="mailto:info@caseone.app">info@caseone.app</a>
              </li>
            </ul>
          </div>

          {/* Юридическая информация */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Юридическая информация</h4>
            <div className={styles.legalInfo}>
              <p>ООО «CaseOne»</p>
              <p>ИНН 1234567890</p>
              <p>Россия</p>
            </div>
          </div>

          {/* Безопасность и данные */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Безопасность</h4>
            <div className={styles.securityInfo}>
              <p>
                <span className={styles.securityIcon}>🔒</span> Данные хранятся на защищённых серверах.
              </p>
              <p>Используется шифрование и резервное копирование.</p>
            </div>
          </div>
        </div>

        {/* Копирайт и версия */}
        <div className={styles.copyright}>
          <p>© 2025 CaseOne. Все права защищены. Версия сервиса: beta</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

