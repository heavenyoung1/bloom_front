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

  // Обновление профиля
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    return apiClient.request<AuthResponse>('/me', 'PATCH', data);
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
    const token = localStorage.getItem('token');
    
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
    const token = localStorage.getItem('token');
    
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
    return apiClient.request<PaymentDetail>('/payment-detail/create-payment-detail', 'POST', data);
  },
  
  // Получение платежной информации по ID
  async getPaymentDetail(paymentDetailId: number): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/payment-detail/payment-detail/${paymentDetailId}`, 'GET');
  },
  
  // Получение платежной информации по ID юриста
  async getPaymentDetailByAttorney(attorneyId: number): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/payment-detail/payment-detail/attorneys/${attorneyId}`, 'GET');
  },
  
  // Обновление платежной информации
  async updatePaymentDetail(paymentDetailId: number, data: UpdatePaymentDetailRequest): Promise<PaymentDetail> {
    return apiClient.request<PaymentDetail>(`/payment-detail/update-payment-detail/${paymentDetailId}`, 'PUT', data);
  },
  
  // Удаление платежной информации
  async deletePaymentDetail(paymentDetailId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.request<{ success: boolean; message?: string }>(`/payment-detail/delete-payment-detail/${paymentDetailId}`, 'DELETE');
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
    const token = localStorage.getItem('token');
    
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

export default apiClient;