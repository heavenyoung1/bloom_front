import React from 'react';
import styles from './Hero.module.scss';

const Hero: React.FC = () => {
  return (
    <div className={styles.hero}>
      <h1 className={styles.title}>
        Создайте свой первый невероятный градиент
      </h1>
      <p className={styles.description}>
        Удивительный эффект иридисцентных оттенков всего за несколько минут. 
        Вы сделаете это сами быстро и легко. Удивите своих клиентов и получите восторженные отзывы!
      </p>
    </div>
  );
};

export default Hero;
