"use client";

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Box, Truck, DollarSign, Monitor, MapPin } from 'lucide-react';

export default function InventoryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/inventory/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch inventory dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Inventory Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load dashboard</div>;
  }

  const { kpis, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Asset Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of stock levels, purchasing, and fixed assets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                <dd className="text-2xl font-semibold text-gray-900">{kpis.totalProducts}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-400">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                <dd className="text-2xl font-semibold text-gray-900">{kpis.lowStockCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <Box className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                <dd className="text-2xl font-semibold text-gray-900">{kpis.outOfStockCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Inventory Value</dt>
                <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(kpis.inventoryValue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Operations Summary</h2>
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-4 border-b">
               <div className="flex items-center">
                 <Truck className="h-5 w-5 text-gray-400 mr-2" />
                 <span className="text-sm text-gray-600">Total Purchase Value</span>
               </div>
               <span className="font-semibold text-gray-900">{formatCurrency(kpis.purchaseValue)}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b">
               <div className="flex items-center">
                 <Monitor className="h-5 w-5 text-gray-400 mr-2" />
                 <span className="text-sm text-gray-600">Active Fixed Assets</span>
               </div>
               <span className="font-semibold text-gray-900">{kpis.totalAssets}</span>
             </div>
             <div className="flex justify-between items-center">
               <div className="flex items-center">
                 <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                 <span className="text-sm text-gray-600">Active Warehouses</span>
               </div>
               <span className="font-semibold text-gray-900">{kpis.totalWarehouses}</span>
             </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Audit Log</h2>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentTransactions.length === 0 ? (
                <li className="py-4 text-sm text-gray-500">No recent activity</li>
              ) : (
                recentTransactions.map((audit: any) => (
                  <li key={audit.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {audit.action.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {audit.description}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {audit.performedBy?.name || 'System'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
