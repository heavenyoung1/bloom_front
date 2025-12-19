import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthForm from './components/AuthForm/AuthForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Можно оставить минимальный Header или полностью убрать */}
        {/* <Header /> - удаляем или комментируем */}
        
        {/* Показываем только AuthForm */}
        <AuthForm />
        
        {/* Hero и другие компоненты больше не показываем */}
        {/* {currentPage === 'hero' && <Hero />} - удаляем */}
      </div>
    </AuthProvider>
  );
}

export default App;