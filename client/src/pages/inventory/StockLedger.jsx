import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

export default function StockLedger() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/ledger');
      setLedger(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Stock Movement Ledger (Audit Log)</h1>
        <p style={{ fontSize: '12px', color: '#64748B' }}>Permanent chronological record of every receipt, issue, transfer, and adjustment.</p>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Transaction Type</th>
              <th>Quantity</th>
              <th>Previous Stock</th>
              <th>New Stock</th>
              <th>Ref Type / Document</th>
              <th>Remarks</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>Loading ledger entries...</td></tr>
            ) : ledger.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No ledger movements recorded yet.</td></tr>
            ) : (
              ledger.map(entry => (
                <tr key={entry._id}>
                  <td style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(entry.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{entry.itemCode}</td>
                  <td style={{ fontWeight: 600 }}>{entry.itemName}</td>
                  <td>
                    <span className={`status-badge ${entry.transactionType === 'STOCK_IN' || entry.transactionType === 'GRN_RECEIPT' ? 'success' : entry.transactionType === 'MATERIAL_ISSUE' ? 'warning' : 'info'}`}>
                      {entry.transactionType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {entry.transactionType === 'MATERIAL_ISSUE' ? `-${entry.quantity}` : `+${entry.quantity}`}
                  </td>
                  <td style={{ color: '#64748B' }}>{entry.previousStock}</td>
                  <td style={{ fontWeight: 700 }}>{entry.newStock}</td>
                  <td>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>{entry.referenceType}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{entry.referenceNumber}</div>
                  </td>
                  <td style={{ maxWidth: '220px', fontSize: '12px' }}>{entry.remarks}</td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>{entry.performedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
