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
  remember_me?: boolean;
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
      patronymic?: string;
      phone?: string;
      telegram_username?: string;
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

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
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

export interface Case {
  id: number;
  name: string;
  client_id: number;
  attorney_id: number;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Вспомогательные функции для работы с токенами
const getToken = (): string | null => {
  // Сначала проверяем localStorage, потом sessionStorage
  return localStorage.getItem('access_token') || 
         sessionStorage.getItem('access_token') ||
         localStorage.getItem('token') || 
         sessionStorage.getItem('token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken?: string, rememberMe: boolean = false): void => {
  const storage = rememberMe ? localStorage : sessionStorage;
  // Сохраняем новые токены
  storage.setItem('access_token', accessToken);
  if (refreshToken) {
    storage.setItem('refresh_token', refreshToken);
  }
  // Удаляем старые токены для обратной совместимости
  storage.removeItem('token');
};

const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('token');
};

// Флаг для предотвращения множественных одновременных запросов на обновление токена
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Функция для обновления токена
const refreshAccessToken = async (): Promise<string | null> => {
  // Если уже идет обновление, возвращаем существующий промис
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data: RefreshTokenResponse = await response.json();
      
      // Сохраняем новые токены
      const rememberMe = !!localStorage.getItem('refresh_token');
      setTokens(data.access_token, data.refresh_token || refreshToken, rememberMe);
      
      return data.access_token;
    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      clearTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Базовый HTTP клиент
const apiClient = {
  async request<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    headers: Record<string, string> = {},
    retry: boolean = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Получаем токен из обоих хранилищ для защищенных запросов
    const token = getToken();
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
      
      // Если получили 401 и это не запрос на обновление токена, пытаемся обновить токен
      if (response.status === 401 && retry && endpoint !== '/auth/refresh') {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Повторяем запрос с новым токеном
          authHeaders['Authorization'] = `Bearer ${newToken}`;
          config.headers = {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...headers,
          };
          
          const retryResponse = await fetch(url, config);
          
          if (!retryResponse.ok) {
            // Если после обновления токена все еще ошибка, пробрасываем дальше
            const contentType = retryResponse.headers.get('content-type');
            let responseData: any;
            
            if (contentType && contentType.includes('application/json')) {
              responseData = await retryResponse.json();
            } else {
              const text = await retryResponse.text();
              responseData = { message: text || 'Ошибка сервера' };
            }
            
            throw {
              message: responseData.message || responseData.detail || 'Ошибка авторизации',
              status: retryResponse.status,
              errors: responseData.errors || responseData.detail,
            } as ApiError;
          }
          
          // Парсим успешный ответ
          const contentType = retryResponse.headers.get('content-type');
          let responseData: any;
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await retryResponse.json();
          } else {
            const text = await retryResponse.text();
            responseData = { message: text || 'Успешно' };
          }
          
          return responseData as T;
        } else {
          // Если не удалось обновить токен, пробрасываем ошибку
          throw {
            message: 'Сессия истекла. Пожалуйста, войдите снова.',
            status: 401,
          } as ApiError;
        }
      }
      
      // Парсим ответ
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
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
      
      // Проверяем, является ли это эндпоинтом верификации или логина
      const isVerificationEndpoint = endpoint.includes('verify-email');
      const isLoginEndpoint = endpoint.includes('/auth/login');
      
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          // Если это эндпоинт верификации и CORS ошибка, скорее всего это неверный код
          if (isVerificationEndpoint) {
            errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
            status = 400; // Устанавливаем статус 400 для неверного кода
          } 
          // Для эндпоинта логина при CORS/Failed to fetch - может быть ошибка авторизации или сервера
          // Устанавливаем специальный статус, чтобы фронтенд мог правильно обработать
          else if (isLoginEndpoint) {
            // Для логина при ошибке подключения может быть:
            // 1. Реальная ошибка подключения/CORS
            // 2. Ошибка авторизации (401), которую заблокировал CORS
            // 3. Ошибка сервера (500), которую заблокировал CORS
            // Устанавливаем статус, который позволит фронтенду показать более общее сообщение
            errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение и настройки CORS на бэкенде.';
            status = 0; // Оставляем 0, чтобы фронтенд мог показать соответствующее сообщение
          } else {
            errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.';
          }
        } else if (error.message.includes('CORS')) {
          if (isVerificationEndpoint) {
            errorMessage = 'Код неверный. Проверьте код и попробуйте еще раз.';
            status = 400;
          } 
          // Для логина при CORS - может быть ошибка авторизации, скрытая за CORS
          else if (isLoginEndpoint) {
            errorMessage = 'Ошибка подключения к серверу. Проверьте настройки CORS на бэкенде. Возможно, неверный логин или пароль.';
            status = 0;
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
      } else if (isLoginEndpoint) {
        // Для логина при неизвестной ошибке - может быть проблема с авторизацией или подключением
        errorMessage = 'Ошибка подключения к серверу. Проверьте логин, пароль и настройки CORS на бэкенде.';
        status = 0;
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

  // Обновление профиля
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/me', 'PATCH', data);
  },

  // Обновление access token через refresh token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.request<RefreshTokenResponse>('/auth/refresh', 'POST', { refresh_token: refreshToken }, {}, false);
  },
};

