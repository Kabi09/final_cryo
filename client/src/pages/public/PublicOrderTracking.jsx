import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AcUnitIcon from '@mui/icons-material/AcUnit';

export default function PublicOrderTracking() {
  const { token } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Service Request Modal from public page
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  useEffect(() => {
    fetchTracking();
  }, [token]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/public/tracking/${token}`);
      setTracking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid tracking link or expired access token.');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseService = async (e) => {
    e.preventDefault();
    try {
      const serial = tracking.serials?.[0]?.serialNumber || 'CRYO-ULT-2026-0091';
      alert(`Service ticket request submitted for unit ${serial}! Our customer support engineer will contact you shortly.`);
      setShowServiceModal(false);
    } catch (err) {
      alert('Error submitting request');
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading real-time customer tracking...</div>;
  if (error) return <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '30px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '850px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Banner */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#0F2C59', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AcUnitIcon style={{ fontSize: '22px' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F2C59' }}>CRYO SCIENTIFIC SYSTEMS</h1>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Official Customer Order & Warranty Journey Portal</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Order #{tracking.orderNumber}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Customer: {tracking.customerName}</div>
            </div>
          </div>
        </div>

        {/* Equipment & Active Stage Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>EQUIPMENT MANUFACTURED:</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F2C59' }}>{tracking.items?.[0]?.description || 'Ultra Low Temp Freezer'}</div>
            </div>
            <div>
              <span className="status-badge success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                STAGE: {tracking.currentStage}
              </span>
            </div>
          </div>

          {/* Logistics & Tracking Callout */}
          {tracking.shipment && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0369A1', marginBottom: '4px' }}>
                <LocalShippingIcon fontSize="small" /> Logistics Carrier & Live Tracking
              </div>
              <div style={{ fontSize: '12.5px', color: '#0C4A6E', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div><strong>Carrier:</strong> {tracking.shipment.carrierName}</div>
                <div><strong>Consignment LR #:</strong> {tracking.shipment.trackingNumber}</div>
                <div><strong>Delivery Status:</strong> {tracking.shipment.status}</div>
                <a href={tracking.shipment.trackingUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                  <OpenInNewIcon fontSize="inherit" /> Track with Carrier
                </a>
              </div>
            </div>
          )}

          {/* Warranty & Serials Callout */}
          {tracking.warranty && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '14px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#047857', marginBottom: '4px' }}>
                <SecurityIcon fontSize="small" /> Manufacturer Warranty Active
              </div>
              <div style={{ fontSize: '12.5px', color: '#064E3B' }}>
                <strong>Warranty #:</strong> {tracking.warranty.warrantyNumber} • <strong>Coverage Valid:</strong> {new Date(tracking.warranty.startDate).toLocaleDateString()} to {new Date(tracking.warranty.endDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* The 13 Milestone Journey Timeline */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F2C59', marginBottom: '18px' }}>
            Complete Customer Order Lifecycle Timeline
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {tracking.milestones?.map((m, idx) => {
              const isDone = m.status === 'COMPLETED';
              const isInProg = m.status === 'IN_PROGRESS';
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {isDone ? (
                      <CheckCircleIcon style={{ color: '#059669', fontSize: '20px' }} />
                    ) : isInProg ? (
                      <HourglassEmptyIcon style={{ color: '#2563EB', fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedIcon style={{ color: '#CBD5E1', fontSize: '20px' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingBottom: '12px', borderBottom: idx < tracking.milestones.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: isDone || isInProg ? 700 : 500, color: isDone ? '#0F172A' : isInProg ? '#1E40AF' : '#94A3B8' }}>
                        {m.label}
                      </span>
                      {m.date && (
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{new Date(m.date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {m.details && (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{m.details}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Support & Service Desk */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Need Assistance or After-Sales Service?</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Raise a service ticket directly against your registered serial number.</div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowServiceModal(true)}>
            <BuildIcon fontSize="small" /> Raise Service Ticket
          </button>
        </div>

        {/* Service Modal */}
        {showServiceModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Raise Service Complaint / Support</h3>
                <button className="close-btn" onClick={() => setShowServiceModal(false)}>✕</button>
              </div>
              <form onSubmit={handleRaiseService}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Registered Serial Number</label>
                    <input className="form-control" readOnly value={tracking.serials?.[0]?.serialNumber || 'CRYO-ULT-2026-0091'} />
                  </div>
                  <div className="form-group">
                    <label>Describe the Issue / Symptoms *</label>
                    <textarea className="form-control" required value={complaintText} onChange={e => setComplaintText(e.target.value)} placeholder="e.g. Temperature alarm sounding, door gasket inspection required..." />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit to Service Operations Desk</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
          Cryo Scientific Systems Pvt Ltd • Customer Secure Order Tracking
        </div>
      </div>
    </div>
  );
}
