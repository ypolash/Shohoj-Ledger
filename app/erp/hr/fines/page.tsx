"use client";

import { useState, useEffect } from "react";
// Removed date-fns import

export default function FinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newFine, setNewFine] = useState({ employeeId: "", amount: "", reason: "", date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [finesRes, empRes] = await Promise.all([
        fetch("/api/hr/fines"),
        fetch("/api/employees")
      ]);
      const fData = await finesRes.json();
      const eData = await empRes.json();
      
      setFines(fData.fines || []);
      setEmployees(eData.data || eData.employees || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }

  async function handleCreateFine(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFine)
      });
      if (res.ok) {
        setShowModal(false);
        setNewFine({ employeeId: "", amount: "", reason: "", date: "" });
        fetchData();
      } else {
        alert("Failed to assign fine");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  }

  async function handleCancelFine(id: string) {
    if (!confirm("Are you sure you want to cancel this fine?")) return;
    try {
      const res = await fetch(`/api/hr/fines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to cancel fine");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Disciplinary Fines & Penalties</h1>
          <p className="text-sm text-gray-500">Manage employee deductions and penalties.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          Assign Fine
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payroll Period</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading fines...</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">No fines assigned.</td></tr>
              ) : fines.map((f: any) => (
                <tr key={f.id}>
                  <td>{new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(f.date))}</td>
                  <td>{f.employee?.firstName} {f.employee?.lastName} <br/><span className="text-xs text-gray-400">{f.employee?.employeeId}</span></td>
                  <td>{f.reason}</td>
                  <td className="font-medium text-red-600">৳{Number(f.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${f.status === 'PENDING' ? 'badge-warning' : f.status === 'DEDUCTED' ? 'badge-success' : 'badge-ghost'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>{f.payrollRun?.period?.name || "-"}</td>
                  <td>
                    {f.status === "PENDING" && (
                      <button 
                        onClick={() => handleCancelFine(f.id)}
                        className="btn btn-xs btn-outline btn-error"
                      >
                        Waive / Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Assign Penalty</h3>
            <form onSubmit={handleCreateFine}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Employee</span></label>
                <select 
                  className="select select-bordered" 
                  value={newFine.employeeId} 
                  onChange={e => setNewFine({...newFine, employeeId: e.target.value})}
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Amount (৳)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input input-bordered" 
                  value={newFine.amount}
                  onChange={e => setNewFine({...newFine, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Reason</span></label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  placeholder="e.g. Late Arrival, Property Damage"
                  value={newFine.reason}
                  onChange={e => setNewFine({...newFine, reason: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-6">
                <label className="label"><span className="label-text">Penalty Date</span></label>
                <input 
                  type="date" 
                  className="input input-bordered" 
                  value={newFine.date}
                  onChange={e => setNewFine({...newFine, date: e.target.value})}
                  required
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Assign Penalty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
