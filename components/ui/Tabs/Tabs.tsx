"use client";

import React, { createContext, useContext, useState } from 'react';
import styles from './Tabs.module.css';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
}

export function Tabs({ defaultValue, children, className = '', ...props }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`${styles.tabs} ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.list} ${className}`} role="tablist" {...props}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, children, className = '', ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  
  const isActive = context.activeTab === value;
  const triggerClass = `${styles.trigger} ${isActive ? styles.active : ''} ${className}`.trim();

  return (
    <button
      className={triggerClass}
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, children, className = '', ...props }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  
  if (context.activeTab !== value) return null;

  return (
    <div 
      className={`${styles.content} ${className}`} 
      role="tabpanel" 
      {...props}
    >
      {children}
    </div>
  );
}
