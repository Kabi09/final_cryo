import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales-orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (order) => {
    try {
      setSelectedOrder(order);
      setDetailsLoading(true);
      const res = await api.get(`/sales-orders/${order._id}`);
      setOrderDetails(res.data);
    } catch (err) {
      alert('Failed to load order lifecycle');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReleaseProduction = async (orderId) => {
    try {
      const res = await api.put(`/sales-orders/${orderId}/release-production`);
      alert(res.data.message);
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        viewOrder(selectedOrder);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error releasing to production');
    }
  };

  const downloadPDF = (id) => {
    window.open(`/api/sales-orders/${id}/pdf`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Confirmed Sales Orders (SO)</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Commercial contract execution, advance payment gates, and production releases.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>SO #</th>
              <th>Customer</th>
              <th>Customer PO #</th>
              <th>Order Date</th>
              <th>Total Value</th>
              <th>Payment Gate</th>
              <th>Production Status</th>
              <th>Current Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading Sales Orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No Sales Orders confirmed yet. Verify a Customer PO to generate SO.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{order.soNumber}</td>
                  <td style={{ fontWeight: 600 }}>{order.customer?.name}</td>
                  <td>{order.customerPONumber || 'PO Ref'}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700 }}>₹{order.grandTotal.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-badge ${order.paymentStatus === 'ADVANCE_VERIFIED' || order.paymentStatus === 'FULLY_PAID' ? 'success' : 'warning'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${order.productionStatus === 'COMPLETED' ? 'success' : order.productionStatus === 'RELEASED' ? 'info' : 'warning'}`}>
                      {order.productionStatus}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge info">{order.currentStage}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewOrder(order)} title="360° Order Dossier">
                        <VisibilityIcon fontSize="inherit" /> Dossier
                      </button>

                      {order.productionStatus === 'PENDING_RELEASE' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleReleaseProduction(order._id)} title="Release to Production Floor">
                          <PlayCircleOutlineIcon fontSize="inherit" /> Release
                        </button>
                      )}

                      <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(order._id)}>
                        <PictureAsPdfIcon fontSize="inherit" />
                      </button>

                      <a 
                        href={`/track/${order.publicTrackingToken}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm" 
                        title="Customer Tracking Link"
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

      {/* 360-Degree Lifecycle Dossier Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '880px' }}>
            <div className="modal-header">
              <h3>Sales Order Dossier & Traceability — {selectedOrder.soNumber}</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading full lifecycle traceability...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Summary Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#F8FAFC', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
                    <div><strong>Customer:</strong> {selectedOrder.customer?.name}</div>
                    <div><strong>Contract Value:</strong> ₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</div>
                    <div><strong>Advance Verified:</strong> ₹{(selectedOrder.advancePaid || 0).toLocaleString('en-IN')}</div>
                    <div><strong>Balance Due:</strong> ₹{(selectedOrder.balanceDue || 0).toLocaleString('en-IN')}</div>
                  </div>

                  {/* Payment Gate & Production Release Action */}
                  <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>Manufacturing Release Gate</div>
                      <div style={{ fontSize: '12px', color: '#0C4A6E' }}>
                        Advance threshold (30%): ₹{(selectedOrder.advanceRequired || 0).toLocaleString('en-IN')} • Status: <strong>{selectedOrder.paymentStatus}</strong>
                      </div>
                    </div>
                    {selectedOrder.productionStatus === 'PENDING_RELEASE' ? (
                      <button className="btn btn-primary btn-sm" onClick={() => handleReleaseProduction(selectedOrder._id)}>
                        <PlayCircleOutlineIcon fontSize="inherit" /> Release to Production
                      </button>
                    ) : (
                      <span className="status-badge success">
                        <CheckCircleIcon fontSize="inherit" /> RELEASED TO MFG
                      </span>
                    )}
                  </div>

                  {/* Complete Lifecycle Traceability Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Manufacturing & QA */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '4px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59', marginBottom: '8px' }}>
                        PRODUCTION & QUALITY
                      </div>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Production Order:</strong> {orderDetails?.productionOrder?.productionNumber || 'Pending Release'}</div>
                        <div><strong>Mfg Status:</strong> {orderDetails?.productionOrder?.status || 'N/A'}</div>
                        <div><strong>BOM Version:</strong> {orderDetails?.productionOrder?.bomVersion || 'V1'}</div>
                        <div><strong>QA Inspection:</strong> {orderDetails?.qaInspection?.qaNumber || 'Pending QA'} ({orderDetails?.qaInspection?.overallResult || 'N/A'})</div>
                        <div><strong>Assigned Serial #:</strong> {orderDetails?.serialNumbers?.[0]?.serialNumber || 'Pending Serialization'}</div>
                      </div>
                    </div>

                    {/* Logistics, Installation & Warranty */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '4px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59', marginBottom: '8px' }}>
                        DISPATCH, WARRANTY & SERVICE
                      </div>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Final Tax Invoice:</strong> {orderDetails?.taxInvoice?.invoiceNumber || 'Pending Dispatch'}</div>
                        <div><strong>Logistics Consignment:</strong> {orderDetails?.shipment?.carrierName || 'Unassigned'} ({orderDetails?.shipment?.trackingNumber || 'N/A'})</div>
                        <div><strong>Delivery Verified (POD):</strong> {orderDetails?.shipment?.podReceived ? 'Yes (Signed)' : 'In Transit / Pending'}</div>
                        <div><strong>Commissioning:</strong> {orderDetails?.installation?.status || 'Pending Delivery'}</div>
                        <div><strong>Warranty Active:</strong> {orderDetails?.warranty?.warrantyNumber || 'Pending Commissioning'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Public Link */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px 14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px' }}>
                      <strong>Customer Order Tracking Portal:</strong>
                      <div style={{ color: '#64748B', fontSize: '11px' }}>Give this link to customer for real-time progress & document downloads</div>
                    </div>
                    <a href={`/track/${selectedOrder.publicTrackingToken}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <OpenInNewIcon fontSize="inherit" /> Open Tracking URL
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
