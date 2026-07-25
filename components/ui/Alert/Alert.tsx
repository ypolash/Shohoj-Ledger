import React from 'react';
import styles from './Alert.module.css';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className = '' }: AlertProps) {
  
  let Icon = Info;
  switch (variant) {
    case 'success': Icon = CheckCircle2; break;
    case 'danger': Icon = XCircle; break;
    case 'warning': Icon = AlertTriangle; break;
  }

  const rootClass = `${styles.alert} ${styles[variant]} ${className}`.trim();

  return (
    <div className={rootClass} role="alert">
      <div className={styles.iconContainer}>
        <Icon size={20} />
      </div>
      <div className={styles.content}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div className={styles.message}>{children}</div>
      </div>
      {onClose && (
        <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
