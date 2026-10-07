import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Dispatch() {
  const [shipments, setShipments] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeShipment, setActiveShipment] = useState(null);

  const [selectedOrderId, setSelectedOrderId] = useState('');

  const [shipmentData, setShipmentData] = useState({
    carrierName: 'VRL Logistics Heavy Cargo',
    bookingNumber: 'VRL-CHE-2026-88',
    trackingNumber: 'VRL889900',
    trackingUrl: 'https://www.vrllogistics.com/track?lr=VRL889900',
    expectedDeliveryDate: ''
  });

  const [statusData, setStatusData] = useState({
    status: 'DELIVERED',
    podReceiverName: 'Lab In-Charge',
    remarks: 'Delivered in good condition'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, oRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/sales-orders')
      ]);
      setShipments(sRes.data);
      const ready = oRes.data.filter(o => o.qaStatus === 'PASSED');
      setReadyOrders(ready);
      if (ready.length > 0) {
        setSelectedOrderId(ready[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/dispatch/invoice', { salesOrderId: selectedOrderId });
      alert(`Tax Invoice ${res.data.invoiceNumber} generated!`);
      setShowInvoiceModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Invoice generation failed');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dispatch/shipment', {
        ...shipmentData,
        salesOrderId: selectedOrderId
      });
      setShowShipmentModal(false);
      alert('Shipment successfully booked & dispatched!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Shipment booking failed');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/dispatch/shipments/${activeShipment._id}`, statusData);
      setShowStatusModal(false);
      alert('Shipment status & Proof of Delivery (POD) updated!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Dispatch, Invoicing & Logistics</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Tax invoice generation, dedicated carrier bookings, and proof of delivery (POD).</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowInvoiceModal(true)}>
            <ReceiptIcon fontSize="small" /> Generate Tax Invoice
          </button>
          <button className="btn btn-primary" onClick={() => setShowShipmentModal(true)}>
            <LocalShippingIcon fontSize="small" /> Book Consignment
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Shipment #</th>
              <th>SO #</th>
              <th>Customer</th>
              <th>Carrier Name</th>
              <th>Tracking Number</th>
              <th>Dispatch Date</th>
              <th>POD Verified</th>
              <th>Shipment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading shipments...</td></tr>
            ) : shipments.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No shipments booked yet.</td></tr>
            ) : (
              shipments.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{s.shipmentNumber}</td>
                  <td style={{ fontWeight: 600 }}>{s.soNumber}</td>
                  <td>{s.customer?.name}</td>
                  <td>{s.carrierName}</td>
                  <td>
                    <a href={s.trackingUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {s.trackingNumber} <OpenInNewIcon style={{ fontSize: '12px' }} />
                    </a>
                  </td>
                  <td>{new Date(s.dispatchDate).toLocaleDateString()}</td>
                  <td>
                    {s.podReceived ? (
                      <span className="status-badge success">
                        <CheckCircleIcon fontSize="inherit" /> DELIVERED ({s.podReceiverName})
                      </span>
                    ) : (
                      <span className="status-badge warning">In Transit</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${s.status === 'DELIVERED' ? 'success' : 'info'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setActiveShipment(s); setShowStatusModal(true); }}>
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Tax Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Generate Final Tax Invoice</h3>
              <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateInvoice}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select QA-Passed Sales Order *</label>
                  <select className="form-control" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                    {readyOrders.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.soNumber} - {o.customer?.name} (₹{o.grandTotal.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B' }}>
                  Generates statutory GST Tax Invoice with HSN code, serial number allocation, and tax computation.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Shipment Modal */}
      {showShipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Consignment & Transmit Tracking</h3>
              <button className="close-btn" onClick={() => setShowShipmentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateShipment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Sales Order *</label>
                  <select className="form-control" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                    {readyOrders.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.soNumber} - {o.customer?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Carrier / Logistics Company *</label>
                    <input className="form-control" required value={shipmentData.carrierName} onChange={e => setShipmentData({ ...shipmentData, carrierName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Booking / LR Number *</label>
                    <input className="form-control" required value={shipmentData.bookingNumber} onChange={e => setShipmentData({ ...shipmentData, bookingNumber: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Consignment Tracking Number *</label>
                  <input className="form-control" required value={shipmentData.trackingNumber} onChange={e => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Carrier Live Tracking URL *</label>
                  <input className="form-control" required value={shipmentData.trackingUrl} onChange={e => setShipmentData({ ...shipmentData, trackingUrl: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShipmentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status & POD Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delivery Status & POD — {activeShipment?.shipmentNumber}</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Transit Status *</label>
                  <select className="form-control" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
                    <option value="IN_TRANSIT">IN TRANSIT (On Route)</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Local Hub)</option>
                    <option value="DELIVERED">DELIVERED (Proof of Delivery Verified)</option>
                  </select>
                </div>
                {statusData.status === 'DELIVERED' && (
                  <div className="form-group">
                    <label>POD Consignee Receiver Name *</label>
                    <input className="form-control" required value={statusData.podReceiverName} onChange={e => setStatusData({ ...statusData, podReceiverName: e.target.value })} placeholder="Dr. Arun Kumar / Stores Officer" />
                  </div>
                )}
                <div className="form-group">
                  <label>Delivery Remarks</label>
                  <textarea className="form-control" value={statusData.remarks} onChange={e => setStatusData({ ...statusData, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Delivery Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
