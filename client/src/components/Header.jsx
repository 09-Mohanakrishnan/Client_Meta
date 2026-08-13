import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const [accountLabel, setAccountLabel] = useState('Sri Durga Bhavan (23656...');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const accountInputRef = useRef(null);

  useEffect(() => {
    if (isEditingAccount && accountInputRef.current) {
      accountInputRef.current.focus();
      accountInputRef.current.select();
    }
  }, [isEditingAccount]);

  const handleAccountSave = () => {
    setIsEditingAccount(false);
  };

  const handleAccountCancel = () => {
    setAccountLabel('Sri Durga Bhavan (23656...');
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
            }}>S</div>
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
            }}>S</div>
            <span>{accountLabel}</span>
            <ChevronDown size={14} color="#65676b" />
          </div>
        )}

        {/* Opportunity Score */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
          borderRadius: '6px', border: '1px solid #dddfe2', background: '#fff',
          cursor: 'pointer', fontSize: '13px', color: '#1c1e21',
        }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#42b72a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '9px', fontWeight: 800,
          }}>100</div>
          <span>Opportunity score</span>
          <ChevronDown size={14} color="#65676b" />
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#65676b' }}>
          <CheckCircle2 size={14} color="#42b72a" />
          <span>Updated just now</span>
        </div>
        <button style={{
          padding: '6px', border: '1px solid #dddfe2', borderRadius: '6px',
          background: '#fff', cursor: 'pointer', display: 'flex',
        }}>
          <RefreshCw size={14} color="#65676b" />
        </button>
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
        <div title={`${user?.name} (${user?.role})`} style={{
          height: '32px', width: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
        }}>
          {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'OP'}
        </div>
      </div>
    </header>
  );
};

export default Header;
