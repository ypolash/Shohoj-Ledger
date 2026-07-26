"use client";

import { useState, useEffect } from 'react';
import { Flag, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function FeatureFlagsPage() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/system/features');
      if (res.ok) {
        const json = await res.json();
        setFeatures(json.features || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature: any) => {
    try {
      const res = await fetch('/api/system/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: feature.key,
          description: feature.description,
          isEnabled: !feature.isEnabled,
          rolloutPercentage: feature.rolloutPercentage,
          enabledCompanyIds: feature.enabledCompanyIds
        })
      });
      if (res.ok) fetchFeatures();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-gray-500">Manage early access and beta module rollouts.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading features...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rollout %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 relative"><span className="sr-only">Toggle</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {features.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No feature flags configured.</td>
                  </tr>
                ) : (
                  features.map((f) => (
                    <tr key={f.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Flag className="h-4 w-4 text-gray-400 mr-2" />
                          {f.key}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          f.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {f.isEnabled ? 'Global On' : 'Off / Gradual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {f.rolloutPercentage}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {f.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => toggleFeature(f)} className={`text-gray-500 hover:text-gray-900 focus:outline-none ${f.isEnabled ? 'text-green-600' : ''}`}>
                          {f.isEnabled ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
