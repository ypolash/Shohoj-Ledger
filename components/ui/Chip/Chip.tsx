import React from 'react';
import styles from './Chip.module.css';
import { X } from 'lucide-react';

export type ChipVariant = 'default' | 'primary';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  onRemove?: () => void;
  avatar?: React.ReactNode;
}

export function Chip({ children, variant = 'default', onRemove, avatar, className = '', ...props }: ChipProps) {
  const rootClass = `${styles.chip} ${styles[variant]} ${className}`.trim();
  
  return (
    <div className={rootClass} {...props}>
      {avatar && <div className={styles.avatar}>{avatar}</div>}
      <span className={styles.content}>{children}</span>
      {onRemove && (
        <button 
          type="button" 
          className={styles.removeButton} 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
