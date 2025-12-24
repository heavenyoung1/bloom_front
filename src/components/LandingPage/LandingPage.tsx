import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Hero from '../Hero/Hero';
import styles from './LandingPage.module.scss';

const LandingPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Обработка якорных ссылок при загрузке страницы
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      // Прокрутка наверх при загрузке без якоря
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div className={styles.landingPage}>
      <Header />
      
      {/* Hero секция с градиентным фоном */}
      <section id="overview" className={styles.heroSection}>
        <Hero />
        <div 
          className={styles.scrollIndicator}
          onClick={() => {
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
              featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V22M12 22L19 15M12 22L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Прокрутите вниз</span>
        </div>
      </section>

      {/* Секция Функции */}
      <section id="features" className={styles.contentSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Функции</h2>
          <p className={styles.sectionDescription}>
            Всё необходимое для эффективной работы юридической практики
          </p>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📋</div>
              <h3>Управление делами</h3>
              <p>Отслеживайте статусы дел, важные даты и документы в единой системе</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👥</div>
              <h3>База клиентов</h3>
              <p>Централизованное хранение информации о клиентах и контактах</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📅</div>
              <h3>Календарь событий</h3>
              <p>Планируйте встречи, судебные заседания и важные события</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Учёт платежей</h3>
              <p>Контролируйте финансовые операции и платежи клиентов</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📄</div>
              <h3>Документооборот</h3>
              <p>Храните и управляйте всеми документами в одном месте</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3>AI помощник</h3>
              <p>Искусственный интеллект для помощи в юридической работе</p>
            </div>
          </div>
        </div>
      </section>

      {/* Секция Цены */}
      <section id="pricing" className={styles.contentSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Тарифы</h2>
          <p className={styles.sectionDescription}>
            Выберите план, который подходит именно вам
          </p>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <h3>Базовый</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>0₽</span>
                <span className={styles.pricePeriod}>/месяц</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li>До 10 дел</li>
                <li>До 20 клиентов</li>
                <li>Базовый календарь</li>
                <li>Email поддержка</li>
              </ul>
              <button className={styles.pricingButton}>Начать бесплатно</button>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <div className={styles.badge}>Популярный</div>
              <h3>Профессиональный</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>2990₽</span>
                <span className={styles.pricePeriod}>/месяц</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li>Неограниченное количество дел</li>
                <li>Неограниченное количество клиентов</li>
                <li>Расширенный календарь</li>
                <li>AI помощник</li>
                <li>Приоритетная поддержка</li>
              </ul>
              <button className={styles.pricingButton}>Выбрать план</button>
            </div>
            <div className={styles.pricingCard}>
              <h3>Корпоративный</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>По запросу</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li>Всё из Профессионального</li>
                <li>Многопользовательский доступ</li>
                <li>Кастомная интеграция</li>
                <li>Персональный менеджер</li>
                <li>Обучение команды</li>
              </ul>
              <button className={styles.pricingButton}>Связаться с нами</button>
            </div>
          </div>
        </div>
      </section>

      {/* Секция Для кого */}
      <section id="forwhom" className={styles.contentSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Для кого</h2>
          <p className={styles.sectionDescription}>
            Наша CRM система создана специально для юридических специалистов
          </p>
          <div className={styles.targetGrid}>
            <div className={styles.targetCard}>
              <h3>Частные юристы</h3>
              <p>Управляйте своей практикой эффективно и профессионально</p>
            </div>
            <div className={styles.targetCard}>
              <h3>Адвокаты</h3>
              <p>Организуйте работу с делами и клиентами в единой системе</p>
            </div>
            <div className={styles.targetCard}>
              <h3>Юридические фирмы</h3>
              <p>Масштабируемое решение для команд любого размера</p>
            </div>
            <div className={styles.targetCard}>
              <h3>Юридические отделы</h3>
              <p>Интеграция с корпоративными системами и процессами</p>
            </div>
          </div>
        </div>
      </section>

      {/* Секция О нас */}
      <section id="about" className={styles.contentSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>О нас</h2>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <p>
                Мы создали CRM систему, которая понимает специфику работы юристов. 
                Наша команда знает, с какими вызовами вы сталкиваетесь каждый день, 
                и мы разработали инструменты, которые действительно помогают.
              </p>
              <p>
                Наша миссия — сделать юридическую практику более эффективной, 
                организованной и успешной. Мы постоянно улучшаем продукт, 
                добавляя новые функции на основе обратной связи от наших пользователей.
              </p>
            </div>
            <div className={styles.aboutStats}>
              <div className={styles.stat}>
                <div className={styles.statNumber}>1000+</div>
                <div className={styles.statLabel}>Активных пользователей</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>5000+</div>
                <div className={styles.statLabel}>Успешных дел</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>99.9%</div>
                <div className={styles.statLabel}>Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция Контакты */}
      <section id="contacts" className={styles.contentSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Контакты</h2>
          <p className={styles.sectionDescription}>
            Свяжитесь с нами любым удобным способом
          </p>
          <div className={styles.contactsGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📧</div>
              <h3>Email</h3>
              <p>support@crm-law.ru</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📞</div>
              <h3>Телефон</h3>
              <p>+7 (800) 123-45-67</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>💬</div>
              <h3>Чат поддержки</h3>
              <p>Доступен 24/7</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
