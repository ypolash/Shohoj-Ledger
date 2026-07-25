"use client";

import React, { forwardRef } from 'react';
import styles from '../Input/Input.module.css'; // Reusing input wrapper styles
import selectStyles from './Select.module.css';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, fullWidth = true, className = '', id, ...props }, ref) => {
    
    const selectId = id || (label ? `select-${Math.random().toString(36).substr(2, 9)}` : undefined);
    const wrapperClass = `${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim();
    const selectClass = `${styles.input} ${selectStyles.select} ${error ? styles.hasError : ''}`;

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={selectStyles.selectContainer}>
          <select
            ref={ref}
            id={selectId}
            className={selectClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
            {...props}
          >
            {/* If placeholder behavior is needed, we could add a default empty option */}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className={selectStyles.iconWrapper}>
            <ChevronDown size={16} />
          </div>
        </div>

        {error && (
          <p id={`${selectId}-error`} className={styles.errorMessage}>
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={`${selectId}-help`} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
