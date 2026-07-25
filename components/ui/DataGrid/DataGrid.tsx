"use client";

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table/Table';
import { Checkbox } from '../Checkbox/Checkbox';
import { Loading } from '../Loading/Loading';
import { EmptyState } from '../EmptyState/EmptyState';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import styles from './DataGrid.module.css';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataGrid<T>({ 
  data, 
  columns, 
  keyExtractor, 
  isLoading = false,
  emptyState,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  className = ''
}: DataGridProps<T>) {
  
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortDir(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const allSelected = data.length > 0 && selectedKeys.length === data.length;
  const someSelected = selectedKeys.length > 0 && selectedKeys.length < data.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(data.map(keyExtractor));
  };

  const toggleRow = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Loading size="lg" text="Loading data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={className}>
        {emptyState || <EmptyState title="No records found" />}
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className={styles.checkboxCell}>
                <Checkbox 
                  checked={allSelected} 
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <TableHead 
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={col.sortable ? styles.sortableHeader : ''}
                >
                  <div className={styles.headerContent}>
                    {col.header}
                    {col.sortable && (
                      <span className={styles.sortIcon}>
                        {isSorted && sortDir === 'asc' ? <ArrowUp size={14} /> : 
                         isSorted && sortDir === 'desc' ? <ArrowDown size={14} /> : 
                         <ArrowUpDown size={14} className={styles.idleIcon} />}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {sortedData.map((item) => {
            const key = keyExtractor(item);
            const isSelected = selectedKeys.includes(key);
            
            return (
              <TableRow 
                key={key} 
                className={isSelected ? styles.selectedRow : ''}
              >
                {selectable && (
                  <TableCell className={styles.checkboxCell}>
                    <Checkbox 
                      checked={isSelected} 
                      onChange={() => toggleRow(key)}
                      aria-label={`Select row ${key}`}
                    />
                  </TableCell>
                )}
                
                {columns.map((col) => (
                  <TableCell key={`${key}-${String(col.key)}`}>
                    {col.cell ? col.cell(item) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
