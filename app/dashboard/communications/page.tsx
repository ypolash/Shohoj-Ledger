"use client";

import { useState, useEffect } from 'react';
import { Mail, Check, Archive, Trash2, Pin } from 'lucide-react';

export default function InboxPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("UNREAD");

  useEffect(() => {
    fetchInbox();
  }, [filter]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communications/inbox?filter=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch inbox", error);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch(`/api/communications/inbox/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "READ" })
    });
    fetchInbox();
  };

  const deleteMessage = async (id: string) => {
    await fetch(`/api/communications/inbox/${id}`, { method: 'DELETE' });
    fetchInbox();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your alerts.</p>
        </div>
        <div className="flex space-x-2">
          {["UNREAD", "READ", "ARCHIVED", "PINNED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inbox...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No {filter.toLowerCase()} notifications.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((n) => (
              <li key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${n.status === 'UNREAD' ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {n.isPinned && <Pin className="h-4 w-4 text-orange-500" />}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        n.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {n.category}
                      </span>
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {n.status === 'UNREAD' && (
                      <button onClick={() => markRead(n.id)} className="p-1 text-gray-400 hover:text-green-600" title="Mark Read">
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => deleteMessage(n.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
