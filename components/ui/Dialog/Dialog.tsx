"use client";

import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export type DialogVariant = 'default' | 'danger' | 'success' | 'info';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  children, 
  variant = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false
}: DialogProps) {
  
  let Icon = null;
  let iconColor = '';
  let buttonVariant: 'primary' | 'danger' | 'success' | 'info' = 'primary';

  switch (variant) {
    case 'danger':
      Icon = AlertTriangle;
      iconColor = 'var(--danger)';
      buttonVariant = 'danger';
      break;
    case 'success':
      Icon = CheckCircle2;
      iconColor = 'var(--success)';
      buttonVariant = 'success';
      break;
    case 'info':
      Icon = Info;
      iconColor = 'var(--info)';
      buttonVariant = 'info';
      break;
    default:
      buttonVariant = 'primary';
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      {Icon && <Icon size={24} style={{ color: iconColor }} />}
      <span>{title}</span>
    </div>
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      {onConfirm && (
        <Button variant={buttonVariant} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={header}
      footer={footer}
      size="sm"
    >
      {children}
    </Modal>
  );
}
