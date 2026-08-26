"use client";

import React, { useState } from 'react';
import styles from "../../../income/page.module.css";
import { updateExtendedProfile, saveDocumentMetadata, saveNote } from "./actions";
import PersonalTab from '../components/PersonalTab';
import EducationTab from '../components/EducationTab';
import ExperienceTab from '../components/ExperienceTab';
import FamilyTab from '../components/FamilyTab';

export default function EmployeeProfileClient({ employee }: { employee: any }) {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [lifecycles, setLifecycles] = useState<any[]>([]);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [newLifecycle, setNewLifecycle] = useState({ eventType: 'HIRE', effectiveDate: new Date().toISOString().split('T')[0], description: '' });

  React.useEffect(() => {
    fetchLifecycles();
  }, []);

  const fetchLifecycles = async () => {
    try {
      const res = await fetch(`/api/employees/${employee.id}/lifecycle`);
      if (res.ok) setLifecycles(await res.json());
    } catch (error) {
      console.error("Failed to fetch lifecycles", error);
    }
  };

  const handleCreateLifecycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/employees/${employee.id}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLifecycle)
      });
      if (res.ok) {
        setIsLifecycleModalOpen(false);
        fetchLifecycles();
        alert("Lifecycle event added successfully!");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert("Failed to add lifecycle event.");
    }
  };
  
  // Extended Form State (Mapped to Prisma fields where possible, localized where schema lacks)
  const [formData, setFormData] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    designation: employee.designation || '',
    department: employee.department || '',
    basicSalary: employee.basicSalary || '',
    status: employee.status || '',
    employeeId: employee.employeeId || '',
    joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
    location: employee.location || '',
    profile: {
      dateOfBirth: employee.profile?.dateOfBirth ? new Date(employee.profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: employee.profile?.gender || 'Male',
      bloodGroup: employee.profile?.bloodGroup || '',
      nationalId: employee.profile?.nationalId || '',
      maritalStatus: employee.profile?.maritalStatus || 'Single',
      photo: employee.profile?.photo || '',
      secondaryPhone: employee.profile?.secondaryPhone || '',
      currentAddress: employee.profile?.currentAddress || '',
      mainAddress: employee.profile?.mainAddress || '',
      bankName: employee.profile?.bankName || '',
      accountName: employee.profile?.accountName || '',
      accountNumber: employee.profile?.accountNumber || '',
      fatherName: employee.profile?.fatherName || '',
      motherName: employee.profile?.motherName || '',
      spouseName: employee.profile?.spouseName || '',
      nomineeName: employee.profile?.nomineeName || '',
      nomineeRelation: employee.profile?.nomineeRelation || '',
      nomineePhoto: employee.profile?.nomineePhoto || '',
      nomineeNid: employee.profile?.nomineeNid || ''
    },
    education: employee.education?.length ? employee.education : [],
    experience: employee.experience?.length ? employee.experience : []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState<{ id: number, text: string, date: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [documents, setDocuments] = useState<{ id: number, name: string, type: string, uploadDate: string }[]>([]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateExtendedProfile(employee.id, formData);
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    try {
      await saveNote(employee.id, newNote);
      setNotes([{ id: Date.now(), text: newNote, date: new Date().toISOString() }, ...notes]);
      setNewNote("");
    } catch (err: any) {
      alert("Failed to save note");
    }
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await saveDocumentMetadata(employee.id, { name: file.name, type });
        setDocuments([{ id: Date.now(), name: file.name, type, uploadDate: new Date().toISOString() }, ...documents]);
        alert(`${type} uploaded successfully.`);
      } catch (err) {
        alert("Failed to upload document.");
      }
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

  const handleProfileChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', board: '', subject: '', passingYear: '', result: '' }]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => {
      const newEdu = [...prev.education];
      newEdu.splice(index, 1);
      return { ...prev, education: newEdu };
    });
  };

  const handleEducationChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newEdu = [...prev.education];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, education: newEdu };
    });
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', joiningDate: '', leavingDate: '', salary: '', reason: '' }]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => {
      const newExp = [...prev.experience];
      newExp.splice(index, 1);
      return { ...prev, experience: newExp };
    });
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newExp = [...prev.experience];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const tabs = ["Profile", "Documents", "Notes", "Timeline"];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Tabs & Edit Button Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: '12px 24px', 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === t ? 600 : 400,
                cursor: 'pointer',
                fontSize: '15px',
                marginBottom: '-9px'
              }}
            >
              {t}
            </button>
          ))}
        </div>
        
        {activeTab === "Profile" && (
          <button type="button" onClick={() => setIsEditing(!isEditing)} className={isEditing ? "btn btn-secondary" : "btn btn-primary"} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? (
              <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span> Cancel Edit</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit Profile</>
            )}
          </button>
        )}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div style={{ position: 'relative' }}>
          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <PersonalTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} getInitials={getInitials} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <EducationTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
                  <ExperienceTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <FamilyTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleProfileChange={handleProfileChange} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              <PersonalTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} getInitials={getInitials} />
              <EducationTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
              <ExperienceTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
              <FamilyTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving Profile..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "Documents" && (
        <div className="glass-card">
          <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>Employee Documents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {["Profile Photo", "Resume", "National ID", "Passport", "Driving License", "Certificates", "Offer Letter", "Appointment Letter"].map(docType => (
              <div key={docType} style={{ border: '1px dashed var(--border)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>upload_file</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{docType}</div>
                <label className="btn btn-secondary" style={{ fontSize: '12px', cursor: 'pointer', display: 'inline-block' }}>
                  Upload
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, docType)} />
                </label>
              </div>
            ))}
          </div>
          {documents.length > 0 && (
            <div>
              <h4>Uploaded Documents (Metadata)</h4>
              <table className={styles.table}>
                <thead><tr><th>Document Name</th><th>Type</th><th>Upload Date</th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.type}</td>
                      <td>{new Date(d.uploadDate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "Notes" && (
        <div className="glass-card">
          <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>HR Notes</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <textarea 
              className="input" 
              placeholder="Add a new HR note..." 
              value={newNote} 
              onChange={e => setNewNote(e.target.value)}
              style={{ flex: 1, minHeight: '80px', resize: 'vertical' }}
            />
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleAddNote}>Add Note</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notes added yet.</p> : notes.map(note => (
              <div key={note.id} style={{ background: 'var(--surface-light)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{new Date(note.date).toLocaleString()}</div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{note.text}</p>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "Timeline" && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ margin: 0 }}>Employee Timeline & Lifecycle</h3>
            <button className="btn btn-primary" onClick={() => setIsLifecycleModalOpen(true)}>Add Event</button>
          </div>
          
          <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border)' }}>
            {lifecycles.map((lc) => (
              <div key={lc.id} style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)' }}></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(lc.effectiveDate).toLocaleDateString()}</div>
                <div style={{ fontWeight: 500 }}>{lc.eventType}</div>
                {lc.description && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{lc.description}</div>}
              </div>
            ))}

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--surface)' }}></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(employee.joinDate).toLocaleDateString()}</div>
              <div style={{ fontWeight: 500 }}>Joined Company</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Officially joined as {employee.designation}.</div>
            </div>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', left: '-31px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)' }}></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(employee.createdAt).toLocaleDateString()}</div>
              <div style={{ fontWeight: 500 }}>Profile Created</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Employee profile was initialized in the system.</div>
            </div>
          </div>
        </div>
      )}

    {/* Lifecycle Modal */}
      {isLifecycleModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100,
          paddingTop: '8vh'
        }}>
          <div className="glass-card" style={{ width: '400px', maxWidth: '90%', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Add Lifecycle Event</h2>
              <button onClick={() => setIsLifecycleModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateLifecycle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Event Type *</label>
                <select className="input" value={newLifecycle.eventType} onChange={e => setNewLifecycle({...newLifecycle, eventType: e.target.value})} required>
                  <option value="HIRE">HIRE</option>
                  <option value="CONFIRM">CONFIRM</option>
                  <option value="PROMOTE">PROMOTE</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="SUSPEND">SUSPEND</option>
                  <option value="REINSTATE">REINSTATE</option>
                  <option value="RESIGN">RESIGN</option>
                  <option value="TERMINATE">TERMINATE</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Effective Date *</label>
                <input type="date" className="input" value={newLifecycle.effectiveDate} onChange={e => setNewLifecycle({...newLifecycle, effectiveDate: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Description</label>
                <textarea className="input" rows={3} value={newLifecycle.description} onChange={e => setNewLifecycle({...newLifecycle, description: e.target.value})}></textarea>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsLifecycleModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
