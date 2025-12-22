import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Profile.module.scss';
import type { UpdateProfileRequest } from '../../../services/api';

interface ProfileFormData {
  email: string;
  first_name: string;
  last_name: string;
  license_id: string;
  patronymic: string;
  phone: string;
  telegram_username: string;
}

const Profile: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    email: '',
    first_name: '',
    last_name: '',
    license_id: '',
    patronymic: '',
    phone: '',
    telegram_username: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { user, logout, updateProfile, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Инициализация формы данными пользователя
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        license_id: user.license_id || '',
        patronymic: user.patronymic || '',
        phone: user.phone || '',
        telegram_username: user.telegram_username || '',
      });
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    // Восстанавливаем исходные данные пользователя
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        license_id: user.license_id || '',
        patronymic: user.patronymic || '',
        phone: user.phone || '',
        telegram_username: user.telegram_username || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const updateData: UpdateProfileRequest = {};
      
      // Добавляем только измененные поля
      if (formData.email !== user.email) updateData.email = formData.email;
      if (formData.first_name !== user.first_name) updateData.first_name = formData.first_name;
      if (formData.last_name !== user.last_name) updateData.last_name = formData.last_name;
      if (formData.license_id !== user.license_id) updateData.license_id = formData.license_id;
      if (formData.patronymic !== (user.patronymic || '')) updateData.patronymic = formData.patronymic;
      if (formData.phone !== (user.phone || '')) updateData.phone = formData.phone;
      if (formData.telegram_username !== (user.telegram_username || '')) updateData.telegram_username = formData.telegram_username;

      await updateProfile(updateData);
      // Обновляем данные пользователя
      await checkAuth();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setError(err.message || 'Ошибка при сохранении данных');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Личный кабинет</h1>
            {!isEditing && (
              <button
                className={styles.editButton}
                onClick={handleEdit}
              >
                Редактировать
              </button>
            )}
          </div>
          
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              {user?.last_name?.[0] || user?.first_name?.[0] || 'U'}
            </div>
            {!isEditing ? (
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>
                  {user?.last_name || ''} {user?.first_name || 'User'}
                  {user?.patronymic && ` ${user.patronymic}`}
                </h2>
                <p className={styles.profileRole}>Юрист</p>
                {user?.email && (
                  <p className={styles.profileDetail}>
                    <span className={styles.detailLabel}>Email:</span> {user.email}
                  </p>
                )}
                {user?.phone && (
                  <p className={styles.profileDetail}>
                    <span className={styles.detailLabel}>Телефон:</span> {user.phone}
                  </p>
                )}
                {user?.telegram_username && (
                  <p className={styles.profileDetail}>
                    <span className={styles.detailLabel}>Telegram:</span> @{user.telegram_username}
                  </p>
                )}
                {user?.license_id && (
                  <p className={styles.profileDetail}>
                    <span className={styles.detailLabel}>Номер удостоверения:</span> {user.license_id}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.profileForm}>
                {error && (
                  <div className={styles.errorMessage}>{error}</div>
                )}
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.input}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Фамилия
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={styles.input}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Имя
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={styles.input}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Отчество
                    <input
                      type="text"
                      name="patronymic"
                      value={formData.patronymic}
                      onChange={handleInputChange}
                      className={styles.input}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Номер удостоверения
                    <input
                      type="text"
                      name="license_id"
                      value={formData.license_id}
                      onChange={handleInputChange}
                      className={styles.input}
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Телефон
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="+79991234567"
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Telegram username
                    <input
                      type="text"
                      name="telegram_username"
                      value={formData.telegram_username}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="advokat1234"
                      disabled={isSaving}
                    />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <span className={styles.logoutIcon}>🚪</span>
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


