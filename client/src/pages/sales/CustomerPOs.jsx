import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { openPdfDocument } from '../../utils/pdfHelper.js';

import AddIcon from '@mui/icons-material/Add';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';

export default function CustomerPOs() {
  const [pos, setPos] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activePO, setActivePO] = useState(null);

  const [formData, setFormData] = useState({
    poNumber: '',
    proformaInvoiceId: '',
    orderValue: '',
    deliveryAddress: '',
    notes: ''
  });

  const [checklist, setChecklist] = useState({
    quantityMatch: true,
    priceMatch: true,
    specMatch: true,
    termsMatch: true,
    taxMatch: true
  });
  const [mismatchRemarks, setMismatchRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, piRes] = await Promise.all([
        api.get('/customer-pos'),
        api.get('/proforma-invoices')
      ]);
      setPos(poRes.data);
      setProformas(piRes.data);
      if (piRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          proformaInvoiceId: piRes.data[0]._id,
          orderValue: piRes.data[0].grandTotal,
          deliveryAddress: piRes.data[0].customer?.address || 'Industrial Estate, Chennai'
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customer-pos', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording Customer PO');
    }
  };

  const openVerifyModal = (po) => {
    setActivePO(po);
    setChecklist(po.verificationChecklist || {
      quantityMatch: true,
      priceMatch: true,
      specMatch: true,
      termsMatch: true,
      taxMatch: true
    });
    setMismatchRemarks(po.mismatchRemarks || '');
    setShowVerifyModal(true);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/customer-pos/${activePO._id}/verify`, {
        checklist,
        mismatchRemarks
      });
      setShowVerifyModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleGenerateSO = async (poId) => {
    try {
      const res = await api.post('/sales-orders/from-po', { customerPoId: poId });
      alert(`Sales Order ${res.data.soNumber} successfully confirmed!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating Sales Order');
    }
  };

  const downloadPDF = (id, poNumber) => {
    openPdfDocument(`/customer-pos/${id}/pdf`, `${poNumber || 'PO'}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Customer Purchase Orders (PO)</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Mandatory parameter verification (Match/Mismatch/Hold) prior to Sales Order confirmation.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Upload / Enter Customer PO
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>PI Ref</th>
              <th>Customer</th>
              <th>Order Value</th>
              <th>Delivery Address</th>
              <th>Verification Status</th>
              <th>SO Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading Customer POs...</td></tr>
            ) : pos.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No Customer POs logged yet.</td></tr>
            ) : (
              pos.map(po => (
                <tr key={po._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{po.poNumber}</td>
                  <td>{po.proformaInvoice?.piNumber || 'PI Ref'}</td>
                  <td style={{ fontWeight: 600 }}>{po.customer?.name}</td>
                  <td style={{ fontWeight: 700 }}>₹{po.orderValue.toLocaleString('en-IN')}</td>
                  <td style={{ maxWidth: '240px', fontSize: '12px', color: '#475569' }}>{po.deliveryAddress}</td>
                  <td>
                    <span className={`status-badge ${po.verificationStatus === 'MATCHED' ? 'success' : po.verificationStatus === 'MISMATCH_HOLD' ? 'danger' : 'warning'}`}>
                      {po.verificationStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${po.salesOrderGenerated ? 'success' : 'neutral'}`}>
                      {po.salesOrderGenerated ? 'SO CONFIRMED' : 'PENDING SO'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openVerifyModal(po)} title="Verify Checklist">
                        <FactCheckIcon fontSize="inherit" /> Verify
                      </button>

                      {po.verificationStatus === 'MATCHED' && !po.salesOrderGenerated && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleGenerateSO(po._id)} title="Convert to Sales Order">
                          <ShoppingCartCheckoutIcon fontSize="inherit" /> Create SO
                        </button>
                      )}

                      <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(po._id)}>
                        <PictureAsPdfIcon fontSize="inherit" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record PO Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Customer Purchase Order</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Proforma Invoice Reference *</label>
                  <select className="form-control" value={formData.proformaInvoiceId} onChange={e => {
                    const pi = proformas.find(p => p._id === e.target.value);
                    setFormData({
                      ...formData,
                      proformaInvoiceId: e.target.value,
                      orderValue: pi?.grandTotal || formData.orderValue,
                      deliveryAddress: pi?.customer?.address || formData.deliveryAddress
                    });
                  }}>
                    {proformas.map(p => (
                      <option key={p._id} value={p._id}>{p.piNumber} - {p.customer?.name} (₹{p.grandTotal.toLocaleString('en-IN')})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer PO Number *</label>
                    <input className="form-control" required value={formData.poNumber} onChange={e => setFormData({ ...formData, poNumber: e.target.value })} placeholder="e.g. PO-2026-0098" />
                  </div>
                  <div className="form-group">
                    <label>PO Order Value (₹) *</label>
                    <input className="form-control" type="number" required value={formData.orderValue} onChange={e => setFormData({ ...formData, orderValue: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <input className="form-control" required value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Checklist Modal */}
      {showVerifyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>PO Verification Audit — {activePO?.poNumber}</h3>
              <button className="close-btn" onClick={() => setShowVerifyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleVerify}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Verify that the buyer-issued Purchase Order matches the quotation and Proforma Invoice parameters completely.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '4px', marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.quantityMatch} onChange={e => setChecklist({ ...checklist, quantityMatch: e.target.checked })} />
                    <span><strong>1. Quantity Match:</strong> Ordered quantity matches accepted commercial proposal.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.priceMatch} onChange={e => setChecklist({ ...checklist, priceMatch: e.target.checked })} />
                    <span><strong>2. Price & Tax Match:</strong> Unit rates and GST tax calculations conform to PI.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.specMatch} onChange={e => setChecklist({ ...checklist, specMatch: e.target.checked })} />
                    <span><strong>3. Specification Match:</strong> Equipment model, dimensions and temperature range align.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.termsMatch} onChange={e => setChecklist({ ...checklist, termsMatch: e.target.checked })} />
                    <span><strong>4. Commercial Terms Match:</strong> Advance payment milestones and lead-time acknowledged.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.taxMatch} onChange={e => setChecklist({ ...checklist, taxMatch: e.target.checked })} />
                    <span><strong>5. Invoicing & Consignee Match:</strong> Billing GSTIN and dispatch destination address accurate.</span>
                  </label>
                </div>

                {(!checklist.quantityMatch || !checklist.priceMatch || !checklist.specMatch || !checklist.termsMatch || !checklist.taxMatch) && (
                  <div className="form-group">
                    <label style={{ color: '#DC2626' }}>Discrepancy Notes (Holds order for correction)</label>
                    <textarea className="form-control" value={mismatchRemarks} onChange={e => setMismatchRemarks(e.target.value)} placeholder="Explain the mismatch reason..." />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Verification Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
