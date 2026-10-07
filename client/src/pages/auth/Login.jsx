import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../store/authSlice.js';
import AcUnitIcon from '@mui/icons-material/AcUnit';

export default function Login() {
  const [email, setEmail] = useState('admin@cryoscientific.com');
  const [password, setPassword] = useState('password123');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B192C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '36px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: '#0F2C59',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <AcUnitIcon style={{ fontSize: '26px' }} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', letterSpacing: '0.3px' }}>
            CRYO SCIENTIFIC SYSTEMS
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            Manufacturing Enterprise Resource Planning Suite
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Corporate Email ID *</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@cryoscientific.com"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              className="form-control"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '14px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Operations'}
          </button>
        </form>

        {/* Quick Role Switcher for Evaluators */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
            Quick Demo Role Access:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('admin@cryoscientific.com')}>Super Admin</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('sales@cryoscientific.com')}>Sales</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('prod.mgr@cryoscientific.com')}>Production</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('store@cryoscientific.com')}>Stores</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('qa@cryoscientific.com')}>QA</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('finance@cryoscientific.com')}>Finance</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDemo('engineer@cryoscientific.com')}>Service Eng.</button>
          </div>
        </div>
      </div>
    </div>
  );
}
