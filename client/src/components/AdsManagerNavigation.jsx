import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Folder, Layers, Tv, Search, Settings2, MousePointerClick, PlayCircle, Inbox } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

const AdsManagerNavigation = ({ activeLevel, searchInput, setSearchInput, statusFilter, setStatusFilter }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaignId = searchParams.get('campaignId');
  const adSetId = searchParams.get('adSetId');

  const buildPath = (targetLevel) => {
    const params = new URLSearchParams();
    if (campaignId) params.set('campaignId', campaignId);
    if (adSetId) params.set('adSetId', adSetId);
    return `/${targetLevel}?${params.toString()}`;
  };

  const handleTabClick = (targetLevel) => {
    navigate(buildPath(targetLevel));
  };

  const filterTabs = [
    { label: 'All ads', value: 'All', icon: Folder },
    { label: 'Actions', value: 'Actions', icon: MousePointerClick },
    { label: 'Active ads', value: 'Active', icon: PlayCircle },
    { label: 'Had delivery', value: 'Had delivery', icon: Inbox },
  ];

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff', borderBottom: '1px solid #dddfe2', flexShrink: 0, userSelect: 'none' }}>
      {/* Row 1: Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.value)}
                className={`meta-filter-pill ${isActive ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: isActive ? '1px solid #1877f2' : '1px solid #dddfe2',
                  backgroundColor: isActive ? '#e7f3ff' : '#ffffff',
                  color: isActive ? '#1877f2' : '#1c1e21',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f2f3f5';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <Icon size={13} style={{ color: isActive ? '#1877f2' : '#65676b' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button style={{
            padding: '5px 12px', fontSize: '13px', fontWeight: 600,
            color: '#1c1e21', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            + See more
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button style={{
            padding: '5px 14px', fontSize: '13px', fontWeight: 600,
            backgroundColor: '#42b72a', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer',
          }}>
            Create a view
          </button>
          <button style={{
            padding: '5px 8px', border: '1px solid #dddfe2', borderRadius: '6px',
            background: '#fff', cursor: 'pointer', display: 'flex',
          }}>
            <Settings2 size={14} color="#65676b" />
          </button>
        </div>
      </div>

      {/* Row 2: Search */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8a8d91' }}>
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search to filter by: name, ID or metrics"
            style={{
              width: '100%', paddingLeft: '36px', paddingRight: '16px',
              paddingTop: '7px', paddingBottom: '7px',
              border: '1px solid #dddfe2', borderRadius: '6px',
              backgroundColor: '#f0f2f5', fontSize: '13px', color: '#1c1e21',
              outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#1877f2'; e.target.style.backgroundColor = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#dddfe2'; e.target.style.backgroundColor = '#f0f2f5'; }}
          />
        </div>
      </div>

      {/* Row 3: Folder Tabs + Date Range */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 16px', borderTop: '1px solid #e4e6eb' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
          <button
            onClick={() => handleTabClick('campaigns')}
            className={`meta-folder-tab ${activeLevel === 'campaigns' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Folder size={14} />
              Campaigns
            </span>
          </button>
          <button
            onClick={() => handleTabClick('adsets')}
            className={`meta-folder-tab ${activeLevel === 'adsets' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} />
              Ad sets
            </span>
          </button>
          <button
            onClick={() => handleTabClick('ads')}
            className={`meta-folder-tab ${activeLevel === 'ads' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tv size={14} />
              Ads
            </span>
          </button>
        </div>
        <div style={{ paddingBottom: '6px' }}>
          <DateRangePicker />
        </div>
      </div>
    </div>
  );
};

export default AdsManagerNavigation;
