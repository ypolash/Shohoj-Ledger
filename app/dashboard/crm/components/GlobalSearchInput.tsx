"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function GlobalSearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Redirect to a unified search page or customer list with query
    router.push(`/dashboard/crm/customers?search=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-6">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-slate-400">search</span>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Name, Phone, Company, or Code... (Press Enter)"
        className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
      />
      {query && (
        <button 
          type="button" 
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </form>
  );
}
