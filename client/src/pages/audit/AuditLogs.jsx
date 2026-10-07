import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = search ? `/audit/logs?action=${search}` : '/audit/logs';
      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Enterprise Audit Trail & Security Logs</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Immutable compliance record of every quotation approval, pricing modification, and manufacturing release.</p>
        </div>

        <input
          type="text"
          className="form-control"
          style={{ width: '260px' }}
          placeholder="Filter by action (e.g. PRICE, QA)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID / Ref</th>
              <th>User</th>
              <th>Role</th>
              <th>Audit Narrative</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading audit logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No audit records matched.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log._id}>
                  <td style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td><span className="status-badge info">{log.action}</span></td>
                  <td style={{ fontWeight: 600 }}>{log.entityType}</td>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{log.entityNumber || log.entityId}</td>
                  <td>{log.performedBy}</td>
                  <td><span className="status-badge neutral">{log.userRole}</span></td>
                  <td style={{ maxWidth: '420px', fontSize: '12.5px' }}>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
