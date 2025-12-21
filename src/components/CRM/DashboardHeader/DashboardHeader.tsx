import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './DashboardHeader.module.scss';

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSearch }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.greeting}>
        <h1>Hello {user?.first_name || 'User'} 👋</h1>
      </div>
      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;


