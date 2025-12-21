import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import styles from './PlaceholderPage.module.scss';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.container}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          <div className={styles.placeholder}>
            <p>Эта страница находится в разработке</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;


