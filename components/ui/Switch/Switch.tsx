import React, { forwardRef } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    
    const switchId = id || (label ? `switch-${Math.random().toString(36).substr(2, 9)}` : undefined);
    
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.container}>
          <div className={styles.switchWrapper}>
            <input
              type="checkbox"
              id={switchId}
              ref={ref}
              className={styles.input}
              role="switch"
              {...props}
            />
            <div className={styles.track}>
              <div className={styles.thumb} />
            </div>
          </div>
          
          {label && (
            <label htmlFor={switchId} className={styles.label}>
              {label}
            </label>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
