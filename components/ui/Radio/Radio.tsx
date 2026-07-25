import React, { forwardRef } from 'react';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    
    const radioId = id || (label ? `radio-${Math.random().toString(36).substr(2, 9)}` : undefined);
    
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.container}>
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className={`${styles.input} ${error ? styles.hasError : ''}`}
            aria-invalid={!!error}
            {...props}
          />
          {label && (
            <label htmlFor={radioId} className={styles.label}>
              {label}
            </label>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
