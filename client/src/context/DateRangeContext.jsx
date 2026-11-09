import React, { createContext, useContext, useState } from 'react';

const DateRangeContext = createContext(null);

export const DateRangeProvider = ({ children }) => {
  // Restore from localStorage or default to Last 7 days
  const [dateRange, setDateRangeState] = useState(() => {
    try {
      const saved = localStorage.getItem('meta_date_range');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      startDate: '2026-11-03',
      endDate: '2026-11-09',
      label: 'Last 7 days',
    };
  });

  const setDateRange = (newRange) => {
    setDateRangeState(newRange);
    try {
      localStorage.setItem('meta_date_range', JSON.stringify(newRange));
    } catch {}
  };

  const selectRange = (label, customStart = '', customEnd = '') => {
    if (label === 'Last 7 days' || label === 'Last 7') {
      setDateRange({ startDate: '2026-11-03', endDate: '2026-11-09', label: 'Last 7 days' });
    } else if (label === 'Last 14 days' || label === 'Last 14') {
      setDateRange({ startDate: '2026-10-27', endDate: '2026-11-09', label: 'Last 14 days' });
    } else if (label === 'Last 28 days' || label === 'Last 28') {
      setDateRange({ startDate: '2026-10-13', endDate: '2026-11-09', label: 'Last 28 days' });
    } else if (label === 'Last 30 days' || label === 'Last 30') {
      setDateRange({ startDate: '2026-10-11', endDate: '2026-11-09', label: 'Last 30 days' });
    } else if (label === 'Oct 1 - Oct 31' || label === 'October') {
      setDateRange({ startDate: '2026-10-01', endDate: '2026-10-31', label: 'Oct 1 - Oct 31' });
    } else if (label === 'Nov 1 - Nov 10' || label === 'November') {
      setDateRange({ startDate: '2026-11-01', endDate: '2026-11-10', label: 'Nov 1 - Nov 10' });
    } else if (label === 'Today') {
      setDateRange({ startDate: '2026-11-10', endDate: '2026-11-10', label: 'Today' });
    } else if (label === 'Yesterday') {
      setDateRange({ startDate: '2026-11-09', endDate: '2026-11-09', label: 'Yesterday' });
    } else if (label === 'Last 90 days' || label === '90 days') {
      setDateRange({ startDate: '2026-08-13', endDate: '2026-11-10', label: 'Last 90 days' });
    } else if (label === 'Maximum' || label === 'All time') {
      setDateRange({ startDate: '', endDate: '', label: 'Maximum' });
    } else if (label === 'Custom range' && customStart && customEnd) {
      setDateRange({ startDate: customStart, endDate: customEnd, label: 'Custom range' });
    }
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, selectRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};
