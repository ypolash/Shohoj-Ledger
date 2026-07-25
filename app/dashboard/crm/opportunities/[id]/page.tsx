"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [activity, setActivity] = useState({ activityType: "Task", subject: "", description: "" });
  
  // Lost Modal State
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("Competitor");
  const [lostNote, setLostNote] = useState("");

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
    setShowLostModal(false);
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-start bg-white p-6 rounded shadow">
        <div>
          <h1 className="text-2xl font-bold">{opportunity.title}</h1>
          <p className="text-gray-500">{opportunity.opportunityNumber} • {opportunity.customer?.name}</p>
          <div className="mt-2 flex space-x-2">
            <span className={`px-2 py-1 rounded text-sm ${
              opportunity.status === 'WON' ? 'bg-green-100 text-green-800' :
              opportunity.status === 'LOST' ? 'bg-red-100 text-red-800' :
              opportunity.status === 'ARCHIVED' ? 'bg-gray-200 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {opportunity.status}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{opportunity.stage?.name}</span>
          </div>
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {opportunity.tags.map((tag: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right space-y-2">
          <div className="space-x-2">
            <Link href={`/dashboard/crm/opportunities/${params.id}/edit`} className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm">
              Edit Opportunity
            </Link>
            <Link href="/dashboard/crm/opportunities" className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm">
              Back to List
            </Link>
          </div>
          <p className="text-xl font-bold mt-4">{opportunity.currency} {Number(opportunity.estimatedRevenue).toLocaleString()}</p>
          <p className="text-gray-500">Probability: {opportunity.probability}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Pipeline Stages</h2>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {stages
            .filter(s => !opportunity.pipelineId || s.pipelineId === opportunity.pipelineId)
            .map(stage => (
            <button
              key={stage.id}
              onClick={() => handleStatusChange("MOVE_STAGE", { stageId: stage.id })}
              className={`px-4 py-2 rounded whitespace-nowrap ${opportunity.stageId === stage.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            >
              {stage.name}
            </button>
          ))}
        </div>
        
        {opportunity.status !== 'WON' && opportunity.status !== 'LOST' && (
          <div className="mt-6 flex space-x-4 border-t pt-4">
            <button onClick={() => handleStatusChange("WON")} className="px-4 py-2 bg-green-600 text-white rounded font-medium">Mark as Won</button>
            <button onClick={() => setShowLostModal(true)} className="px-4 py-2 bg-red-600 text-white rounded font-medium">Mark as Lost</button>
          </div>
        )}
        
        {opportunity.status === 'LOST' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="font-bold text-red-800">Lost Reason: {opportunity.lostReason}</p>
          </div>
        )}
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
                {act.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{act.description}</p>}
              </div>
            ))}
            {(!opportunity.activities || opportunity.activities.length === 0) && (
              <p className="text-gray-500 text-sm">No activities logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Mark Opportunity as Lost</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select className="w-full border p-2 rounded" value={lostReason} onChange={e => setLostReason(e.target.value)}>
                  <option value="Competitor">Lost to Competitor</option>
                  <option value="Price">Price too high</option>
                  <option value="Feature Gap">Missing Features</option>
                  <option value="Customer Cancelled">Customer Cancelled / Ghosted</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea className="w-full border p-2 rounded h-24" placeholder="Provide details..." value={lostNote} onChange={e => setLostNote(e.target.value)}></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => setShowLostModal(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                <button 
                  onClick={() => handleStatusChange("LOST", { reason: `${lostReason}${lostNote ? ` - ${lostNote}` : ''}` })} 
                  className="px-4 py-2 bg-red-600 text-white rounded font-medium"
                >
                  Confirm Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
