import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CallIcon from '@mui/icons-material/Call';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const initialLeadForm = {
  customerName: '',
  contactPerson: '',
  phone: '',
  email: '',
  requirement: '',
  quantity: 1,
  expectedValue: '',
  priority: 'High',
  leadSource: 'Direct Inquiry',
  leadType: 'New Customer',
  segment: 'Research & Labs',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  assignedTo: 'Sales Executive',
  expectedDate: '',
  remarks: ''
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  
  const [showModifyFollowUpModal, setShowModifyFollowUpModal] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  const [modifyFollowUpData, setModifyFollowUpData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    nextFollowUpDate: '',
    responseStatus: 'INTERESTED',
    contactedBy: ''
  });

  const [activeLead, setActiveLead] = useState(null);
  const [formData, setFormData] = useState({ ...initialLeadForm });
  const [editFormData, setEditFormData] = useState({ ...initialLeadForm });

  const [qualifyData, setQualifyData] = useState({
    isQualified: true,
    qualificationNotes: ''
  });

  const [qualifyCustomerData, setQualifyCustomerData] = useState({
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    segment: 'Research & Labs'
  });

  const [followUpData, setFollowUpData] = useState({
    date: new Date().toISOString().split('T')[0],
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
      setFormData({ ...initialLeadForm });
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleOpenEdit = (lead) => {
    setActiveLead(lead);
    setEditFormData({
      customerName: lead.customerName || '',
      contactPerson: lead.contactPerson || '',
      phone: lead.phone || '',
      email: lead.email || '',
      requirement: lead.requirement || '',
      quantity: lead.quantity || 1,
      expectedValue: lead.expectedValue || '',
      priority: lead.priority || 'High',
      leadSource: lead.leadSource || 'Direct Inquiry',
      leadType: lead.leadType || 'New Customer',
      segment: lead.segment || 'Research & Labs',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      pincode: lead.pincode || '',
      gstin: lead.gstin || '',
      assignedTo: lead.assignedTo || 'Sales Executive',
      expectedDate: lead.expectedDate ? lead.expectedDate.split('T')[0] : '',
      remarks: lead.remarks || '',
      status: lead.status || 'NEW'
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leads/${activeLead._id}`, editFormData);
      setShowEditModal(false);
      setActiveLead(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating lead');
    }
  };

  const handleOpenQualify = (lead) => {
    setActiveLead(lead);
    setQualifyData({
      isQualified: true,
      qualificationNotes: lead.remarks || ''
    });
    setQualifyCustomerData({
      customerName: lead.customerName || '',
      contactPerson: lead.contactPerson || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || 'Chennai',
      state: lead.state || 'Tamil Nadu',
      pincode: lead.pincode || '600001',
      gstin: lead.gstin || '',
      segment: lead.segment || 'Research & Labs'
    });
    setShowQualifyModal(true);
  };

  const handleQualify = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/leads/${activeLead._id}/qualify`, {
        ...qualifyData,
        customerData: qualifyCustomerData
      });
      alert(res.data.message || 'Lead qualified and customer master created successfully!');
      setShowQualifyModal(false);
      setActiveLead(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error qualifying lead');
    }
  };

  const handleOpenAddFollowUp = (lead) => {
    setActiveLead(lead);
    setFollowUpData({
      date: new Date().toISOString().split('T')[0],
      notes: '',
      nextFollowUpDate: '',
      responseStatus: 'INTERESTED'
    });
    setShowFollowUpModal(true);
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/leads/${activeLead._id}/follow-up`, followUpData);
      if (res.data?.message && followUpData.responseStatus === 'REQUESTED_QUOTE') {
        alert(res.data.message);
      }
      setShowFollowUpModal(false);
      setActiveLead(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording follow-up');
    }
  };

  const handleOpenModifyFollowUp = (lead, fu) => {
    setActiveLead(lead);
    setActiveFollowUp(fu);
    setModifyFollowUpData({
      date: fu.date ? new Date(fu.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: fu.notes || '',
      nextFollowUpDate: fu.nextFollowUpDate ? new Date(fu.nextFollowUpDate).toISOString().split('T')[0] : '',
      responseStatus: fu.responseStatus || 'INTERESTED',
      contactedBy: fu.contactedBy || ''
    });
    setShowModifyFollowUpModal(true);
  };

  const handleUpdateFollowUp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/leads/${activeLead._id}/follow-up/${activeFollowUp._id}`, modifyFollowUpData);
      if (res.data?.message && modifyFollowUpData.responseStatus === 'REQUESTED_QUOTE') {
        alert(res.data.message);
      }
      setShowModifyFollowUpModal(false);
      setActiveLead(null);
      setActiveFollowUp(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating follow-up');
    }
  };

  const handleDeleteFollowUp = async (leadId, followUpId) => {
    if (!window.confirm('Are you sure you want to delete this follow-up record?')) return;
    try {
      await api.delete(`/leads/${leadId}/follow-up/${followUpId}`);
      setShowModifyFollowUpModal(false);
      setActiveLead(null);
      setActiveFollowUp(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting follow-up');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Commercial Leads & Enquiries</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            Inquiry capture, lead editing, qualification, and automated Customer Master conversion.
          </p>
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
              <th>Customer / Institution</th>
              <th>Contact Person</th>
              <th>Phone / Email</th>
              <th>Requirement</th>
              <th>Est. Value</th>
              <th>Source / Type</th>
              <th>Priority</th>
              <th>Status / Customer Link</th>
              <th>Actions</th>
              <th>All Follow-ups & Next Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '24px' }}>Loading leads...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No leads found. Capture your first lead above.</td></tr>
            ) : (
              leads.map(lead => {
                const customerCode = lead.customerId?.customerCode || lead.convertedCustomerCode;
                return (
                  <tr key={lead._id}>
                    <td style={{ fontWeight: 600, color: '#0F2C59' }}>{lead.leadNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.customerName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{lead.segment || 'Scientific'}</div>
                    </td>
                    <td>{lead.contactPerson}</td>
                    <td>
                      <div>{lead.phone}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{lead.email}</div>
                    </td>
                    <td>
                      <div>{lead.requirement}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>Qty: <strong>{lead.quantity}</strong></div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{Number(lead.expectedValue || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      <div>{lead.leadSource || 'Direct'}</div>
                      <span className="status-badge neutral" style={{ fontSize: '10px' }}>{lead.leadType || 'New'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${lead.priority === 'High' || lead.priority === 'Urgent' ? 'danger' : 'info'}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`status-badge ${lead.status === 'QUALIFIED' ? 'success' : lead.status === 'LOST' ? 'danger' : 'info'}`}>
                          {lead.status}
                        </span>
                        {customerCode && (
                          <Link 
                            to="/sales/customers" 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '3px', 
                              fontSize: '10.5px', 
                              color: '#0284C7', 
                              textDecoration: 'none', 
                              fontWeight: 600 
                            }}
                            title="View in Customer Master"
                          >
                            <BusinessIcon fontSize="inherit" /> {customerCode}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {/* Qualify Button */}
                        {lead.status !== 'QUALIFIED' && lead.status !== 'LOST' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => handleOpenQualify(lead)}
                            title="Qualify & Store in Customer Master"
                          >
                            <PersonAddIcon fontSize="inherit" /> Qualify
                          </button>
                        )}

                        {/* Edit Button */}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleOpenEdit(lead)}
                          title="Edit Lead Details"
                        >
                          <EditIcon fontSize="inherit" /> Edit
                        </button>

                        {/* Follow-up Button */}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleOpenAddFollowUp(lead)}
                          title="Record Follow-up Call or Meeting"
                        >
                          <CallIcon fontSize="inherit" /> Follow-up
                        </button>
                      </div>
                    </td>
                    <td>
                      {lead.followUps && lead.followUps.length > 0 ? (
                        <div style={{ maxWidth: '320px', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '185px', overflowY: 'auto', paddingRight: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Follow-up Timeline ({lead.followUps.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAddFollowUp(lead)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0284C7',
                                cursor: 'pointer',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: 0
                              }}
                              title="Add another follow-up"
                            >
                              + Add
                            </button>
                          </div>
                          {[...lead.followUps].reverse().map((fu, idx) => {
                            const statusColor = 
                              fu.responseStatus === 'REQUESTED_QUOTE' ? 'success' :
                              fu.responseStatus === 'INTERESTED' ? 'info' :
                              fu.responseStatus === 'NOT_INTERESTED' ? 'danger' : 'warning';
                            return (
                              <div 
                                key={fu._id || idx} 
                                style={{ 
                                  background: '#F8FAFC', 
                                  border: '1px solid #E2E8F0', 
                                  borderRadius: '6px', 
                                  padding: '6px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F2C59' }}>
                                      {new Date(fu.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className={`status-badge ${statusColor}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                                      {fu.responseStatus?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenModifyFollowUp(lead, fu)}
                                    style={{
                                      background: '#F1F5F9',
                                      border: '1px solid #CBD5E1',
                                      color: '#0F2C59',
                                      cursor: 'pointer',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                    title="Modify this follow-up message & dates"
                                  >
                                    <EditIcon style={{ fontSize: '11px', color: '#0284C7' }} /> Modify
                                  </button>
                                </div>
                                
                                <div 
                                  style={{ 
                                    fontSize: '11.5px', 
                                    color: '#1E293B', 
                                    lineHeight: 1.35,
                                    wordBreak: 'break-word',
                                    background: '#FFFFFF',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #F1F5F9'
                                  }}
                                >
                                  💬 "{fu.notes}"
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748B', marginTop: '1px' }}>
                                  {fu.nextFollowUpDate ? (
                                    <span style={{ color: '#0369A1', fontWeight: 600, background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px' }}>
                                      Next Follow-up: {new Date(fu.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                  ) : (
                                    <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>No next follow-up date</span>
                                  )}
                                  {fu.contactedBy && (
                                    <span style={{ color: '#64748B' }}>By: {fu.contactedBy}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ maxWidth: '200px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '4px' }}>
                            {lead.remarks ? `"${lead.remarks}"` : 'No follow-up yet'}
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm" 
                            style={{ fontSize: '10px', padding: '2px 7px' }}
                            onClick={() => handleOpenAddFollowUp(lead)}
                          >
                            <CallIcon style={{ fontSize: '11px', marginRight: '3px' }} /> Record Follow-up
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Capture Lead Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }}>
            <div className="modal-header">
              <h3>Capture New Lead</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                
                {/* Section 1: Customer & Contact */}
                <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  1. Customer & Contact Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer / Institution Name *</label>
                    <input className="form-control" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="e.g. Apex Biotech Research Institute" />
                  </div>
                  <div className="form-group">
                    <label>Industry Segment</label>
                    <select className="form-control" value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })}>
                      <option value="Research & Labs">Research & Labs</option>
                      <option value="Hospital & Healthcare">Hospital & Healthcare</option>
                      <option value="Pharma & Biotech">Pharma & Biotech</option>
                      <option value="Industrial & Manufacturing">Industrial & Manufacturing</option>
                      <option value="Blood Bank">Blood Bank</option>
                      <option value="Educational">Educational</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input className="form-control" required value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Dr. S. Ramanathan" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input className="form-control" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98401 23456" />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input className="form-control" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ramanathan@apexbiotech.in" />
                  </div>
                </div>

                {/* Section 2: Address & Location Details (For direct Customer Master storage) */}
                <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '13px', margin: '14px 0 8px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  2. Facility Address & Tax Information (For Customer Master)
                </div>

                <div className="form-group">
                  <label>Facility / Street Address</label>
                  <input className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Plot 42, Biotech Park, Guindy" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Chennai" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="Tamil Nadu" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input className="form-control" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="600032" />
                  </div>
                  <div className="form-group">
                    <label>GSTIN (Optional)</label>
                    <input className="form-control" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="33AAAAA0000A1Z5" />
                  </div>
                </div>

                {/* Section 3: Equipment & Commercials */}
                <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '13px', margin: '14px 0 8px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  3. Equipment Requirement & Commercial Estimate
                </div>

                <div className="form-group">
                  <label>Equipment Requirement *</label>
                  <input className="form-control" required value={formData.requirement} onChange={e => setFormData({ ...formData, requirement: e.target.value })} placeholder="e.g. Ultra Low Temperature Freezer (-80°C) 500L" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Estimated Value (₹)</label>
                    <input className="form-control" type="number" value={formData.expectedValue} onChange={e => setFormData({ ...formData, expectedValue: e.target.value })} placeholder="450000" />
                  </div>
                  <div className="form-group">
                    <label>Target Delivery Date</label>
                    <input className="form-control" type="date" value={formData.expectedDate} onChange={e => setFormData({ ...formData, expectedDate: e.target.value })} />
                  </div>
                </div>

                {/* Section 4: Source & Assignment */}
                <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '13px', margin: '14px 0 8px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  4. Lead Source & Ownership
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Lead Source</label>
                    <select className="form-control" value={formData.leadSource} onChange={e => setFormData({ ...formData, leadSource: e.target.value })}>
                      <option value="Direct Inquiry">Direct Inquiry</option>
                      <option value="Website">Website</option>
                      <option value="Exhibition">Exhibition</option>
                      <option value="Tender">Tender</option>
                      <option value="Referral">Referral</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="Email Campaign">Email Campaign</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lead Type</label>
                    <select className="form-control" value={formData.leadType} onChange={e => setFormData({ ...formData, leadType: e.target.value })}>
                      <option value="New Customer">New Customer</option>
                      <option value="Existing Customer">Existing Customer</option>
                    </select>
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
                  <div className="form-group">
                    <label>Assigned To</label>
                    <input className="form-control" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} placeholder="Sales Exec" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Remarks / Technical Notes</label>
                  <textarea className="form-control" rows="2" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Customer requires cascade refrigeration and digital touchscreen..." />
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

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }}>
            <div className="modal-header">
              <h3>Edit Lead — {activeLead?.leadNumber}</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer / Institution Name *</label>
                    <input className="form-control" required value={editFormData.customerName} onChange={e => setEditFormData({ ...editFormData, customerName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Industry Segment</label>
                    <select className="form-control" value={editFormData.segment} onChange={e => setEditFormData({ ...editFormData, segment: e.target.value })}>
                      <option value="Research & Labs">Research & Labs</option>
                      <option value="Hospital & Healthcare">Hospital & Healthcare</option>
                      <option value="Pharma & Biotech">Pharma & Biotech</option>
                      <option value="Industrial & Manufacturing">Industrial & Manufacturing</option>
                      <option value="Blood Bank">Blood Bank</option>
                      <option value="Educational">Educational</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input className="form-control" required value={editFormData.contactPerson} onChange={e => setEditFormData({ ...editFormData, contactPerson: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input className="form-control" required value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input className="form-control" type="email" required value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Facility Address</label>
                  <input className="form-control" value={editFormData.address} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" value={editFormData.city} onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" value={editFormData.state} onChange={e => setEditFormData({ ...editFormData, state: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input className="form-control" value={editFormData.pincode} onChange={e => setEditFormData({ ...editFormData, pincode: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input className="form-control" value={editFormData.gstin} onChange={e => setEditFormData({ ...editFormData, gstin: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Equipment Requirement *</label>
                  <input className="form-control" required value={editFormData.requirement} onChange={e => setEditFormData({ ...editFormData, requirement: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={editFormData.quantity} onChange={e => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Estimated Value (₹)</label>
                    <input className="form-control" type="number" value={editFormData.expectedValue} onChange={e => setEditFormData({ ...editFormData, expectedValue: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Target Delivery Date</label>
                    <input className="form-control" type="date" value={editFormData.expectedDate} onChange={e => setEditFormData({ ...editFormData, expectedDate: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Lead Status</label>
                    <select className="form-control" value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}>
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="NOT_QUALIFIED">NOT_QUALIFIED</option>
                      <option value="LOST">LOST</option>
                      <option value="QUOTATION_CREATED">QUOTATION_CREATED</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={editFormData.priority} onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lead Source</label>
                    <select className="form-control" value={editFormData.leadSource} onChange={e => setEditFormData({ ...editFormData, leadSource: e.target.value })}>
                      <option value="Direct Inquiry">Direct Inquiry</option>
                      <option value="Website">Website</option>
                      <option value="Exhibition">Exhibition</option>
                      <option value="Tender">Tender</option>
                      <option value="Referral">Referral</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="Email Campaign">Email Campaign</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lead Type</label>
                    <select className="form-control" value={editFormData.leadType} onChange={e => setEditFormData({ ...editFormData, leadType: e.target.value })}>
                      <option value="New Customer">New Customer</option>
                      <option value="Existing Customer">Existing Customer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assigned To</label>
                    <input className="form-control" value={editFormData.assignedTo} onChange={e => setEditFormData({ ...editFormData, assignedTo: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea className="form-control" rows="2" value={editFormData.remarks} onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })} />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Qualify Modal with Automated Customer Master Storage */}
      {showQualifyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div className="modal-header">
              <h3>Qualify Lead — {activeLead?.leadNumber}</h3>
              <button className="close-btn" onClick={() => setShowQualifyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleQualify}>
              <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  color: '#1E40AF'
                }}>
                  <strong>✨ Automated Customer Master Integration:</strong> Qualifying this lead will automatically register and store the account in the <strong>Customer Master</strong> with a verified customer code.
                </div>

                <div className="form-group">
                  <label>Qualification Decision *</label>
                  <select className="form-control" value={qualifyData.isQualified ? 'yes' : 'no'} onChange={e => setQualifyData({ ...qualifyData, isQualified: e.target.value === 'yes' })}>
                    <option value="yes">QUALIFIED (Directly Store in Customer Master & Open Quotation Gate)</option>
                    <option value="no">NOT QUALIFIED (Mark as Lost Opportunity)</option>
                  </select>
                </div>

                {qualifyData.isQualified && (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '14px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '13px', marginBottom: '8px' }}>
                      Verify Customer Details to be Stored
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Company / Organization Name *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.customerName} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, customerName: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Industry Segment</label>
                        <select 
                          className="form-control" 
                          value={qualifyCustomerData.segment} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, segment: e.target.value })}
                        >
                          <option value="Research & Labs">Research & Labs</option>
                          <option value="Hospital & Healthcare">Hospital & Healthcare</option>
                          <option value="Pharma & Biotech">Pharma & Biotech</option>
                          <option value="Industrial & Manufacturing">Industrial & Manufacturing</option>
                          <option value="Blood Bank">Blood Bank</option>
                          <option value="Educational">Educational</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Contact Person *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.contactPerson} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, contactPerson: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.phone} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, phone: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input 
                          className="form-control" 
                          type="email" 
                          required 
                          value={qualifyCustomerData.email} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, email: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Site Address *</label>
                      <input 
                        className="form-control" 
                        required 
                        value={qualifyCustomerData.address} 
                        onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, address: e.target.value })} 
                        placeholder="Street / Facility Address"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>City *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.city} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, city: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>State *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.state} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, state: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Pincode *</label>
                        <input 
                          className="form-control" 
                          required 
                          value={qualifyCustomerData.pincode} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, pincode: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>GSTIN</label>
                        <input 
                          className="form-control" 
                          value={qualifyCustomerData.gstin} 
                          onChange={e => setQualifyCustomerData({ ...qualifyCustomerData, gstin: e.target.value })} 
                        />
                      </div>
                    </div>

                  </div>
                )}

                <div className="form-group">
                  <label>Assessment Remarks</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    value={qualifyData.qualificationNotes} 
                    onChange={e => setQualifyData({ ...qualifyData, qualificationNotes: e.target.value })} 
                    placeholder="Confirmed budget, temperature range requirement, and procurement timeline..." 
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQualifyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {qualifyData.isQualified ? '✓ Qualify & Store in Customer Master' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h3>Record Follow-up — {activeLead?.customerName}</h3>
              <button className="close-btn" onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFollowUp}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Follow-up Date *</label>
                    <input 
                      className="form-control" 
                      type="date" 
                      required 
                      value={followUpData.date} 
                      onChange={e => setFollowUpData({ ...followUpData, date: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Response Status *</label>
                    <select className="form-control" value={followUpData.responseStatus} onChange={e => setFollowUpData({ ...followUpData, responseStatus: e.target.value })}>
                      <option value="INTERESTED">Interested (Active Discussion)</option>
                      <option value="REQUESTED_QUOTE">Requested Official Quotation</option>
                      <option value="NO_RESPONSE">No Response (Schedule Next Follow-up)</option>
                      <option value="NOT_INTERESTED">Not Interested (Mark Opportunity Lost)</option>
                    </select>
                  </div>
                </div>

                {followUpData.responseStatus === 'REQUESTED_QUOTE' && (
                  <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    color: '#1E40AF'
                  }}>
                    <strong>✨ Automated Customer Master Conversion:</strong> Selecting <em>Requested Official Quotation</em> will automatically qualify this lead and register the customer record in the <strong>Customer Master</strong> with an official Customer Code (CUST-xxxx).
                  </div>
                )}

                <div className="form-group">
                  <label>Discussion Remarks *</label>
                  <textarea className="form-control" required rows="3" value={followUpData.notes} onChange={e => setFollowUpData({ ...followUpData, notes: e.target.value })} placeholder="Customer discussed temperature pull-down and asked for technical catalog..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Next Follow-up Date</label>
                    <input className="form-control" type="date" value={followUpData.nextFollowUpDate} onChange={e => setFollowUpData({ ...followUpData, nextFollowUpDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Contacted By / Sales Rep</label>
                    <input className="form-control" value={followUpData.contactedBy || ''} onChange={e => setFollowUpData({ ...followUpData, contactedBy: e.target.value })} placeholder="Sales Representative" />
                  </div>
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

      {/* Modify Follow-up Modal */}
      {showModifyFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h3>Modify Follow-up — {activeLead?.customerName} ({activeLead?.leadNumber})</h3>
              <button className="close-btn" onClick={() => setShowModifyFollowUpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateFollowUp}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Follow-up Date *</label>
                    <input 
                      className="form-control" 
                      type="date" 
                      required 
                      value={modifyFollowUpData.date} 
                      onChange={e => setModifyFollowUpData({ ...modifyFollowUpData, date: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Response Status *</label>
                    <select 
                      className="form-control" 
                      value={modifyFollowUpData.responseStatus} 
                      onChange={e => setModifyFollowUpData({ ...modifyFollowUpData, responseStatus: e.target.value })}
                    >
                      <option value="INTERESTED">Interested (Active Discussion)</option>
                      <option value="REQUESTED_QUOTE">Requested Official Quotation</option>
                      <option value="NO_RESPONSE">No Response (Schedule Next Follow-up)</option>
                      <option value="NOT_INTERESTED">Not Interested (Mark Opportunity Lost)</option>
                    </select>
                  </div>
                </div>

                {modifyFollowUpData.responseStatus === 'REQUESTED_QUOTE' && (
                  <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    color: '#1E40AF'
                  }}>
                    <strong>✨ Automated Customer Master Conversion:</strong> Selecting <em>Requested Official Quotation</em> will automatically qualify this lead and ensure the customer record is registered in the <strong>Customer Master</strong> with an official Customer Code (CUST-xxxx).
                  </div>
                )}

                <div className="form-group">
                  <label>Discussion Message / Remarks *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    required 
                    value={modifyFollowUpData.notes} 
                    onChange={e => setModifyFollowUpData({ ...modifyFollowUpData, notes: e.target.value })} 
                    placeholder="Updated notes regarding customer conversation..." 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Next Follow-up Date</label>
                    <input 
                      className="form-control" 
                      type="date" 
                      value={modifyFollowUpData.nextFollowUpDate} 
                      onChange={e => setModifyFollowUpData({ ...modifyFollowUpData, nextFollowUpDate: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Contacted By / Sales Rep</label>
                    <input 
                      className="form-control" 
                      value={modifyFollowUpData.contactedBy || ''} 
                      onChange={e => setModifyFollowUpData({ ...modifyFollowUpData, contactedBy: e.target.value })} 
                      placeholder="Sales Representative Name" 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
                  onClick={() => handleDeleteFollowUp(activeLead?._id, activeFollowUp?._id)}
                >
                  Delete Follow-up
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModifyFollowUpModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Follow-up</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
