import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AcUnitIcon from '@mui/icons-material/AcUnit';

export default function PublicQuotation() {
  const { token } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [comments, setComments] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [actionDone, setActionDone] = useState(false);

  useEffect(() => {
    fetchQuotation();
  }, [token]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/public/quotation/${token}`);
      setQuotation(res.data);
      if (res.data.customerSnapshot?.contactPerson) {
        setCustomerName(res.data.customerSnapshot.contactPerson);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Quotation not found or link has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Confirm formal acceptance of this commercial proposal?')) return;
    try {
      await axios.post(`/api/public/quotation/${token}/accept`, { comments, customerName });
      alert('Thank you! Quotation accepted. Cryo Scientific Systems will issue your Proforma Invoice.');
      setActionDone(true);
      fetchQuotation();
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting quotation');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for declining this proposal:');
    if (!reason) return;
    try {
      await axios.post(`/api/public/quotation/${token}/reject`, { reason, customerName });
      alert('Feedback recorded. Thank you.');
      setActionDone(true);
      fetchQuotation();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting quotation');
    }
  };

  const handleRevisionRequest = async () => {
    const changes = prompt('Please describe the required changes (e.g. commercial discount, delivery terms, specs):');
    if (!changes) return;
    try {
      await axios.post(`/api/public/quotation/${token}/revision-request`, { comments: changes, customerName });
      alert('Revision request transmitted to our commercial sales desk.');
      setActionDone(true);
      fetchQuotation();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting revision request');
    }
  };

  const downloadPDF = () => {
    window.open(`/api/public/quotation/${token}/pdf`, '_blank');
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading commercial proposal...</div>;
  if (error) return <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '30px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '850px', width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '36px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F2C59', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#0F2C59', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AcUnitIcon style={{ fontSize: '18px' }} />
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F2C59', letterSpacing: '0.3px' }}>
                CRYO SCIENTIFIC SYSTEMS PVT LTD
              </h1>
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Scientific refrigeration & laboratory systems • ISO 9001:2015</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>No. 22 Industrial Estate, Guindy, Chennai, Tamil Nadu • GSTIN: 33AABCC1234F1Z5</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F2C59' }}>
              {quotation.revisionNumber === 'R00' ? 'COMMERCIAL QUOTATION' : `QUOTATION REVISION (${quotation.revisionNumber})`}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{quotation.quotationNumber}</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Date: {new Date(quotation.quotationDate).toLocaleDateString()}</div>
            <div style={{ marginTop: '4px' }}>
              <span className={`status-badge ${quotation.status === 'ACCEPTED' ? 'success' : quotation.status === 'REVISED' ? 'neutral' : 'info'}`}>
                {quotation.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Proposal Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '6px', marginBottom: '24px', fontSize: '12.5px' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>PROPOSAL ISSUED TO:</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F2C59', marginTop: '2px' }}>{quotation.customerSnapshot?.name}</div>
            <div style={{ color: '#475569', marginTop: '2px' }}>{quotation.customerSnapshot?.address}</div>
            <div style={{ color: '#475569' }}>GSTIN: {quotation.customerSnapshot?.gstin || 'Unregistered'}</div>
            <div style={{ color: '#475569' }}>Attn: {quotation.customerSnapshot?.contactPerson} ({quotation.customerSnapshot?.phone})</div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>COMMERCIAL PROPOSAL DETAILS:</div>
            <div style={{ marginTop: '2px' }}><strong>Validity:</strong> {new Date(quotation.validityDate).toLocaleDateString()}</div>
            <div style={{ marginTop: '2px' }}><strong>Lead-Time:</strong> {quotation.deliveryPeriod}</div>
            <div style={{ marginTop: '2px' }}><strong>Warranty:</strong> {quotation.warrantyTerms}</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: '20px' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description / Specification</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>GST</th>
                <th>Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ fontWeight: 600 }}>{item.description}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                  <td>₹{Number(item.discount).toLocaleString('en-IN')}</td>
                  <td>{item.taxRate}%</td>
                  <td style={{ fontWeight: 700 }}>₹{Number(item.totalAmount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commercial Summary Box */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '28px' }}>
          <div style={{ flex: 1, fontSize: '12px', color: '#475569', background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, color: '#0F2C59', marginBottom: '4px' }}>PAYMENT & WARRANTY TERMS</div>
            <div>• {quotation.paymentTerms}</div>
            <div style={{ marginTop: '4px' }}>• Quotation pricing subject to the terms and specifications stated above.</div>
          </div>

          <div style={{ width: '280px', border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
              <span>Taxable Value:</span>
              <strong>₹{Number(quotation.taxableAmount).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
              <span>Discount:</span>
              <strong>₹{Number(quotation.totalDiscount).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
              <span>GST @ 18%:</span>
              <strong>₹{Number(quotation.taxAmount).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#0F2C59', color: '#FFF', fontSize: '14px', fontWeight: 700 }}>
              <span>GRAND TOTAL:</span>
              <span>₹{Number(quotation.grandTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Customer Interaction Gate */}
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '18px', borderRadius: '6px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0369A1', marginBottom: '6px' }}>
            Customer Review & Digital Approval Gate
          </div>

          {quotation.status === 'ACCEPTED' ? (
            <div style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircleIcon /> Quotation has been accepted. Your order is being processed for Proforma Invoice issuance.
            </div>
          ) : quotation.status === 'REJECTED' ? (
            <div style={{ color: '#DC2626', fontWeight: 600 }}>This commercial proposal was declined.</div>
          ) : (
            <div>
              <p style={{ fontSize: '12.5px', color: '#0C4A6E', marginBottom: '12px' }}>
                Please review the technical specifications, quantities, and commercial milestones. You can accept, reject, or request revisions.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-success" onClick={handleAccept}>
                  <CheckCircleIcon fontSize="small" /> Accept Quotation
                </button>
                <button className="btn btn-secondary" onClick={handleRevisionRequest}>
                  <EditNoteIcon fontSize="small" /> Request Revision
                </button>
                <button className="btn btn-danger" onClick={handleReject}>
                  <CancelIcon fontSize="small" /> Decline Proposal
                </button>
                <button className="btn btn-secondary" onClick={downloadPDF}>
                  <PictureAsPdfIcon fontSize="small" /> Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginTop: '16px' }}>
          Cryo Scientific Systems Pvt Ltd • Official Electronic Commercial Proposal
        </div>
      </div>
    </div>
  );
}
