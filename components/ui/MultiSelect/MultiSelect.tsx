"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from '../Input/Input.module.css'; 
import multiStyles from './MultiSelect.module.css';
import { ChevronDown, X, Check } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectProps {
  label?: string;
  error?: string;
  helpText?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

export function MultiSelect({ 
  label, 
  error, 
  helpText, 
  options, 
  value, 
  onChange, 
  placeholder = "Select options...", 
  fullWidth = true 
}: MultiSelectProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useRef(`multiselect-${Math.random().toString(36).substr(2, 9)}`).current;

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const wrapperClass = `${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`.trim();
  const inputClass = `${styles.input} ${multiStyles.selectBox} ${error ? styles.hasError : ''} ${isOpen ? multiStyles.open : ''}`;

  return (
    <div className={wrapperClass} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      
      <div className={multiStyles.container}>
        <div 
          id={id}
          className={inputClass}
          onClick={() => setIsOpen(!isOpen)}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
        >
          <div className={multiStyles.tags}>
            {value.length === 0 && <span className={multiStyles.placeholder}>{placeholder}</span>}
            {value.map(val => {
              const option = options.find(o => o.value === val);
              if (!option) return null;
              return (
                <span key={val} className={multiStyles.tag}>
                  {option.label}
                  <button 
                    type="button" 
                    className={multiStyles.removeTag} 
                    onClick={(e) => removeOption(e, val)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
          <div className={multiStyles.indicators}>
            <ChevronDown size={16} className={styles.rightIcon} style={{ position: 'relative', right: 0 }} />
          </div>
        </div>

        {isOpen && (
          <ul 
            id={`${id}-listbox`} 
            className={multiStyles.dropdown} 
            role="listbox" 
            aria-multiselectable="true"
          >
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <li 
                  key={option.value}
                  className={`${multiStyles.option} ${isSelected ? multiStyles.selected : ''}`}
                  onClick={() => toggleOption(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={multiStyles.checkbox}>
                    {isSelected && <Check size={14} />}
                  </div>
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
      {helpText && !error && <p className={styles.helpText}>{helpText}</p>}
    </div>
  );
}
