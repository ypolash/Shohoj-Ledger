import React from 'react';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {children}
      </div>
    </div>
  );
}