// Интерфейс для обновления профиля
export interface UpdateProfileRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  license_id?: string;
  patronymic?: string;
  phone?: string;
  telegram_username?: string;
}

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

// Интерфейс для обновления клиента
export interface UpdateClientRequest {
  name?: string;
  type?: boolean;
  email?: string;
  phone?: string;
  personal_info?: string;
  address?: string;
  messenger?: string;
  messenger_handle?: string;
}

// API для работы с клиентами
export const clientsApi = {
  // Получение списка клиентов
  async getClients(): Promise<Client[]> {
    return apiClient.request<Client[]>('/clients', 'GET');
  },
  
  // Получение конкретного клиента
  async getClient(clientId: number): Promise<Client> {
    return apiClient.request<Client>(`/clients/${clientId}`, 'GET');
  },
  
  // Создание клиента
  async createClient(data: CreateClientRequest): Promise<Client> {
    return apiClient.request<Client>('/clients', 'POST', data);
  },
  
  // Обновление клиента
  async updateClient(clientId: number, data: UpdateClientRequest): Promise<Client> {
    return apiClient.request<Client>(`/clients/${clientId}`, 'PUT', data);
  },
  
  // Удаление клиента
  async deleteClient(clientId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/clients/${clientId}`, 'DELETE');
  },
};

// Интерфейс для создания дела
export interface CreateCaseRequest {
  attorney_id: number;
  client_id: number;
  description: string;
  name: string;
  status: string;
}

// Интерфейс для обновления дела
export interface UpdateCaseRequest {
  attorney_id?: number;
  client_id?: number;
  description?: string;
  name?: string;
  status?: string;
}

// API для работы с делами
export const casesApi = {
  // Получение списка дел
  async getCases(): Promise<Case[]> {
    return apiClient.request<Case[]>('/cases', 'GET');
  },
  
  // Получение конкретного дела
  async getCase(caseId: number): Promise<Case> {
    return apiClient.request<Case>(`/cases/${caseId}`, 'GET');
  },
  
  // Создание дела
  async createCase(data: CreateCaseRequest): Promise<Case> {
    return apiClient.request<Case>('/cases', 'POST', data);
  },
  
  // Обновление дела
  async updateCase(caseId: number, data: UpdateCaseRequest): Promise<Case> {
    return apiClient.request<Case>(`/cases/${caseId}`, 'PUT', data);
  },
  
  // Удаление дела
  async deleteCase(caseId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/cases/${caseId}`, 'DELETE');
  },
};

// Интерфейс для события
export interface Event {
  id: number;
  name: string;
  description: string;
  event_type: string;
  event_date: string;
  case_id: number;
  attorney_id: number;
  created_at: string;
  updated_at: string;
}

// Интерфейс для создания события
export interface CreateEventRequest {
  attorney_id: number;
  case_id: number;
  description: string;
  event_date: string;
  event_type: string;
  name: string;
}

// Интерфейс для обновления события
export interface UpdateEventRequest {
  attorney_id?: number;
  case_id?: number;
  description?: string;
  event_date?: string;
  event_type?: string;
  name?: string;
}

