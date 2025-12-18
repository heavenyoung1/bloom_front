import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext'; // Импортируем AuthProvider
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import RegistrationForm from './components/RegistrationForm/RegistrationForm';
import LoginForm from './components/LoginForm/LoginForm';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'hero' | 'register' | 'login'>('hero');
  
  const showHero = () => setCurrentPage('hero');
  const showRegister = () => setCurrentPage('register');
  const showLogin = () => setCurrentPage('login');
  
  return (
    <AuthProvider> {/* ВСЁ ОБОРАЧИВАЕМ В AuthProvider */}
      <div className="App">
        <Header 
          onShowHero={showHero}
          onShowRegister={showRegister}
          onShowLogin={showLogin}
        />
        
        {currentPage === 'hero' && <Hero />}
        {currentPage === 'register' && <RegistrationForm />}
        {currentPage === 'login' && <LoginForm />}
      </div>
    </AuthProvider>
  );
}

export default App;