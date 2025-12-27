import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Profile.module.scss';
import type { UpdateProfileRequest, PaymentDetail, CreatePaymentDetailRequest, UpdatePaymentDetailRequest } from '../../../services/api';
import { paymentDetailApi } from '../../../services/api';

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
  
  // Состояние для платежной информации
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [isLoadingPaymentDetail, setIsLoadingPaymentDetail] = useState(false);
  const [isEditingPaymentDetail, setIsEditingPaymentDetail] = useState(false);
  const [isSavingPaymentDetail, setIsSavingPaymentDetail] = useState(false);
  const [paymentDetailFormData, setPaymentDetailFormData] = useState<CreatePaymentDetailRequest>({
    address: '',
    bank_account: '',
    bank_recipient: '',
    bik: '',
    correspondent_account: '',
    index_address: '',
    inn: '',
    kpp: '',
  });
  const [paymentDetailError, setPaymentDetailError] = useState<string | null>(null);

  // Заглушка для подписки PRO
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('active');

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
      
      // Загружаем платежную информацию
      loadPaymentDetail();
    }
  }, [user]);
  
  // Загрузка платежной информации
  const loadPaymentDetail = async () => {
    if (!user?.id) return;
    
    setIsLoadingPaymentDetail(true);
    setPaymentDetailError(null);
    
    try {
      const data = await paymentDetailApi.getPaymentDetailByAttorney(user.id);
      setPaymentDetail(data);
      // Форматируем данные при загрузке
      setPaymentDetailFormData({
        address: data.address || '',
        bank_account: data.bank_account ? formatBankAccount(data.bank_account) : '',
        bank_recipient: data.bank_recipient || '',
        bik: data.bik || '',
        correspondent_account: data.correspondent_account ? formatCorrespondentAccount(data.correspondent_account) : '',
        index_address: data.index_address || '',
        inn: data.inn || '',
        kpp: data.kpp || '',
      });
    } catch (err: any) {
      // Если платежная информация не найдена (404), это нормально
      if (err.status !== 404) {
        console.error('Ошибка загрузки платежной информации:', err);
        setPaymentDetailError(err.message || 'Ошибка при загрузке платежной информации');
      }
      setPaymentDetail(null);
    } finally {
      setIsLoadingPaymentDetail(false);
    }
  };

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
  
  // Функции форматирования для платежной информации
  const formatPostalCode = (value: string): string => {
    // Только цифры, максимум 6
    const digits = value.replace(/\D/g, '').slice(0, 6);
    return digits;
  };

  const formatBankAccount = (value: string): string => {
    // Только цифры, максимум 20, разделяем по 5 цифр
    const digits = value.replace(/\D/g, '').slice(0, 20);
    if (digits.length === 0) return '';
    
    // Разделяем на группы по 5 цифр
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 5) {
      groups.push(digits.slice(i, i + 5));
    }
    return groups.join(' ');
  };

  const formatCorrespondentAccount = (value: string): string => {
    // Только цифры, максимум 20, разделяем по 5 цифр
    const digits = value.replace(/\D/g, '').slice(0, 20);
    if (digits.length === 0) return '';
    
    // Разделяем на группы по 5 цифр
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 5) {
      groups.push(digits.slice(i, i + 5));
    }
    return groups.join(' ');
  };

  const formatINN = (value: string): string => {
    // Только цифры, максимум 12
    const digits = value.replace(/\D/g, '').slice(0, 12);
    return digits;
  };

  const formatKPP = (value: string): string => {
    // Только цифры, максимум 9
    const digits = value.replace(/\D/g, '').slice(0, 9);
    return digits;
  };

  const formatBIK = (value: string): string => {
    // Только цифры, максимум 9
    const digits = value.replace(/\D/g, '').slice(0, 9);
    return digits;
  };

  // Обработчики для платежной информации
  const handlePaymentDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Применяем форматирование в зависимости от поля
    switch (name) {
      case 'index_address':
        formattedValue = formatPostalCode(value);
        break;
      case 'bank_account':
        formattedValue = formatBankAccount(value);
        break;
      case 'correspondent_account':
        formattedValue = formatCorrespondentAccount(value);
        break;
      case 'inn':
        formattedValue = formatINN(value);
        break;
      case 'kpp':
        formattedValue = formatKPP(value);
        break;
      case 'bik':
        formattedValue = formatBIK(value);
        break;
      default:
        formattedValue = value;
    }
    
    setPaymentDetailFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
    setPaymentDetailError(null);
  };
  
  const handleEditPaymentDetail = () => {
    setIsEditingPaymentDetail(true);
    setPaymentDetailError(null);
  };
  
  const handleCancelPaymentDetail = () => {
    if (paymentDetail) {
      // Форматируем данные при восстановлении
      setPaymentDetailFormData({
        address: paymentDetail.address || '',
        bank_account: paymentDetail.bank_account ? formatBankAccount(paymentDetail.bank_account) : '',
        bank_recipient: paymentDetail.bank_recipient || '',
        bik: paymentDetail.bik || '',
        correspondent_account: paymentDetail.correspondent_account ? formatCorrespondentAccount(paymentDetail.correspondent_account) : '',
        index_address: paymentDetail.index_address || '',
        inn: paymentDetail.inn || '',
        kpp: paymentDetail.kpp || '',
      });
    } else {
      setPaymentDetailFormData({
        address: '',
        bank_account: '',
        bank_recipient: '',
        bik: '',
        correspondent_account: '',
        index_address: '',
        inn: '',
        kpp: '',
      });
    }
    setIsEditingPaymentDetail(false);
    setPaymentDetailError(null);
  };
  
  const handleSavePaymentDetail = async () => {
    if (!user?.id) return;
    
    setIsSavingPaymentDetail(true);
    setPaymentDetailError(null);
    
    try {
      // Убираем пробелы из форматированных полей перед отправкой
      const dataToSend: CreatePaymentDetailRequest | UpdatePaymentDetailRequest = {
        ...paymentDetailFormData,
        bank_account: paymentDetailFormData.bank_account?.replace(/\s/g, ''),
        correspondent_account: paymentDetailFormData.correspondent_account?.replace(/\s/g, ''),
      };
      
      if (paymentDetail) {
        // Обновляем существующую платежную информацию
        const updated = await paymentDetailApi.updatePaymentDetail(paymentDetail.id, {
          ...dataToSend,
          attorney_id: user.id,
        });
        setPaymentDetail(updated);
        // Обновляем форму с данными с сервера (они могут быть без форматирования)
        setPaymentDetailFormData({
          address: updated.address || '',
          bank_account: updated.bank_account ? formatBankAccount(updated.bank_account) : '',
          bank_recipient: updated.bank_recipient || '',
          bik: updated.bik || '',
          correspondent_account: updated.correspondent_account ? formatCorrespondentAccount(updated.correspondent_account) : '',
          index_address: updated.index_address || '',
          inn: updated.inn || '',
          kpp: updated.kpp || '',
        });
        setIsEditingPaymentDetail(false);
      } else {
        // Создаем новую платежную информацию
        const created = await paymentDetailApi.createPaymentDetail(dataToSend);
        setPaymentDetail(created);
        // Обновляем форму с данными с сервера
        setPaymentDetailFormData({
          address: created.address || '',
          bank_account: created.bank_account ? formatBankAccount(created.bank_account) : '',
          bank_recipient: created.bank_recipient || '',
          bik: created.bik || '',
          correspondent_account: created.correspondent_account ? formatCorrespondentAccount(created.correspondent_account) : '',
          index_address: created.index_address || '',
          inn: created.inn || '',
          kpp: created.kpp || '',
        });
        setIsEditingPaymentDetail(false);
      }
    } catch (err: any) {
      console.error('Ошибка сохранения платежной информации:', err);
      setPaymentDetailError(err.message || 'Ошибка при сохранении платежной информации');
    } finally {
      setIsSavingPaymentDetail(false);
    }
  };
  
  const handleDeletePaymentDetail = async () => {
    if (!paymentDetail?.id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить платежную информацию?')) {
      return;
    }
    
    setIsSavingPaymentDetail(true);
    setPaymentDetailError(null);
    
    try {
      await paymentDetailApi.deletePaymentDetail(paymentDetail.id);
      setPaymentDetail(null);
      setPaymentDetailFormData({
        address: '',
        bank_account: '',
        bank_recipient: '',
        bik: '',
        correspondent_account: '',
        index_address: '',
        inn: '',
        kpp: '',
      });
      setIsEditingPaymentDetail(false);
    } catch (err: any) {
      console.error('Ошибка удаления платежной информации:', err);
      setPaymentDetailError(err.message || 'Ошибка при удалении платежной информации');
    } finally {
      setIsSavingPaymentDetail(false);
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Личный кабинет</h1>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <span className={styles.logoutIcon}>🚪</span>
              <span>Выйти</span>
            </button>
          </div>

          {/* Плашка подписки PRO */}
          <div className={`${styles.subscriptionBanner} ${subscriptionStatus === 'active' ? styles.subscriptionActive : styles.subscriptionInactive}`}>
            <div className={styles.subscriptionContent}>
              <div className={styles.subscriptionIcon}>
                {subscriptionStatus === 'active' ? '⭐' : '🔒'}
              </div>
              <div className={styles.subscriptionText}>
                <span className={styles.subscriptionTitle}>
                  {subscriptionStatus === 'active' ? 'Подписка PRO активна' : 'Подписка не активна'}
                </span>
                {subscriptionStatus === 'active' && (
                  <span className={styles.subscriptionSubtitle}>
                    Вы используете все возможности PRO версии
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.columnsLayout}>
            {/* Левая колонка - Основная информация */}
            <div className={styles.leftColumn}>
              <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <h2 className={styles.profileCardTitle}>Основная информация</h2>
                  {!isEditing && (
                    <button
                      className={styles.editButton}
                      onClick={handleEdit}
                    >
                      Редактировать
                    </button>
                  )}
                </div>
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
            </div>

            {/* Правая колонка - Платежная информация */}
            <div className={styles.rightColumn}>
              <div className={styles.paymentDetailCard}>
            <div className={styles.paymentDetailHeader}>
              <h2 className={styles.paymentDetailTitle}>Платежная информация</h2>
              {!isEditingPaymentDetail && (
                <button
                  className={styles.editButton}
                  onClick={handleEditPaymentDetail}
                >
                  {paymentDetail ? 'Редактировать' : 'Добавить'}
                </button>
              )}
            </div>
            
            {isLoadingPaymentDetail ? (
              <div className={styles.loadingMessage}>Загрузка...</div>
            ) : !isEditingPaymentDetail ? (
              paymentDetail ? (
                <div className={styles.paymentDetailInfo}>
                  {paymentDetail.address && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>Адрес:</span> {paymentDetail.address}
                    </p>
                  )}
                  {paymentDetail.index_address && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>Почтовый индекс:</span> {paymentDetail.index_address}
                    </p>
                  )}
                  {paymentDetail.bank_recipient && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>Получатель банка:</span> {paymentDetail.bank_recipient}
                    </p>
                  )}
                  {paymentDetail.bank_account && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>Банковский счет:</span> {paymentDetail.bank_account}
                    </p>
                  )}
                  {paymentDetail.bik && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>БИК:</span> {paymentDetail.bik}
                    </p>
                  )}
                  {paymentDetail.correspondent_account && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>Корреспондентский счет:</span> {paymentDetail.correspondent_account}
                    </p>
                  )}
                  {paymentDetail.inn && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>ИНН:</span> {paymentDetail.inn}
                    </p>
                  )}
                  {paymentDetail.kpp && (
                    <p className={styles.profileDetail}>
                      <span className={styles.detailLabel}>КПП:</span> {paymentDetail.kpp}
                    </p>
                  )}
                  <button
                    className={styles.deleteButton}
                    onClick={handleDeletePaymentDetail}
                    disabled={isSavingPaymentDetail}
                  >
                    Удалить платежную информацию
                  </button>
                </div>
              ) : (
                <div className={styles.emptyPaymentDetail}>
                  <p>Платежная информация не добавлена</p>
                </div>
              )
            ) : (
              <div className={styles.paymentDetailForm}>
                {paymentDetailError && (
                  <div className={styles.errorMessage}>{paymentDetailError}</div>
                )}
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Адрес
                    <input
                      type="text"
                      name="address"
                      value={paymentDetailFormData.address}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="г. Санкт-Петербург, ул. Площадь Восстания, д.10, кв. 54"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Почтовый индекс
                    <input
                      type="text"
                      name="index_address"
                      value={paymentDetailFormData.index_address}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="241099"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Получатель банка
                    <input
                      type="text"
                      name="bank_recipient"
                      value={paymentDetailFormData.bank_recipient}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="ПАО T-Банк, филиал в городе Брянске"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Банковский счет
                    <input
                      type="text"
                      name="bank_account"
                      value={paymentDetailFormData.bank_account}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="12345 12345 12345 12345"
                      maxLength={23}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    БИК
                    <input
                      type="text"
                      name="bik"
                      value={paymentDetailFormData.bik}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="987654319"
                      maxLength={9}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Корреспондентский счет
                    <input
                      type="text"
                      name="correspondent_account"
                      value={paymentDetailFormData.correspondent_account}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="12345 12345 12345 12345"
                      maxLength={23}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    ИНН
                    <input
                      type="text"
                      name="inn"
                      value={paymentDetailFormData.inn}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="123456789012"
                      maxLength={12}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    КПП
                    <input
                      type="text"
                      name="kpp"
                      value={paymentDetailFormData.kpp}
                      onChange={handlePaymentDetailInputChange}
                      className={styles.input}
                      disabled={isSavingPaymentDetail}
                      placeholder="123456789"
                      maxLength={9}
                      inputMode="numeric"
                    />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSavePaymentDetail}
                    disabled={isSavingPaymentDetail}
                  >
                    {isSavingPaymentDetail ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancelPaymentDetail}
                    disabled={isSavingPaymentDetail}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


