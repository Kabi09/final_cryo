import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    gstin: '',
    segment: 'Research & Labs'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setShowCreateModal(false);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', gstin: '', segment: 'Research & Labs' });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const viewCustomer = async (cust) => {
    try {
      setSelectedCustomer(cust);
      const res = await api.get(`/customers/${cust._id}`);
      setCustomerDetails(res.data);
    } catch (err) {
      alert('Failed to load customer details');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Customer Directory</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Master accounts, contact dossiers, and lifecycle histories.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Add Customer
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer Name</th>
              <th>Segment</th>
              <th>Contact Person</th>
              <th>Phone / Email</th>
              <th>Location</th>
              <th>GSTIN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No customers created yet.</td></tr>
            ) : (
              customers.map(cust => (
                <tr key={cust._id}>
                  <td style={{ fontWeight: 600, color: '#0F2C59' }}>{cust.customerCode}</td>
                  <td style={{ fontWeight: 600 }}>{cust.name}</td>
                  <td><span className="status-badge info">{cust.segment}</span></td>
                  <td>{cust.contactPerson}</td>
                  <td>
                    <div>{cust.phone}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{cust.email}</div>
                  </td>
                  <td>{cust.city}, {cust.state}</td>
                  <td style={{ fontSize: '11px', color: '#475569' }}>{cust.gstin || 'Unregistered'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => viewCustomer(cust)}>
                      <VisibilityIcon fontSize="inherit" /> 360° View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer 360 View Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>{selectedCustomer.name} — Account Dossier</h3>
              <button className="close-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '12.5px' }}>
                <div><strong>Code:</strong> {selectedCustomer.customerCode}</div>
                <div><strong>Contact:</strong> {selectedCustomer.contactPerson} ({selectedCustomer.phone})</div>
                <div><strong>Email:</strong> {selectedCustomer.email}</div>
                <div><strong>GSTIN:</strong> {selectedCustomer.gstin || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F2C59', marginBottom: '6px' }}>Confirmed Sales Orders ({customerDetails?.orders?.length || 0})</h4>
                  {customerDetails?.orders?.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748B' }}>No orders confirmed yet.</div>
                  ) : (
                    <div className="table-container">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>SO #</th>
                            <th>Date</th>
                            <th>Value</th>
                            <th>Stage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetails?.orders?.map(o => (
                            <tr key={o._id}>
                              <td style={{ fontWeight: 600 }}>{o.soNumber}</td>
                              <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                              <td>₹{o.grandTotal.toLocaleString('en-IN')}</td>
                              <td><span className="status-badge success">{o.currentStage}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F2C59', marginBottom: '6px' }}>Quotations History ({customerDetails?.quotations?.length || 0})</h4>
                  {customerDetails?.quotations?.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748B' }}>No quotations issued yet.</div>
                  ) : (
                    <div className="table-container">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>Quote #</th>
                            <th>Rev</th>
                            <th>Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetails?.quotations?.map(q => (
                            <tr key={q._id}>
                              <td style={{ fontWeight: 600 }}>{q.quotationNumber}</td>
                              <td>{q.revisionNumber}</td>
                              <td>₹{q.grandTotal.toLocaleString('en-IN')}</td>
                              <td><span className="status-badge info">{q.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Customer Account</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Company / Hospital / Lab Name *</label>
                  <input className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ABC Research Laboratories Pvt Ltd" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input className="form-control" required value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Mr. Arun Kumar" />
                  </div>
                  <div className="form-group">
                    <label>Segment *</label>
                    <select className="form-control" value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })}>
                      <option value="Research & Labs">Research & Labs</option>
                      <option value="Hospital & Healthcare">Hospital & Healthcare</option>
                      <option value="Pharma & Biotech">Pharma & Biotech</option>
                      <option value="Industrial & Manufacturing">Industrial & Manufacturing</option>
                      <option value="Blood Bank">Blood Bank</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input className="form-control" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98401 23456" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input className="form-control" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contact@abcresearch.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Facility Address *</label>
                  <input className="form-control" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Plot 45, Phase II, Guindy Industrial Estate" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>City *</label>
                    <input className="form-control" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Chennai" />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input className="form-control" required value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="Tamil Nadu" />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input className="form-control" required value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="600032" />
                  </div>
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input className="form-control" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="33YYYYYYYYYY1Z8" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
