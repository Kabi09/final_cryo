import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function Production() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [planningResult, setPlanningResult] = useState(null);
  const [procuring, setProcuring] = useState(false);
  const [selectedBomId, setSelectedBomId] = useState('');

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
      if (res.data.bom?._id) {
        setSelectedBomId(res.data.bom._id);
      }
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Material planning failed');
    }
  };

  // Switch BOM
  const handleAssignBOM = async (orderId, bomId) => {
    try {
      const res = await api.put(`/production-orders/${orderId}/bom`, { bomId });
      alert(res.data.message);
      await handlePlanMaterials(orderId);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to switch BOM');
    }
  };

  // Advance Procurement Workflow (PR -> PO -> GRN -> Stores In)
  const handleAdvanceProcurement = async (action) => {
    try {
      setProcuring(true);
      const mrId = planningResult.materialRequest?._id;
      const res = await api.put(`/production-orders/material-requests/${mrId}/advance-procurement`, { action });
      alert(res.data.message);
      await handlePlanMaterials(planningResult.order?._id);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Procurement action failed');
    } finally {
      setProcuring(false);
    }
  };

  // Issue Material -> Inventory stock deducted -> Production floor starts
  const handleIssueMaterials = async (requestId) => {
    try {
      const res = await api.post('/production-orders/issue-materials', { requestId });
      alert(res.data.message);
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

  const mr = planningResult?.materialRequest;
  const currentStage = mr?.workflowStage || 'MATERIAL_REQUEST';
  const isStockAvailable = mr?.stockAvailable;
  const isStoresInwarded = mr?.storesInwarded || (!planningResult?.shortagePresent && isStockAvailable);
  const isMaterialAvailable = mr?.materialAvailable || (!planningResult?.shortagePresent && isStockAvailable);
  const isIssued = currentStage === 'MATERIAL_ISSUED' || mr?.status === 'FULLY_ISSUED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Manufacturing & Production Orders</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            Production Order → BOM → Material Requirement → Stock Check → Procurement / Issue → Shop Floor Assembly
          </p>
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
              <th>BOM Assigned</th>
              <th>Work Center</th>
              <th>Stock Status</th>
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
                  <td>
                    <span className="status-badge neutral" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {order.bom?.bomNumber ? `${order.bom.bomNumber} (${order.bom.version || 'V1'})` : (order.bomVersion || 'Default BOM')}
                    </span>
                  </td>
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

                      <button className="btn btn-primary btn-sm" onClick={() => handlePlanMaterials(order._id)} title="BOM & Stock Flow">
                        <FactCheckIcon fontSize="inherit" /> Check Stock
                      </button>

                      {order.status !== 'COMPLETED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCompleteOrder(order._id)} title="Complete & Trigger QA">
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

      {/* Production Order → BOM → Material Requirement → Stock Check Lifecycle Modal */}
      {planningResult && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1020px', width: '95%' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Production & Inventory Real-Time Workflow</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Order: <strong>{planningResult.order?.productionNumber}</strong> | Product: <strong>{planningResult.order?.productName}</strong> ({planningResult.order?.model}) | Order Qty: <strong>{planningResult.order?.quantity || 1} Unit(s)</strong>
                </span>
              </div>
              <button className="close-btn" onClick={() => setPlanningResult(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
              
              {/* Architecture Flowchart Tracker */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manufacturing Stores & Procurement Architecture
                  </div>
                  {planningResult.availableBOMs && planningResult.availableBOMs.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Switch BOM:</span>
                      <select 
                        value={selectedBomId} 
                        onChange={(e) => {
                          setSelectedBomId(e.target.value);
                          handleAssignBOM(planningResult.order?._id, e.target.value);
                        }}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                      >
                        {planningResult.availableBOMs.map(b => (
                          <option key={b._id} value={b._id}>{b.bomNumber} ({b.version}) - {b.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Vertical-Horizontal Unified Workflow Tree */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Top Level Pipeline: Production Order -> BOM -> Material Requirement -> Stock Check */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    
                    {/* 1. Production Order */}
                    <div style={{
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1.5px solid #0F2C59',
                      borderRadius: '6px',
                      textAlign: 'center',
                      minWidth: '130px'
                    }}>
                      <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>STEP 1</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59' }}>Production Order</div>
                      <div style={{ fontSize: '10.5px', color: '#475569' }}>{planningResult.order?.productionNumber} ({planningResult.order?.quantity} Unit)</div>
                    </div>

                    <ArrowForwardIcon style={{ color: '#94A3B8', fontSize: '18px' }} />

                    {/* 2. BOM */}
                    <div style={{
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1.5px solid #0284C7',
                      borderRadius: '6px',
                      textAlign: 'center',
                      minWidth: '130px'
                    }}>
                      <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>STEP 2</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1' }}>BOM (Bill of Materials)</div>
                      <div style={{ fontSize: '10.5px', color: '#475569' }}>
                        {planningResult.bom?.bomNumber || planningResult.order?.bomVersion || 'Standard BOM'} ({planningResult.bom?.version || 'V1'})
                      </div>
                    </div>

                    <ArrowForwardIcon style={{ color: '#94A3B8', fontSize: '18px' }} />

                    {/* 3. Material Requirement */}
                    <div style={{
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1.5px solid #7C3AED',
                      borderRadius: '6px',
                      textAlign: 'center',
                      minWidth: '130px'
                    }}>
                      <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>STEP 3</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6D28D9' }}>Material Requirement</div>
                      <div style={{ fontSize: '10.5px', color: '#475569' }}>{planningResult.itemsPlanning?.length || 0} Components Calculated</div>
                    </div>

                    <ArrowForwardIcon style={{ color: '#94A3B8', fontSize: '18px' }} />

                    {/* 4. Stock Check */}
                    <div style={{
                      padding: '8px 12px',
                      background: !planningResult.shortagePresent ? '#ECFDF5' : '#FEF2F2',
                      border: `1.5px solid ${!planningResult.shortagePresent ? '#059669' : '#DC2626'}`,
                      borderRadius: '6px',
                      textAlign: 'center',
                      minWidth: '130px'
                    }}>
                      <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>STEP 4: STOCK CHECK</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: !planningResult.shortagePresent ? '#059669' : '#DC2626' }}>
                        {!planningResult.shortagePresent ? 'Stock Available' : 'Shortage Detected'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: !planningResult.shortagePresent ? '#065F46' : '#991B1B' }}>
                        {!planningResult.shortagePresent ? '100% In Store' : `${planningResult.itemsPlanning?.filter(i => i.shortageQty > 0).length} Shortage Items`}
                      </div>
                    </div>

                  </div>

                  {/* Branching Visualization Section */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    
                    {/* Branch A: Stock Available */}
                    <div style={{
                      border: !planningResult.shortagePresent ? '2px solid #059669' : '1px dashed #CBD5E1',
                      borderRadius: '6px',
                      padding: '10px',
                      background: !planningResult.shortagePresent ? '#F0FDF4' : '#F8FAFC',
                      opacity: !planningResult.shortagePresent ? 1 : 0.65
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#059669', fontSize: '12px' }}>
                        <CheckCircleIcon fontSize="small" /> Branch 1: Stock Available
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', margin: '6px 0 10px 0' }}>
                        Sufficient stock in stores. Proceed directly:
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                        <span className="status-badge success" style={{ padding: '3px 8px' }}>Issue Material</span>
                        <ArrowForwardIcon style={{ fontSize: '14px', color: '#059669' }} />
                        <span className="status-badge success" style={{ padding: '3px 8px' }}>Inventory Deducted</span>
                        <ArrowForwardIcon style={{ fontSize: '14px', color: '#059669' }} />
                        <span className="status-badge success" style={{ padding: '3px 8px' }}>Production Started</span>
                      </div>
                    </div>

                    {/* Branch B: Shortage Pipeline */}
                    <div style={{
                      border: planningResult.shortagePresent ? '2px solid #D97706' : '1px dashed #CBD5E1',
                      borderRadius: '6px',
                      padding: '10px',
                      background: planningResult.shortagePresent ? '#FFFBEB' : '#F8FAFC',
                      opacity: planningResult.shortagePresent ? 1 : 0.65
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#D97706', fontSize: '12px' }}>
                        <WarningAmberIcon fontSize="small" /> Branch 2: Shortage Procurement
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', margin: '6px 0 8px 0' }}>
                        Stores shortage requires vendor replenishment:
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '11px', fontWeight: 600 }}>
                        <span className={`status-badge ${mr?.purchaseRequestNumber ? 'info' : 'warning'}`}>
                          Procurement ({mr?.purchaseRequestNumber || 'PR'})
                        </span>
                        <ArrowForwardIcon style={{ fontSize: '13px', color: '#94A3B8' }} />
                        <span className={`status-badge ${mr?.vendorPoNumber ? 'info' : 'neutral'}`}>
                          Vendor PO ({mr?.vendorPoNumber || 'Pending'})
                        </span>
                        <ArrowForwardIcon style={{ fontSize: '13px', color: '#94A3B8' }} />
                        <span className={`status-badge ${mr?.grnNumber ? 'info' : 'neutral'}`}>
                          GRN ({mr?.grnNumber || 'Pending'})
                        </span>
                        <ArrowForwardIcon style={{ fontSize: '13px', color: '#94A3B8' }} />
                        <span className={`status-badge ${isStoresInwarded ? 'success' : 'neutral'}`}>
                          Stores Inventory In
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Material Requirement vs Stores Stock Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F2C59', margin: 0 }}>
                  Material Requirements from BOM & Stores Inventory Status
                </h4>
                <span className={`status-badge ${!planningResult.shortagePresent ? 'success' : 'danger'}`}>
                  Coverage: {!planningResult.shortagePresent ? 'FULL (All Materials In Stock)' : `SHORTAGE DETECTED`}
                </span>
              </div>

              <div className="table-container" style={{ marginBottom: '14px' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Description</th>
                      <th>Unit Req</th>
                      <th>Total Req</th>
                      <th>On Hand</th>
                      <th>Reserved</th>
                      <th>Available Stock</th>
                      <th>Shortage</th>
                      <th>Unit</th>
                      <th>Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(planningResult.itemsPlanning || planningResult.materialRequest?.items)?.map((item, idx) => {
                      const coverage = item.coverageStatus || (item.shortageQty === 0 ? 'FULL' : item.availableQty > 0 ? 'PARTIAL' : 'NONE');
                      return (
                        <tr key={idx} style={{ backgroundColor: item.shortageQty > 0 ? '#FFFBEB' : 'transparent' }}>
                          <td style={{ fontWeight: 700, color: '#0F2C59' }}>{item.itemCode || item.materialCode}</td>
                          <td style={{ fontWeight: 600 }}>{item.itemName || item.materialName}</td>
                          <td style={{ color: '#64748B' }}>{item.unitQty || (item.requiredQty / (planningResult.order?.quantity || 1))}</td>
                          <td style={{ fontWeight: 700 }}>{item.requiredQty}</td>
                          <td style={{ color: '#475569' }}>{item.currentStock ?? '—'}</td>
                          <td style={{ color: '#D97706' }}>{item.reservedQty ?? 0}</td>
                          <td style={{ fontWeight: 600, color: '#0F2C59' }}>{item.availableQty}</td>
                          <td style={{ fontWeight: 700, color: item.shortageQty > 0 ? '#DC2626' : '#059669' }}>
                            {item.shortageQty}
                          </td>
                          <td>{item.unit}</td>
                          <td>
                            <span className={`status-badge ${coverage === 'FULL' ? 'success' : coverage === 'PARTIAL' ? 'warning' : 'danger'}`}>
                              {coverage}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Interactive Action Flow: Procurement (When Shortage) */}
              {planningResult.shortagePresent && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontWeight: 700, color: '#92400E', fontSize: '13px', marginBottom: '4px' }}>
                    Procurement Required: Shortage must be inwarded to Stores Inventory
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350F', marginBottom: '12px' }}>
                    Follow the real-time replenishment flow: <strong>Purchase Request → Vendor PO → GRN → Inward to Inventory</strong>.
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Step 1: Approve PR */}
                    {(!mr?.workflowStage || mr?.workflowStage === 'PURCHASE_REQUEST' || mr?.workflowStage === 'REQUEST_CREATED') && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        disabled={procuring}
                        onClick={() => handleAdvanceProcurement('APPROVE_PR')}
                        title="Approve Purchase Request"
                      >
                        <CheckCircleIcon fontSize="inherit" /> 1. Approve PR ({mr?.purchaseRequestNumber || 'PR'})
                      </button>
                    )}

                    {/* Step 2: Issue Vendor PO */}
                    {mr?.workflowStage === 'PURCHASE_APPROVED' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        disabled={procuring}
                        onClick={() => handleAdvanceProcurement('ISSUE_PO')}
                        title="Issue Purchase Order to Supplier"
                      >
                        <ShoppingBagIcon fontSize="inherit" /> 2. Issue Vendor PO
                      </button>
                    )}

                    {/* Step 3: Receive GRN */}
                    {(mr?.workflowStage === 'PO_ISSUED' || mr?.vendorPoNumber) && (
                      <button 
                        className="btn btn-primary btn-sm"
                        disabled={procuring}
                        onClick={() => handleAdvanceProcurement('PROCESS_GRN')}
                        title="Supplier delivers -> Inward stock to Inventory via GRN"
                      >
                        <ReceiptIcon fontSize="inherit" /> 3. Receive Supplier GRN & Stores In
                      </button>
                    )}

                    {/* 1-Click Fast Inward */}
                    <button 
                      className="btn btn-warning btn-sm"
                      disabled={procuring}
                      onClick={() => handleAdvanceProcurement('AUTO_COMPLETE_CHAIN')}
                      title="Instantly completes PR -> Vendor PO -> GRN -> Inward to Inventory"
                    >
                      <WarehouseIcon fontSize="inherit" /> {procuring ? 'Inwarding Stock...' : '⚡ 1-Click Procure & Inward to Stores'}
                    </button>
                  </div>
                </div>
              )}

              {/* Ready to Issue Banner (When Stock Available) */}
              {isMaterialAvailable && !planningResult.shortagePresent && (
                <div style={{
                  background: '#ECFDF5',
                  border: '1.5px solid #A7F3D0',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <strong style={{ color: '#065F46', fontSize: '13px' }}>
                      ✓ All Materials Available in Stores Inventory!
                    </strong>
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      Click below to deduct stores stock and dispatch items directly to the assembly floor to start Production.
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => handleIssueMaterials(mr?._id)}
                    style={{ fontSize: '13px', padding: '9px 18px' }}
                  >
                    <PlayArrowIcon fontSize="small" /> Issue Material to Production (Start Assembly Floor)
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button type="button" className="btn btn-secondary" onClick={() => handlePlanMaterials(planningResult.order?._id)}>
                  <RefreshIcon fontSize="inherit" /> Re-check Stores Stock
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPlanningResult(null)}>Close</button>
                
                {isMaterialAvailable && !planningResult.shortagePresent && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => handleIssueMaterials(mr?._id)}
                  >
                    <PlayArrowIcon fontSize="inherit" /> Issue Material to Production
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
