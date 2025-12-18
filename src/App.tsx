import React, { useState } from 'react'; // Добавили useState
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import RegistrationForm from './components/RegistrationForm/RegistrationForm';
import LoginForm from './components/LoginForm/LoginForm';
import './App.css';

// Временно не используем Layout, пока его нет
// import Layout from './components/Layout/Layout';

function App() {
  const [currentPage, setCurrentPage] = useState<'hero' | 'register' | 'login'>('hero');
  
  // Функции для смены страниц
  const showHero = () => setCurrentPage('hero');
  const showRegister = () => setCurrentPage('register');
  const showLogin = () => setCurrentPage('login');
  
  return (
    // Пока закомментируем Layout, создашь позже
    // <Layout>
    <div className="App">
      {/* Передаем функции в Header для навигации */}
      <Header 
        onShowHero={showHero}
        onShowRegister={showRegister}
        onShowLogin={showLogin}
      />
      
      {/* Отображаем текущую страницу */}
      {currentPage === 'hero' && <Hero />}
      {currentPage === 'register' && <RegistrationForm />}
      {currentPage === 'login' && <LoginForm />}
    </div>
    // </Layout>
  );
}

export default App;