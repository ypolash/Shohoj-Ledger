"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [activity, setActivity] = useState({ activityType: "Task", subject: "", description: "" });
  
  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    const [oppRes, stageRes] = await Promise.all([
      fetch(`/api/crm/opportunities/${params.id}`),
      fetch("/api/crm/opportunities/stages")
    ]);
    if (oppRes.ok) setOpportunity(await oppRes.json());
    if (stageRes.ok) setStages(await stageRes.json());
  };

  const handleStatusChange = async (action: string, extraData: any = {}) => {
    await fetch(`/api/crm/opportunities/${params.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extraData })
    });
    fetchData();
  };

  const handleAddActivity = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/crm/opportunities/${params.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity)
    });
    setActivity({ activityType: "Task", subject: "", description: "" });
    fetchData();
  };

  if (!opportunity) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start bg-white p-6 rounded shadow">
        <div>
          <h1 className="text-2xl font-bold">{opportunity.title}</h1>
          <p className="text-gray-500">{opportunity.opportunityNumber} • {opportunity.customer?.name}</p>
          <div className="mt-2 flex space-x-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{opportunity.status}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{opportunity.stage?.name}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${Number(opportunity.estimatedRevenue).toLocaleString()}</p>
          <p className="text-gray-500">Probability: {opportunity.probability}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Pipeline Stages</h2>
        <div className="flex space-x-2 overflow-x-auto">
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => handleStatusChange("MOVE_STAGE", { stageId: stage.id })}
              className={`px-4 py-2 rounded whitespace-nowrap ${opportunity.stageId === stage.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            >
              {stage.name}
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-4 border-t pt-4">
          <button onClick={() => handleStatusChange("WON")} className="px-4 py-2 bg-green-600 text-white rounded">Mark as Won</button>
          <button onClick={() => {
            const reason = prompt("Enter lost reason (Competitor, Price, Feature Gap, etc):");
            if (reason) handleStatusChange("LOST", { reason });
          }} className="px-4 py-2 bg-red-600 text-white rounded">Mark as Lost</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Add Activity</h2>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div>
              <select className="w-full border p-2 rounded" value={activity.activityType} onChange={e => setActivity({...activity, activityType: e.target.value})}>
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Task">Task</option>
                <option value="Internal Note">Internal Note</option>
              </select>
            </div>
            <div>
              <input required placeholder="Subject" className="w-full border p-2 rounded" value={activity.subject} onChange={e => setActivity({...activity, subject: e.target.value})} />
            </div>
            <div>
              <textarea placeholder="Description / Comment" className="w-full border p-2 rounded h-24" value={activity.description} onChange={e => setActivity({...activity, description: e.target.value})}></textarea>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Post Activity</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {opportunity.activities?.map((act: any) => (
              <div key={act.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm">{act.subject}</h3>
                  <span className="text-xs text-gray-500">{new Date(act.activityDate).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-blue-700 uppercase mt-1">{act.activityType}</p>
                {act.description && <p className="text-sm text-gray-700 mt-2">{act.description}</p>}
              </div>
            ))}
            {(!opportunity.activities || opportunity.activities.length === 0) && (
              <p className="text-gray-500 text-sm">No activities logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
