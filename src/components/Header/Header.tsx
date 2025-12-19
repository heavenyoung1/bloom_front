import React from "react";
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
  
  const handleLogout = async () => {
    await logout();
    if (onShowHero) {
      onShowHero();
    }
  };

  const handleLogoClick = () => {
    console.log('Logo clicked');
    if (onShowHero) {
      onShowHero();
    }
  };

  return (
    <header className={styles.header}>
      
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
          <li><a href="#overview" onClick={(e) => { e.preventDefault(); onShowHero?.(); }}>Возможности</a></li>
          <li><a href="#features" onClick={(e) => { e.preventDefault(); onShowHero?.(); }}>Продукт</a></li>
          <li><a href="#pricing" onClick={(e) => { e.preventDefault(); onShowHero?.(); }}>Тарифы</a></li>
          <li><a href="#forwhom" onClick={(e) => { e.preventDefault(); onShowHero?.(); }}>Для кого</a></li>
          <li><a href="#about" onClick={(e) => { e.preventDefault(); onShowHero?.(); }}>О нас</a></li>
        </ul>
      </nav>
      
      {/* Кнопки авторизации */}
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
              onClick={onShowLogin}
            >
              Войти
            </button>
            
            <button 
              className={`${styles.button} ${styles.signUp}`}
              onClick={onShowRegister}
            >
              Регистрация
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;