// API для работы с событиями
export const eventsApi = {
  // Получение списка событий
  async getEvents(): Promise<Event[]> {
    return apiClient.request<Event[]>('/events', 'GET');
  },
  
  // Получение событий для конкретного адвоката
  async getEventsByAttorney(attorneyId: number): Promise<Event[]> {
    return apiClient.request<Event[]>(`/events/attorney/${attorneyId}`, 'GET');
  },
  
  // Получение событий для конкретного дела
  async getEventsByCase(caseId: number): Promise<Event[]> {
    return apiClient.request<Event[]>(`/events/cases/${caseId}`, 'GET');
  },
  
  // Получение количества событий для дела
  async getCaseEventsCount(caseId: number): Promise<number> {
    try {
      const data = await apiClient.request<Event[]>(`/events/cases/${caseId}`, 'GET');
      return Array.isArray(data) ? data.length : 0;
    } catch (err) {
      console.error(`Ошибка получения количества событий для дела ${caseId}:`, err);
      return 0;
    }
  },
  
  // Получение ближайших событий для адвоката
  async getNearestEvents(attorneyId: number): Promise<Event[]> {
    return apiClient.request<Event[]>(`/nearest-events/attorney/${attorneyId}`, 'GET');
  },
  
  // Получение конкретного события
  async getEvent(eventId: number): Promise<Event> {
    return apiClient.request<Event>(`/events/${eventId}`, 'GET');
  },
  
  // Создание события
  async createEvent(data: CreateEventRequest): Promise<Event> {
    return apiClient.request<Event>('/events', 'POST', data);
  },
  
  // Обновление события
  async updateEvent(eventId: number, data: UpdateEventRequest): Promise<Event> {
    return apiClient.request<Event>(`/events/${eventId}`, 'PUT', data);
  },
  
  // Удаление события
  async deleteEvent(eventId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/events/${eventId}`, 'DELETE');
  },
};

// Интерфейс для документа
export interface Document {
  id: number;
  case_id: number;
  file_name: string;
  storage_path?: string;
  file_size?: number | string;
  mime_type?: string;
  attorney_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для ответа со списком документов
export interface DocumentsResponse {
  documents: Document[];
  total: number;
}

// API для работы с документами
export const documentsApi = {
  // Получение списка документов дела
  async getCaseDocuments(caseId: number): Promise<Document[] | DocumentsResponse> {
    return apiClient.request<Document[] | DocumentsResponse>(`/cases/${caseId}/documents`, 'GET');
  },
  
  // Получение количества документов дела
  async getCaseDocumentsCount(caseId: number): Promise<number> {
    try {
      const data = await apiClient.request<Document[] | DocumentsResponse>(`/cases/${caseId}/documents`, 'GET');
      if (typeof data === 'object' && data !== null && 'total' in data) {
        return (data as DocumentsResponse).total;
      } else if (Array.isArray(data)) {
        return data.length;
      }
      return 0;
    } catch (err) {
      console.error(`Ошибка получения количества документов для дела ${caseId}:`, err);
      return 0;
    }
  },
  
  // Загрузка документа в дело
  async uploadDocument(caseId: number, file: File): Promise<Document> {
    const url = `${API_BASE_URL}/cases/${caseId}/documents`;
    const token = getToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Ошибка загрузки документа';
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      }
      
      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }
    
    return await response.json();
  },
  
  // Получение данных документа
  async getDocument(documentId: number): Promise<Document> {
    return apiClient.request<Document>(`/documents/${documentId}`, 'GET');
  },
  
  // Удаление документа
  async deleteDocument(documentId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/documents/${documentId}/`, 'DELETE');
  },
  
  // Скачивание документа
  async downloadDocument(documentId: number): Promise<Blob> {
    const url = `${API_BASE_URL}/documents/${documentId}/download`;
    const token = getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Ошибка скачивания документа';
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      }
      
      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }
    
    return await response.blob();
  },
};

// Интерфейс для платежной информации
export interface PaymentDetail {
  id: number;
  attorney_id: number;
  address?: string;
  bank_account?: string;
  bank_recipient?: string;
  bik?: string;
  correspondent_account?: string;
  index_address?: string;
  inn?: string;
  kpp?: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для создания платежной информации
export interface CreatePaymentDetailRequest {
  address?: string;
  bank_account?: string;
  bank_recipient?: string;
  bik?: string;
  correspondent_account?: string;
  index_address?: string;
  inn?: string;
  kpp?: string;
}

// Интерфейс для обновления платежной информации
export interface UpdatePaymentDetailRequest {
  attorney_id?: number;
  address?: string;
  bank_account?: string;
  bank_recipient?: string;
  bik?: string;
  correspondent_account?: string;
  index_address?: string;
  inn?: string;
  kpp?: string;
}

// API для работы с платежной информацией
export const paymentDetailApi = {
  // Создание платежной информации
  async createPaymentDetail(data: CreatePaymentDetailRequest): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>('/create-payment-detail', 'POST', data);
  },
  
  // Получение платежной информации по ID
  async getPaymentDetail(paymentDetailId: number): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/payment-detail/${paymentDetailId}`, 'GET');
  },
  
  // Получение платежной информации по ID юриста
  async getPaymentDetailByAttorney(attorneyId: number): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/payment-detail/attorneys/${attorneyId}`, 'GET');
  },
  
  // Обновление платежной информации
  async updatePaymentDetail(paymentDetailId: number, data: UpdatePaymentDetailRequest): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/update-payment-detail/${paymentDetailId}`, 'PUT', data);
  },
  
  // Удаление платежной информации
  async deletePaymentDetail(paymentDetailId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/delete-payment-detail/${paymentDetailId}`, 'DELETE');
  },
};

