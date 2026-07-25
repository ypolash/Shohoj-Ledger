"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, dashRes] = await Promise.all([
        fetch("/api/crm/opportunities"),
        fetch("/api/crm/opportunities/dashboard")
      ]);
      const oppData = await oppRes.json();
      const dashData = await dashRes.json();
      if (oppRes.ok) setOpportunities(oppData.data || []);
      if (dashRes.ok) setDashboard(dashData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{o.opportunityNumber}</td>
                  <td className="px-6 py-4 font-medium">{o.title}</td>
                  <td className="px-6 py-4">{o.customer?.name}</td>
                  <td className="px-6 py-4">{o.stage?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{o.status}</td>
                  <td className="px-6 py-4">${Number(o.estimatedRevenue).toLocaleString()}</td>
                  <td className="px-6 py-4">{o.probability}%</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/crm/opportunities/${o.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
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
