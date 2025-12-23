import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import CreateEventForm from './CreateEventForm';
import { eventsApi } from '../../../services/api';
import type { Event } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Calendar.module.scss';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (user?.id) {
      loadEvents();
    }
  }, [user?.id]);

  const loadEvents = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await eventsApi.getEventsByAttorney(user.id);
      setEvents(data);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleEventCreated = () => {
    loadEvents();
    setShowCreateForm(false);
  };

  const handleEventUpdated = () => {
    loadEvents();
    setShowEditForm(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }

    try {
      await eventsApi.deleteEvent(eventId);
      loadEvents();
    } catch (error) {
      console.error('Ошибка удаления события:', error);
      alert('Не удалось удалить событие. Попробуйте еще раз.');
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEditForm(true);
  };

  // Навигация по месяцам
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Получение названия месяца и года
  const getMonthYear = () => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Получение дней месяца
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0

    const days = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Получение событий для конкретной даты
  const getEventsForDate = (day: number | null): Event[] => {
    if (day === null) return [];
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Проверка, является ли день сегодняшним
  const isToday = (day: number | null): boolean => {
    if (day === null) return false;
    const today = new Date();
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  // Преобразование русского типа события в CSS класс
  const getEventTypeClass = (eventType: string): string => {
    const typeMap: Record<string, string> = {
      'Встреча': 'eventType_meeting',
      'Задача': 'eventType_task',
      'Судебное заседание': 'eventType_court_hearing',
      'Дедлайн': 'eventType_deadline',
      'Важное': 'eventType_important',
      'Другое': 'eventType_other',
    };
    return typeMap[eventType] || 'eventType_other';
  };

  const days = getDaysInMonth();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className={styles.calendar}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardHeader />
        
        <div className={styles.calendarContainer}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>Календарь событий</h2>
              <p className={styles.subtitle}>Управление событиями и встречами</p>
            </div>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              + Создать событие
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>Загрузка событий...</div>
          ) : (
            <div className={styles.calendarContent}>
              <div className={styles.calendarHeader}>
                <button className={styles.navButton} onClick={goToPreviousMonth}>
                  ‹
                </button>
                <div className={styles.monthYear}>
                  <h3>{getMonthYear()}</h3>
                  <button className={styles.todayButton} onClick={goToToday}>
                    Сегодня
                  </button>
                </div>
                <button className={styles.navButton} onClick={goToNextMonth}>
                  ›
                </button>
              </div>

              <div className={styles.calendarGrid}>
                {/* Заголовки дней недели */}
                {weekDays.map((day, index) => (
                  <div key={index} className={styles.weekDayHeader}>
                    {day}
                  </div>
                ))}

                {/* Дни месяца */}
                {days.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const today = isToday(day);

                  return (
                    <div
                      key={index}
                      className={`${styles.calendarDay} ${day === null ? styles.emptyDay : ''} ${today ? styles.today : ''}`}
                    >
                      {day !== null && (
                        <>
                          <div className={styles.dayNumber}>{day}</div>
                          <div className={styles.dayEvents}>
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className={`${styles.eventBadge} ${styles[getEventTypeClass(event.event_type)] || styles.eventType_other}`}
                                onClick={() => handleEventClick(event)}
                                title={`${event.name}\n${event.description}`}
                              >
                                <span className={styles.eventTime}>
                                  {new Date(event.event_date).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span className={styles.eventName}>{event.name}</span>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className={styles.moreEvents}>
                                +{dayEvents.length - 3} еще
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {showCreateForm && (
          <CreateEventForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleEventCreated}
          />
        )}

        {showEditForm && selectedEvent && (
          <EditEventForm
            event={selectedEvent}
            onClose={() => {
              setShowEditForm(false);
              setSelectedEvent(null);
            }}
            onSuccess={handleEventUpdated}
            onDelete={handleDeleteEvent}
          />
        )}
      </div>
    </div>
  );
};

// Компонент для редактирования события
interface EditEventFormProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (eventId: number) => void;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onClose, onSuccess, onDelete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description,
    event_type: event.event_type,
    event_date: new Date(event.event_date).toISOString().slice(0, 16),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setErrors({ submit: 'Ошибка: пользователь не авторизован' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const eventDate = new Date(formData.event_date);
      const isoDate = eventDate.toISOString();

      await eventsApi.updateEvent(event.id, {
        ...formData,
        event_date: isoDate,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Ошибка обновления события:', error);
      setErrors({
        submit: error.message || 'Не удалось обновить событие. Попробуйте еще раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Редактировать событие</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.submit && (
            <div className={styles.errorMessage}>{errors.submit}</div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Название <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              rows={4}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_type" className={styles.label}>
              Тип события <span className={styles.required}>*</span>
            </label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.event_type ? styles.inputError : ''}`}
              required
            >
              <option value="Встреча">Встреча</option>
              <option value="Задача">Задача</option>
              <option value="Судебное заседание">Судебное заседание</option>
              <option value="Дедлайн">Дедлайн</option>
              <option value="Важное">Важное</option>
              <option value="Другое">Другое</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event_date" className={styles.label}>
              Дата и время <span className={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              id="event_date"
              name="event_date"
              value={formData.event_date}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.event_date ? styles.inputError : ''}`}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleDelete}
              className={styles.deleteButton}
              disabled={isSubmitting}
            >
              Удалить
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !user?.id}
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Calendar;
