"use client";

import { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye } from 'lucide-react';

export default function AuditTimelinePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?search=${encodeURIComponent(search)}&limit=100`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    window.open('/api/audit/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Timeline</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive audit trail of all enterprise actions.</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID or description..."
              className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="-ml-1 mr-2 h-4 w-4" />
            Filters
          </button>
          <button onClick={downloadCsv} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <Download className="-ml-1 mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit trail...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module & Action</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP / Device</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No activity logs found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.user?.name || 'System Account'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {log.module}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {log.ipAddress || 'Unknown IP'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => setSelectedLog(log)} className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-5 w-5" />
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedLog(null)} />
            <div className="relative inline-block w-full max-w-2xl p-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Audit Record Detail</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div><strong>ID:</strong> {selectedLog.id}</div>
                <div><strong>Entity:</strong> {selectedLog.entityType} ({selectedLog.entityId})</div>
                <div><strong>Status:</strong> {selectedLog.status}</div>
                <div><strong>IP Address:</strong> {selectedLog.ipAddress}</div>
                <div className="col-span-2"><strong>User Agent:</strong> {selectedLog.userAgent}</div>
              </div>
              
              <div className="space-y-4">
                {selectedLog.beforeValue && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Before</h4>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">{selectedLog.beforeValue}</pre>
                  </div>
                )}
                {selectedLog.afterValue && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase">After</h4>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">{selectedLog.afterValue}</pre>
                  </div>
                )}
              </div>
              <div className="mt-5 sm:mt-6 text-right">
                <button onClick={() => setSelectedLog(null)} className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none sm:text-sm sm:w-auto">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
