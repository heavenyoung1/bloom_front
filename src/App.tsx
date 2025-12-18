import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import RegistrationForm from './components/RegistrationForm/RegistrationForm';
import './App.css';

function App() {
  // Для показа регистрации вместо Hero
  const showRegistration = true; // или false для показа Hero
  
  return (
    <div className="App">
      <Header />
      
      {/* Переключатель между Hero и RegistrationForm */}
      {showRegistration ? <RegistrationForm /> : <Hero />}
      
      {/* Или можно показывать оба компонента последовательно */}
      {/* <Hero />
      <RegistrationForm /> */}
    </div>
  );
}

export default App;