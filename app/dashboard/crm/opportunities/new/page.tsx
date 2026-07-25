"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    customerId: "",
    stageId: "",
    pipelineId: "",
    estimatedRevenue: 0,
    probability: 50,
    priority: "Medium",
    currency: "BDT"
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/customers").then(r => r.json()),
      fetch("/api/crm/opportunities/stages").then(r => r.json()),
      fetch("/api/crm/opportunities/pipelines").then(r => r.json())
    ]).then(([custData, stageData, pipeData]) => {
      setCustomers(custData.data || []);
      setStages(stageData || []);
      setPipelines(pipeData || []);
    });
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/crm/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      router.push("/dashboard/crm/opportunities");
    } else {
      alert("Error creating opportunity");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-6">
      <h1 className="text-2xl font-bold mb-6">New Opportunity</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input required type="text" className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select required className="w-full border p-2 rounded" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pipeline</label>
            <select className="w-full border p-2 rounded" value={formData.pipelineId} onChange={e => setFormData({...formData, pipelineId: e.target.value})}>
              <option value="">Select Pipeline</option>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stage</label>
            <select required className="w-full border p-2 rounded" value={formData.stageId} onChange={e => setFormData({...formData, stageId: e.target.value})}>
              <option value="">Select Stage</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select className="w-full border p-2 rounded" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Expected Revenue ({formData.currency})</label>
            <input required type="number" min="0" step="0.01" className="w-full border p-2 rounded" value={formData.estimatedRevenue} onChange={e => setFormData({...formData, estimatedRevenue: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Probability (%)</label>
            <input required type="number" min="0" max="100" className="w-full border p-2 rounded" value={formData.probability} onChange={e => setFormData({...formData, probability: Number(e.target.value)})} />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Opportunity</button>
        </div>
      </form>
    </div>
  );
}
