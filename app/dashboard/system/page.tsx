"use client";

import { useEffect, useState } from 'react';
import { Server, Users, Building, HardDrive, Cpu, Activity, Clock } from 'lucide-react';

export default function SystemDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/system/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <div className="p-8 text-center">Loading platform metrics...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500">Failed to load or Unauthorized.</div>;

  const { metrics, health, lastBackup } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Operations Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Global overview across all tenants and server hardware.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Building className="h-5 w-5 mr-2 text-indigo-500" />
            <h3 className="text-sm font-medium">Active Tenants</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeCompanies} / {metrics.totalCompanies}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="text-sm font-medium">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            <h3 className="text-sm font-medium">Database Status</h3>
          </div>
          <p className="text-xl font-bold text-green-600 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
            {health.databaseStatus}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            <h3 className="text-sm font-medium">Uptime</h3>
          </div>
          <p className="text-xl font-bold text-gray-900">{health.uptimeHours} Hours</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Hardware Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">CPU Load (1m / 5m / 15m)</h3>
            <Cpu className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex space-x-4 items-end">
            <div className="text-2xl font-bold text-gray-900">{health.cpuLoad1m}</div>
            <div className="text-xl font-semibold text-gray-500">{health.cpuLoad5m}</div>
            <div className="text-lg font-medium text-gray-400">{health.cpuLoad15m}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
            <HardDrive className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mb-2 flex justify-between">
            <span className="text-2xl font-bold text-gray-900">{health.memoryUsagePercent}%</span>
            <span className="text-sm text-gray-500 self-end">of {health.totalMemoryGb} GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${parseFloat(health.memoryUsagePercent) > 80 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${health.memoryUsagePercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Latest Backup</h3>
            <Server className="h-5 w-5 text-gray-400" />
          </div>
          {lastBackup ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{new Date(lastBackup.createdAt).toLocaleString()}</p>
              <p className={`text-xs mt-1 font-semibold ${lastBackup.status === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'}`}>
                Status: {lastBackup.status}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No backups found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
