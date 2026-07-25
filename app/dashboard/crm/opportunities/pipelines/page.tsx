"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPipelineName, setNewPipelineName] = useState("");

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    setLoading(true);
    const res = await fetch("/api/crm/opportunities/pipelines");
    if (res.ok) {
      setPipelines(await res.json());
    }
    setLoading(false);
  };

  const handleCreatePipeline = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/crm/opportunities/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPipelineName })
    });
    if (res.ok) {
      setNewPipelineName("");
      fetchPipelines();
    } else {
      alert("Error creating pipeline");
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/crm/opportunities/pipelines/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      fetchPipelines();
    } else {
      alert("Cannot delete pipeline. Make sure it has no active opportunities.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Pipelines</h1>
        <Link href="/dashboard/crm/opportunities" className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
          Back to Opportunities
        </Link>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Create New Pipeline</h2>
        <form onSubmit={handleCreatePipeline} className="flex space-x-4">
          <input 
            required 
            placeholder="Pipeline Name (e.g. Sales, Enterprise)" 
            className="flex-1 border p-2 rounded" 
            value={newPipelineName} 
            onChange={e => setNewPipelineName(e.target.value)} 
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {pipelines.map(pipeline => (
            <div key={pipeline.id} className="bg-white p-6 rounded shadow flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{pipeline.name} {pipeline.isDefault && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Default</span>}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {pipeline._count?.opportunities} Opportunities • {pipeline._count?.stages} Stages
                </p>
              </div>
              <div>
                <button onClick={() => handleDeletePipeline(pipeline.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {pipelines.length === 0 && (
            <p className="text-gray-500">No pipelines found. Create one above.</p>
          )}
        </div>
      )}
    </div>
  );
}
