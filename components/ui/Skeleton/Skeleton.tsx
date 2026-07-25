import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ width, height, circle = false, className = '', style, ...props }: SkeletonProps) {
  const rootClass = `${styles.skeleton} ${circle ? styles.circle : ''} ${className}`.trim();
  
  return (
    <div 
      className={rootClass} 
      style={{ width, height, ...style }} 
      {...props} 
    />
  );
}
