"use client";

import React, { useEffect, useRef, useState } from "react";

type FastEntryProps = {
  isOpen: boolean;
  onClose: () => void;
  type: "INCOME" | "EXPENSE";
  onSuccess: () => void;
};

export function FastEntryDrawer({ isOpen, onClose, type, onSuccess }: FastEntryProps) {
  const [loading, setLoading] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const reset = () => {
    setAmount("");
    setCategory("");
    setPaymentMethod("CASH");
    setNote("");
    setError(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !category) {
      setError(true);
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = type === "INCOME" ? "/api/income" : "/api/expenses";
      let payload: any = {};
      
      if (type === "INCOME") {
        payload = {
          amount: Number(amount),
          received: Number(amount),
          category: category,
          source: "Fast Entry", // Default source
          description: note
        };
      } else {
        payload = {
          amount: Number(amount),
          category: category,
          paymentMethod: paymentMethod,
          description: note
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        reset();
        onSuccess();
        onClose();
      } else {
        alert("Failed to save. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[1040] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 z-[1050] shadow-2xl flex flex-col transform transition-transform duration-200">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <span className={`material-symbols-outlined ${type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
              {type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
            </span>
            Record {type === 'INCOME' ? 'Income' : 'Expense'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (BDT) <span className="text-red-500">*</span></label>
            <input 
              type="number"
              ref={amountInputRef}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              className="w-full text-2xl px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              placeholder="0.00"
            />
            {error && (!amount || Number(amount) <= 0) && <span className="text-xs text-red-500 mt-1">Valid amount required</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category <span className="text-red-500">*</span></label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
            >
              <option value="">Select Category...</option>
              {type === 'INCOME' ? (
                <>
                  <option value="1">Sales</option>
                  <option value="2">Services</option>
                  <option value="3">Investments</option>
                </>
              ) : (
                <>
                  <option value="4">Office Supplies</option>
                  <option value="5">Rent</option>
                  <option value="6">Utilities</option>
                  <option value="7">Salary</option>
                </>
              )}
            </select>
            {error && !category && <span className="text-xs text-red-500 mt-1">Category required</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Paid Via</label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 has-[:checked]:border-blue-500 transition-colors">
                <input type="radio" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} className="sr-only" />
                <span className="material-symbols-outlined text-[18px]">payments</span> Cash
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 has-[:checked]:border-blue-500 transition-colors">
                <input type="radio" value="BANK" checked={paymentMethod === 'BANK'} onChange={() => setPaymentMethod('BANK')} className="sr-only" />
                <span className="material-symbols-outlined text-[18px]">account_balance</span> Bank
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Note (Optional)</label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
              placeholder="e.g. Printer paper"
            />
          </div>

          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors flex justify-center items-center gap-2 ${type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} ${loading ? 'opacity-70' : ''}`}>
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
