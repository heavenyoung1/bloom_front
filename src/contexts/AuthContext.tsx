import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { AuthResponse, VerifyEmailResponse, ResendCodeResponse } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  license_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<VerifyEmailResponse>;
  resendVerificationCode: (email: string) => Promise<ResendCodeResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Проверка токена/сессии
  const checkAuth = async () => {
    try {
      const response = await authApi.me();
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else {
        // Токен невалидный
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Вход
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект с токенами
      // Проверяем оба варианта
      if (response.success && response.data) {
        // Стандартный формат с success и data
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else if ((response as any).access_token || (response as any).access) {
        // Прямой объект с токенами (как возвращает бэкенд)
        const loginData = response as any;
        const accessToken = loginData.access_token || loginData.access || loginData.token;
        
        if (accessToken) {
          setToken(accessToken);
          localStorage.setItem('token', accessToken);
          
          // Если есть информация о пользователе, устанавливаем её
          if (loginData.user) {
            setUser(loginData.user);
          } else if (loginData.email) {
            // Если есть только email, создаем минимальный объект пользователя
            setUser({
              id: loginData.id || 0,
              email: loginData.email,
              first_name: loginData.first_name || '',
              last_name: loginData.last_name || '',
              license_id: loginData.license_id || '',
            });
          }
          
          // Возвращаем успешный ответ
          return {
            success: true,
            data: {
              user: {
                id: loginData.id || loginData.user?.id || 0,
                email: loginData.email || loginData.user?.email || '',
                first_name: loginData.first_name || loginData.user?.first_name || '',
                last_name: loginData.last_name || loginData.user?.last_name || '',
                license_id: loginData.license_id || loginData.user?.license_id || '',
              },
              token: accessToken,
              expires_in: loginData.expires_in || 3600,
            },
          } as AuthResponse;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Регистрация
  const register = async (userData: any): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      
      // НЕ устанавливаем пользователя и токен после регистрации,
      // так как требуется верификация email
      // Пользователь будет установлен только после успешной верификации
      // if (response.success && response.data && response.data.token) {
      //   setUser(response.data.user);
      //   setToken(response.data.token);
      //   localStorage.setItem('token', response.data.token);
      // }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  // Верификация email
  const verifyEmail = async (email: string, code: string): Promise<VerifyEmailResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyEmail({ email, code });
      
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект пользователя
      // Проверяем оба варианта
      if (response.success && response.data) {
        // Стандартный формат с success и data
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else if ((response as any).id && (response as any).email) {
        // Прямой объект пользователя (как при регистрации)
        const userData = response as any;
        setUser({
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          license_id: userData.license_id,
        });
        // Если есть токен в ответе, сохраняем его
        if (userData.token) {
          setToken(userData.token);
          localStorage.setItem('token', userData.token);
        }
        // Возвращаем успешный ответ
        return {
          success: true,
          data: {
            user: {
              id: userData.id,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              license_id: userData.license_id,
            },
            token: userData.token || '',
            expires_in: 3600,
          },
        } as VerifyEmailResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода подтверждения
  const resendVerificationCode = async (email: string): Promise<ResendCodeResponse> => {
    try {
      const response = await authApi.resendVerificationCode({ email });
      return response;
    } catch (error) {
      console.error('Resend verification code failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    verifyEmail,
    resendVerificationCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};