import React, { useState, useEffect } from 'react';
import { eventsApi } from '../../../services/api';
import type { Event } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './NearestEvents.module.scss';

const NearestEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadNearestEvents();
    }
  }, [user?.id]);

  const loadNearestEvents = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getNearestEvents(user.id);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Ошибка загрузки ближайших событий:', err);
      setError(err.message || 'Не удалось загрузить события');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>📅</div>
        <div className={styles.content}>
          <h3 className={styles.title}>Ближайшие события</h3>
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : events.length === 0 ? (
            <div className={styles.empty}>Нет предстоящих событий</div>
          ) : (
            <div className={styles.eventsList}>
              {events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`${styles.eventItem} ${isPast(event.event_date) ? styles.past : ''}`}
                >
                  <div className={styles.eventTime}>
                    {isToday(event.event_date) ? (
                      <span className={styles.today}>Сегодня</span>
                    ) : (
                      <span className={styles.date}>{formatDate(event.event_date)}</span>
                    )}
                    <span className={styles.time}>{formatTime(event.event_date)}</span>
                  </div>
                  <div className={styles.eventInfo}>
                    <div className={styles.eventName}>{event.name}</div>
                    <div className={styles.eventType}>{event.event_type}</div>
                  </div>
                </div>
              ))}
              {events.length > 3 && (
                <div className={styles.moreEvents}>
                  +{events.length - 3} еще
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearestEvents;

