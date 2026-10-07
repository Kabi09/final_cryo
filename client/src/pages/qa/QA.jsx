import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { openPdfDocument } from '../../utils/pdfHelper.js';

import VerifiedIcon from '@mui/icons-material/Verified';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FactCheckIcon from '@mui/icons-material/FactCheck';

export default function QA() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQA, setSelectedQA] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [testResult, setTestResult] = useState({
    overallResult: 'PASS',
    rectificationNotes: ''
  });

  useEffect(() => {
    fetchQA();
  }, []);

  const fetchQA = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qa');
      setInspections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openSubmit = (qa) => {
    setSelectedQA(qa);
    setTestResult({
      overallResult: 'PASS',
      rectificationNotes: ''
    });
    setShowSubmitModal(true);
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/qa/${selectedQA._id}/submit`, testResult);
      setShowSubmitModal(false);
      alert(`QA certification processed. Serial Number: ${res.data.assignedSerialNumber || 'N/A'}`);
      fetchQA();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting QA result');
    }
  };

  const downloadCert = (id, certNumber) => {
    openPdfDocument(`/qa/${id}/certificate-pdf`, `${certNumber || 'QA-Cert'}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Quality Assurance & Cryogenic Testing</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Pull-down curve calibration, vacuum integrity, hi-pot dielectric tests, and serialization.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>QA #</th>
              <th>Prod Order</th>
              <th>Product Model</th>
              <th>Assigned Serial #</th>
              <th>Certificate #</th>
              <th>Inspector</th>
              <th>Date</th>
              <th>Overall Result</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading QA records...</td></tr>
            ) : inspections.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No inspections logged yet. Complete a production order to trigger QA.</td></tr>
            ) : (
              inspections.map(qa => (
                <tr key={qa._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{qa.qaNumber}</td>
                  <td style={{ fontWeight: 600 }}>{qa.productionNumber}</td>
                  <td>{qa.productName} ({qa.model})</td>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{qa.assignedSerialNumber || 'Pending Pass'}</td>
                  <td>{qa.certificateNumber || 'Pending'}</td>
                  <td>{qa.inspectorName}</td>
                  <td>{new Date(qa.inspectedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${qa.overallResult === 'PASS' ? 'success' : 'danger'}`}>
                      {qa.overallResult}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openSubmit(qa)}>
                        <FactCheckIcon fontSize="inherit" /> Test Readings
                      </button>

                      {qa.certificateNumber && (
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadCert(qa._id)} title="Download Quality Certificate">
                          <PictureAsPdfIcon fontSize="inherit" /> Cert
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

      {/* Test Readings & Certification Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3>Quality Inspection Protocol — {selectedQA?.productionNumber}</h3>
              <button className="close-btn" onClick={() => setShowSubmitModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitResult}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px' }}>
                  <div><strong>Equipment:</strong> {selectedQA?.productName} ({selectedQA?.model})</div>
                  <div><strong>Current Serial Number:</strong> {selectedQA?.assignedSerialNumber || 'Will be assigned automatically upon certification'}</div>
                </div>

                <div className="table-container" style={{ marginBottom: '16px' }}>
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Test Parameter</th>
                        <th>Standard Specification</th>
                        <th>Recorded Reading</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQA?.parameters?.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.parameter}</td>
                          <td style={{ color: '#475569' }}>{p.specification}</td>
                          <td style={{ fontWeight: 700, color: '#0F2C59' }}>{p.actualReading}</td>
                          <td><span className="status-badge success">{p.result}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="form-group">
                  <label>Overall Quality Verdict *</label>
                  <select className="form-control" value={testResult.overallResult} onChange={e => setTestResult({ ...testResult, overallResult: e.target.value })}>
                    <option value="PASS">PASS (Certify & Assign Factory Serial Number)</option>
                    <option value="FAIL">FAIL (Hold for Engineering Rectification)</option>
                  </select>
                </div>

                {testResult.overallResult === 'FAIL' && (
                  <div className="form-group">
                    <label style={{ color: '#DC2626' }}>Rectification Notes *</label>
                    <textarea className="form-control" required value={testResult.rectificationNotes} onChange={e => setTestResult({ ...testResult, rectificationNotes: e.target.value })} placeholder="Document failure points for rework..." />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <VerifiedIcon fontSize="small" /> Certify & Release to Finished Goods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
