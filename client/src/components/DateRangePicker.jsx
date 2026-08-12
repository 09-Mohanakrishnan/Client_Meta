import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateRange } from '../context/DateRangeContext';

const DateRangePicker = () => {
  const { dateRange, selectRange } = useDateRange();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);

  const presets = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom range'];

  const handlePresetSelect = (preset) => {
    if (preset !== 'Custom range') { selectRange(preset); setShowDatePicker(false); }
    else { selectRange('Custom range', customStart, customEnd); }
  };

  const applyCustomRange = (e) => {
    e.preventDefault();
    selectRange('Custom range', customStart, customEnd);
    setShowDatePicker(false);
  };

  const formatLabel = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    const range = `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-GB', opts)}`;
    return dateRange.label === 'Custom range' ? range : `${dateRange.label}: ${range}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowDatePicker(!showDatePicker)} className="meta-btn">
        <Calendar size={12} color="#65676b" />
        <span style={{ whiteSpace: 'nowrap' }}>{formatLabel()}</span>
        <ChevronDown size={12} color="#65676b" />
      </button>

      {showDatePicker && (
        <div style={{
          position: 'absolute', right: 0, zIndex: 50, marginTop: '4px',
          width: '220px', borderRadius: '8px', border: '1px solid #dddfe2',
          backgroundColor: '#fff', padding: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          fontSize: '13px',
        }}>
          <div style={{ marginBottom: '4px', fontWeight: 700, fontSize: '10px', color: '#8a8d91', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Date Range
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {presets.map(preset => (
              <button key={preset} onClick={() => handlePresetSelect(preset)}
                style={{
                  width: '100%', borderRadius: '4px', padding: '6px 8px', textAlign: 'left',
                  border: 'none', cursor: 'pointer', fontSize: '13px',
                  backgroundColor: dateRange.label === preset ? '#e7f3ff' : 'transparent',
                  color: dateRange.label === preset ? '#1877f2' : '#1c1e21',
                  fontWeight: dateRange.label === preset ? 600 : 400,
                }}
                onMouseEnter={e => { if (dateRange.label !== preset) e.target.style.backgroundColor = '#f2f3f5'; }}
                onMouseLeave={e => { if (dateRange.label !== preset) e.target.style.backgroundColor = 'transparent'; }}>
                {preset}
              </button>
            ))}
          </div>

          {dateRange.label === 'Custom range' && (
            <form onSubmit={applyCustomRange} style={{ marginTop: '8px', borderTop: '1px solid #e4e6eb', paddingTop: '8px' }}>
              <div style={{ marginBottom: '6px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: '#8a8d91', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Start</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  style={{ width: '100%', border: '1px solid #dddfe2', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: '#8a8d91', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>End</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  style={{ width: '100%', border: '1px solid #dddfe2', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none' }} />
              </div>
              <button type="submit" style={{
                width: '100%', padding: '6px', backgroundColor: '#1877f2', color: '#fff',
                border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              }}>
                Apply Range
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
