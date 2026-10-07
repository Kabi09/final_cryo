import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const MATERIAL_TYPES = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'REFRIGERATION', label: 'Refrigeration Component' },
  { value: 'ELECTRICAL', label: 'Electrical & Instrumentation' },
  { value: 'MECHANICAL', label: 'Mechanical & Structural' },
  { value: 'CHEMICAL', label: 'Chemical / Refrigerant Gas' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'SPARE_PART', label: 'Spare Part' },
  { value: 'SUB_ASSEMBLY', label: 'Sub Assembly' },
  { value: 'FINISHED_GOODS', label: 'Finished Goods' }
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [materialTypeFilter, setMaterialTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // New Item Form
  const [newItemData, setNewItemData] = useState({
    itemCode: '',
    itemName: '',
    materialType: 'RAW_MATERIAL',
    unit: 'Nos',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: 0,
    minStockLevel: 5,
    reorderPoint: 10,
    warehouse: 'Main Plant - Chennai',
    binLocation: 'Bay A - Rack 1',
    supplier: '',
    description: '',
    active: true
  });

  // Edit Item Form
  const [editItemData, setEditItemData] = useState({});

  // Stock In Form
  const [addStockData, setAddStockData] = useState({
    quantity: '',
    referenceType: 'MANUAL',
    referenceNumber: '',
    remarks: 'Stock In / Receipt added'
  });

  // Adjust Form
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

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...newItemData,
        purchasePrice: Number(newItemData.purchasePrice || 0),
        sellingPrice: Number(newItemData.sellingPrice || 0),
        currentStock: Number(newItemData.currentStock || 0),
        minStockLevel: Number(newItemData.minStockLevel || 0),
        reorderPoint: Number(newItemData.reorderPoint || 0)
      });
      setShowCreateModal(false);
      resetNewItemData();
      fetchInventory();
      alert('Inventory material master item created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating inventory item');
    }
  };

  const resetNewItemData = () => {
    setNewItemData({
      itemCode: '',
      itemName: '',
      materialType: 'RAW_MATERIAL',
      unit: 'Nos',
      purchasePrice: '',
      sellingPrice: '',
      currentStock: 0,
      minStockLevel: 5,
      reorderPoint: 10,
      warehouse: 'Main Plant - Chennai',
      binLocation: 'Bay A - Rack 1',
      supplier: '',
      description: '',
      active: true
    });
  };

  const openEditModal = (item) => {
    setActiveItem(item);
    setEditItemData({
      itemName: item.itemName,
      materialType: item.materialType || item.category || 'RAW_MATERIAL',
      unit: item.unit,
      purchasePrice: item.purchasePrice || item.unitCost || 0,
      sellingPrice: item.sellingPrice || 0,
      minStockLevel: item.minStockLevel || 5,
      reorderPoint: item.reorderPoint || 10,
      warehouse: item.warehouse || 'Main Plant - Chennai',
      binLocation: item.binLocation || '',
      supplier: item.supplier || '',
      description: item.description || '',
      active: item.active !== false
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/inventory/${activeItem._id}`, editItemData);
      setShowEditModal(false);
      fetchInventory();
      alert('Inventory item updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating inventory item');
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
      alert('Stock In receipt successfully recorded!');
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
      alert('Stock count reconciled successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = materialTypeFilter === '' || 
      (item.materialType === materialTypeFilter || item.category === materialTypeFilter);
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Stores Inventory & Material Master</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            Raw materials, compressors, cryogenic refrigerants, spares, warehouse bins, stock availability, and reorder levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            <WarningAmberIcon fontSize="small" /> {lowStockFilter ? 'Show All Materials' : 'Filter Shortage / Low Stock'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <AddIcon fontSize="small" /> + Add Material Item
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          className="form-control"
          style={{ maxWidth: '300px' }}
          placeholder="Search Code, Name, or Supplier..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="form-control"
          style={{ maxWidth: '240px' }}
          value={materialTypeFilter}
          onChange={e => setMaterialTypeFilter(e.target.value)}
        >
          <option value="">All Material Types</option>
          {MATERIAL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Inventory Code</th>
              <th>Material Name</th>
              <th>Material Type</th>
              <th>Unit</th>
              <th>Current Stock</th>
              <th>Reserved</th>
              <th>Available Stock</th>
              <th>Reorder / Min</th>
              <th>Purchase Price</th>
              <th>Issue Price</th>
              <th>Location</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="14" style={{ textAlign: 'center', padding: '24px' }}>Loading inventory master...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="14" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No inventory items found.</td></tr>
            ) : (
              filteredItems.map(item => {
                const available = Math.max(0, (item.currentStock || 0) - (item.reservedStock || 0));
                const isLow = available <= (item.reorderPoint || 10);
                const isUnderMin = available <= (item.minStockLevel || 5);
                return (
                  <tr key={item._id} style={{ backgroundColor: isUnderMin ? '#FEF2F2' : isLow ? '#FFFBEB' : 'transparent' }}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{item.itemCode}</td>
                    <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td>
                      <span className="status-badge info" style={{ fontSize: '11px' }}>
                        {item.materialType?.replace('_', ' ') || item.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{item.unit}</td>
                    <td style={{ fontWeight: 700 }}>{item.currentStock}</td>
                    <td style={{ color: '#D97706', fontWeight: 600 }}>{item.reservedStock || 0}</td>
                    <td style={{ fontWeight: 700, color: isUnderMin ? '#DC2626' : isLow ? '#D97706' : '#059669' }}>
                      {available} {isLow && <WarningAmberIcon style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '4px' }} />}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748B' }}>
                      {item.reorderPoint} / {item.minStockLevel || 0}
                    </td>
                    <td>₹{Number(item.purchasePrice || item.unitCost || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      {item.binLocation || 'Main'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{item.supplier || 'Standard'}</td>
                    <td>
                      <span className={`status-badge ${item.active !== false ? 'success' : 'neutral'}`}>
                        {item.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openAddStock(item)} title="Stock In / Receipt">
                          <AddIcon fontSize="inherit" /> Stock In
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(item)} title="Audit / Adjust">
                          <TuneIcon fontSize="inherit" />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)} title="Edit Item Details">
                          <EditIcon fontSize="inherit" />
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

      {/* Modal 1: Create Inventory Master Item */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Create Stores Material / Inventory Item</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Inventory Code *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={newItemData.itemCode} 
                      onChange={e => setNewItemData({ ...newItemData, itemCode: e.target.value.toUpperCase() })} 
                      placeholder="e.g. MAT-COMP-01" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Inventory / Material Name *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={newItemData.itemName} 
                      onChange={e => setNewItemData({ ...newItemData, itemName: e.target.value })} 
                      placeholder="e.g. Hermetic Compressor 1.5 HP (-80°C Rated)" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Material Type *</label>
                    <select 
                      className="form-control" 
                      value={newItemData.materialType} 
                      onChange={e => setNewItemData({ ...newItemData, materialType: e.target.value })}
                    >
                      {MATERIAL_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit of Measure *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={newItemData.unit} 
                      onChange={e => setNewItemData({ ...newItemData, unit: e.target.value })} 
                      placeholder="Nos / KG / M / Liters" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Opening Stock</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-control" 
                      value={newItemData.currentStock} 
                      onChange={e => setNewItemData({ ...newItemData, currentStock: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Purchase Price (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      className="form-control" 
                      value={newItemData.purchasePrice} 
                      onChange={e => setNewItemData({ ...newItemData, purchasePrice: e.target.value })} 
                      placeholder="45000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling / Issue Price (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newItemData.sellingPrice} 
                      onChange={e => setNewItemData({ ...newItemData, sellingPrice: e.target.value })} 
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Minimum Stock Threshold</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-control" 
                      value={newItemData.minStockLevel} 
                      onChange={e => setNewItemData({ ...newItemData, minStockLevel: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Reorder Point Level</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-control" 
                      value={newItemData.reorderPoint} 
                      onChange={e => setNewItemData({ ...newItemData, reorderPoint: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Warehouse</label>
                    <input 
                      className="form-control" 
                      value={newItemData.warehouse} 
                      onChange={e => setNewItemData({ ...newItemData, warehouse: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location / Bin</label>
                    <input 
                      className="form-control" 
                      value={newItemData.binLocation} 
                      onChange={e => setNewItemData({ ...newItemData, binLocation: e.target.value })} 
                      placeholder="Bay A - Rack 2 - Bin 05"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Primary Supplier / Vendor</label>
                    <input 
                      className="form-control" 
                      value={newItemData.supplier} 
                      onChange={e => setNewItemData({ ...newItemData, supplier: e.target.value })} 
                      placeholder="e.g. Danfoss / Tecumseh India"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newItemData.active} 
                        onChange={e => setNewItemData({ ...newItemData, active: e.target.checked })} 
                      />
                      Active Material
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description & Technical Specifications</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    value={newItemData.description} 
                    onChange={e => setNewItemData({ ...newItemData, description: e.target.value })} 
                    placeholder="Material grade, refrigeration rating, electrical compatibility..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Inventory Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Item */}
      {showEditModal && activeItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Edit Material Master — {activeItem.itemCode}</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateItem}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Material Name *</label>
                  <input 
                    className="form-control" 
                    required 
                    value={editItemData.itemName} 
                    onChange={e => setEditItemData({ ...editItemData, itemName: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Material Type</label>
                    <select 
                      className="form-control" 
                      value={editItemData.materialType} 
                      onChange={e => setEditItemData({ ...editItemData, materialType: e.target.value })}
                    >
                      {MATERIAL_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input 
                      className="form-control" 
                      value={editItemData.unit} 
                      onChange={e => setEditItemData({ ...editItemData, unit: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Purchase Price (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItemData.purchasePrice} 
                      onChange={e => setEditItemData({ ...editItemData, purchasePrice: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling / Issue Price (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItemData.sellingPrice} 
                      onChange={e => setEditItemData({ ...editItemData, sellingPrice: Number(e.target.value) })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Min Stock Level</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItemData.minStockLevel} 
                      onChange={e => setEditItemData({ ...editItemData, minStockLevel: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Reorder Point</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editItemData.reorderPoint} 
                      onChange={e => setEditItemData({ ...editItemData, reorderPoint: Number(e.target.value) })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Warehouse</label>
                    <input 
                      className="form-control" 
                      value={editItemData.warehouse} 
                      onChange={e => setEditItemData({ ...editItemData, warehouse: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location / Bin</label>
                    <input 
                      className="form-control" 
                      value={editItemData.binLocation} 
                      onChange={e => setEditItemData({ ...editItemData, binLocation: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Supplier</label>
                  <input 
                    className="form-control" 
                    value={editItemData.supplier} 
                    onChange={e => setEditItemData({ ...editItemData, supplier: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    value={editItemData.description} 
                    onChange={e => setEditItemData({ ...editItemData, description: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Stock (Stock In) */}
      {showAddStockModal && activeItem && (
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
                  <div><strong>Reserved:</strong> {activeItem?.reservedStock || 0} {activeItem?.unit}</div>
                  <div><strong>Available:</strong> {Math.max(0, (activeItem?.currentStock || 0) - (activeItem?.reservedStock || 0))} {activeItem?.unit}</div>
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

      {/* Modal 4: Adjust Stock */}
      {showAdjustModal && activeItem && (
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
