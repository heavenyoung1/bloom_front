import React from "react";
import styles from './Header.module.scss';

// Обновляем интерфейс пропсов
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
  // Обработчик клика по логотипу
  const handleLogoClick = () => {
    console.log('Logo clicked');
    if (onShowHero) {
      onShowHero(); // Возвращаем на главную
    }
    // window.location.href = '/';
  };

  // Обработчики для кнопок
  const handleSignIn = () => {
    console.log('Sign In clicked');
    if (onShowLogin) {
      onShowLogin(); // Показываем форму входа
    }
  };

  const handleSignUp = () => {
    console.log('Sign Up clicked');
    if (onShowRegister) {
      onShowRegister(); // Показываем форму регистрации
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
        <button 
          className={`${styles.button} ${styles.signIn}`}
          onClick={handleSignIn}
        >
          Войти
        </button>
        
        <button 
          className={`${styles.button} ${styles.signUp}`}
          onClick={handleSignUp}
        >
          Регистрация
        </button>
      </div>
    </header>
  );
};

export default Header;