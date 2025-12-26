import React, { useState, useEffect } from 'react';
import { FiBriefcase } from 'react-icons/fi';
import { casesApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { Case } from '../../../services/api';
import { getStatusColor } from '../../../types/caseStatus';
import styles from './CaseStatusChart.module.scss';

interface StatusCount {
  status: string;
  count: number;
  color: string;
}

const CaseStatusChart: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await casesApi.getCases();
        // Фильтруем дела только для текущего адвоката
        const attorneyCases = data.filter((caseItem) => caseItem.attorney_id === user.id);
        setCases(attorneyCases);

        // Подсчитываем дела по статусам
        const counts: Record<string, number> = {};
        attorneyCases.forEach((caseItem) => {
          const status = caseItem.status || 'Неизвестно';
          counts[status] = (counts[status] || 0) + 1;
        });

        // Преобразуем в массив и сортируем по количеству
        const statusArray: StatusCount[] = Object.entries(counts)
          .map(([status, count]) => ({
            status,
            count,
            color: getStatusColor(status),
          }))
          .sort((a, b) => b.count - a.count);

        setStatusCounts(statusArray);
      } catch (error) {
        console.error('Ошибка загрузки дел:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user?.id]);

  // Вычисляем углы для секторов диаграммы
  const calculateAngles = (counts: StatusCount[]) => {
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return [];

    let currentAngle = -90; // Начинаем сверху
    return counts.map((item) => {
      const percentage = (item.count / total) * 100;
      const angle = (item.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        ...item,
        percentage: percentage.toFixed(1),
        startAngle,
        endAngle,
      };
    });
  };

  const chartData = calculateAngles(statusCounts);
  const totalCases = cases.length;

  // Функция для преобразования полярных координат в декартовы
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Функция для создания пути сектора кольца
  const createSectorPath = (
    startAngle: number,
    endAngle: number,
    outerRadius: number,
    innerRadius: number,
    centerX: number,
    centerY: number
  ): string => {
    // Точки на внешней окружности
    const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    
    // Точки на внутренней окружности
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Строим путь: внешняя дуга -> линия к внутренней -> внутренняя дуга -> замыкание
    return [
      `M ${outerStart.x} ${outerStart.y}`, // Начинаем с внешней точки
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`, // Внешняя дуга
      `L ${innerEnd.x} ${innerEnd.y}`, // Линия к внутренней точке
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`, // Внутренняя дуга (обратно)
      'Z', // Замыкаем путь
    ].join(' ');
  };

  const centerX = 108;
  const centerY = 108;
  const outerRadius = 96; // 80 * 1.2
  const innerRadius = 60; // 50 * 1.2

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <FiBriefcase />
        </div>
        <div className={styles.leftSection}>
          <h3 className={styles.title}>Статистика дел</h3>
          {!loading && totalCases > 0 && (
            <>
              <div className={styles.legend}>
                {chartData.map((item, index) => (
                  <div key={index} className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={styles.legendLabel}>{item.status}</span>
                    <span className={styles.legendCount}>{item.count}</span>
                  </div>
                ))}
              </div>
              <div className={styles.totalPayments}>
                Всего: <span className={styles.totalValue}>{totalCases}</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.rightSection}>
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : totalCases === 0 ? (
            <div className={styles.empty}>Нет данных</div>
          ) : (
            <div className={styles.chartContainer}>
              <svg width="216" height="216" className={styles.chart} viewBox="0 0 216 216">
                {chartData.map((item, index) => (
                  <path
                    key={index}
                    d={createSectorPath(item.startAngle, item.endAngle, outerRadius, innerRadius, centerX, centerY)}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseStatusChart;

