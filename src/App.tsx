import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthForm from './components/AuthForm/AuthForm';
import Dashboard from './components/CRM/Dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Публичные маршруты */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthForm />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthForm />
                </PublicRoute>
              }
            />
            
            {/* Защищенные маршруты */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Перенаправление с корня */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 - перенаправляем на логин */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;