import React from 'react';
import styles from './C1Logo.module.scss';

const C1Logo: React.FC = () => {
  return (
    <div className={styles.logoContainer}>
      <span className={styles.logoText}>С1</span>
    </div>
  );
};

export default C1Logo;

