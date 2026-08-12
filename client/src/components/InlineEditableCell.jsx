import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InlineEditableCell = ({
  value: initialValue,
  columnKey,
  columnType,
  isEditable = true,
  onSave,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => { setValue(initialValue); }, [initialValue]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  // SUPER_ADMIN can always edit, EDITOR can edit, VIEWER cannot
  const canEdit = isEditable && user && user.role !== 'VIEWER';

  if (!canEdit) {
    return (
      <div style={{ padding: '0 4px', fontSize: '12px', color: '#1c1e21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {renderFormattedValue(initialValue, columnType)}
      </div>
    );
  }

  const handleSave = () => {
    let parsedVal = value;
    if (['number', 'currency', 'percentage'].includes(columnType)) {
      parsedVal = parseFloat(value);
      if (isNaN(parsedVal)) parsedVal = 0;
    }
    onSave(parsedVal);
    setIsEditing(false);
  };

  const handleCancel = () => { setValue(initialValue); setIsEditing(false); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') handleCancel();
  };

  const isNumeric = ['number', 'currency', 'percentage'].includes(columnType);

  if (isEditing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px',
        backgroundColor: '#e7f3ff', border: '1px solid #1877f2', borderRadius: '4px',
        minWidth: '80px',
      }}>
        {columnType === 'status' ? (
          <select ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
            style={{ flex: 1, border: '1px solid #dddfe2', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', outline: 'none', backgroundColor: '#fff' }}>
            {['Active', 'Off', 'Payment error', 'Draft', 'Paused'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : columnType === 'boolean' ? (
          <input ref={inputRef} type="checkbox" checked={!!value} onChange={(e) => setValue(e.target.checked)} onKeyDown={handleKeyDown}
            style={{ width: '16px', height: '16px' }} />
        ) : columnType === 'date' ? (
          <input ref={inputRef} type="date" value={value || ''} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
            style={{ flex: 1, border: '1px solid #dddfe2', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', outline: 'none' }} />
        ) : (
          <input ref={inputRef}
            type={isNumeric ? 'number' : 'text'}
            value={value ?? ''} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: '1px solid #dddfe2', borderRadius: '4px', padding: '2px 4px',
              fontSize: '12px', outline: 'none', textAlign: isNumeric ? 'right' : 'left', backgroundColor: '#fff',
            }} />
        )}
        <button onClick={handleSave} style={{ padding: '2px', color: '#42b72a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <Check size={14} />
        </button>
        <button onClick={handleCancel} style={{ padding: '2px', color: '#fa3e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px',
        fontSize: '12px', color: '#1c1e21', cursor: 'pointer', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: '4px',
        justifyContent: isNumeric ? 'flex-end' : 'space-between',
        flexDirection: isNumeric ? 'row-reverse' : 'row',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f2f3f5'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Edit2 size={11} style={{ opacity: 0, flexShrink: 0, color: '#8a8d91', transition: 'opacity 0.15s' }}
        className="group-hover-show" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {renderFormattedValue(initialValue, columnType)}
      </span>
    </div>
  );
};

const renderFormattedValue = (value, type) => {
  if (value === undefined || value === null) return '—';

  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
        : value;
    case 'percentage':
      return `${parseFloat(value).toFixed(2)}%`;
    case 'number':
      return typeof value === 'number' ? new Intl.NumberFormat('en-IN').format(value) : value;
    case 'date':
      if (!value) return '—';
      return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    case 'datetime':
      if (!value) return '—';
      return new Date(value).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'status': {
      let dotColor = '#65676b';
      if (value === 'Active') dotColor = '#42b72a';
      else if (value === 'Off') dotColor = '#65676b';
      else if (value === 'Paused') dotColor = '#f5a623';
      else if (value === 'Payment error') dotColor = '#fa3e3e';
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} />
          <span style={{ fontWeight: 500, color: '#1c1e21' }}>{value}</span>
        </span>
      );
    }
    case 'image':
      return value ? (
        <img src={value} alt="" style={{ height: '28px', width: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e4e6eb' }} />
      ) : (
        <div style={{ height: '28px', width: '40px', backgroundColor: '#f0f2f5', borderRadius: '4px', border: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#8a8d91', fontWeight: 700 }}>N/A</div>
      );
    case 'link':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer"
          style={{ color: '#1877f2', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', display: 'inline-block' }}
          onClick={(e) => e.stopPropagation()}>
          {value}
        </a>
      );
    default:
      return String(value);
  }
};

export default InlineEditableCell;
export { renderFormattedValue };
