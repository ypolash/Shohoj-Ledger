import React, { forwardRef } from 'react';
import styles from '../Input/Input.module.css'; // Reuse input styles for wrapper/label/error
import textareaStyles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, fullWidth = true, className = '', id, rows = 4, ...props }, ref) => {
    
    const textareaId = id || (label ? `textarea-${Math.random().toString(36).substr(2, 9)}` : undefined);
    const wrapperClass = `${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim();
    const textareaClass = `${styles.input} ${textareaStyles.textarea} ${error ? styles.hasError : ''}`;

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClass}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className={styles.errorMessage}>
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={`${textareaId}-help`} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
