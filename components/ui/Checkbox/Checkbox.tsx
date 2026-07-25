import React, { forwardRef } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    
    const checkboxId = id || (label ? `checkbox-${Math.random().toString(36).substr(2, 9)}` : undefined);
    
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.container}>
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={`${styles.input} ${error ? styles.hasError : ''}`}
            aria-invalid={!!error}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className={styles.label}>
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

Checkbox.displayName = 'Checkbox';