// Интерфейс для платежа клиента
export interface ClientPayment {
  id: number;
  attorney_id: number;
  client_id: number;
  condition?: string;
  name: string;
  pade_date?: string;
  paid: number;
  paid_deadline?: string;
  paid_str?: string;
  status: string;
  taxable: boolean;
  created_at: string;
  updated_at: string;
}

// Интерфейс для создания платежа клиента
export interface CreateClientPaymentRequest {
  attorney_id: number;
  client_id: number;
  condition?: string;
  name: string;
  pade_date?: string;
  paid: number;
  paid_deadline?: string;
  paid_str?: string;
  status: string;
  taxable: boolean;
}

// Интерфейс для обновления платежа клиента
export interface UpdateClientPaymentRequest {
  attorney_id?: number;
  client_id?: number;
  condition?: string;
  name?: string;
  pade_date?: string;
  paid?: number;
  paid_deadline?: string;
  paid_str?: string;
  status?: string;
  taxable?: boolean;
}

// API для работы с платежами клиентов
export const clientPaymentsApi = {
  // Создание платежа для клиента
  async createClientPayment(data: CreateClientPaymentRequest): Promise<ClientPayment> {
    return apiClient.request<ClientPayment>('/create-client-payment', 'POST', data);
  },
  
  // Получение платежа по ID
  async getClientPayment(paymentId: number): Promise<ClientPayment> {
    return apiClient.request<ClientPayment>(`/get-client-payment/${paymentId}`, 'GET');
  },
  
  // Получение всех платежей для юриста
  async getClientPaymentsByAttorney(attorneyId: number): Promise<ClientPayment[]> {
    return apiClient.request<ClientPayment[]>(`/get-client-payment/attorneys/${attorneyId}`, 'GET');
  },
  
  // Обновление платежа
  async updateClientPayment(paymentId: number, data: UpdateClientPaymentRequest): Promise<ClientPayment> {
    return apiClient.request<ClientPayment>(`/update-client-payment/${paymentId}`, 'PUT', data);
  },
  
  // Удаление платежа
  async deleteClientPayment(paymentId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/delete-client-payment/${paymentId}`, 'DELETE');
  },
  
  // Скачивание PDF документа платежа
  async downloadPaymentPdf(paymentId: number): Promise<Blob> {
    const url = `${API_BASE_URL}/download-payment-pdf/${paymentId}`;
    const token = getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Ошибка скачивания PDF';
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      }
      
      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }
    
    return await response.blob();
  },
};

// Интерфейс для контакта
export interface Contact {
  id: number;
  attorney_id: number;
  case_id: number;
  email: string;
  name: string;
  personal_info: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для создания контакта
export interface CreateContactRequest {
  attorney_id: number;
  case_id: number;
  email: string;
  name: string;
  personal_info: string;
  phone: string;
}

// Интерфейс для обновления контакта
export interface UpdateContactRequest {
  attorney_id?: number;
  case_id?: number;
  email?: string;
  name?: string;
  personal_info?: string;
  phone?: string;
}

// API для работы с контактами
export const contactsApi = {
  // Получение списка контактов
  async getContacts(): Promise<Contact[]> {
    return apiClient.request<Contact[]>('/contacts', 'GET');
  },
  
  // Получение конкретного контакта
  async getContact(contactId: number): Promise<Contact> {
    return apiClient.request<Contact>(`/contacts/${contactId}`, 'GET');
  },
  
  // Создание контакта
  async createContact(data: CreateContactRequest): Promise<Contact> {
    return apiClient.request<Contact>('/contacts', 'POST', data);
  },
  
  // Обновление контакта
  async updateContact(contactId: number, data: UpdateContactRequest): Promise<Contact> {
    return apiClient.request<Contact>(`/contacts/${contactId}`, 'PUT', data);
  },
  
  // Удаление контакта
  async deleteContact(contactId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/contacts/${contactId}`, 'DELETE');
  },
};

// Интерфейс для данных дашборда
export interface DashboardData {
  case_name: string;
  client_name: string;
  client_phone: string;
  contact_name: string;
  contact_phone: string;
  event_name: string;
  pending_payments_count: number;
}

// API для работы с дашбордом
export const dashboardApi = {
  // Получение данных дашборда
  async getDashboard(): Promise<DashboardData[]> {
    return apiClient.request<DashboardData[]>('/dashboard', 'GET');
  },
};

export default apiClient;
