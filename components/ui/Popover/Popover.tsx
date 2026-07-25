"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './Popover.module.css';

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

export function Popover({ trigger, children, align = 'center', width = 300 }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <div 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div className={`${styles.popover} ${styles[align]}`} style={{ width }} role="dialog">
          {children}
        </div>
      )}
    </div>
  );
}
