import React from "react";
import styles from './Header.module.scss'; // Убедись в правильном имени файла

// Определяем тип для пропсов (пока пустой, но может пригодиться)
interface HeaderProps {
  // Например: isLoggedIn?: boolean;
  // Мы можем добавлять пропсы позже
}

const Header: React.FC<HeaderProps> = () => {
  // Обработчик клика по логотипу
  const handleLogoClick = () => {
    // Позже добавим навигацию на главную
    console.log('Logo clicked');
    // window.location.href = '/';
  };

  // Обработчики для кнопок
  const handleSignIn = () => {
    console.log('Sign In clicked');
    // Здесь будет логика входа
  };

  const handleSignUp = () => {
    console.log('Sign Up clicked');
    // Здесь будет логика регистрации
  };

  return (
    // Используем стиль из CSS Modules
    <header className={styles.header}>
      
      {/* Логотип */}
      <img 
        className={styles.logo} 
        src="/img/test_logo.svg" 
        alt="Logo" 
        onClick={handleLogoClick}
      />
      
      {/* Навигация */}
      <nav className={styles.navbar}>
        <ul>
          <li><a href="#overview">Обзор</a></li>
          <li><a href="#features">Контакты</a></li>
          <li><a href="#pricing">Новости</a></li>
          <li><a href="#about">О нас</a></li>
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