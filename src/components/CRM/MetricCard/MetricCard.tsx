import React from 'react';
import styles from './MetricCard.module.scss';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  activeUsers?: string[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  change,
  activeUsers,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.value}>{value}</div>
          {change && (
            <div className={`${styles.change} ${change.isPositive ? styles.positive : styles.negative}`}>
              <span className={styles.arrow}>
                {change.isPositive ? '↑' : '↓'}
              </span>
              <span>{change.value}</span>
            </div>
          )}
          {activeUsers && activeUsers.length > 0 && (
            <div className={styles.activeUsers}>
              {activeUsers.map((avatar, index) => (
                <div key={index} className={styles.avatar}>
                  {avatar}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;



