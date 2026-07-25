import React from 'react';
import styles from './Loading.module.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
  fullHeight?: boolean;
}

export function Loading({ 
  size = 'md', 
  variant = 'primary', 
  text, 
  fullScreen = false,
  fullHeight = false
}: LoadingProps) {
  
  const spinnerClass = `${styles.spinner} ${styles[size]} ${styles[variant]}`;
  const containerClass = `${styles.container} ${fullScreen ? styles.fullScreen : ''} ${fullHeight ? styles.fullHeight : ''}`.trim();

  const spinner = (
    <svg className={spinnerClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (!text && !fullScreen && !fullHeight) {
    return spinner;
  }

  return (
    <div className={containerClass}>
      {spinner}
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
