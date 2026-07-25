"use client";

import React, { createContext, useContext, useState } from 'react';
import styles from './Accordion.module.css';
import { ChevronDown } from 'lucide-react';

interface AccordionContextType {
  activeItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
}

export function Accordion({ type = 'single', defaultValue, children, className = '', ...props }: AccordionProps) {
  
  const [activeItems, setActiveItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : (defaultValue ? [defaultValue] : [])
  );
  
  const toggleItem = (value: string) => {
    if (type === 'single') {
      setActiveItems(prev => prev[0] === value ? [] : [value]);
    } else {
      setActiveItems(prev => 
        prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
      );
    }
  };
  
  return (
    <AccordionContext.Provider value={{ activeItems, toggleItem }}>
      <div className={`${styles.accordion} ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItemContext = createContext<string | undefined>(undefined);

export function AccordionItem({ value, children, className = '', ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={`${styles.item} ${className}`} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AccordionTrigger({ children, className = '', ...props }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);
  
  if (!context || !value) throw new Error("Accordion components must be used correctly");
  
  const isOpen = context.activeItems.includes(value);

  return (
    <h3 className={styles.header}>
      <button 
        className={`${styles.trigger} ${className}`} 
        onClick={() => context.toggleItem(value)}
        aria-expanded={isOpen}
        {...props}
      >
        <span className={styles.triggerContent}>{children}</span>
        <ChevronDown className={`${styles.icon} ${isOpen ? styles.open : ''}`} size={16} />
      </button>
    </h3>
  );
}

export function AccordionContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);
  
  if (!context || !value) throw new Error("Accordion components must be used correctly");
  
  const isOpen = context.activeItems.includes(value);

  if (!isOpen) return null;

  return (
    <div className={`${styles.content} ${className}`} role="region" {...props}>
      <div className={styles.contentInner}>
        {children}
      </div>
    </div>
  );
}
