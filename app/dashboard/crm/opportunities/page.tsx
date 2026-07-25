"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [stageId, setStageId] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Metadata for filters
  const [stages, setStages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/opportunities/stages").then(r => r.json()),
      fetch("/api/crm/opportunities/pipelines").then(r => r.json()),
      fetch("/api/employees").then(r => r.json())
    ]).then(([stageData, pipeData, empData]) => {
      setStages(stageData || []);
      setPipelines(pipeData || []);
      setEmployees(empData?.data || empData || []);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [query, status, stageId, pipelineId, ownerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (status) params.append("status", status);
      if (stageId) params.append("stageId", stageId);
      if (pipelineId) params.append("pipelineId", pipelineId);
      if (ownerId) params.append("ownerId", ownerId);

      const [oppRes, dashRes] = await Promise.all([
        fetch(`/api/crm/opportunities?${params.toString()}`),
        fetch("/api/crm/opportunities/dashboard")
      ]);
      
      if (oppRes.ok) {
        const oppData = await oppRes.json();
        setOpportunities(oppData.data || []);
      }
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboard(dashData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    if (action === "DELETE") {
      if (!confirm("Are you sure you want to delete this opportunity?")) return;
      await fetch(`/api/crm/opportunities/${id}`, { method: "DELETE" });
    } else {
      if (!confirm(`Are you sure you want to ${action.toLowerCase()} this opportunity?`)) return;
      await fetch(`/api/crm/opportunities/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
    }
    fetchData();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <div className="space-x-4">
          <Link href="/dashboard/crm/opportunities/pipelines" className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
            Manage Pipelines
          </Link>
          <Link href="/dashboard/crm/opportunities/new" className="bg-blue-600 text-white px-4 py-2 rounded">
            + New Opportunity
          </Link>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">{dashboard.totalOpportunities}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Pipeline Value</p>
            <p className="text-xl font-bold">${dashboard.pipelineValue?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Weighted Forecast</p>
            <p className="text-xl font-bold">${dashboard.weightedForecast?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Won Value</p>
            <p className="text-xl font-bold text-green-600">${dashboard.wonValue?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Lost Value</p>
            <p className="text-xl font-bold text-red-600">${dashboard.lostValue?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-xl font-bold">{dashboard.conversionRate}%</p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input 
          type="text" 
          placeholder="Search Title or Number..." 
          className="border p-2 rounded" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <select className="border p-2 rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select className="border p-2 rounded" value={pipelineId} onChange={(e) => setPipelineId(e.target.value)}>
          <option value="">All Pipelines</option>
          {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="border p-2 rounded" value={stageId} onChange={(e) => setStageId(e.target.value)}>
          <option value="">All Stages</option>
          {stages.filter(s => !pipelineId || s.pipelineId === pipelineId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="border p-2 rounded" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">All Owners</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2">
              <tr>
                <th className="px-6 py-4">Number</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Probability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{o.opportunityNumber}</td>
                  <td className="px-6 py-4 font-medium">{o.title}</td>
                  <td className="px-6 py-4">{o.customer?.name}</td>
                  <td className="px-6 py-4">{o.stage?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      o.status === 'WON' ? 'bg-green-100 text-green-800' :
                      o.status === 'LOST' ? 'bg-red-100 text-red-800' :
                      o.status === 'ARCHIVED' ? 'bg-gray-200 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">${Number(o.estimatedRevenue).toLocaleString()}</td>
                  <td className="px-6 py-4">{o.probability}%</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/dashboard/crm/opportunities/${o.id}`} className="text-blue-600 hover:underline">View</Link>
                    <Link href={`/dashboard/crm/opportunities/${o.id}/edit`} className="text-gray-600 hover:underline">Edit</Link>
                    
                    {o.status !== 'ARCHIVED' && (
                      <button onClick={() => handleAction(o.id, 'ARCHIVE')} className="text-yellow-600 hover:underline">Archive</button>
                    )}
                    {o.status === 'ARCHIVED' && (
                      <button onClick={() => handleAction(o.id, 'RESTORE')} className="text-green-600 hover:underline">Restore</button>
                    )}
                    <button onClick={() => handleAction(o.id, 'DELETE')} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No opportunities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
