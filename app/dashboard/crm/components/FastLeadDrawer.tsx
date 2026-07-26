"use client";

import React, { useEffect, useRef, useState } from "react";

type FastLeadProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function FastLeadDrawer({ isOpen, onClose, onSuccess }: FastLeadProps) {
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const reset = () => {
    setName("");
    setPhone("");
    setCompany("");
    setExpectedValue("");
    setError(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError(true);
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        firstName: name,
        lastName: "",
        phone,
        company,
        expectedValue: Number(expectedValue) || 0,
        status: "New",
        priority: "Medium"
      };

      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        reset();
        onSuccess();
        onClose();
      } else {
        alert("Failed to save lead.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving lead.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[1040] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 z-[1050] shadow-2xl flex flex-col transform transition-transform duration-200">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <span className="material-symbols-outlined">person_add</span>
            Quick Add Lead
          </h2>
          <button onClick={onClose} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name <span className="text-red-500">*</span></label>
            <input 
              type="text"
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Rahim Uddin"
            />
            {error && !name && <span className="text-xs text-red-500 mt-1">Name is required</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone <span className="text-red-500">*</span></label>
            <input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              placeholder="01XXXXXXXXX"
            />
            {error && !phone && <span className="text-xs text-red-500 mt-1">Phone is required</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company (Optional)</label>
            <input 
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Rahim Trading"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Value (Optional)</label>
            <input 
              type="number"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              min="0"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              placeholder="0.00"
            />
          </div>

          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 ${loading ? 'opacity-70' : ''}`}>
              {loading ? 'Saving...' : (
                <>Save <span className="text-xs ml-1 font-mono hidden md:inline border border-white/30 px-1 rounded">Enter</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
