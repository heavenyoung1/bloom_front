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
        // Токен невалидный - только если пользователь еще не установлен
        // Если пользователь уже установлен, не удаляем его (может быть проблема с эндпоинтом)
        if (!user) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Удаляем токен только если это не 404 или если пользователь не установлен
      // 404 может означать проблему с эндпоинтом, а не с токеном
      if (error.status !== 404 || !user) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } else {
        // Если есть пользователь, но /me возвращает 404, возможно проблема с эндпоинтом
        // Не удаляем пользователя и токен, так как они могут быть валидными
        console.warn('Auth check returned 404, but user is already set. Possibly endpoint issue.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Вход
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      console.log('Login response:', response); // Для отладки
      
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект с токенами
      // Проверяем оба варианта
      if (response.success && response.data) {
        // Стандартный формат с success и data
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        console.log('Token saved after login (standard format)'); // Для отладки
      } else if ((response as any).access_token || (response as any).access || (response as any).token) {
        // Прямой объект с токенами (как возвращает бэкенд)
        const loginData = response as any;
        const accessToken = loginData.access_token || loginData.access || loginData.token;
        
        if (accessToken) {
          setToken(accessToken);
          localStorage.setItem('token', accessToken);
          console.log('Token saved after login (token format)'); // Для отладки
          
          // Если есть информация о пользователе, устанавливаем её
          if (loginData.user) {
            setUser(loginData.user);
            console.log('User saved after login (from user field):', loginData.user); // Для отладки
          } else if (loginData.email || loginData.id) {
            // Если есть только email или id, создаем минимальный объект пользователя
            const userData = {
              id: loginData.id || loginData.user?.id || 0,
              email: loginData.email || loginData.user?.email || '',
              first_name: loginData.first_name || loginData.user?.first_name || '',
              last_name: loginData.last_name || loginData.user?.last_name || '',
              license_id: loginData.license_id || loginData.user?.license_id || '',
            };
            setUser(userData);
            console.log('User saved after login (constructed):', userData); // Для отладки
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
      
      // Если дошли сюда, токен не был найден
      console.warn('No token found in login response'); // Для отладки
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
      
      console.log('Verify email response:', response); // Для отладки
      
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект с токенами
      // Проверяем все возможные форматы
      let tokenToSave: string | null = null;
      let userToSave: User | null = null;
      
      if (response.success && response.data) {
        // Стандартный формат с success и data
        tokenToSave = response.data.token;
        userToSave = response.data.user;
      } else {
        // Проверяем различные форматы ответа
        const responseData = response as any;
        
        // Ищем токен в различных полях
        tokenToSave = responseData.token || 
                     responseData.access_token || 
                     responseData.access ||
                     responseData.data?.token ||
                     responseData.data?.access_token;
        
        // Ищем данные пользователя
        if (responseData.user) {
          userToSave = {
            id: responseData.user.id || responseData.id,
            email: responseData.user.email || responseData.email,
            first_name: responseData.user.first_name || responseData.first_name || '',
            last_name: responseData.user.last_name || responseData.last_name || '',
            license_id: responseData.user.license_id || responseData.license_id || '',
          };
        } else if (responseData.id && responseData.email) {
          // Прямой объект пользователя (как при регистрации)
          userToSave = {
            id: responseData.id,
            email: responseData.email,
            first_name: responseData.first_name || '',
            last_name: responseData.last_name || '',
            license_id: responseData.license_id || '',
          };
        }
      }
      
      // Сохраняем токен и пользователя, если они найдены
      if (tokenToSave) {
        setToken(tokenToSave);
        localStorage.setItem('token', tokenToSave);
        console.log('Token saved after verification'); // Для отладки
      } else {
        console.warn('No token found in verification response'); // Для отладки
      }
      
      if (userToSave) {
        setUser(userToSave);
        console.log('User saved after verification:', userToSave); // Для отладки
      }
      
      // Если не нашли токен или пользователя в стандартном формате, возвращаем ответ как есть
      // но с установленными данными если они были найдены
      if (response.success && response.data) {
        return response;
      } else if (tokenToSave && userToSave) {
        return {
          success: true,
          data: {
            user: userToSave,
            token: tokenToSave,
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