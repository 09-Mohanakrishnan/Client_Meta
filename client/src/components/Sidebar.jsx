import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Columns,
  Users,
  ClipboardList,
  HelpCircle,
  Bell,
  BarChart2,
  Search,
  Settings,
  Bug,
} from 'lucide-react';

const iconBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: '8px',
  color: '#65676b', background: 'none', border: 'none', cursor: 'pointer',
};

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();

  const menuItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Ads Manager', path: '/campaigns', icon: FolderKanban, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Column Configurations', path: '/columns', icon: Columns, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Console Audit Logs', path: '/audit-logs', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
  ];

  const filteredItems = menuItems.filter((item) => hasRole(item.roles));

  return (
    <aside style={{
      width: '44px', minWidth: '44px', maxWidth: '44px',
      backgroundColor: '#ffffff', borderRight: '1px solid #dddfe2',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      height: '100vh', zIndex: 30, flexShrink: 0, userSelect: 'none',
    }}>
      {/* Meta Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '44px', borderBottom: '1px solid #e4e6eb' }}>
        <img src="/meta-logo.svg" alt="Meta" style={{ width: '24px', height: '24px' }} />
      </div>

      {/* Nav Icons */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '6px', gap: '2px' }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '8px',
                color: isActive ? '#1877f2' : '#65676b',
                backgroundColor: isActive ? '#e7f3ff' : 'transparent',
                transition: 'all 0.15s', cursor: 'pointer', position: 'relative',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: '-4px', top: '6px', bottom: '6px',
                      width: '3px', backgroundColor: '#1877f2', borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </>
              )}
            </NavLink>
          );
        })}
        <div style={{ width: '24px', borderTop: '1px solid #e4e6eb', margin: '4px 0' }} />
        <button title="Notifications" style={iconBtnStyle}><Bell size={18} strokeWidth={1.8} /></button>
        <button title="Ads Reporting" style={iconBtnStyle}><BarChart2 size={18} strokeWidth={1.8} /></button>
        <button title="Search" style={iconBtnStyle}><Search size={18} strokeWidth={1.8} /></button>
      </div>

      {/* Bottom */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: '2px', borderTop: '1px solid #e4e6eb' }}>
        <button title="Help" style={iconBtnStyle}><HelpCircle size={17} strokeWidth={1.8} /></button>
        <button title="Settings" style={iconBtnStyle}><Settings size={17} strokeWidth={1.8} /></button>
        <button title="Search" style={iconBtnStyle}><Search size={17} strokeWidth={1.8} /></button>
        <button onClick={logout} title="Debug / Sign Out" style={iconBtnStyle}>
          <Bug size={17} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
