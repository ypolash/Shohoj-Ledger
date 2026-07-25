import React from 'react';
import { Card, CardContent } from '../Card/Card';
import styles from './StatCard.module.css';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  
  let TrendIcon = Minus;
  let trendClass = styles.trendNeutral;
  
  if (trend) {
    if (trend.direction === 'up' || (trend.direction === undefined && trend.value > 0)) {
      TrendIcon = TrendingUp;
      trendClass = styles.trendUp;
    } else if (trend.direction === 'down' || (trend.direction === undefined && trend.value < 0)) {
      TrendIcon = TrendingDown;
      trendClass = styles.trendDown;
    }
  }

  return (
    <Card variant="dashboard" className={`${styles.statCard} ${className}`}>
      <CardContent className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{title}</h4>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
        </div>
        <div className={styles.valueWrapper}>
          <span className={styles.value}>{value}</span>
        </div>
        {trend && (
          <div className={styles.trendWrapper}>
            <span className={`${styles.trend} ${trendClass}`}>
              <TrendIcon size={16} />
              {Math.abs(trend.value)}%
            </span>
            {trend.label && <span className={styles.trendLabel}>{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
