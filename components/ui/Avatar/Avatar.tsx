import React from 'react';
import styles from './Avatar.module.css';
import { User } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
}

export function Avatar({ src, alt, initials, size = 'md', className = '', ...props }: AvatarProps) {
  const rootClass = `${styles.avatar} ${styles[size]} ${className}`.trim();

  return (
    <div className={rootClass} {...props}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className={styles.image} />
      ) : initials ? (
        <span className={styles.initials}>{initials}</span>
      ) : (
        <User className={styles.icon} />
      )}
    </div>
  );
}
