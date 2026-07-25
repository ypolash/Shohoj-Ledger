import React from 'react';
import styles from '../EmptyState/EmptyState.module.css'; // Reuse empty state layout
import errorStyles from './ErrorState.module.css';
import { Button } from '../Button/Button';
import { AlertTriangle } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while trying to load this data. Please try again.",
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`${styles.container} ${errorStyles.errorContainer} ${className}`}>
      <div className={`${styles.iconWrapper} ${errorStyles.errorIcon}`}>
        <AlertTriangle size={48} strokeWidth={1} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      
      {onRetry && (
        <div className={styles.actions}>
          <Button variant="danger" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
