import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);

  // Отслеживаем первую загрузку приложения
  useEffect(() => {
    if (!isLoading) {
      // Когда загрузка завершается, отмечаем что начальная загрузка прошла
      setInitialLoad(false);
    }
  }, [isLoading]);

  // Если пользователь уже авторизован, перенаправляем на дашборд
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Показываем загрузку только при первой загрузке приложения (проверка токена при монтировании)
  // После этого показываем формы даже во время операций (регистрация, логин)
  // Это позволяет формам (например, верификации email) отображаться даже во время операций
  if (isLoading && initialLoad) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;

