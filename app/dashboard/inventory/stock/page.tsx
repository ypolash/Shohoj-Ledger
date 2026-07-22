"use client";

import { Box } from 'lucide-react';

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Control</h1>
          <p className="mt-1 text-sm text-gray-500">Manage stock ins, outs, transfers, and adjustments.</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Stock Out
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Stock In
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
        <Box className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No stock transactions</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new stock entry or adjustment.</p>
      </div>
    </div>
  );
}
