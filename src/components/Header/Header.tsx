import React from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.scss';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onShowHero?: () => void;
  onShowRegister?: () => void;
  onShowLogin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onShowHero, 
  onShowRegister, 
  onShowLogin 
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/home';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Не рендерим Header на страницах авторизации
  if (isAuthPage) {
    return null;
  }
  
  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  const handleLogoClick = () => {
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/home');
    }
  };

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

  const handleCRMClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className={`${styles.header} ${isLandingPage ? styles.landingHeader : ''}`}>
      
      {/* Логотип */}
      <img 
        className={styles.logo} 
        src="/img/test_logo.svg" 
        alt="Logo" 
        onClick={handleLogoClick}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Навигация */}
      <nav className={styles.navbar}>
        <ul>
          <li><a href="#overview" onClick={(e) => handleNavClick(e, 'overview')}>Обзор</a></li>
          <li><a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Функции</a></li>
          <li><a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}>Цены</a></li>
          <li><a href="#forwhom" onClick={(e) => handleNavClick(e, 'forwhom')}>Для кого</a></li>
          <li><a href="#about" onClick={(e) => handleNavClick(e, 'about')}>О нас</a></li>
          <li><a href="#contacts" onClick={(e) => handleNavClick(e, 'contacts')}>Контакты</a></li>
          <li>
            <button 
              className={styles.crmButton}
              onClick={handleCRMClick}
            >
              CRM
            </button>
          </li>
        </ul>
      </nav>
      
      {/* Кнопки авторизации - только не на лендинге */}
      {!isLandingPage && (
        <div className={styles.auth}>
          {isAuthenticated ? (
            <>
              <span className={styles.userGreeting}>
                Привет, {user?.first_name}!
              </span>
              <button 
                className={`${styles.button} ${styles.signOut}`}
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <button 
                className={`${styles.button} ${styles.signIn}`}
                onClick={() => navigate('/login')}
              >
                Войти
              </button>
              
              <button 
                className={`${styles.button} ${styles.signUp}`}
                onClick={() => navigate('/register')}
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;