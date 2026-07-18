"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Settings, ShieldAlert, Check } from "lucide-react";

export default function PunishmentSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    type: "LATE",
    fromMinutes: 16,
    toMinutes: 30,
    amount: 100,
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, rulesRes] = await Promise.all([
        fetch("/api/staff/settings/attendance"),
        fetch("/api/staff/settings/punishments")
      ]);
      const configData = await configRes.json();
      const rulesData = await rulesRes.json();
      setConfig(configData);
      setRules(rulesData);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/staff/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      alert("Configuration saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (rule: any = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        type: rule.type,
        fromMinutes: rule.fromMinutes,
        toMinutes: rule.toMinutes,
        amount: rule.amount,
        active: rule.active
      });
    } else {
      setEditingRule(null);
      setFormData({
        type: "LATE",
        fromMinutes: 16,
        toMinutes: 30,
        amount: 100,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const saveRule = async () => {
    try {
      if (editingRule) {
        await fetch(`/api/staff/settings/punishments/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch("/api/staff/settings/punishments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const toggleRuleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/staff/settings/punishments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active })
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await fetch(`/api/staff/settings/punishments/${id}`, {
        method: "DELETE"
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-indigo-600" />
            Attendance & Punishment Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure global attendance limits and monetary penalty slabs.</p>
        </div>
      </div>

      {/* Global Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="h-4 w-4" /> Global Settings
          </h3>
          <button 
            onClick={saveConfig}
            disabled={saving}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
        
        {config && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Minutes)</label>
              <input 
                type="number" 
                value={config.gracePeriod}
                onChange={(e) => handleConfigChange('gracePeriod', parseInt(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start Time (HH:mm)</label>
              <input 
                type="time" 
                value={config.shiftStart}
                onChange={(e) => handleConfigChange('shiftStart', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift End Time (HH:mm)</label>
              <input 
                type="time" 
                value={config.shiftEnd}
                onChange={(e) => handleConfigChange('shiftEnd', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 border"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox" 
                id="fridayOff"
                checked={config.fridayOff}
                onChange={(e) => handleConfigChange('fridayOff', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="fridayOff" className="text-sm font-medium text-gray-700">Friday is an Off-Day</label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox" 
                id="enablePunishment"
                checked={config.enablePunishmentDeduction}
                onChange={(e) => handleConfigChange('enablePunishmentDeduction', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enablePunishment" className="text-sm font-medium text-gray-700">
                Enable Monetary Deductions (Warning Only if disabled)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Punishment Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Punishment Slabs (Rules)</h3>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4" /> Add Rule
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (৳)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No punishment rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.fromMinutes} to {rule.toMinutes} mins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      ৳{rule.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleRuleActive(rule.id, !rule.active)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {rule.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(rule)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingRule ? "Edit Rule" : "Add Rule"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="LATE">LATE</option>
                  <option value="EARLY_LEAVE">EARLY LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">From (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.fromMinutes}
                    onChange={(e) => setFormData({...formData, fromMinutes: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.toMinutes}
                    onChange={(e) => setFormData({...formData, toMinutes: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (৳)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="activeRule"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="activeRule" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={saveRule}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
