import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer: '',
    items: [
      { product: '', productCode: '', description: '', quantity: 1, unit: 'Units', unitPrice: 250000, discount: 0, taxRate: 18 }
    ],
    validityDays: 14,
    deliveryPeriod: '6–8 weeks from order and advance receipt.',
    paymentTerms: '30% advance on order confirmation. Balance as per agreed delivery/payment milestone.',
    warrantyTerms: '12 Months comprehensive manufacturer warranty.'
  });

  const [sendData, setSendData] = useState({
    sendVia: 'LINK',
    recipientEmail: '',
    recipientPhone: ''
  });

  const [revisionData, setRevisionData] = useState({
    reason: 'Customer requested commercial discount confirmation.',
    discount: 10000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes, pRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/customers'),
        api.get('/products')
      ]);
      setQuotations(qRes.data);
      setCustomers(cRes.data);
      setProducts(pRes.data);
      if (cRes.data.length > 0) {
        setFormData(prev => ({ ...prev, customer: cRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p._id === prodId);
    if (!prod) return;
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      product: prod._id,
      productCode: prod.model,
      description: `${prod.name} Model ${prod.model}`,
      unitPrice: prod.sellingPrice,
      taxRate: prod.taxRate || 18
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quotations', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating quotation');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/quotations/${id}/approve`, { remarks: 'Approved by commercial management.' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval error');
    }
  };

  const openSendModal = (quote) => {
    setActiveQuotation(quote);
    setSendData({
      sendVia: 'LINK',
      recipientEmail: quote.customerSnapshot?.email || '',
      recipientPhone: quote.customerSnapshot?.phone || ''
    });
    setShowSendModal(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/quotations/${activeQuotation._id}/send`, sendData);
      setShowSendModal(false);
      alert(`Quotation sent successfully! Customer Public Portal Link: ${res.data.publicUrl}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending quotation');
    }
  };

  const handleRevision = async (e) => {
    e.preventDefault();
    try {
      // Apply discount to first item as sample revision
      const revisedItems = activeQuotation.items.map(item => ({
        ...item,
        discount: Number(revisionData.discount) || 0
      }));

      await api.post(`/quotations/${activeQuotation._id}/revision`, {
        reason: revisionData.reason,
        items: revisedItems
      });
      setShowRevisionModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating revision');
    }
  };

  const downloadPDF = (id, quoteNumber) => {
    window.open(`/api/quotations/${id}/pdf`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Commercial Quotations & Revisions</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Version control, pricing proposals, approvals, customer portals, and PDF downloads.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Create Quotation
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Rev</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Validity</th>
              <th>Grand Total</th>
              <th>Approval</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading quotations...</td></tr>
            ) : quotations.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No quotations generated yet.</td></tr>
            ) : (
              quotations.map(quote => (
                <tr key={quote._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{quote.quotationNumber}</td>
                  <td><span className="status-badge neutral">{quote.revisionNumber}</span></td>
                  <td style={{ fontWeight: 600 }}>{quote.customerSnapshot?.name}</td>
                  <td>{new Date(quote.quotationDate).toLocaleDateString()}</td>
                  <td>{new Date(quote.validityDate).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700 }}>₹{quote.grandTotal.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-badge ${quote.approval?.status === 'APPROVED' ? 'success' : 'warning'}`}>
                      {quote.approval?.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${quote.status === 'ACCEPTED' ? 'success' : quote.status === 'REVISED' ? 'neutral' : quote.status === 'APPROVED' ? 'info' : 'warning'}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {quote.approval?.status === 'PENDING' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleApprove(quote._id)} title="Manager Approval">
                          <CheckCircleOutlineIcon fontSize="inherit" /> Approve
                        </button>
                      )}

                      {quote.approval?.status === 'APPROVED' && quote.status !== 'ACCEPTED' && quote.status !== 'REVISED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openSendModal(quote)} title="Send to Customer">
                          <SendIcon fontSize="inherit" /> Send
                        </button>
                      )}

                      {quote.status !== 'REVISED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveQuotation(quote); setShowRevisionModal(true); }} title="Create Revision">
                          <HistoryIcon fontSize="inherit" /> Revise
                        </button>
                      )}

                      <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(quote._id, quote.quotationNumber)} title="Download Official PDF">
                        <PictureAsPdfIcon fontSize="inherit" /> PDF
                      </button>

                      <a 
                        href={`/quotation/view/${quote.publicToken}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm" 
                        title="Open Customer Public View Link"
                      >
                        <OpenInNewIcon fontSize="inherit" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Create Commercial Proposal</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Account *</label>
                  <select className="form-control" required value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.customerCode})</option>
                    ))}
                  </select>
                </div>

                <div style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '4px', marginBottom: '14px', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59', marginBottom: '8px' }}>PRODUCT ITEM SELECTION</div>
                  <div className="form-group">
                    <label>Select Product Model *</label>
                    <select className="form-control" onChange={e => handleProductSelect(0, e.target.value)}>
                      <option value="">-- Choose Equipment --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.model}) - Price: ₹{p.sellingPrice.toLocaleString('en-IN')}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input className="form-control" type="number" min="1" value={formData.items[0].quantity} onChange={e => {
                        const items = [...formData.items];
                        items[0].quantity = e.target.value;
                        setFormData({ ...formData, items });
                      }} />
                    </div>
                    <div className="form-group">
                      <label>Unit Price (₹)</label>
                      <input className="form-control" type="number" value={formData.items[0].unitPrice} onChange={e => {
                        const items = [...formData.items];
                        items[0].unitPrice = e.target.value;
                        setFormData({ ...formData, items });
                      }} />
                    </div>
                    <div className="form-group">
                      <label>Discount (₹)</label>
                      <input className="form-control" type="number" value={formData.items[0].discount} onChange={e => {
                        const items = [...formData.items];
                        items[0].discount = e.target.value;
                        setFormData({ ...formData, items });
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Validity (Days)</label>
                    <input className="form-control" type="number" value={formData.validityDays} onChange={e => setFormData({ ...formData, validityDays: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Period</label>
                    <input className="form-control" value={formData.deliveryPeriod} onChange={e => setFormData({ ...formData, deliveryPeriod: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Commercial Payment Terms</label>
                  <input className="form-control" value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Proposal (R00)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Send Quotation — {activeQuotation?.quotationNumber}</h3>
              <button className="close-btn" onClick={() => setShowSendModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSend}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px' }}>
                  <div><strong>Customer:</strong> {activeQuotation?.customerSnapshot?.name}</div>
                  <div><strong>Amount:</strong> ₹{activeQuotation?.grandTotal?.toLocaleString('en-IN')}</div>
                  <div><strong>Version:</strong> {activeQuotation?.revisionNumber}</div>
                </div>

                <div className="form-group">
                  <label>Dispatch Channel *</label>
                  <select className="form-control" value={sendData.sendVia} onChange={e => setSendData({ ...sendData, sendVia: e.target.value })}>
                    <option value="LINK">Generate Customer Portal Secure URL</option>
                    <option value="EMAIL">Send via SMTP Email</option>
                    <option value="WHATSAPP">Send via WhatsApp Business API</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Recipient Email</label>
                  <input className="form-control" value={sendData.recipientEmail} onChange={e => setSendData({ ...sendData, recipientEmail: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Recipient WhatsApp / Phone</label>
                  <input className="form-control" value={sendData.recipientPhone} onChange={e => setSendData({ ...sendData, recipientPhone: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSendModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Transmit Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Quotation Revision from {activeQuotation?.quotationNumber}</h3>
              <button className="close-btn" onClick={() => setShowRevisionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRevision}>
              <div className="modal-body">
                <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '12px' }}>
                  Creates a new commercial version (e.g. R01) linked to the original while preserving previous quotation audit history untouched.
                </p>
                <div className="form-group">
                  <label>Revision Justification / Reason *</label>
                  <textarea className="form-control" required value={revisionData.reason} onChange={e => setRevisionData({ ...revisionData, reason: e.target.value })} placeholder="e.g. Customer requested commercial discount confirmation..." />
                </div>
                <div className="form-group">
                  <label>Updated Commercial Discount (₹)</label>
                  <input className="form-control" type="number" value={revisionData.discount} onChange={e => setRevisionData({ ...revisionData, discount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRevisionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate New Revision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
