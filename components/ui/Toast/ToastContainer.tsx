"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast, ToastMessage } from '@/lib/contexts/ToastContext';
import styles from './Toast.module.css';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const toastRoot = document.getElementById('toast-root');
  if (!toastRoot) return null;

  return createPortal(
    <div className={styles.toastContainer} aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>,
    toastRoot
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage, onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const Icon = toast.type === 'success' ? CheckCircle2 : 
               toast.type === 'danger' ? AlertTriangle : 
               toast.type === 'warning' ? AlertTriangle : Info;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <div className={styles.iconContainer}>
        <Icon size={20} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{toast.title}</h4>
        {toast.message && <p className={styles.message}>{toast.message}</p>}
      </div>
      <button className={styles.closeButton} onClick={onRemove} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
