import React from 'react';
import styles from './Progress.module.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function Progress({ 
  value, 
  max = 100, 
  variant = 'primary', 
  size = 'md',
  showLabel = false,
  className = '', 
  ...props 
}: ProgressProps) {
  
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const rootClass = `${styles.container} ${styles[size]} ${className}`.trim();
  const barClass = `${styles.bar} ${styles[variant]}`;

  return (
    <div className={styles.wrapper}>
      <div 
        className={rootClass} 
        role="progressbar" 
        aria-valuenow={value} 
        aria-valuemin={0} 
        aria-valuemax={max}
        {...props}
      >
        <div 
          className={barClass} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
