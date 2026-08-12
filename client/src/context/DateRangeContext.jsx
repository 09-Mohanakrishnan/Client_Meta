import React, { createContext, useContext, useState } from 'react';

const DateRangeContext = createContext(null);

export const DateRangeProvider = ({ children }) => {
  const getPastDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({
    startDate: getPastDate(30), // Default to last 30 days
    endDate: getToday(),
    label: 'Last 30 days',
  });

  const selectRange = (label, customStart = '', customEnd = '') => {
    const today = getToday();
    
    if (label === 'Today') {
      setDateRange({ startDate: today, endDate: today, label });
    } else if (label === 'Yesterday') {
      const yesterday = getPastDate(1);
      setDateRange({ startDate: yesterday, endDate: yesterday, label });
    } else if (label === 'Last 7 days') {
      setDateRange({ startDate: getPastDate(7), endDate: today, label });
    } else if (label === 'Last 30 days') {
      setDateRange({ startDate: getPastDate(30), endDate: today, label });
    } else if (label === 'Last 90 days') {
      setDateRange({ startDate: getPastDate(90), endDate: today, label });
    } else if (label === 'Custom range' && customStart && customEnd) {
      setDateRange({ startDate: customStart, endDate: customEnd, label });
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
