import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Copy, Edit3, FlaskConical, MoreHorizontal, 
  SlidersHorizontal, ChevronDown, LayoutGrid, Download, BarChart4, Search as SearchIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdsManagerToolbar = ({
  entityType, selectedCount, onCreate, onDuplicate, onDelete,
  onExport, onBulkStatus, onBulkBudget, importComponent
}) => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [showMoreActions, setShowMoreActions] = useState(false);
  const canModify = hasRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
      gap: '8px', backgroundColor: '#ffffff', padding: '6px 16px',
      borderBottom: '1px solid #dddfe2', flexShrink: 0, userSelect: 'none',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* Create */}
        <button onClick={onCreate} disabled={!canModify} className="meta-btn-green" style={{ opacity: canModify ? 1 : 0.5 }}>
          <Plus size={13} strokeWidth={2.5} />
          <span>Create</span>
        </button>

        {/* Duplicate */}
        <button onClick={onDuplicate} disabled={!canModify || selectedCount === 0}
          className="meta-btn" style={{ opacity: (!canModify || selectedCount === 0) ? 0.4 : 1 }}>
          <Copy size={12} />
          <span>Duplicate</span>
        </button>

        {/* Edit */}
        <div style={{ position: 'relative' }}>
          <button disabled={!canModify || selectedCount === 0}
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="meta-btn" style={{ opacity: (!canModify || selectedCount === 0) ? 0.4 : 1 }}>
            <Edit3 size={12} />
            <span>Edit</span>
          </button>
          {showMoreActions && (
            <div style={{
              position: 'absolute', left: 0, top: '100%', marginTop: '4px', zIndex: 50,
              width: '180px', borderRadius: '8px', border: '1px solid #dddfe2',
              backgroundColor: '#fff', padding: '4px 0', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              fontSize: '13px',
            }}>
              <button onClick={() => { onBulkStatus?.('Active'); setShowMoreActions(false); }}
                style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#1c1e21' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#f2f3f5'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                Set Active
              </button>
              <button onClick={() => { onBulkStatus?.('Off'); setShowMoreActions(false); }}
                style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#1c1e21' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#f2f3f5'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                Set Off
              </button>
              <div style={{ borderTop: '1px solid #e4e6eb', margin: '4px 0' }} />
              <button onClick={() => {
                const budget = prompt('Enter new budget (INR):');
                if (budget && !isNaN(budget)) onBulkBudget?.(Number(budget));
                setShowMoreActions(false);
              }}
                style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#1c1e21' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#f2f3f5'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                Edit Budget...
              </button>
            </div>
          )}
        </div>

        {/* Analyse */}
        <button className="meta-btn" disabled={selectedCount === 0} style={{ opacity: selectedCount === 0 ? 0.4 : 1 }}>
          <SearchIcon size={12} />
          <span>Analyse</span>
        </button>

        {/* A/B test */}
        <button className="meta-btn" disabled={selectedCount === 0} style={{ opacity: selectedCount === 0 ? 0.4 : 1 }}>
          <FlaskConical size={12} />
          <span>A/B test</span>
        </button>

        {/* More */}
        <button className="meta-btn">
          <span>More</span>
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Columns */}
        <button onClick={() => navigate('/columns')} className="meta-btn">
          <SlidersHorizontal size={12} />
          <span>Columns: Performance and clicks</span>
          <ChevronDown size={12} />
        </button>

        {/* Breakdown */}
        <button className="meta-btn">
          <LayoutGrid size={12} />
          <span>Breakdown</span>
          <ChevronDown size={12} />
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: '#dddfe2', margin: '0 2px' }} />

        {/* Import */}
        {importComponent}

        {/* Export */}
        <button onClick={onExport} className="meta-btn" title="Export CSV">
          <Download size={12} />
        </button>

        {/* Chart */}
        <button className="meta-btn" style={{ padding: '6px' }}>
          <BarChart4 size={13} />
        </button>
      </div>
    </div>
  );
};

export default AdsManagerToolbar;
