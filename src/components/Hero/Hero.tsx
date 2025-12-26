import React from 'react';
import styles from './Hero.module.scss';

const Hero: React.FC = () => {
  return (
    <div className={styles.hero}>
      <h1 className={styles.title}>
        Управляй делами так же, как пилот Формулы 1 управляет своим болидом
      </h1>
      <p className={styles.description}>
        Используйте время для работы с клиентами, а не для хаотичных записей.
        CaseOne помогает системно вести дела, клиентов, платежи и календарь — без блокнотов, таблиц и лишней рутины.
      </p>
    </div>
  );
};

export default Hero;
