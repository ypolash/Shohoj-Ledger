"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/crm/customers/${params.id}`);
      const data = await res.json();
      if (res.ok) setCustomer(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!customer) return <div className="p-6">Customer not found.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-gray-500">{customer.customerCode}</p>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 border rounded">Back</button>
      </div>

      <div className="flex space-x-4 border-b mb-6">
        {["details", "contacts", "addresses", "documents"].map(tab => (
          <button
            key={tab}
            className={`py-2 px-4 ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="bg-white p-6 rounded shadow max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{customer.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p>{customer.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p>{customer.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tags</p>
              <p>{customer.tags?.length ? customer.tags.join(", ") : "None"}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Contacts</h2>
          {customer.contacts?.length === 0 ? <p>No contacts found.</p> : (
            <ul>
              {customer.contacts?.map((c: any) => (
                <li key={c.id} className="border-b py-2">{c.name} ({c.email || c.phone}) - {c.designation || 'No Designation'}</li>
              ))}
            </ul>
          )}
          {/* Add Contact Form would go here */}
        </div>
      )}

      {activeTab === "addresses" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Addresses</h2>
          {customer.addresses?.length === 0 ? <p>No addresses found.</p> : (
            <ul>
              {customer.addresses?.map((a: any) => (
                <li key={a.id} className="border-b py-2">{a.addressLine1}, {a.city}, {a.country}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Documents</h2>
          <p>Document management feature initialized.</p>
        </div>
      )}
    </div>
  );
}
