import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const rootClass = `${styles.badge} ${styles[variant]} ${className}`.trim();
  
  return (
    <span className={rootClass} {...props}>
      {children}
    </span>
  );
}
