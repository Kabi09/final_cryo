import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Procurement() {
  const [tab, setTab] = useState('pr'); // 'pr', 'vpo', 'grn'
  const [prs, setPRs] = useState([]);
  const [vpos, setVPOs] = useState([]);
  const [grns, setGRNs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPRModal, setShowPRModal] = useState(false);
  const [showVPOModal, setShowVPOModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);

  const [prData, setPRData] = useState({
    itemCode: 'RAW-COMP-15HP',
    itemName: 'Hermetic Cascade Compressor 1.5HP',
    quantity: 4,
    unit: 'Nos',
    estimatedCost: 42000,
    urgency: 'High'
  });

  const [vpoData, setVPOData] = useState({
    vendorName: 'Tecumseh India Refrigeration Ltd',
    vendorEmail: 'sales@tecumseh-india.com',
    vendorGstin: '33AABCT9981F1Z8',
    itemCode: 'RAW-COMP-15HP',
    itemName: 'Hermetic Cascade Compressor 1.5HP',
    quantity: 4,
    unit: 'Nos',
    unitPrice: 42000,
    grandTotal: 198240
  });

  const [grnData, setGRNData] = useState({
    vendorPoId: '',
    deliveryChallanNumber: 'DC-2026-8891',
    itemCode: 'RAW-COMP-15HP',
    itemName: 'Hermetic Cascade Compressor 1.5HP',
    receivedQty: 4,
    acceptedQty: 4,
    rejectedQty: 0,
    damagedQty: 0,
    unit: 'Nos',
    remarks: 'Inspected and accepted into store'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prRes, vpoRes, grnRes] = await Promise.all([
        api.get('/procurement/purchase-requests'),
        api.get('/procurement/vendor-pos'),
        api.get('/procurement/grn')
      ]);
      setPRs(prRes.data);
      setVPOs(vpoRes.data);
      setGRNs(grnRes.data);
      if (vpoRes.data.length > 0) {
        setGRNData(prev => ({ ...prev, vendorPoId: vpoRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePR = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procurement/purchase-requests', {
        items: [{
          itemCode: prData.itemCode,
          itemName: prData.itemName,
          quantity: prData.quantity,
          unit: prData.unit,
          estimatedCost: prData.estimatedCost,
          urgency: prData.urgency
        }]
      });
      setShowPRModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating PR');
    }
  };

  const handleApprovePR = async (id) => {
    try {
      await api.put(`/procurement/purchase-requests/${id}/approve`);
      alert('Purchase Request Approved!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval error');
    }
  };

  const handleCreateVPO = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procurement/vendor-pos', {
        vendorName: vpoData.vendorName,
        vendorEmail: vpoData.vendorEmail,
        vendorGstin: vpoData.vendorGstin,
        items: [{
          itemCode: vpoData.itemCode,
          itemName: vpoData.itemName,
          quantity: vpoData.quantity,
          unit: vpoData.unit,
          unitPrice: vpoData.unitPrice,
          taxRate: 18,
          totalAmount: vpoData.grandTotal
        }],
        grandTotal: vpoData.grandTotal
      });
      setShowVPOModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating Vendor PO');
    }
  };

  const handleCreateGRN = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procurement/grn', {
        vendorPoId: grnData.vendorPoId,
        deliveryChallanNumber: grnData.deliveryChallanNumber,
        items: [{
          itemCode: grnData.itemCode,
          itemName: grnData.itemName,
          orderedQty: grnData.receivedQty,
          receivedQty: grnData.receivedQty,
          acceptedQty: grnData.acceptedQty,
          rejectedQty: grnData.rejectedQty,
          damagedQty: grnData.damagedQty,
          unit: grnData.unit
        }],
        remarks: grnData.remarks
      });
      setShowGRNModal(false);
      alert('GRN processed! Inventory automatically updated.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing GRN');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Procurement & Stores Receipt (GRN)</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Purchase requisition workflows, vendor orders, and automatic inventory receipt reconciliation.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {tab === 'pr' && (
            <button className="btn btn-primary" onClick={() => setShowPRModal(true)}>
              <AddIcon fontSize="small" /> Raise Purchase Request
            </button>
          )}
          {tab === 'vpo' && (
            <button className="btn btn-primary" onClick={() => setShowVPOModal(true)}>
              <AddIcon fontSize="small" /> Issue Vendor PO
            </button>
          )}
          {tab === 'grn' && (
            <button className="btn btn-primary" onClick={() => setShowGRNModal(true)}>
              <AddIcon fontSize="small" /> Process GRN Inward
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0' }}>
        <button
          className="btn"
          style={{
            borderBottom: tab === 'pr' ? '2px solid #1E40AF' : 'none',
            color: tab === 'pr' ? '#1E40AF' : '#64748B',
            fontWeight: tab === 'pr' ? 700 : 500,
            borderRadius: 0,
            background: 'transparent'
          }}
          onClick={() => setTab('pr')}
        >
          Purchase Requests ({prs.length})
        </button>
        <button
          className="btn"
          style={{
            borderBottom: tab === 'vpo' ? '2px solid #1E40AF' : 'none',
            color: tab === 'vpo' ? '#1E40AF' : '#64748B',
            fontWeight: tab === 'vpo' ? 700 : 500,
            borderRadius: 0,
            background: 'transparent'
          }}
          onClick={() => setTab('vpo')}
        >
          Vendor Purchase Orders ({vpos.length})
        </button>
        <button
          className="btn"
          style={{
            borderBottom: tab === 'grn' ? '2px solid #1E40AF' : 'none',
            color: tab === 'grn' ? '#1E40AF' : '#64748B',
            fontWeight: tab === 'grn' ? 700 : 500,
            borderRadius: 0,
            background: 'transparent'
          }}
          onClick={() => setTab('grn')}
        >
          Goods Received Notes (GRN) ({grns.length})
        </button>
      </div>

      {/* Tab Contents */}
      {tab === 'pr' && (
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>PR #</th>
                <th>Material Requested</th>
                <th>Qty</th>
                <th>Department</th>
                <th>Requested By</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading requests...</td></tr>
              ) : prs.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No purchase requests logged.</td></tr>
              ) : (
                prs.map(pr => (
                  <tr key={pr._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{pr.prNumber}</td>
                    <td>{pr.items?.[0]?.itemName}</td>
                    <td style={{ fontWeight: 700 }}>{pr.items?.[0]?.quantity} {pr.items?.[0]?.unit}</td>
                    <td>{pr.department}</td>
                    <td>{pr.requestedBy}</td>
                    <td><span className="status-badge danger">{pr.items?.[0]?.urgency || 'High'}</span></td>
                    <td>
                      <span className={`status-badge ${pr.status === 'APPROVED' ? 'success' : 'warning'}`}>
                        {pr.status}
                      </span>
                    </td>
                    <td>
                      {pr.status === 'PENDING_APPROVAL' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleApprovePR(pr._id)}>
                          <CheckCircleIcon fontSize="inherit" /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vpo' && (
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Vendor PO #</th>
                <th>Vendor / Supplier</th>
                <th>Order Date</th>
                <th>Component Items</th>
                <th>PO Total Amount</th>
                <th>Payment Terms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vpos.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No vendor purchase orders issued yet.</td></tr>
              ) : (
                vpos.map(po => (
                  <tr key={po._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{po.poNumber}</td>
                    <td style={{ fontWeight: 600 }}>{po.vendorName}</td>
                    <td>{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td>{po.items?.[0]?.itemName} (Qty: {po.items?.[0]?.quantity})</td>
                    <td style={{ fontWeight: 700 }}>₹{po.grandTotal.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{po.paymentTerms}</td>
                    <td><span className="status-badge success">{po.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'grn' && (
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>GRN #</th>
                <th>Vendor PO Ref</th>
                <th>Supplier</th>
                <th>Delivery Challan</th>
                <th>Received Date</th>
                <th>Accepted Qty</th>
                <th>Warehouse Dest</th>
                <th>Inspector</th>
              </tr>
            </thead>
            <tbody>
              {grns.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No GRNs processed yet.</td></tr>
              ) : (
                grns.map(grn => (
                  <tr key={grn._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{grn.grnNumber}</td>
                    <td style={{ fontWeight: 600 }}>{grn.vendorPoNumber}</td>
                    <td>{grn.vendorName}</td>
                    <td>{grn.deliveryChallanNumber}</td>
                    <td>{new Date(grn.receivedDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{grn.items?.[0]?.acceptedQty} {grn.items?.[0]?.unit}</td>
                    <td>{grn.warehouse}</td>
                    <td>{grn.inspectedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Raise PR Modal */}
      {showPRModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Raise Purchase Requisition (PR)</h3>
              <button className="close-btn" onClick={() => setShowPRModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePR}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Material SKU Code *</label>
                  <input className="form-control" required value={prData.itemCode} onChange={e => setPRData({ ...prData, itemCode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Material Name / Description *</label>
                  <input className="form-control" required value={prData.itemName} onChange={e => setPRData({ ...prData, itemName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input className="form-control" type="number" min="1" required value={prData.quantity} onChange={e => setPRData({ ...prData, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Urgency Level</label>
                    <select className="form-control" value={prData.urgency} onChange={e => setPRData({ ...prData, urgency: e.target.value })}>
                      <option value="Critical">Critical (Halting Assembly)</option>
                      <option value="High">High</option>
                      <option value="Standard">Standard Stocking</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPRModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit PR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue VPO Modal */}
      {showVPOModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Issue Vendor Purchase Order</h3>
              <button className="close-btn" onClick={() => setShowVPOModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateVPO}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vendor Supplier Name *</label>
                  <input className="form-control" required value={vpoData.vendorName} onChange={e => setVPOData({ ...vpoData, vendorName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Item Name *</label>
                    <input className="form-control" required value={vpoData.itemName} onChange={e => setVPOData({ ...vpoData, itemName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>PO Value (₹) *</label>
                    <input className="form-control" type="number" required value={vpoData.grandTotal} onChange={e => setVPOData({ ...vpoData, grandTotal: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVPOModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Issue VPO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {showGRNModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Inward Goods Received Note (GRN)</h3>
              <button className="close-btn" onClick={() => setShowGRNModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGRN}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Vendor Purchase Order *</label>
                  <select className="form-control" value={grnData.vendorPoId} onChange={e => setGRNData({ ...grnData, vendorPoId: e.target.value })}>
                    {vpos.map(v => (
                      <option key={v._id} value={v._id}>{v.poNumber} - {v.vendorName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Challan / Invoice # *</label>
                  <input className="form-control" required value={grnData.deliveryChallanNumber} onChange={e => setGRNData({ ...grnData, deliveryChallanNumber: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Received Qty *</label>
                    <input className="form-control" type="number" min="1" required value={grnData.receivedQty} onChange={e => setGRNData({ ...grnData, receivedQty: e.target.value, acceptedQty: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Accepted Qty (Credited to Store) *</label>
                    <input className="form-control" type="number" min="0" required value={grnData.acceptedQty} onChange={e => setGRNData({ ...grnData, acceptedQty: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGRNModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process GRN & Credit Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
