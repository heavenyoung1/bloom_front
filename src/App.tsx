import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthForm from './components/AuthForm/AuthForm';
import LandingPage from './components/LandingPage/LandingPage';
import Dashboard from './components/CRM/Dashboard/Dashboard';
import PlaceholderPage from './components/CRM/PlaceholderPage/PlaceholderPage';
import Clients from './components/CRM/Clients/Clients';
import Cases from './components/CRM/Cases/Cases';
import Calendar from './components/CRM/Events/Calendar';
import Profile from './components/CRM/Profile/Profile';
import Payments from './components/CRM/Payments/Payments';
import Contacts from './components/CRM/Contacts/Contacts';
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
              path="/home"
              element={<LandingPage />}
            />
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
            <Route
              path="/cases"
              element={
                <ProtectedRoute>
                  <Cases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Универсальный помощник юриста" description="Искусственный интеллект для помощи в работе" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Поддержка" description="Центр помощи и поддержки" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Настройки" description="Настройки системы" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            {/* Перенаправление с корня */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* 404 - перенаправляем на логин */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;