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

// Базовый HTTP клиент
const apiClient = {
  async request<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
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
        throw {
          message: responseData.message || responseData.detail || 'Ошибка сервера',
          status: response.status,
          errors: responseData.errors || responseData.detail,
        } as ApiError;
      }
      
      return responseData as T;
    } catch (error: any) {
      // Если это уже наш ApiError, пробрасываем дальше
      if (error.status || error.message) {
        console.error('API Error:', error);
        throw error;
      }
      
      // Если это ошибка сети или CORS
      console.error('Network/CORS Error:', error);
      throw {
        message: 'Ошибка подключения к серверу. Проверьте CORS настройки.',
        status: 0,
      } as ApiError;
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
    return apiClient.request<AuthResponse>('/auth/me', 'GET');
  },
  
  // Восстановление пароля
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request('/auth/forgot-password', 'POST', { email });
  },
  
  // Сброс пароля
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request('/auth/reset-password', 'POST', { token, password });
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

export default apiClient;