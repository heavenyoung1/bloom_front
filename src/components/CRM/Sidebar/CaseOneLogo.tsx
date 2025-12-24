import React from 'react';
import styles from './CaseOneLogo.module.scss';

const CaseOneLogo: React.FC = () => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoDot}></div>
      <span className={styles.logoText}>
        <span className={styles.logoTextGradient}>Case</span>
        <span className={styles.logoTextPlain}>One</span>
      </span>
    </div>
  );
};

export default CaseOneLogo;

