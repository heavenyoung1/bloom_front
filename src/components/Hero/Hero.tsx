import React, { useState } from 'react';
import styles from './Hero.module.scss';

// Типы для формы
interface FormData {
  fullName: string;
  email: string;
  industry: string;
  teamSize: string;
}

const Hero: React.FC = () => {
  // Состояние для формы
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    industry: 'Design',
    teamSize: '1-9 Members'
  });

  // Обработчики изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Здесь будет логика отправки данных
    alert('Thank you for your submission!');
  };

  // Обработчики для кнопок
  const handleDemoClick = () => {
    console.log('Schedule Demo clicked');
  };

  const handleContactClick = () => {
    console.log('Contact Sales clicked');
  };

  return (
    <section className={styles.hero}>
      {/* Левая колонка - Текст */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          CRM для юристов
        </h1>
        <h2 className={styles.subtitle}>
          Управляйте делами, клиентами и документами в одном месте
        </h2>
        <p className={styles.description}>
          Дела, клиенты, события, документы и напоминания —
          всё в единой системе, созданной специально для юристов.
        </p>
        
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleDemoClick}
          >
            Запросить демо
          </button>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleContactClick}
          >
            Посмотреть возможности
          </button>
        </div>
      </div>

      {/* Правая колонка - Форма */}
      <div className={styles.form}>
        <h3 className={styles.formTitle}>Отправьте свои контакты</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="fullName">
              Имя
            </label>
            <input
              className={styles.input}
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Имя"
              required
            />
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Адрес электронной почты
            </label>
            <input
              className={styles.input}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
              required
            />
          </div>

          {/* Industry */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="industry">
              Тип пользователя
            </label>
            <select
              className={styles.select}
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
            >
              <option value="Design">Адвокат</option>
              <option value="Design">Частный юрист</option>
              <option value="Development">Юридическая фирма</option>
            </select>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
          >
            Отправить
          </button>
        </form>
      </div>
    </section>
  );
};

export default Hero;