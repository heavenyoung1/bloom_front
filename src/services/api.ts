// Базовый URL API (будем менять в зависимости от среды)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v0';

// Интерфейсы для запросов/ответов
export interface RegisterRequest {
  license_id: string;
  first_name: string;
  last_name: string;
  patronymic: string;
  email: string;
  phone: string;
  telegram_username?: string;
  password: string;
  confirm_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      license_id: string;
    };
    token: string;
    expires_in: number;
  };
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      license_id: string;
    };
    token: string;
    expires_in: number;
  };
  errors?: Record<string, string[]>;
}

export interface ResendCodeRequest {
  email: string;
}

export interface ResendCodeResponse {
  success: boolean;
  message?: string;
}

export interface Client {
  id: number;
  name: string;
  type: boolean;
  email: string;
  phone: string;
  personal_info: string;
  address: string;
  messenger: string;
  messenger_handle: string;
  owner_attorney_id: number;
  created_at: string;
  updated_at: string;
}

// Экспортируем тип для использования в других модулях
export type { Client as ClientType };

// Базовый HTTP клиент
const apiClient = {
  async request<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Получаем токен из localStorage для защищенных запросов
    const token = localStorage.getItem('token');
    const authHeaders: Record<string, string> = {};
    
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      credentials: 'include', // Для работы с куки/сессиями
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, config);
      
      // Проверяем, есть ли тело ответа перед парсингом JSON
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          // Если не удалось распарсить JSON, читаем как текст
          const text = await response.text();
          console.error('Failed to parse JSON response:', text);
          throw {
            message: 'Ошибка обработки ответа сервера',
            status: response.status,
          } as ApiError;
        }
      } else {
        // Если ответ не JSON, читаем как текст
        const text = await response.text();
        responseData = { message: text || 'Ошибка сервера' };
      }
      
      if (!response.ok) {
        // Извлекаем сообщение об ошибке из различных возможных полей
        let errorMessage = 'Ошибка сервера';
        
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.detail) {
          // FastAPI часто возвращает ошибки в поле detail
          if (typeof responseData.detail === 'string') {
            errorMessage = responseData.detail;
          } else if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
            // Обрабатываем массив ошибок валидации FastAPI
            const firstError = responseData.detail[0];
            if (firstError.msg) {
              errorMessage = `${firstError.loc ? firstError.loc.join('.') + ': ' : ''}${firstError.msg}`;
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            } else {
              errorMessage = JSON.stringify(firstError);
            }
          }
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.errors) {
          // Если есть ошибки валидации, берем первую
          const errorKeys = Object.keys(responseData.errors);
          if (errorKeys.length > 0) {
            const firstError = responseData.errors[errorKeys[0]];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        }
        
        throw {
          message: errorMessage,
          status: response.status,
          errors: responseData.errors || responseData.detail,
          fullResponse: responseData, // Добавляем полный ответ для отладки
        } as ApiError;
      }
      
      return responseData as T;
    } catch (error: any) {
      // Если это уже наш ApiError (созданный выше), пробрасываем дальше
      if (error.status !== undefined || (error.message && error.message !== 'Failed to fetch')) {
        console.error('API Error:', error);
        throw error;
      }
      
      // Если это ошибка сети, CORS или другая ошибка fetch
      console.error('Network/Fetch Error:', error);
      
      // Определяем тип ошибки
      // При CORS ошибке запрос может быть отправлен, но ответ заблокирован
      // Поэтому для эндпоинтов верификации считаем это ошибкой валидации
      let errorMessage = 'Ошибка подключения к серверу.';
      let status = 0;
      
      // Проверяем, является ли это эндпоинтом верификации
      const isVerificationEndpoint = endpoint.includes('verify-email');
      
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          // Если это эндпоинт верификации и CORS ошибка, скорее всего это неверный код
          if (isVerificationEndpoint) {
            errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
            status = 400; // Устанавливаем статус 400 для неверного кода
          } else {
            errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.';
          }
        } else if (error.message.includes('CORS')) {
          if (isVerificationEndpoint) {
            errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
            status = 400;
          } else {
            errorMessage = 'Ошибка подключения к серверу. Обратитесь к администратору.';
          }
        } else {
          errorMessage = error.message;
        }
      } else if (isVerificationEndpoint) {
        // Для эндпоинта верификации по умолчанию считаем код неверным
        errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
        status = 400;
      }
      
      const apiError: ApiError = {
        message: errorMessage,
        status: status,
      };
      
      throw apiError;
    }
  },
};

// Конкретные методы API
export const authApi = {
  // Регистрация
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/auth/register', 'POST', data);
  },
  
  // Вход
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/auth/login', 'POST', data);
  },
  
  // Выход
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiClient.request('/auth/logout', 'POST');
  },
  
  // Проверка токена/сессии
  async me(): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/me', 'GET');
  },
  
  // Восстановление пароля
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request('/auth/forgot-password', 'POST', { email });
  },
  
  // Сброс пароля
  async resetPassword(email: string, code: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request('/auth/reset-password', 'POST', { email, code, new_password: password });
  },

  // Верификация email
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return apiClient.request<VerifyEmailResponse>('/auth/verify-email', 'POST', data);
  },

  // Повторная отправка кода подтверждения
  async resendVerificationCode(data: ResendCodeRequest): Promise<ResendCodeResponse> {
    return apiClient.request<ResendCodeResponse>('/auth/resend-verification-code', 'POST', data);
  },
};

// Интерфейс для создания клиента
export interface CreateClientRequest {
  name: string;
  type: boolean;
  email: string;
  phone: string;
  personal_info: string;
  address: string;
  messenger: string;
  messenger_handle: string;
}

// API для работы с клиентами
export const clientsApi = {
  // Получение списка клиентов
  async getClients(): Promise<Client[]> {
    return apiClient.request<Client[]>('/clients', 'GET');
  },
  
  // Создание клиента
  async createClient(data: CreateClientRequest): Promise<Client> {
    return apiClient.request<Client>('/clients', 'POST', data);
  },
};

export default apiClient;