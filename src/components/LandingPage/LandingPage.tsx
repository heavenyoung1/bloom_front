import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Hero from '../Hero/Hero';
import Footer from '../Footer';
import styles from './LandingPage.module.scss';
import {
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiBarChart2,
  FiMail,
  FiPhone,
  FiMessageCircle,
} from 'react-icons/fi';

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
              <div className={styles.featureIcon}>
                <FiBriefcase />
              </div>
              <h3>Управление делами</h3>
              <p>Не просто список дел, а полный контроль над каждым делом. </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <FiUsers />
              </div>
              <h3>Клиенты и контакты</h3>
              <p>Вы точно знаете, кому нужно перезвонить, по какому делу и в какие сроки.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <FiCalendar />
              </div>
              <h3>Календарь событий</h3>
              <p>Планируйте встречи, соблюдайте дедлайны и отслеживайте ближайшие события.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <FiCreditCard />
              </div>
              <h3>Учёт платежей</h3>
              <p>Выставляйте платежи в один клик — достаточно заполнить данные и создать платёж.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <FiFileText />
              </div>
              <h3>Документооборот</h3>
              <p>Все документы собраны в одном месте и привязаны к делам. Найти нужный файл можно за секунды — без поиска по папкам и почте.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <FiBarChart2 />
              </div>
              <h3>Дашборд с ключевой информацией</h3>
              <p>Ближайшие события, статистика дел и платежей — всё, что важно именно вам, отображается сразу.</p>
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
              <h3>Тестовый</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>0₽</span>
                <span className={styles.pricePeriod}>/месяц</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li>Все функции проффесионального тарифа</li>
                <li>Ограничение - 14 дней</li>
                <li>Email поддержка</li>
              </ul>
              <button className={styles.pricingButton}>Начать бесплатно</button>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <div className={styles.badge}>Популярный</div>
              <h3>Профессиональный</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>599₽</span>
                <span className={styles.pricePeriod}>/месяц</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li>Неограниченное количество дел</li>
                <li>Неограниченное количество клиентов</li>
                <li>Полноценный календарь</li>
                <li>Выставление платежей</li>
                <li>Приоритетная поддержка</li>
              </ul>
              <button className={styles.pricingButton}>Выбрать план</button>
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
                Мы — ИТ-команда, которая создаёт инструменты для практикующих специалистов, а не для крупных юридических компаний.
              </p>
              <p>
                Наш клиент — не большая фирма и не корпоративный отдел.
                Наш клиент — вы: специалист, который ценит порядок, простоту и контроль над своей работой.
              </p>
              <p>
                Мы не навязываем лишние функции и не заставляем платить за то, что не используется.
                Наша цель — дать доступное и понятное средство управления практикой каждому.
              </p>
              <p>
                По философии CaseOne — как iPhone:
                простой, аккуратный и функциональный.
              </p>
              <p>
                При этом мы открыты к обратной связи.
                Если вы предложите полезную идею, и она пройдёт тестирование — она станет частью системы.
                CaseOne развивается вместе с такими же специалистами, как вы.
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
              <div className={styles.contactIcon}>
                <FiMail />
              </div>
              <h3>Email</h3>
              <p>support@crm-law.ru</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <FiPhone />
              </div>
              <h3>Телефон</h3>
              <p>+7 (800) 123-45-67</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <FiMessageCircle />
              </div>
              <h3>Чат поддержки</h3>
              <p>Доступен 24/7</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
