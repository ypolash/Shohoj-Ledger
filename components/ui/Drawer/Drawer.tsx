"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';
import { X } from 'lucide-react';

export type DrawerPosition = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
  closeOnOverlayClick?: boolean;
}

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  position = 'right',
  size = 'md', 
  closeOnOverlayClick = true 
}: DrawerProps) {
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const drawerRoot = document.getElementById('drawer-root');
  if (!drawerRoot) {
    console.warn("drawer-root not found in document. Drawers require a <div id='drawer-root'> in the DOM.");
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby={title ? "drawer-title" : undefined}>
      <div className={`${styles.drawer} ${styles[position]} ${styles[size]}`}>
        {title && (
          <div className={styles.header}>
            <h2 id="drawer-title" className={styles.title}>{title}</h2>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close drawer">
              <X size={20} />
            </button>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    drawerRoot
  );
}
