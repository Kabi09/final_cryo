import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export default function Products() {
  const { user } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    model: '',
    name: '',
    productCode: '',
    sellingPrice: '',
    warranty: '2 Years',
    category: 'Ultra Low Temperature Freezer',
    description: '',
    unit: 'Units',
    specifications: [
      { label: 'Operating Temperature', value: '-86°C to -50°C' },
      { label: 'Capacity', value: '700 Liters' }
    ],
    active: true
  });

  const [priceData, setPriceData] = useState({
    sellingPrice: '',
    minSellingPrice: '',
    baseCost: '',
    taxRate: 18,
    reason: ''
  });

  // Materials Mapping state for active product
  const [productMaterials, setProductMaterials] = useState([]);
  const [newMaterialRow, setNewMaterialRow] = useState({
    materialId: '',
    quantity: 1,
    unit: 'Nos',
    isRequired: true,
    alternativeMaterialId: '',
    remarks: ''
  });

  // Specs state for active product
  const [productSpecs, setProductSpecs] = useState([]);
  const [newSpecRow, setNewSpecRow] = useState({ label: '', value: '' });

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventoryList(res.data);
    } catch (err) {
      console.error('Error fetching inventory items for mapping:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...formData,
        baseCost: formData.baseCost || Number(formData.sellingPrice) * 0.6,
        minSellingPrice: formData.minSellingPrice || Number(formData.sellingPrice) * 0.9,
        warrantyMonths: formData.warranty.includes('2') ? 24 : 12
      });
      setShowCreateModal(false);
      resetFormData();
      fetchProducts();
      alert('Product created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const resetFormData = () => {
    setFormData({
      model: '',
      name: '',
      productCode: '',
      sellingPrice: '',
      warranty: '2 Years',
      category: 'Ultra Low Temperature Freezer',
      description: '',
      unit: 'Units',
      specifications: [
        { label: 'Operating Temperature', value: '-86°C to -50°C' },
        { label: 'Capacity', value: '700 Liters' }
      ],
      active: true
    });
  };

  // Open Materials Modal
  const openMaterialsModal = (prod) => {
    setActiveProduct(prod);
    const existing = (prod.requiredMaterials || []).map(rm => ({
      material: rm.material?._id || rm.material,
      materialCode: rm.material?.itemCode || rm.materialCode,
      materialName: rm.material?.itemName || rm.materialName,
      quantity: rm.quantity,
      unit: rm.unit,
      isRequired: rm.isRequired !== false,
      alternativeMaterial: rm.alternativeMaterial?._id || rm.alternativeMaterial || '',
      alternativeName: rm.alternativeMaterial?.itemName || '',
      remarks: rm.remarks || ''
    }));
    setProductMaterials(existing);
    setNewMaterialRow({
      materialId: '',
      quantity: 1,
      unit: 'Nos',
      isRequired: true,
      alternativeMaterialId: '',
      remarks: ''
    });
    setShowMaterialsModal(true);
  };

  // Add row to materials mapping
  const handleAddMaterialRow = () => {
    if (!newMaterialRow.materialId) {
      alert('Please select an inventory material item.');
      return;
    }
    const inv = inventoryList.find(i => i._id === newMaterialRow.materialId);
    if (!inv) return;

    if (productMaterials.some(m => m.material === inv._id)) {
      alert('This material is already added to the product BOM. You can modify its quantity.');
      return;
    }

    const altInv = newMaterialRow.alternativeMaterialId 
      ? inventoryList.find(i => i._id === newMaterialRow.alternativeMaterialId) 
      : null;

    setProductMaterials([
      ...productMaterials,
      {
        material: inv._id,
        materialCode: inv.itemCode,
        materialName: inv.itemName,
        quantity: Number(newMaterialRow.quantity),
        unit: newMaterialRow.unit || inv.unit,
        isRequired: newMaterialRow.isRequired,
        alternativeMaterial: altInv ? altInv._id : undefined,
        alternativeName: altInv ? altInv.itemName : '',
        remarks: newMaterialRow.remarks || ''
      }
    ]);

    setNewMaterialRow({
      materialId: '',
      quantity: 1,
      unit: 'Nos',
      isRequired: true,
      alternativeMaterialId: '',
      remarks: ''
    });
  };

  const handleRemoveMaterialRow = (idx) => {
    setProductMaterials(productMaterials.filter((_, i) => i !== idx));
  };

  const handleSaveMaterials = async () => {
    try {
      const payload = {
        requiredMaterials: productMaterials.map(pm => ({
          material: pm.material,
          materialCode: pm.materialCode,
          materialName: pm.materialName,
          quantity: pm.quantity,
          unit: pm.unit,
          isRequired: pm.isRequired,
          alternativeMaterial: pm.alternativeMaterial || undefined,
          remarks: pm.remarks
        }))
      };
      await api.put(`/products/${activeProduct._id}/materials`, payload);
      alert('Product material requirements & BOM successfully mapped!');
      setShowMaterialsModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating materials');
    }
  };

  // Open Price Modal
  const openPriceModal = (prod) => {
    setActiveProduct(prod);
    setPriceData({
      sellingPrice: prod.sellingPrice,
      minSellingPrice: prod.minSellingPrice,
      baseCost: prod.baseCost,
      taxRate: prod.taxRate || 18,
      reason: 'Commercial price revision approved by executive management'
    });
    setShowPriceModal(true);
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${activeProduct._id}/price`, priceData);
      setShowPriceModal(false);
      alert('Product pricing updated successfully!');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Access Denied: Role lacks pricing permissions.');
    }
  };

  // Open Specs Modal
  const openSpecsModal = (prod) => {
    setActiveProduct(prod);
    setProductSpecs(prod.specifications || []);
    setNewSpecRow({ label: '', value: '' });
    setShowSpecsModal(true);
  };

  const handleAddSpecRow = () => {
    if (!newSpecRow.label.trim() || !newSpecRow.value.trim()) {
      alert('Please provide both specification label and value.');
      return;
    }
    setProductSpecs([...productSpecs, { label: newSpecRow.label.trim(), value: newSpecRow.value.trim() }]);
    setNewSpecRow({ label: '', value: '' });
  };

  const handleRemoveSpecRow = (idx) => {
    setProductSpecs(productSpecs.filter((_, i) => i !== idx));
  };

  const handleSaveSpecs = async () => {
    try {
      await api.put(`/products/${activeProduct._id}`, { specifications: productSpecs });
      alert('Product specifications saved successfully!');
      setShowSpecsModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating specifications');
    }
  };

  const isPriceEditAllowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SALES_MANAGER', 'MANAGEMENT'].includes(user?.role);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = searchTerm === '' || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === '' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Product Master & Material Requirements</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            Equipment models, selling prices, warranty, technical specifications, and multi-item inventory material mapping.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Add Product Model
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          className="form-control" 
          style={{ maxWidth: '300px' }}
          placeholder="Search by Model, Name, or Code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="form-control" 
          style={{ maxWidth: '260px' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Ultra Low Temperature Freezer">Ultra Low Temperature Freezer</option>
          <option value="Deep Freezer">Deep Freezer</option>
          <option value="Blood Bank Refrigerator">Blood Bank Refrigerator</option>
          <option value="Plasma Freezer">Plasma Freezer</option>
          <option value="Cryo Storage Container">Cryo Storage Container</option>
          <option value="Mortuary Chamber">Mortuary Chamber</option>
          <option value="Laboratory Refrigerator">Laboratory Refrigerator</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Product Name</th>
              <th>Product Code</th>
              <th>Selling Price</th>
              <th>Warranty</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Required Materials</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>Loading products...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No products found matching filters.</td></tr>
            ) : (
              filteredProducts.map(prod => {
                const materialsCount = prod.requiredMaterials?.length || 0;
                return (
                  <tr key={prod._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{prod.model}</td>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{prod.productCode}</td>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>₹{Number(prod.sellingPrice || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px' }}>{prod.warranty || `${prod.warrantyMonths || 12} Months`}</td>
                    <td><span className="status-badge info">{prod.category}</span></td>
                    <td style={{ fontSize: '12px', color: '#64748B' }}>{prod.unit || 'Units'}</td>
                    <td>
                      <span className={`status-badge ${materialsCount > 0 ? 'success' : 'neutral'}`} style={{ cursor: 'pointer' }} onClick={() => openMaterialsModal(prod)}>
                        {materialsCount} Items Mapped
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${prod.active !== false ? 'success' : 'neutral'}`}>
                        {prod.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openMaterialsModal(prod)}
                          title="Configure Multi-Select Materials & BOM"
                        >
                          <AccountTreeIcon fontSize="inherit" /> Materials ({materialsCount})
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openSpecsModal(prod)}
                          title="View & Edit Technical Specifications"
                        >
                          <ListAltIcon fontSize="inherit" /> Specs
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openPriceModal(prod)}
                          title="Update Selling & Catalog Price"
                        >
                          <PriceChangeIcon fontSize="inherit" /> Price
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

      {/* Modal 1: Configure Required Materials (Product ↔ Inventory Mapping) */}
      {showMaterialsModal && activeProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Configure Materials for {activeProduct.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Model: <strong>{activeProduct.model}</strong> | Code: <strong>{activeProduct.productCode}</strong> | Selling Price: <strong>₹{Number(activeProduct.sellingPrice || 0).toLocaleString('en-IN')}</strong>
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowMaterialsModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '12.5px', color: '#0369A1' }}>
                <strong>Product-Material Mapping:</strong> Link multiple raw materials, compressors, refrigerants, and components from the Inventory master to this product model. This mapping powers automatic BOM generation, inventory stock checks, shortage calculations, and procurement requisitions.
              </div>

              {/* Table of mapped materials */}
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#0F2C59' }}>
                Required Materials List ({productMaterials.length})
              </h4>
              <div className="table-container" style={{ marginBottom: '16px' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Name</th>
                      <th>Required Qty</th>
                      <th>Unit</th>
                      <th>Type</th>
                      <th>Alternative Material</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productMaterials.length === 0 ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: '#64748B' }}>No materials mapped yet. Use the form below to add materials.</td></tr>
                    ) : (
                      productMaterials.map((m, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: '#0F2C59' }}>{m.materialCode}</td>
                          <td style={{ fontWeight: 600 }}>{m.materialName}</td>
                          <td style={{ fontWeight: 700 }}>{m.quantity}</td>
                          <td>{m.unit}</td>
                          <td>
                            <span className={`status-badge ${m.isRequired ? 'info' : 'neutral'}`}>
                              {m.isRequired ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748B' }}>{m.alternativeName || '—'}</td>
                          <td style={{ fontSize: '12px', color: '#64748B' }}>{m.remarks || '—'}</td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleRemoveMaterialRow(idx)}
                              title="Remove Material"
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form to Add a Material */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#0F172A' }}>
                  + Add Required Material / Inventory Item
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Select Inventory Material *</label>
                    <select 
                      className="form-control"
                      value={newMaterialRow.materialId}
                      onChange={e => {
                        const sel = inventoryList.find(i => i._id === e.target.value);
                        setNewMaterialRow({
                          ...newMaterialRow,
                          materialId: e.target.value,
                          unit: sel ? sel.unit : newMaterialRow.unit
                        });
                      }}
                    >
                      <option value="">-- Choose Material from Stores Inventory --</option>
                      {inventoryList.map(inv => (
                        <option key={inv._id} value={inv._id}>
                          {inv.itemCode} — {inv.itemName} ({inv.materialType || inv.category}) [Avail: {inv.currentStock - inv.reservedStock} {inv.unit}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Quantity per Product *</label>
                    <input 
                      type="number" 
                      step="any"
                      min="0.01"
                      className="form-control"
                      value={newMaterialRow.quantity}
                      onChange={e => setNewMaterialRow({ ...newMaterialRow, quantity: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Unit</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newMaterialRow.unit}
                      onChange={e => setNewMaterialRow({ ...newMaterialRow, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Requirement Type</label>
                    <select 
                      className="form-control"
                      value={newMaterialRow.isRequired ? 'REQUIRED' : 'OPTIONAL'}
                      onChange={e => setNewMaterialRow({ ...newMaterialRow, isRequired: e.target.value === 'REQUIRED' })}
                    >
                      <option value="REQUIRED">Required</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Alternative Material (Optional)</label>
                    <select 
                      className="form-control"
                      value={newMaterialRow.alternativeMaterialId}
                      onChange={e => setNewMaterialRow({ ...newMaterialRow, alternativeMaterialId: e.target.value })}
                    >
                      <option value="">-- None --</option>
                      {inventoryList
                        .filter(i => i._id !== newMaterialRow.materialId)
                        .map(inv => (
                          <option key={inv._id} value={inv._id}>
                            {inv.itemCode} — {inv.itemName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Specification / Remarks</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Dual Stage Hermetic, Pre-charged"
                      value={newMaterialRow.remarks}
                      onChange={e => setNewMaterialRow({ ...newMaterialRow, remarks: e.target.value })}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleAddMaterialRow}
                    style={{ height: '36px' }}
                  >
                    <AddIcon fontSize="small" /> Add
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialsModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveMaterials}>
                Save Materials Mapping ({productMaterials.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Technical Specifications */}
      {showSpecsModal && activeProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Technical Specifications — {activeProduct.name}</h3>
              <button className="close-btn" onClick={() => setShowSpecsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="table-container" style={{ marginBottom: '16px' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Specification Label</th>
                      <th>Value / Rating</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSpecs.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '14px', color: '#64748B' }}>No specifications configured yet.</td></tr>
                    ) : (
                      productSpecs.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{s.label}</td>
                          <td>{s.value}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveSpecRow(idx)}>
                              <DeleteOutlineIcon fontSize="inherit" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Parameter (e.g. Voltage, Temp)"
                  value={newSpecRow.label}
                  onChange={e => setNewSpecRow({ ...newSpecRow, label: e.target.value })}
                />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Value (e.g. 230V / 50Hz, -86°C)"
                  value={newSpecRow.value}
                  onChange={e => setNewSpecRow({ ...newSpecRow, value: e.target.value })}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddSpecRow}>
                  Add
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowSpecsModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveSpecs}>Save Specifications</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Update Price Modal (RBAC Protected) */}
      {showPriceModal && activeProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Commercial Pricing — {activeProduct.model}</h3>
              <button className="close-btn" onClick={() => setShowPriceModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePriceUpdate}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '12.5px' }}>
                  <div><strong>Product:</strong> {activeProduct.name}</div>
                  <div><strong>Logged-in Role:</strong> <span className="status-badge info">{user?.role}</span></div>
                  {!isPriceEditAllowed && (
                    <div style={{ color: '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                      Notice: Your active role does not possess commercial pricing write permissions.
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Catalog Selling Price (₹) *</label>
                    <input className="form-control" type="number" required value={priceData.sellingPrice} onChange={e => setPriceData({ ...priceData, sellingPrice: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Minimum Selling Floor (₹) *</label>
                    <input className="form-control" type="number" required value={priceData.minSellingPrice} onChange={e => setPriceData({ ...priceData, minSellingPrice: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Base Manufacturing Cost (₹) *</label>
                    <input className="form-control" type="number" required value={priceData.baseCost} onChange={e => setPriceData({ ...priceData, baseCost: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Applicable GST Rate (%)</label>
                    <input className="form-control" type="number" value={priceData.taxRate} onChange={e => setPriceData({ ...priceData, taxRate: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Audit Justification / Approval Notes *</label>
                  <textarea className="form-control" required value={priceData.reason} onChange={e => setPriceData({ ...priceData, reason: e.target.value })} placeholder="Reason for price change..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPriceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!isPriceEditAllowed}>
                  Save & Log Price Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Create Product Model */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Add Product Model</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Product Model *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={formData.model} 
                      onChange={e => setFormData({ 
                        ...formData, 
                        model: e.target.value,
                        productCode: formData.productCode || `PRD-${e.target.value.toUpperCase().replace(/\s+/g, '-')}` 
                      })} 
                      placeholder="e.g. CS-ULT-80" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Code *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={formData.productCode} 
                      onChange={e => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })} 
                      placeholder="e.g. PRD-ULT-80" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Name *</label>
                  <input 
                    className="form-control" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. -80°C Ultra Low Temperature Freezer 700L" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Category *</label>
                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="Ultra Low Temperature Freezer">Ultra Low Temperature Freezer</option>
                      <option value="Deep Freezer">Deep Freezer</option>
                      <option value="Blood Bank Refrigerator">Blood Bank Refrigerator</option>
                      <option value="Plasma Freezer">Plasma Freezer</option>
                      <option value="Cryo Storage Container">Cryo Storage Container</option>
                      <option value="Mortuary Chamber">Mortuary Chamber</option>
                      <option value="Laboratory Refrigerator">Laboratory Refrigerator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Selling Price (₹) *</label>
                    <input 
                      className="form-control" 
                      type="number" 
                      required 
                      value={formData.sellingPrice} 
                      onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} 
                      placeholder="500000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Warranty *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={formData.warranty} 
                      onChange={e => setFormData({ ...formData, warranty: e.target.value })} 
                      placeholder="e.g. 2 Years" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Unit of Measure *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={formData.unit} 
                      onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                      placeholder="Units / Nos / Set" 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.active} 
                        onChange={e => setFormData({ ...formData, active: e.target.checked })} 
                      />
                      Active Product
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Technical description, build characteristics, insulation profile..." 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Product Master</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
