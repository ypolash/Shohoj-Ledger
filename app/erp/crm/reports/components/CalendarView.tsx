"use client";

import React, { useState } from 'react';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');

  // Extremely basic CSS Grid calendar generation
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    if (dayNumber > 0 && dayNumber <= daysInMonth) return dayNumber;
    return null;
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Mock events
  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    if (day === 12) return [{ title: 'Demo: Acme Corp', type: 'MEETING', color: 'var(--primary)' }];
    if (day === 15) return [{ title: 'Quote Expiry', type: 'ALERT', color: 'var(--danger)' }, { title: 'Follow-up Call', type: 'CALL', color: 'var(--info)' }];
    if (day === 22) return [{ title: 'Quarterly Review', type: 'MEETING', color: 'var(--primary)' }];
    return [];
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{monthName}</h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={prevMonth} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <button onClick={() => setCurrentDate(new Date())} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '6px', padding: '0 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Today</button>
            <button onClick={nextMonth} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-main)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '4px', borderRadius: '8px' }}>
          {['Month', 'Week', 'Day'].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)}
              style={{
                padding: '6px 16px', background: view === v ? 'var(--bg-main)' : 'transparent', 
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, 
                color: view === v ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-light)', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Days Header */}
        {weekDays.map(day => (
          <div key={day} style={{ background: 'var(--surface-main)', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Cells */}
        {days.map((day, i) => {
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
          const events = getEventsForDay(day);

          return (
            <div key={i} style={{ background: 'var(--bg-main)', minHeight: '100px', padding: '8px', position: 'relative', transition: 'background 0.2s', cursor: day ? 'pointer' : 'default' }} className="hover-bg-hover">
              {day && (
                <>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? 'white' : 'var(--text-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 600, marginBottom: '8px'
                  }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {events.map((ev, evIdx) => (
                      <div key={evIdx} style={{ 
                        fontSize: '10px', fontWeight: 600, background: `color-mix(in srgb, ${ev.color} 15%, transparent)`, 
                        color: ev.color, padding: '4px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                      }}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-hover:hover { background: var(--surface-hover) !important; }
      `}} />
    </div>
  );
}
