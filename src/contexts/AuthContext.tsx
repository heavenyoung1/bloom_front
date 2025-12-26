import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { AuthResponse, VerifyEmailResponse, ResendCodeResponse, UpdateProfileRequest } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  license_id: string;
  patronymic?: string;
  phone?: string;
  telegram_username?: string;
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
  updateProfile: (data: UpdateProfileRequest) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Проверяем оба хранилища при инициализации (сначала access_token, потом token для обратной совместимости)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token') || 
           sessionStorage.getItem('access_token') ||
           localStorage.getItem('token') || 
           sessionStorage.getItem('token');
  });
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
      console.log('checkAuth response:', response); // Для отладки
      
      // Определяем, в каком хранилище находится текущий токен
      const localStorageToken = localStorage.getItem('token');
      const sessionStorageToken = sessionStorage.getItem('token');
      const currentStorage = localStorageToken ? localStorage : sessionStorage;
      
      // Обрабатываем разные форматы ответа
      if (response.success && response.data) {
        // Стандартный формат
        setUser(response.data.user);
        if (response.data.token) {
          setToken(response.data.token);
          // Сохраняем токен в то же хранилище, откуда он был загружен
          currentStorage.setItem('token', response.data.token);
        }
        console.log('User data updated from /me:', response.data.user);
      } else if ((response as any).id || (response as any).email) {
        // Прямой объект пользователя
        const userData: User = {
          id: (response as any).id || 0,
          email: (response as any).email || '',
          first_name: (response as any).first_name || (response as any).firstname || '',
          last_name: (response as any).last_name || (response as any).lastname || '',
          license_id: (response as any).license_id || (response as any).licenseId || '',
          patronymic: (response as any).patronymic || undefined,
          phone: (response as any).phone || undefined,
          telegram_username: (response as any).telegram_username || undefined,
        };
        setUser(userData);
        console.log('User data updated from /me (direct format):', userData);
      } else {
        console.warn('Unexpected /me response format:', response);
        // Токен невалидный - только если пользователь еще не установлен
        // Если пользователь уже установлен, не удаляем его (может быть проблема с эндпоинтом)
        if (!user) {
          // Удаляем токен из обоих хранилищ
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
        // Удаляем токен только если это не 404 или если пользователь не установлен
        // 404 может означать проблему с эндпоинтом, а не с токеном
        if (error.status !== 404 || !user) {
          // Не удаляем токен и пользователя, если это временный пользователь
          // (значит, токен валидный, просто /me не работает как ожидалось)
          if (!user || user.id !== 0) {
            // Удаляем токен из обоих хранилищ
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            console.warn('Keeping temporary user despite /me error');
          }
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
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      console.log('Login started for:', email, 'rememberMe:', rememberMe);
      const response = await authApi.login({ email, password, remember_me: rememberMe });
      
      console.log('Login response:', response); // Для отладки
      
      // Выбираем хранилище в зависимости от rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Очищаем токены из обоих хранилищ перед сохранением нового
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      
      // Сервер может вернуть либо { success: true, data: {...} }, либо напрямую объект с токенами
      // Проверяем оба варианта
      if (response.success && response.data) {
        // Стандартный формат с success и data
        setUser(response.data.user);
        const accessToken = response.data.token || (response.data as any).access_token;
        const refreshToken = (response.data as any).refresh_token;
        
        setToken(accessToken);
        storage.setItem('access_token', accessToken);
        if (refreshToken) {
          storage.setItem('refresh_token', refreshToken);
        }
        // Для обратной совместимости
        storage.setItem('token', accessToken);
        console.log(`Token saved after login (standard format) to ${rememberMe ? 'localStorage' : 'sessionStorage'}`); // Для отладки
      } else if ((response as any).access_token || (response as any).access || (response as any).token) {
        // Прямой объект с токенами (как возвращает бэкенд)
        const loginData = response as any;
        const accessToken = loginData.access_token || loginData.access || loginData.token;
        const refreshToken = loginData.refresh_token;
        
        if (accessToken) {
          setToken(accessToken);
          storage.setItem('access_token', accessToken);
          if (refreshToken) {
            storage.setItem('refresh_token', refreshToken);
          }
          // Для обратной совместимости
          storage.setItem('token', accessToken);
          console.log(`Token saved after login (token format) to ${rememberMe ? 'localStorage' : 'sessionStorage'}`); // Для отладки
          
          let userData: User | null = null;
          
          // Если есть информация о пользователе, устанавливаем её
          if (loginData.user) {
            userData = loginData.user;
            setUser(userData);
            console.log('User saved after login (from user field):', userData); // Для отладки
          } else if (loginData.email || loginData.id) {
            // Если есть только email или id, создаем минимальный объект пользователя
            userData = {
              id: loginData.id || loginData.user?.id || 0,
              email: loginData.email || loginData.user?.email || '',
              first_name: loginData.first_name || loginData.user?.first_name || '',
              last_name: loginData.last_name || loginData.user?.last_name || '',
              license_id: loginData.license_id || loginData.user?.license_id || '',
              patronymic: loginData.patronymic || loginData.user?.patronymic || undefined,
              phone: loginData.phone || loginData.user?.phone || undefined,
              telegram_username: loginData.telegram_username || loginData.user?.telegram_username || undefined,
            };
            setUser(userData);
            console.log('User saved after login (constructed):', userData); // Для отладки
          } else {
            // Если нет данных пользователя в ответе, пытаемся получить их через /me
            // Но сначала создаем временного пользователя на основе email, чтобы isAuthenticated стал true
            const tempUser: User = {
              id: 0,
              email: email, // email из параметра функции login
              first_name: '',
              last_name: '',
              license_id: '',
            };
            setUser(tempUser);
            userData = tempUser;
            console.log('Temporary user created, fetching full user data via /me endpoint...');
            
            // Асинхронно получаем полные данные пользователя
            // Не ждём завершения, чтобы не блокировать навигацию
            checkAuth().then(() => {
              console.log('User data fetched successfully from /me');
            }).catch((error) => {
              console.warn('Failed to fetch user data via /me:', error);
              // Оставляем временного пользователя - токен валидный, просто /me не вернул данные
            });
          }
          
          // Возвращаем успешный ответ
          return {
            success: true,
            data: {
              user: userData || {
                id: 0,
                email: email,
                first_name: '',
                last_name: '',
                license_id: '',
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
      // Не устанавливаем isLoading в false сразу после логина,
      // так как может быть асинхронный вызов checkAuth()
      // setIsLoading(false) будет вызван в checkAuth() или через небольшую задержку
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
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
      // Очищаем токены из обоих хранилищ
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      // Очищаем сохраненные учетные данные
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('remembered_password');
      localStorage.removeItem('remember_me');
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
            patronymic: responseData.user.patronymic || responseData.patronymic || undefined,
            phone: responseData.user.phone || responseData.phone || undefined,
            telegram_username: responseData.user.telegram_username || responseData.telegram_username || undefined,
          };
        } else if (responseData.id && responseData.email) {
          // Прямой объект пользователя (как при регистрации)
          userToSave = {
            id: responseData.id,
            email: responseData.email,
            first_name: responseData.first_name || '',
            last_name: responseData.last_name || '',
            license_id: responseData.license_id || '',
            patronymic: responseData.patronymic || undefined,
            phone: responseData.phone || undefined,
            telegram_username: responseData.telegram_username || undefined,
          };
        }
      }
      
      // Сохраняем токен и пользователя, если они найдены
      if (tokenToSave) {
        setToken(tokenToSave);
        const refreshToken = responseData.refresh_token || responseData.data?.refresh_token;
        localStorage.setItem('access_token', tokenToSave);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        // Для обратной совместимости
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

  // Обновление профиля
  const updateProfile = async (data: UpdateProfileRequest): Promise<AuthResponse> => {
    try {
      const response = await authApi.updateProfile(data);
      
      // Обновляем данные пользователя после успешного обновления
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        // Если формат ответа другой, обновляем через checkAuth
        await checkAuth();
      }
      
      return response;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user && !!token;
  
  // Логируем изменения состояния для отладки
  useEffect(() => {
    console.log('AuthContext state changed - user:', user, 'token:', token ? 'present' : 'missing', 'isAuthenticated:', isAuthenticated);
  }, [user, token, isAuthenticated]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    verifyEmail,
    resendVerificationCode,
    updateProfile,
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