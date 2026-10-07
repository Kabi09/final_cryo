import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import TuneIcon from '@mui/icons-material/Tune';

export default function Products() {
  const { user } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: 'Ultra Low Temperature Freezer',
    model: '',
    brand: 'Cryo Scientific',
    description: '',
    baseCost: '',
    minSellingPrice: '',
    sellingPrice: '',
    taxRate: 18,
    warrantyMonths: 12
  });

  const [priceData, setPriceData] = useState({
    sellingPrice: '',
    minSellingPrice: '',
    baseCost: '',
    taxRate: 18,
    reason: ''
  });

  useEffect(() => {
    fetchProducts();
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setShowCreateModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const openPriceModal = (prod) => {
    setActiveProduct(prod);
    setPriceData({
      sellingPrice: prod.sellingPrice,
      minSellingPrice: prod.minSellingPrice,
      baseCost: prod.baseCost,
      taxRate: prod.taxRate,
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

  const isPriceEditAllowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SALES_MANAGER', 'MANAGEMENT'].includes(user?.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Scientific Products & Equipment Master</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Equipment specifications, dynamic technical parameters, and RBAC-protected pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Add Product Model
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Code / Model</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Base Cost</th>
              <th>Min. Selling Price</th>
              <th>Catalog Price</th>
              <th>Warranty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No products found.</td></tr>
            ) : (
              products.map(prod => (
                <tr key={prod._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{prod.model}</td>
                  <td style={{ fontWeight: 600 }}>{prod.name}</td>
                  <td><span className="status-badge info">{prod.category}</span></td>
                  <td style={{ fontWeight: 700 }}>{prod.currentStock} {prod.unit}</td>
                  <td style={{ color: '#64748B' }}>₹{Number(prod.baseCost || 0).toLocaleString('en-IN')}</td>
                  <td style={{ color: '#64748B' }}>₹{Number(prod.minSellingPrice || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>₹{Number(prod.sellingPrice || 0).toLocaleString('en-IN')}</td>
                  <td>{prod.warrantyMonths} Months</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => openPriceModal(prod)}
                        title={isPriceEditAllowed ? "Update Pricing (RBAC Protected)" : "Pricing Edit Restricted to Finance/Admin"}
                      >
                        <PriceChangeIcon fontSize="inherit" /> Update Price
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Price Modal (RBAC Protected) */}
      {showPriceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Commercial Pricing — {activeProduct?.model}</h3>
              <button className="close-btn" onClick={() => setShowPriceModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePriceUpdate}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '12.5px' }}>
                  <div><strong>Product:</strong> {activeProduct?.name}</div>
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>Add Equipment Product Model</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Product Model Code *</label>
                    <input className="form-control" required value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value, model: e.target.value })} placeholder="CFS-ULT-700" />
                  </div>
                  <div className="form-group">
                    <label>Equipment Category *</label>
                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="Ultra Low Temperature Freezer">Ultra Low Temperature Freezer (-80°C)</option>
                      <option value="Deep Freezer">Biomedical Deep Freezer (-40°C)</option>
                      <option value="Blood Bank Refrigerator">Blood Bank Refrigerator (+4°C)</option>
                      <option value="Plasma Freezer">Plasma Freezer (-30°C)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Product Name *</label>
                  <input className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ultra Low Temperature Freezer 700L" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Base Cost (₹)</label>
                    <input className="form-control" type="number" required value={formData.baseCost} onChange={e => setFormData({ ...formData, baseCost: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Min Price (₹)</label>
                    <input className="form-control" type="number" required value={formData.minSellingPrice} onChange={e => setFormData({ ...formData, minSellingPrice: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Selling Price (₹)</label>
                    <input className="form-control" type="number" required value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
