import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, switchRoleDemo } from '../../store/authSlice.js';
import api from '../../api/client.js';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';

const ROLES_LIST = [
  'SUPER_ADMIN',
  'SALES',
  'SALES_MANAGER',
  'PRODUCTION_MANAGER',
  'PRODUCTION',
  'STORE',
  'PROCUREMENT',
  'QA',
  'FINANCE',
  'DISPATCH',
  'SERVICE_MANAGER',
  'SERVICE_ENGINEER'
];

export default function Navbar() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/audit/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRoleChange = (e) => {
    dispatch(switchRoleDemo(e.target.value));
  };

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Search / Brand Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: '4px',
          padding: '4px 10px',
          width: '280px'
        }}>
          <SearchIcon style={{ fontSize: '18px', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Global search orders, serials, tickets..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              color: '#0F172A'
            }}
          />
        </div>
      </div>

      {/* Right Tools & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Interactive RBAC Switcher for testing all module access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
          <SecurityIcon style={{ fontSize: '16px', color: '#0F2C59' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>ACTIVE ROLE:</span>
          <select 
            value={user?.role || 'SUPER_ADMIN'} 
            onChange={handleRoleChange}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0F2C59',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {ROLES_LIST.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              color: '#475569'
            }}
          >
            <NotificationsNoneIcon style={{ fontSize: '20px' }} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#DC2626',
                color: '#FFF',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '32px',
              width: '320px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 200,
              padding: '12px'
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '8px' }}>
                System Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '12px 0' }}>No notifications</div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n._id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{n.title}</div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#0F2C59',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>{user?.name}</span>
            <span style={{ fontSize: '10px', color: '#64748B' }}>{user?.department || 'Operations'}</span>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LogoutIcon style={{ fontSize: '18px' }} />
        </button>
      </div>
    </header>
  );
}
