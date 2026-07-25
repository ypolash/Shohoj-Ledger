import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, leftIcon, rightIcon, fullWidth = true, className = '', id, ...props }, ref) => {
    
    // Generate a unique ID if none is provided but a label exists
    const inputId = id || (label ? `input-${Math.random().toString(36).substr(2, 9)}` : undefined);
    
    const wrapperClass = `${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim();
    const inputClass = `${styles.input} ${error ? styles.hasError : ''} ${leftIcon ? styles.hasLeftIcon : ''} ${rightIcon ? styles.hasRightIcon : ''}`;

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={styles.inputContainer}>
          {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />
          
          {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
        </div>

        {error && (
          <p id={`${inputId}-error`} className={styles.errorMessage}>
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={`${inputId}-help`} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
