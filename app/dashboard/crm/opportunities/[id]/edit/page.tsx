"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditOpportunityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    customerId: "",
    leadId: "",
    stageId: "",
    pipelineId: "",
    ownerId: "",
    description: "",
    estimatedRevenue: 0,
    probability: 50,
    priority: "Medium",
    currency: "BDT",
    expectedCloseDate: "",
    source: "",
    tags: ""
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/customers").then(r => r.json()),
      fetch("/api/crm/opportunities/stages").then(r => r.json()),
      fetch("/api/crm/opportunities/pipelines").then(r => r.json()),
      fetch("/api/crm/leads").then(r => r.json()),
      fetch("/api/employees").then(r => r.json()),
      fetch(`/api/crm/opportunities/${params.id}`).then(r => r.json())
    ]).then(([custData, stageData, pipeData, leadData, empData, oppData]) => {
      setCustomers(custData.data || custData || []);
      setStages(stageData || []);
      setPipelines(pipeData || []);
      setLeads(leadData.data || leadData || []);
      setEmployees(empData.data || empData || []);
      
      if (oppData) {
        setFormData({
          title: oppData.title || "",
          customerId: oppData.customerId || "",
          leadId: oppData.leadId || "",
          stageId: oppData.stageId || "",
          pipelineId: oppData.pipelineId || "",
          ownerId: oppData.ownerId || "",
          description: oppData.description || "",
          estimatedRevenue: oppData.estimatedRevenue || 0,
          probability: oppData.probability || 0,
          priority: oppData.priority || "Medium",
          currency: oppData.currency || "BDT",
          expectedCloseDate: oppData.expectedCloseDate ? new Date(oppData.expectedCloseDate).toISOString().split('T')[0] : "",
          source: oppData.source || "",
          tags: oppData.tags ? oppData.tags.join(", ") : ""
        });
      }
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      ...formData,
      leadId: formData.leadId || undefined,
      ownerId: formData.ownerId || undefined,
      expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate).toISOString() : undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : []
    };

    const res = await fetch(`/api/crm/opportunities/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      router.push(`/dashboard/crm/opportunities/${params.id}`);
    } else {
      alert("Error updating opportunity");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded mt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Opportunity</h1>
        <Link href={`/dashboard/crm/opportunities/${params.id}`} className="text-gray-600 hover:underline">Cancel</Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Opportunity Name / Title *</label>
            <input required type="text" className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border p-2 rounded h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Customer *</label>
            <select required className="w-full border p-2 rounded" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Related Lead (Optional)</label>
            <select className="w-full border p-2 rounded" value={formData.leadId} onChange={e => setFormData({...formData, leadId: e.target.value})}>
              <option value="">Select Lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.companyName} ({l.leadNumber})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pipeline</label>
            <select className="w-full border p-2 rounded" value={formData.pipelineId} onChange={e => setFormData({...formData, pipelineId: e.target.value})}>
              <option value="">Select Pipeline</option>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stage *</label>
            <select required className="w-full border p-2 rounded" value={formData.stageId} onChange={e => {
              const stg = stages.find(s => s.id === e.target.value);
              setFormData({...formData, stageId: e.target.value, probability: stg ? stg.winProbability : formData.probability});
            }}>
              <option value="">Select Stage</option>
              {stages.filter(s => !formData.pipelineId || s.pipelineId === formData.pipelineId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sales Person (Owner)</label>
            <select className="w-full border p-2 rounded" value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})}>
              <option value="">Unassigned</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expected Close Date</label>
            <input type="date" className="w-full border p-2 rounded" value={formData.expectedCloseDate} onChange={e => setFormData({...formData, expectedCloseDate: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select className="w-full border p-2 rounded" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input type="text" placeholder="e.g. Website, Referral" className="w-full border p-2 rounded" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expected Revenue ({formData.currency})</label>
            <input required type="number" min="0" step="0.01" className="w-full border p-2 rounded" value={formData.estimatedRevenue} onChange={e => setFormData({...formData, estimatedRevenue: Number(e.target.value)})} />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Probability (%)</label>
            <input required type="number" min="0" max="100" className="w-full border p-2 rounded" value={formData.probability} onChange={e => setFormData({...formData, probability: Number(e.target.value)})} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input type="text" placeholder="e.g. Enterprise, Software" className="w-full border p-2 rounded" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-2 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
