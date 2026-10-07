import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [formData, setFormData] = useState({
    salesOrderId: '',
    paymentType: 'ADVANCE',
    amount: '',
    paymentMode: 'NEFT',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, soRes] = await Promise.all([
        api.get('/payments'),
        api.get('/sales-orders')
      ]);
      setPayments(payRes.data);
      setOrders(soRes.data);
      if (soRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          salesOrderId: soRes.data[0]._id,
          amount: soRes.data[0].advanceRequired || 84960
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      setShowRecordModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Finance & Payment Verifications</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Audit commercial bank remittances and unlock manufacturing release gates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
          <AddIcon fontSize="small" /> Record Payment Remittance
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>SO #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Bank UTR / Ref</th>
              <th>Date</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No payment receipts recorded yet.</td></tr>
            ) : (
              payments.map(pay => (
                <tr key={pay._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{pay.paymentNumber}</td>
                  <td style={{ fontWeight: 600 }}>{pay.soNumber}</td>
                  <td>{pay.customer?.name}</td>
                  <td><span className="status-badge info">{pay.paymentType}</span></td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>₹{pay.amount.toLocaleString('en-IN')}</td>
                  <td>{pay.paymentMode}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{pay.referenceNumber}</td>
                  <td>{new Date(pay.paymentDate).toLocaleDateString()}</td>
                  <td>
                    <span className="status-badge success">
                      <VerifiedIcon fontSize="inherit" /> {pay.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRecordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Customer Bank Remittance</h3>
              <button className="close-btn" onClick={() => setShowRecordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecord}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Sales Order *</label>
                  <select className="form-control" value={formData.salesOrderId} onChange={e => {
                    const order = orders.find(o => o._id === e.target.value);
                    setFormData({
                      ...formData,
                      salesOrderId: e.target.value,
                      amount: order ? (order.balanceDue || order.advanceRequired) : formData.amount
                    });
                  }}>
                    {orders.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.soNumber} - {o.customer?.name} (Total: ₹{o.grandTotal.toLocaleString('en-IN')} | Adv Req: ₹{o.advanceRequired.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Payment Milestone Type *</label>
                    <select className="form-control" value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })}>
                      <option value="ADVANCE">Advance (30% Release Gate)</option>
                      <option value="MILESTONE">Interim Milestone</option>
                      <option value="FINAL_BALANCE">Final Balance Pre-Dispatch</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Remittance Amount (₹) *</label>
                    <input className="form-control" type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Payment Mode *</label>
                    <select className="form-control" value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}>
                      <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                      <option value="CHEQUE">Demand Draft / Cheque</option>
                      <option value="UPI">UPI Corporate Gateway</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bank UTR / Transaction Reference *</label>
                    <input className="form-control" required value={formData.referenceNumber} onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })} placeholder="e.g. AXISB20261007..." />
                  </div>
                </div>
                <div className="form-group">
                  <label>Accounting Remarks</label>
                  <textarea className="form-control" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Verified against bank statement credit..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Verify & Record Credit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
