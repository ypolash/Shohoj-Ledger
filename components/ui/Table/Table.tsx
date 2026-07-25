import React from 'react';
import styles from './Table.module.css';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.tableContainer}>
      <table className={`${styles.table} ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`${styles.thead} ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`${styles.tbody} ${className}`} {...props} />;
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`${styles.tr} ${className}`} {...props} />;
}

export function TableHead({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`${styles.th} ${className}`} {...props} />;
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`${styles.td} ${className}`} {...props} />;
}
