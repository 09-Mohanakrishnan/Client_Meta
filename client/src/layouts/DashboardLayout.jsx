import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Console Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Controls */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto relative min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
