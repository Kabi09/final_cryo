import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function Production() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [planningResult, setPlanningResult] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production-orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (orderId, stageName, newStatus) => {
    try {
      await api.put(`/production-orders/${orderId}/stage`, {
        stageName,
        status: newStatus
      });
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        const updated = await api.get(`/production-orders/${orderId}`);
        setSelectedOrder(updated.data.order);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stage');
    }
  };

  const handlePlanMaterials = async (orderId) => {
    try {
      const res = await api.post(`/production-orders/${orderId}/plan-materials`);
      setPlanningResult(res.data);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Material planning failed');
    }
  };

  const handleIssueMaterials = async (requestId) => {
    try {
      await api.post('/production-orders/issue-materials', { requestId });
      alert('Materials successfully issued from store to production line!');
      setPlanningResult(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Material issue failed');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const res = await api.put(`/production-orders/${orderId}/complete`);
      alert(res.data.message);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Completion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Manufacturing & Production Orders</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>5-Stage cryogenic fabrication tracking, material planning, store issues, and QA dispatch gates.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Prod #</th>
              <th>SO Ref</th>
              <th>Product Model</th>
              <th>Qty</th>
              <th>Priority</th>
              <th>Work Center</th>
              <th>Material Status</th>
              <th>Mfg Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading production floor orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No production orders scheduled yet. Release an order from the Sales Order dashboard.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{order.productionNumber}</td>
                  <td style={{ fontWeight: 600 }}>{order.soNumber}</td>
                  <td>{order.productName} ({order.model})</td>
                  <td style={{ fontWeight: 700 }}>{order.quantity}</td>
                  <td><span className="status-badge danger">{order.priority}</span></td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>{order.workCenter}</td>
                  <td>
                    {order.materialShortage ? (
                      <span className="status-badge danger">
                        <WarningAmberIcon fontSize="inherit" /> SHORTAGE
                      </span>
                    ) : (
                      <span className="status-badge success">READY / ISSUED</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${order.status === 'COMPLETED' ? 'success' : order.status === 'IN_PROGRESS' ? 'info' : 'warning'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(order)} title="Stage Operations">
                        <PrecisionManufacturingIcon fontSize="inherit" /> Stages
                      </button>

                      <button className="btn btn-secondary btn-sm" onClick={() => handlePlanMaterials(order._id)} title="BOM Stock Check">
                        <FactCheckIcon fontSize="inherit" /> Check Stock
                      </button>

                      {order.status !== 'COMPLETED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleCompleteOrder(order._id)} title="Complete & Trigger QA">
                          <CheckCircleIcon fontSize="inherit" /> Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Production Stages Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>Production Stages Control — {selectedOrder.productionNumber}</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '12.5px' }}>
                <div><strong>Product:</strong> {selectedOrder.productName} ({selectedOrder.model}) • <strong>Assigned Team:</strong> {selectedOrder.assignedTeam}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedOrder.stages?.map((stage, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: stage.status === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F2C59' }}>
                        {idx + 1}. {stage.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {stage.remarks || 'Standard protocol verification'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`status-badge ${stage.status === 'COMPLETED' ? 'success' : stage.status === 'IN_PROGRESS' ? 'info' : 'warning'}`}>
                        {stage.status}
                      </span>

                      {stage.status !== 'COMPLETED' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleUpdateStage(selectedOrder._id, stage.name, 'IN_PROGRESS')}
                            disabled={stage.status === 'IN_PROGRESS'}
                          >
                            Start
                          </button>
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => handleUpdateStage(selectedOrder._id, stage.name, 'COMPLETED')}
                          >
                            Pass
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
              {selectedOrder.status !== 'COMPLETED' && (
                <button type="button" className="btn btn-primary" onClick={() => handleCompleteOrder(selectedOrder._id)}>
                  Mark All Completed & Trigger QA
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Material Planning & Stock Check Result Modal */}
      {planningResult && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3>BOM Material Planning & Stock Check</h3>
              <button className="close-btn" onClick={() => setPlanningResult(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: planningResult.shortagePresent ? '#FEF2F2' : '#ECFDF5',
                border: `1px solid ${planningResult.shortagePresent ? '#FECACA' : '#A7F3D0'}`,
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '14px',
                fontSize: '13px'
              }}>
                <strong>Stock Availability Assessment: </strong>
                {planningResult.shortagePresent ? (
                  <span style={{ color: '#DC2626' }}>Shortage detected. Procurement PR automatically generated.</span>
                ) : (
                  <span style={{ color: '#059669' }}>All materials are in stock and ready to issue.</span>
                )}
              </div>

              <div className="table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Description</th>
                      <th>Req Qty</th>
                      <th>Avail Stock</th>
                      <th>Shortage</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planningResult.materialRequest?.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.itemCode}</td>
                        <td>{item.itemName}</td>
                        <td style={{ fontWeight: 700 }}>{item.requiredQty}</td>
                        <td>{item.availableQty}</td>
                        <td style={{ fontWeight: 700, color: item.shortageQty > 0 ? '#DC2626' : '#059669' }}>
                          {item.shortageQty}
                        </td>
                        <td>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPlanningResult(null)}>Close</button>
              {!planningResult.shortagePresent && (
                <button type="button" className="btn btn-primary" onClick={() => handleIssueMaterials(planningResult.materialRequest?._id)}>
                  Issue Materials to Assembly Line
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
