import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [addStockData, setAddStockData] = useState({
    quantity: '',
    referenceType: 'MANUAL',
    referenceNumber: '',
    remarks: 'Stock In / Receipt added'
  });

  const [adjustData, setAdjustData] = useState({
    newStock: '',
    reason: 'Physical inventory audit reconciliation'
  });

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const url = lowStockFilter ? '/inventory?lowStock=true' : '/inventory';
      const res = await api.get(url);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddStock = (item) => {
    setActiveItem(item);
    setAddStockData({
      quantity: '',
      referenceType: 'MANUAL',
      referenceNumber: '',
      remarks: 'Stock In / Receipt added'
    });
    setShowAddStockModal(true);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${activeItem._id}/add-stock`, addStockData);
      setShowAddStockModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding stock');
    }
  };

  const openAdjust = (item) => {
    setActiveItem(item);
    setAdjustData({
      newStock: item.currentStock,
      reason: 'Physical inventory count adjustment'
    });
    setShowAdjustModal(true);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${activeItem._id}/adjust`, adjustData);
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Stores Inventory & Stock Master</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Raw materials, compressors, cryogenic refrigerants, and finished goods stock ledger.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            <WarningAmberIcon fontSize="small" /> {lowStockFilter ? 'Show All Items' : 'Filter Low Stock / Shortages'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Description</th>
              <th>Category</th>
              <th>Warehouse</th>
              <th>Current Stock</th>
              <th>Reserved Stock</th>
              <th>Available Stock</th>
              <th>Reorder Point</th>
              <th>Unit Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>Loading inventory...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No inventory items found.</td></tr>
            ) : (
              items.map(item => {
                const available = Math.max(0, item.currentStock - item.reservedStock);
                const isLow = available <= item.reorderPoint;
                return (
                  <tr key={item._id} style={{ backgroundColor: isLow ? '#FFFBEB' : 'transparent' }}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{item.itemCode}</td>
                    <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td><span className="status-badge neutral">{item.category}</span></td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{item.warehouse}</td>
                    <td style={{ fontWeight: 700 }}>{item.currentStock} {item.unit}</td>
                    <td style={{ color: '#D97706' }}>{item.reservedStock} {item.unit}</td>
                    <td style={{ fontWeight: 700, color: isLow ? '#DC2626' : '#059669' }}>
                      {available} {item.unit} {isLow && <WarningAmberIcon style={{ fontSize: '14px', verticalAlign: 'middle' }} />}
                    </td>
                    <td style={{ color: '#64748B' }}>{item.reorderPoint} {item.unit}</td>
                    <td>₹{Number(item.unitCost || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openAddStock(item)} title="Add Stock (Stock In)">
                          <AddIcon fontSize="inherit" /> Add Stock
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(item)} title="Stock Adjustment / Audit">
                          <TuneIcon fontSize="inherit" /> Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Stock In / Receipt — {activeItem?.itemName}</h3>
              <button className="close-btn" onClick={() => setShowAddStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px' }}>
                  <div><strong>Item Code:</strong> {activeItem?.itemCode}</div>
                  <div><strong>Current On-Hand Stock:</strong> {activeItem?.currentStock} {activeItem?.unit}</div>
                </div>

                <div className="form-group">
                  <label>Quantity to Receive / Add ({activeItem?.unit}) *</label>
                  <input className="form-control" type="number" min="1" required value={addStockData.quantity} onChange={e => setAddStockData({ ...addStockData, quantity: e.target.value })} placeholder="e.g. 10" />
                </div>

                <div className="form-group">
                  <label>Receipt Source / Reference Type</label>
                  <select className="form-control" value={addStockData.referenceType} onChange={e => setAddStockData({ ...addStockData, referenceType: e.target.value })}>
                    <option value="MANUAL">Manual Stock In Receipt</option>
                    <option value="PO">Vendor Delivery PO</option>
                    <option value="PRODUCTION">Factory Assembly Return</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document / Reference Number</label>
                  <input className="form-control" value={addStockData.referenceNumber} onChange={e => setAddStockData({ ...addStockData, referenceNumber: e.target.value })} placeholder="e.g. REC-2026-0045" />
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea className="form-control" value={addStockData.remarks} onChange={e => setAddStockData({ ...addStockData, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Credit Stock In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Stock Reconciliation / Adjustment — {activeItem?.itemName}</h3>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px' }}>
                  <div><strong>Item Code:</strong> {activeItem?.itemCode}</div>
                  <div><strong>Current Book Stock:</strong> {activeItem?.currentStock} {activeItem?.unit}</div>
                </div>

                <div className="form-group">
                  <label>Audited Physical Stock Quantity ({activeItem?.unit}) *</label>
                  <input className="form-control" type="number" min="0" required value={adjustData.newStock} onChange={e => setAdjustData({ ...adjustData, newStock: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Adjustment Audit Justification *</label>
                  <textarea className="form-control" required value={adjustData.reason} onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })} placeholder="Reason for variance..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
