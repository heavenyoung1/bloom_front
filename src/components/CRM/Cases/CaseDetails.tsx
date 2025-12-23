import React, { useState, useEffect } from 'react';
import { casesApi, clientsApi, documentsApi } from '../../../services/api';
import type { Case, Client, UpdateCaseRequest, Document, DocumentsResponse } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getStatusColor, CASE_STATUSES } from '../../../types/caseStatus';
import styles from './CaseDetails.module.scss';

interface CaseDetailsProps {
  caseId: number;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId, onClose, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  
  const [formData, setFormData] = useState<UpdateCaseRequest>({
    name: '',
    description: '',
    status: '',
    client_id: 0,
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Состояния для документов
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  useEffect(() => {
    loadCaseData();
    loadClients();
    loadDocuments();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await casesApi.getCase(caseId);
      setCaseData(data);
      setFormData({
        name: data.name,
        description: data.description,
        status: data.status,
        client_id: data.client_id,
      });
      
      // Загружаем информацию о клиенте
      try {
        const clientsList = await clientsApi.getClients();
        const foundClient = clientsList.find(c => c.id === data.client_id);
        if (foundClient) {
          setClient(foundClient);
        }
      } catch (err) {
        console.error('Ошибка загрузки клиента:', err);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки дела:', err);
      setError(err.message || 'Не удалось загрузить дело');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsApi.getClients();
      setClients(data);
    } catch (err) {
      console.error('Ошибка загрузки клиентов:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const data = await documentsApi.getCaseDocuments(caseId);
      console.log('Ответ API для документов:', data); // Для отладки
      
      let documentsList: Document[] = [];
      
      // Обрабатываем разные форматы ответа API
      if (Array.isArray(data)) {
        documentsList = data;
      } else if (data && typeof data === 'object') {
        // Проверяем формат с полем documents (новый формат)
        if ('documents' in data && Array.isArray((data as DocumentsResponse).documents)) {
          documentsList = (data as DocumentsResponse).documents;
        } else if ('data' in data && Array.isArray(data.data)) {
          documentsList = data.data;
        } else if ('items' in data && Array.isArray(data.items)) {
          documentsList = data.items;
        } else {
          console.warn('Неожиданный формат ответа API для документов:', data);
          setDocuments([]);
          return;
        }
      } else {
        console.warn('Ответ API не является массивом или объектом:', data);
        setDocuments([]);
        return;
      }
      
      // Если в списке нет file_name, загружаем детальную информацию для каждого документа
      const documentsWithDetails = await Promise.all(
        documentsList.map(async (doc) => {
          // Если у документа уже есть file_name, возвращаем его как есть
          if (doc.file_name) {
            return doc;
          }
          // Иначе загружаем детальную информацию
          try {
            const detailedDoc = await documentsApi.getDocument(doc.id);
            return detailedDoc;
          } catch (err) {
            console.error(`Ошибка загрузки деталей документа ${doc.id}:`, err);
            return doc; // Возвращаем исходный документ, если не удалось загрузить детали
          }
        })
      );
      
      setDocuments(documentsWithDetails);
    } catch (err: any) {
      console.error('Ошибка загрузки документов:', err);
      setDocuments([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    try {
      await documentsApi.uploadDocument(caseId, file);
      await loadDocuments();
      e.target.value = ''; // Сброс input
    } catch (err: any) {
      console.error('Ошибка загрузки документа:', err);
      alert(err.message || 'Не удалось загрузить документ');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const blob = await documentsApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Ошибка скачивания документа:', err);
      alert(err.message || 'Не удалось скачать документ');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.')) {
      return;
    }

    setDeletingDocumentId(documentId);
    try {
      await documentsApi.deleteDocument(documentId);
      await loadDocuments();
    } catch (err: any) {
      console.error('Ошибка удаления документа:', err);
      alert(err.message || 'Не удалось удалить документ');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const formatFileSize = (bytes?: number | string): string => {
    if (!bytes) return 'Неизвестно';
    const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(size)) return 'Неизвестно';
    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} КБ`;
    return `${(size / (1024 * 1024)).toFixed(2)} МБ`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'client_id' ? parseInt(value, 10) : value,
    }));
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Название обязательно';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Описание обязательно';
    }
    
    if (!formData.client_id || formData.client_id === 0) {
      errors.client_id = 'Выберите клиента';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await casesApi.updateCase(caseId, {
        ...formData,
        attorney_id: user.id,
      });
      setIsEditing(false);
      loadCaseData();
      onUpdate();
    } catch (err: any) {
      console.error('Ошибка обновления дела:', err);
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ submit: err.message || 'Не удалось обновить дело' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить это дело? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await casesApi.deleteCase(caseId);
      onDelete();
      onClose();
    } catch (err: any) {
      console.error('Ошибка удаления дела:', err);
      alert(err.message || 'Не удалось удалить дело');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Вы уверены, что хотите перенести это дело в архив?')) {
      return;
    }

    setIsArchiving(true);
    try {
      await casesApi.updateCase(caseId, {
        status: 'Архивировано',
      });
      loadCaseData();
      onUpdate();
      alert('Дело перенесено в архив');
    } catch (err: any) {
      console.error('Ошибка архивирования дела:', err);
      alert(err.message || 'Не удалось перенести дело в архив');
    } finally {
      setIsArchiving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Загрузка дела...</div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>
            <p>{error || 'Дело не найдено'}</p>
            <button onClick={onClose} className={styles.closeButton}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>
            {isEditing ? 'Редактирование дела' : 'Детали дела'}
          </h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isEditing ? (
            <div className={styles.editForm}>
              {formErrors.submit && (
                <div className={styles.errorMessage}>{formErrors.submit}</div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Название <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.name ? styles.inputError : ''}`}
                />
                {formErrors.name && (
                  <span className={styles.errorText}>{formErrors.name}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Описание <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${styles.textarea} ${formErrors.description ? styles.inputError : ''}`}
                  rows={6}
                />
                {formErrors.description && (
                  <span className={styles.errorText}>{formErrors.description}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="client_id" className={styles.label}>
                  Клиент <span className={styles.required}>*</span>
                </label>
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className={`${styles.select} ${formErrors.client_id ? styles.inputError : ''}`}
                >
                  <option value={0}>Выберите клиента</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.client_id && (
                  <span className={styles.errorText}>{formErrors.client_id}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Статус
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  {CASE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    loadCaseData();
                  }}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Название:</span>
                  <span className={styles.infoValue}>{caseData.name}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Описание:</span>
                  <span className={styles.infoValue}>{caseData.description}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Клиент:</span>
                  <span className={styles.infoValue}>
                    {client ? client.name : `ID: ${caseData.client_id}`}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Статус:</span>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(caseData.status) }}
                  >
                    {caseData.status}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Дата создания:</span>
                  <span className={styles.infoValue}>{formatDate(caseData.created_at)}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Последнее обновление:</span>
                  <span className={styles.infoValue}>{formatDate(caseData.updated_at)}</span>
                </div>
              </div>

              <div className={styles.documentsSection}>
                <div className={styles.documentsHeader}>
                  <h3 className={styles.documentsTitle}>Документы</h3>
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingDocument}
                      style={{ display: 'none' }}
                    />
                    {uploadingDocument ? 'Загрузка...' : '+ Загрузить документ'}
                  </label>
                </div>
                
                {loadingDocuments ? (
                  <div className={styles.documentsLoading}>Загрузка документов...</div>
                ) : !Array.isArray(documents) || documents.length === 0 ? (
                  <div className={styles.documentsEmpty}>Документы отсутствуют</div>
                ) : (
                  <div className={styles.documentsList}>
                    {documents.map((doc) => (
                      <div key={doc.id} className={styles.documentItem}>
                        <div className={styles.documentInfo}>
                          <span className={styles.documentName}>{doc.file_name}</span>
                          <span className={styles.documentMeta}>
                            {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                          </span>
                        </div>
                        <div className={styles.documentActions}>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className={styles.downloadButton}
                            title="Скачать"
                          >
                            ⬇
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className={styles.deleteDocumentButton}
                            disabled={deletingDocumentId === doc.id}
                            title="Удалить"
                          >
                            {deletingDocumentId === doc.id ? '...' : '×'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editButton}
                >
                  Редактировать
                </button>
                <button
                  onClick={handleArchive}
                  className={styles.archiveButton}
                  disabled={isArchiving || caseData.status === 'Архивировано'}
                >
                  {isArchiving ? 'Архивирование...' : 'В архив'}
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.deleteButton}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;

