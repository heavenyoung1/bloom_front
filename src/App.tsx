import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthForm from './components/AuthForm/AuthForm';
import Dashboard from './components/CRM/Dashboard/Dashboard';
import PlaceholderPage from './components/CRM/PlaceholderPage/PlaceholderPage';
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
            <Route
              path="/product"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Product" description="Управление продуктами" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Customers" description="Управление клиентами" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Income" description="Аналитика доходов" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promote"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Promote" description="Маркетинг и продвижение" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Help" description="Центр помощи и поддержки" />
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