import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, CheckCircle2, MoreHorizontal, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { toast } from 'sonner';
import vinothAvatar from '../assets/vinoth_avatar.jpg';

const Header = () => {
  const { user } = useAuth();
  const [accountLabel, setAccountLabel] = useState('Sri Durga Bhavan (23656...');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const accountInputRef = useRef(null);

  useEffect(() => {
    const fetchAccountName = async () => {
      try {
        const res = await API.get('/settings/accountName');
        if (res.data.success && res.data.value) {
          setAccountLabel(res.data.value);
        }
      } catch (error) {
        console.warn('Failed to fetch account name setting, using default', error);
      }
    };
    fetchAccountName();
  }, []);

  useEffect(() => {
    if (isEditingAccount && accountInputRef.current) {
      accountInputRef.current.focus();
      accountInputRef.current.select();
    }
  }, [isEditingAccount]);

  const handleAccountSave = async () => {
    setIsEditingAccount(false);
    try {
      await API.put('/settings/accountName', { value: accountLabel });
      toast.success('Account name updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save account name');
      // Fetch setting again to reset
      try {
        const res = await API.get('/settings/accountName');
        if (res.data.success && res.data.value) {
          setAccountLabel(res.data.value);
        } else {
          setAccountLabel('Sri Durga Bhavan (23656...');
        }
      } catch (e) {
        setAccountLabel('Sri Durga Bhavan (23656...');
      }
    }
  };

  const handleAccountCancel = () => {
    setIsEditingAccount(false);
  };

  const canEditAccount = user?.role === 'SUPER_ADMIN';

  return (
    <header style={{
      height: '48px', minHeight: '48px', backgroundColor: '#ffffff',
      borderBottom: '1px solid #dddfe2', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px', zIndex: 20, flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Meta Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', borderRight: '1px solid #dddfe2' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1c1e21' }}>Campaigns</span>
        </div>

        {/* Account Selector */}
        {isEditingAccount ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px',
            borderRadius: '6px', border: '1px solid #1877f2', background: '#fff',
            fontSize: '13px', fontWeight: 600, color: '#1c1e21',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#9bdc77',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2e6d2b', fontSize: '12px', fontWeight: 800, flexShrink: 0,
            }}>P</div>
            <input
              ref={accountInputRef}
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              onBlur={handleAccountSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAccountSave();
                if (e.key === 'Escape') handleAccountCancel();
              }}
              style={{
                border: 'none', padding: '2px 4px',
                fontSize: '13px', minWidth: '180px', outline: 'none', color: '#1c1e21',
                backgroundColor: '#fff', fontWeight: 600,
              }}
            />
          </div>
        ) : (
          <div
            onClick={() => { if (canEditAccount) setIsEditingAccount(true); }}
            title={canEditAccount ? "Click to edit account label" : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
              borderRadius: '6px', border: '1px solid #dddfe2', background: '#fff',
              cursor: canEditAccount ? 'pointer' : 'default', fontSize: '13px', fontWeight: 600, color: '#1c1e21',
              userSelect: 'none',
            }}
            onMouseEnter={e => { if (canEditAccount) e.currentTarget.style.backgroundColor = '#f2f3f5'; }}
            onMouseLeave={e => { if (canEditAccount) e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#9bdc77',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2e6d2b', fontSize: '12px', fontWeight: 800,
            }}>P</div>
            <span>{accountLabel}</span>
            <ChevronDown size={14} color="#65676b" />
          </div>
        )}

        {/* Opportunity Score Icon Button */}
        <button 
          title="Opportunity score"
          style={{
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px', border: '1px solid #dddfe2', background: '#ffffff',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f2f3f5'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <Gauge size={16} color="#65676b" />
        </button>

        {/* Refresh Icon Button (Moved next to account dropdown selector) */}
        <button style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #dddfe2', borderRadius: '6px',
          background: '#ffffff', cursor: 'pointer', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f2f3f5'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <RefreshCw size={14} color="#65676b" />
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#65676b' }}>
          <CheckCircle2 size={14} color="#42b72a" />
          <span>Updated just now</span>
        </div>
        <button style={{
          padding: '6px 14px', backgroundColor: '#e4e6eb', border: 'none',
          borderRadius: '6px', fontSize: '13px', fontWeight: 600,
          color: '#1c1e21', cursor: 'pointer',
        }}>
          Review and publish
        </button>
        <button style={{
          padding: '6px', border: '1px solid #dddfe2', borderRadius: '6px',
          background: '#fff', cursor: 'pointer', display: 'flex',
        }}>
          <MoreHorizontal size={14} color="#65676b" />
        </button>
        <div style={{ position: 'relative', height: '32px', width: '32px' }}>
          <img 
            src={vinothAvatar} 
            alt={user?.name || "User Avatar"} 
            title={`${user?.name} (${user?.role})`}
            style={{
              height: '32px', width: '32px', borderRadius: '50%',
              objectFit: 'cover', cursor: 'pointer',
              border: '1px solid #dddfe2',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fb = document.getElementById('user-avatar-fallback');
              if (fb) fb.style.display = 'flex';
            }}
          />
          {/* Small Facebook Logo Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#1877f2',
            border: '1.5px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 24 24" fill="#ffffff" width="8px" height="8px">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div 
            id="user-avatar-fallback"
            title={`${user?.name} (${user?.role})`} 
            style={{
              height: '32px', width: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'OP'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
