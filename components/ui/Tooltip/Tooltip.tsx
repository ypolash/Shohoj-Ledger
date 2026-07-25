"use client";

import React, { useState } from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: NodeJS.Timeout;

  const show = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  return (
    <div 
      className={styles.container} 
      onMouseEnter={show} 
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
          {content}
          <div className={styles.arrow} />
        </div>
      )}
    </div>
  );
}
