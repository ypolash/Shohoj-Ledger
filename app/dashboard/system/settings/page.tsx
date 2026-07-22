"use client";

import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for editing
  const [maintenanceMode, setMaintenanceMode] = useState("false");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [maxUploadLimit, setMaxUploadLimit] = useState("10");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system/settings');
      if (res.ok) {
        const json = await res.json();
        setSettings(json.settings || []);
        
        // Populate local state if they exist in DB
        json.settings.forEach((s: any) => {
          if (s.key === 'MAINTENANCE_MODE') setMaintenanceMode(s.value);
          if (s.key === 'DEFAULT_CURRENCY') setDefaultCurrency(s.value);
          if (s.key === 'MAX_UPLOAD_MB') setMaxUploadLimit(s.value);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, description: string) => {
    try {
      await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, description })
      });
      alert(`${key} saved successfully!`);
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure core parameters applied across the entire platform.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-3xl">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <Settings className="mr-2 h-5 w-5 text-gray-400" />
          General Platform Configuration
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
              <p className="text-xs text-gray-500">Block all non-admin logins.</p>
            </div>
            <div className="col-span-1">
              <select 
                value={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="false">Disabled (Live)</option>
                <option value="true">Enabled (Maintenance)</option>
              </select>
            </div>
            <div className="col-span-1 text-right">
              <button 
                onClick={() => saveSetting('MAINTENANCE_MODE', maintenanceMode, 'Platform-wide maintenance mode lock')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center pt-4 border-t border-gray-200">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <p className="text-xs text-gray-500">For new tenants.</p>
            </div>
            <div className="col-span-1">
              <input 
                type="text" 
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
            <div className="col-span-1 text-right">
              <button 
                onClick={() => saveSetting('DEFAULT_CURRENCY', defaultCurrency, 'Fallback default currency')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center pt-4 border-t border-gray-200">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Max Upload Limit (MB)</label>
              <p className="text-xs text-gray-500">Max size for file uploads.</p>
            </div>
            <div className="col-span-1">
              <input 
                type="number" 
                value={maxUploadLimit}
                onChange={(e) => setMaxUploadLimit(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
            <div className="col-span-1 text-right">
              <button 
                onClick={() => saveSetting('MAX_UPLOAD_MB', maxUploadLimit, 'Maximum global file upload boundary')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
