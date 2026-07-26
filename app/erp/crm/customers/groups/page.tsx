"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/crm/customers/groups");
      const data = await res.json();
      if (res.ok) setGroups(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup) return;
    try {
      const res = await fetch("/api/crm/customers/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroup })
      });
      if (res.ok) {
        setNewGroup("");
        fetchGroups();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Groups</h1>
        <Link href="/erp/crm/customers" className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
          Back to Customers
        </Link>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6 max-w-md">
        <form onSubmit={handleCreate} className="flex space-x-2">
          <input 
            type="text" 
            placeholder="New Group Name" 
            className="border p-2 flex-grow rounded"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto max-w-3xl">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2">
              <tr>
                <th className="px-6 py-4">Group Name</th>
                <th className="px-6 py-4">Customer Count</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{g.name}</td>
                  <td className="px-6 py-4">{g._count?.customers || 0}</td>
                  <td className="px-6 py-4">{g.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No groups found.
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
