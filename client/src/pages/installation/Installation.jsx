import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

export default function Installation() {
  const [installations, setInstallations] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [activeInst, setActiveInst] = useState(null);

  const [commissionData, setCommissionData] = useState({
    chamberAchievedTemp: '-81.4°C',
    ambientTemperature: '24.0°C',
    powerVoltage: '230V Steady',
    stabilizerInstalled: true,
    alarmCheckDone: true,
    userTrainingCompleted: true,
    customerSignoffName: 'Dr. Arun Kumar',
    customerSignoffDesignation: 'Principal Scientist / Lab In-Charge',
    remarks: 'Commissioning completed with perfect -80°C stability.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [iRes, wRes] = await Promise.all([
        api.get('/installations'),
        api.get('/warranties')
      ]);
      setInstallations(iRes.data);
      setWarranties(wRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCommission = (inst) => {
    setActiveInst(inst);
    setShowCommissionModal(true);
  };

  const handleCommission = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/installations/${activeInst._id}/commissioning`, {
        commissioningDetails: {
          chamberAchievedTemp: commissionData.chamberAchievedTemp,
          ambientTemperature: commissionData.ambientTemperature,
          powerVoltage: commissionData.powerVoltage,
          stabilizerInstalled: commissionData.stabilizerInstalled,
          alarmCheckDone: commissionData.alarmCheckDone,
          userTrainingCompleted: commissionData.userTrainingCompleted
        },
        customerSignoffName: commissionData.customerSignoffName,
        customerSignoffDesignation: commissionData.customerSignoffDesignation,
        remarks: commissionData.remarks
      });
      setShowCommissionModal(false);
      alert(`Commissioning completed! Warranty ${res.data.warranty?.warrantyNumber} officially activated.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Commissioning failed');
    }
  };

  const downloadWarranty = (id) => {
    window.open(`/api/warranties/${id}/pdf`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Site Installation, Commissioning & Warranty</h1>
        <p style={{ fontSize: '12px', color: '#64748B' }}>Field engineering protocols, pull-down stabilization readings, and 12-month manufacturer warranty activation.</p>
      </div>

      {/* Installations Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F2C59' }}>Site Commissioning Records</h2>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Inst #</th>
                <th>SO #</th>
                <th>Customer</th>
                <th>Serial Number</th>
                <th>Assigned Engineer</th>
                <th>Scheduled Date</th>
                <th>Achieved Temp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading installations...</td></tr>
              ) : installations.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No installations pending. Deliver a shipment to initiate scheduling.</td></tr>
              ) : (
                installations.map(inst => (
                  <tr key={inst._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{inst.installationNumber}</td>
                    <td style={{ fontWeight: 600 }}>{inst.soNumber}</td>
                    <td>{inst.customer?.name}</td>
                    <td style={{ fontWeight: 700 }}>{inst.serialNumber}</td>
                    <td>{inst.assignedEngineer}</td>
                    <td>{new Date(inst.scheduledDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      {inst.commissioningDetails?.chamberAchievedTemp || 'Testing Pending'}
                    </td>
                    <td>
                      <span className={`status-badge ${inst.status === 'COMMISSIONED_SUCCESS' ? 'success' : 'warning'}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td>
                      {inst.status !== 'COMMISSIONED_SUCCESS' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openCommission(inst)}>
                          <CheckCircleIcon fontSize="inherit" /> Complete & Activate Warranty
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Warranties Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F2C59', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SecurityIcon fontSize="small" /> Active Manufacturer Warranties
        </h2>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Warranty #</th>
                <th>Serial Number</th>
                <th>Customer</th>
                <th>Product Description</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {warranties.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No warranties active yet.</td></tr>
              ) : (
                warranties.map(war => (
                  <tr key={war._id}>
                    <td style={{ fontWeight: 700, color: '#0F2C59' }}>{war.warrantyNumber}</td>
                    <td style={{ fontWeight: 700 }}>{war.serialNumber}</td>
                    <td>{war.customer?.name}</td>
                    <td>{war.productName}</td>
                    <td>{new Date(war.startDate).toLocaleDateString()}</td>
                    <td>{new Date(war.endDate).toLocaleDateString()}</td>
                    <td><span className="status-badge success">{war.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadWarranty(war._id)}>
                        <PictureAsPdfIcon fontSize="inherit" /> Warranty Cert
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commissioning Modal */}
      {showCommissionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>Site Commissioning & Handover — {activeInst?.serialNumber}</h3>
              <button className="close-btn" onClick={() => setShowCommissionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCommission}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Stabilized Chamber Temperature *</label>
                    <input className="form-control" required value={commissionData.chamberAchievedTemp} onChange={e => setCommissionData({ ...commissionData, chamberAchievedTemp: e.target.value })} placeholder="-81.4°C" />
                  </div>
                  <div className="form-group">
                    <label>Ambient Room Temp</label>
                    <input className="form-control" value={commissionData.ambientTemperature} onChange={e => setCommissionData({ ...commissionData, ambientTemperature: e.target.value })} placeholder="24°C" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer Sign-off Representative *</label>
                    <input className="form-control" required value={commissionData.customerSignoffName} onChange={e => setCommissionData({ ...commissionData, customerSignoffName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Sign-off Designation *</label>
                    <input className="form-control" required value={commissionData.customerSignoffDesignation} onChange={e => setCommissionData({ ...commissionData, customerSignoffDesignation: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Commissioning Handover Remarks</label>
                  <textarea className="form-control" value={commissionData.remarks} onChange={e => setCommissionData({ ...commissionData, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCommissionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Sign-off & Activate 12-Month Warranty</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
