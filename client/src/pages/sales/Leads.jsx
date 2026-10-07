import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CallIcon from '@mui/icons-material/Call';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    requirement: '',
    quantity: 1,
    expectedValue: '',
    priority: 'High'
  });

  const [qualifyData, setQualifyData] = useState({
    isQualified: true,
    qualificationNotes: ''
  });

  const [followUpData, setFollowUpData] = useState({
    notes: '',
    nextFollowUpDate: '',
    responseStatus: 'INTERESTED'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', formData);
      setShowCreateModal(false);
      setFormData({ customerName: '', contactPerson: '', phone: '', email: '', requirement: '', quantity: 1, expectedValue: '', priority: 'High' });
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleQualify = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leads/${activeLead._id}/qualify`, qualifyData);
      setShowQualifyModal(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error qualifying lead');
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leads/${activeLead._id}/follow-up`, followUpData);
      setShowFollowUpModal(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording follow-up');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Commercial Leads & Enquiries</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Inquiry capture, qualification stages, and follow-up loops.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Capture Lead
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Lead #</th>
              <th>Customer</th>
              <th>Contact Person</th>
              <th>Phone / Email</th>
              <th>Requirement</th>
              <th>Est. Value</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading leads...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No leads found. Capture your first lead above.</td></tr>
            ) : (
              leads.map(lead => (
                <tr key={lead._id}>
                  <td style={{ fontWeight: 600, color: '#0F2C59' }}>{lead.leadNumber}</td>
                  <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                  <td>{lead.contactPerson}</td>
                  <td>
                    <div>{lead.phone}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{lead.email}</div>
                  </td>
                  <td>{lead.requirement} (Qty: {lead.quantity})</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(lead.expectedValue || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-badge ${lead.priority === 'High' || lead.priority === 'Urgent' ? 'danger' : 'info'}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${lead.status === 'QUALIFIED' ? 'success' : lead.status === 'LOST' ? 'danger' : 'info'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {lead.status === 'NEW' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveLead(lead); setShowQualifyModal(true); }}>
                          <CheckCircleIcon fontSize="inherit" /> Qualify
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => { setActiveLead(lead); setShowFollowUpModal(true); }}>
                        <CallIcon fontSize="inherit" /> Follow-up
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Capture Lead Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Capture New Lead</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer / Institution Name *</label>
                  <input className="form-control" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="e.g. ABC Research Labs" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input className="form-control" required value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Dr. Kumar" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input className="form-control" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98401 23456" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input className="form-control" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="lab@example.com" />
                </div>
                <div className="form-group">
                  <label>Equipment Requirement *</label>
                  <input className="form-control" required value={formData.requirement} onChange={e => setFormData({ ...formData, requirement: e.target.value })} placeholder="e.g. Ultra Low Temperature Freezer (-80°C)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Estimated Value (₹)</label>
                    <input className="form-control" type="number" value={formData.expectedValue} onChange={e => setFormData({ ...formData, expectedValue: e.target.value })} placeholder="250000" />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Qualify Modal */}
      {showQualifyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Qualify Lead — {activeLead?.leadNumber}</h3>
              <button className="close-btn" onClick={() => setShowQualifyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleQualify}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Evaluate customer requirement, genuine intent, budget, and decision maker timeline.
                </p>
                <div className="form-group">
                  <label>Qualification Decision *</label>
                  <select className="form-control" value={qualifyData.isQualified ? 'yes' : 'no'} onChange={e => setQualifyData({ ...qualifyData, isQualified: e.target.value === 'yes' })}>
                    <option value="yes">QUALIFIED (Move to Customer Selection & Quotation)</option>
                    <option value="no">NOT QUALIFIED (Mark as Lost Opportunity)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assessment Notes</label>
                  <textarea className="form-control" value={qualifyData.qualificationNotes} onChange={e => setQualifyData({ ...qualifyData, qualificationNotes: e.target.value })} placeholder="Confirmed budget, specifications, and delivery expectation..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQualifyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Follow-up Call / Visit — {activeLead?.customerName}</h3>
              <button className="close-btn" onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFollowUp}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Response Status *</label>
                  <select className="form-control" value={followUpData.responseStatus} onChange={e => setFollowUpData({ ...followUpData, responseStatus: e.target.value })}>
                    <option value="INTERESTED">Interested (Active Discussion)</option>
                    <option value="REQUESTED_QUOTE">Requested Official Quotation</option>
                    <option value="NO_RESPONSE">No Response (Schedule Next Follow-up)</option>
                    <option value="NOT_INTERESTED">Not Interested (Mark Opportunity Lost)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discussion Remarks *</label>
                  <textarea className="form-control" required value={followUpData.notes} onChange={e => setFollowUpData({ ...followUpData, notes: e.target.value })} placeholder="Customer discussed temperature pull-down and asked for technical catalog..." />
                </div>
                <div className="form-group">
                  <label>Next Follow-up Date</label>
                  <input className="form-control" type="date" value={followUpData.nextFollowUpDate} onChange={e => setFollowUpData({ ...followUpData, nextFollowUpDate: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
