import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';

export default function ProformaInvoices() {
  const [proformas, setProformas] = useState([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [advancePercent, setAdvancePercent] = useState(30);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [piRes, qRes] = await Promise.all([
        api.get('/proforma-invoices'),
        api.get('/quotations?status=ACCEPTED')
      ]);
      setProformas(piRes.data);
      setAcceptedQuotes(qRes.data);
      if (qRes.data.length > 0) {
        setSelectedQuoteId(qRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePI = async (e) => {
    e.preventDefault();
    try {
      await api.post('/proforma-invoices', {
        quotationId: selectedQuoteId,
        advancePercent
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating Proforma Invoice');
    }
  };

  const downloadPDF = (id) => {
    window.open(`/api/proforma-invoices/${id}/pdf`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Proforma Invoices (PI)</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Issued against accepted quotations for advance payment and Customer PO issuance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Issue Proforma Invoice
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>PI #</th>
              <th>Quotation Ref</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Advance Required (30%)</th>
              <th>Balance Amount</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading proformas...</td></tr>
            ) : proformas.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No proforma invoices generated yet.</td></tr>
            ) : (
              proformas.map(pi => (
                <tr key={pi._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{pi.piNumber}</td>
                  <td style={{ fontWeight: 600 }}>{pi.quotationNumber}</td>
                  <td>{pi.customer?.name}</td>
                  <td>{new Date(pi.piDate).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>₹{pi.advanceAmount.toLocaleString('en-IN')}</td>
                  <td>₹{pi.balanceAmount.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>₹{pi.grandTotal.toLocaleString('en-IN')}</td>
                  <td><span className="status-badge success">{pi.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(pi._id)}>
                      <PictureAsPdfIcon fontSize="inherit" /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Issue Proforma Invoice</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePI}>
              <div className="modal-body">
                {acceptedQuotes.length === 0 ? (
                  <p style={{ color: '#D97706', fontSize: '13px' }}>
                    No newly accepted quotations awaiting PI generation. First accept a quotation via the sales desk or customer portal.
                  </p>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Select Accepted Quotation *</label>
                      <select className="form-control" value={selectedQuoteId} onChange={e => setSelectedQuoteId(e.target.value)}>
                        {acceptedQuotes.map(q => (
                          <option key={q._id} value={q._id}>
                            {q.quotationNumber} ({q.revisionNumber}) - {q.customerSnapshot?.name} (₹{q.grandTotal.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Advance Payment Percent (%)</label>
                      <input className="form-control" type="number" value={advancePercent} onChange={e => setAdvancePercent(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                {acceptedQuotes.length > 0 && (
                  <button type="submit" className="btn btn-primary">Generate PI Document</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
