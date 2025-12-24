// Статусы дел
export enum CaseStatus {
  NEW = 'Новое',
  IN_PROGRESS = 'В работе',
  ON_HOLD = 'На паузе',
  COMPLETED = 'Завершено',
  CLOSED = 'Закрыто',
  CANCELLED = 'Отменено',
  ARCHIVED = 'Архивировано',
}

// Массив всех статусов для использования в селектах
export const CASE_STATUSES = [
  CaseStatus.NEW,
  CaseStatus.IN_PROGRESS,
  CaseStatus.ON_HOLD,
  CaseStatus.COMPLETED,
  CaseStatus.CLOSED,
  CaseStatus.CANCELLED,
  CaseStatus.ARCHIVED,
];

// Функция для получения цвета статуса
export const getStatusColor = (status: string): string => {
  switch (status) {
    case CaseStatus.NEW:
      return '#3b82f6'; // синий
    case CaseStatus.IN_PROGRESS:
      return '#f59e0b'; // оранжевый
    case CaseStatus.ON_HOLD:
      return '#6F88FC'; // голубой
    case CaseStatus.COMPLETED:
      return '#10b981'; // зеленый
    case CaseStatus.CLOSED:
      return '#6b7280'; // серый
    case CaseStatus.CANCELLED:
      return '#ef4444'; // красный
    case CaseStatus.ARCHIVED:
      return '#4b5563'; // темно-серый
    default:
      return '#6b7280'; // серый по умолчанию
  }
};


