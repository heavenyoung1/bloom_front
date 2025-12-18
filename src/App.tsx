import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero'; // Импортируем Hero
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Hero /> {/* Добавляем Hero компонент */}
      {/* Footer будет здесь позже */}
    </div>
  );
}

export default App;