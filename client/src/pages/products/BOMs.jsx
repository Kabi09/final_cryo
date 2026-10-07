import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';

export default function BOMs() {
  const [boms, setBOMs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    product: '',
    title: '',
    version: 'V1',
    items: [
      { materialCode: 'RAW-SS-304', materialName: 'SS304 Sheet 1.2mm', quantity: 6, unit: 'Sheets', unitCost: 3200, workCenter: 'Fabrication' },
      { materialCode: 'RAW-COMP-15HP', materialName: 'Hermetic Compressor 1.5HP', quantity: 2, unit: 'Nos', unitCost: 42000, workCenter: 'Refrigeration' }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes] = await Promise.all([
        api.get('/boms'),
        api.get('/products')
      ]);
      setBOMs(bRes.data);
      setProducts(pRes.data);
      if (pRes.data.length > 0) {
        setFormData(prev => ({ ...prev, product: pRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/boms', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating BOM');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Bill of Materials (BOM / BOQ)</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Engineering component breakdowns, work centers, and version controls.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Define BOM
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>BOM #</th>
              <th>Product Model</th>
              <th>Version</th>
              <th>BOM Title</th>
              <th>Total Components</th>
              <th>Est. Build Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading BOMs...</td></tr>
            ) : boms.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No BOM definitions found.</td></tr>
            ) : (
              boms.map(bom => (
                <tr key={bom._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{bom.bomNumber}</td>
                  <td style={{ fontWeight: 600 }}>{bom.product?.name} ({bom.product?.model})</td>
                  <td><span className="status-badge info">{bom.version}</span></td>
                  <td>{bom.title}</td>
                  <td>{bom.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700 }}>₹{(bom.totalEstimatedCost || 0).toLocaleString('en-IN')}</td>
                  <td><span className="status-badge success">{bom.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBOM(bom)}>
                      <VisibilityIcon fontSize="inherit" /> View Items
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* BOM Detail Modal */}
      {selectedBOM && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>{selectedBOM.bomNumber} ({selectedBOM.version}) — Component Breakdown</h3>
              <button className="close-btn" onClick={() => setSelectedBOM(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '12px', fontSize: '13px' }}>
                <strong>Product:</strong> {selectedBOM.product?.name} • <strong>Total Est. Cost:</strong> ₹{selectedBOM.totalEstimatedCost.toLocaleString('en-IN')}
              </div>
              <div className="table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Name</th>
                      <th>Work Center</th>
                      <th>Qty / Unit</th>
                      <th>Unit Cost</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBOM.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.materialCode}</td>
                        <td>{item.materialName}</td>
                        <td><span className="status-badge neutral">{item.workCenter}</span></td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>₹{(item.unitCost || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700 }}>₹{((item.quantity || 1) * (item.unitCost || 0)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedBOM(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Define BOM Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Define Bill of Materials</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Product *</label>
                  <select className="form-control" value={formData.product} onChange={e => setFormData({ ...formData, product: e.target.value })}>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.model})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
                  <div className="form-group">
                    <label>BOM Title *</label>
                    <input className="form-control" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Standard Production BOM" />
                  </div>
                  <div className="form-group">
                    <label>Version</label>
                    <input className="form-control" value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })} placeholder="V1" />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B' }}>
                  Components will be initialized from engineering catalog templates and can be revised anytime.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
