import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';

import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import LoginIcon from '@mui/icons-material/Login';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function Service() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // Forms
  const [createData, setCreateData] = useState({
    customerId: '',
    serialNumber: 'CRYO-ULT-2026-0091',
    complaintDescription: 'Chamber temperature alarm triggered; fluctuating between -72°C and -76°C.',
    priority: 'High'
  });

  const [scheduleData, setScheduleData] = useState({
    engineerName: 'Deepak Raj',
    engineerPhone: '+91 98402 99887',
    scheduledDate: ''
  });

  const [diagnosisData, setDiagnosisData] = useState({
    inspectionFindings: 'Stage 2 suction pressure sluggish. Expansion orifice partially restricted.',
    diagnosis: 'Faulty electronic expansion valve restricting R508B flow to secondary evaporator.',
    spareRequired: true,
    machineCondition: 'Compressor second stage staged off safely; awaiting replacement cryogenic valve.',
    itemCode: 'SPARE-EXP-VALV',
    itemName: 'Cryogenic Electronic Expansion Valve 0.5T',
    qty: 1
  });

  const [signoffData, setSignoffData] = useState({
    workDone: 'Replaced expansion valve and recharged R508B refrigerant blend. Tested pull-down.',
    requiredTemp: '-80.0°C',
    actualTemp: '-81.1°C',
    voltage: '230V',
    suctionPressure: '1.2 bar',
    dischargePressure: '14.8 bar',
    result: 'PASS',
    customerSignoffName: 'Dr. Arun Kumar',
    customerSignoffRemarks: 'Chamber successfully restored to -80°C operation. Verified.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        api.get('/service/tickets'),
        api.get('/customers')
      ]);
      setTickets(tRes.data);
      setCustomers(cRes.data);
      if (cRes.data.length > 0) {
        setCreateData(prev => ({ ...prev, customerId: cRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/service/tickets', createData);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging service ticket');
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/service/tickets/${activeTicket._id}/assign`, scheduleData);
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error scheduling visit');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/service/tickets/${activeTicket._id}/checkin`, {
        machineConditionOnArrival: 'Alarm triggered; chamber warm (-74°C)'
      });
      setShowCheckInModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleDiagnosis = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/service/tickets/${activeTicket._id}/diagnosis`, {
        inspectionFindings: diagnosisData.inspectionFindings,
        diagnosis: diagnosisData.diagnosis,
        spareRequired: diagnosisData.spareRequired,
        machineCondition: diagnosisData.machineCondition,
        spareDetails: diagnosisData.spareRequired ? [
          {
            itemCode: diagnosisData.itemCode,
            itemName: diagnosisData.itemName,
            qty: diagnosisData.qty
          }
        ] : []
      });

      setShowDiagnosisModal(false);
      if (res.data.waitingForSpare) {
        alert('Notice: Spare part is unavailable in store. Current machine condition documented and ticket moved to WAITING_FOR_SPARE without closing ticket. Automated PR generated.');
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Diagnosis submission failed');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/service/tickets/${activeTicket._id}/reschedule`, {
        scheduledDate: new Date(),
        engineerName: activeTicket.assignedEngineer
      });
      setShowRescheduleModal(false);
      alert('Spare parts received! Rescheduled Second Visit for repair execution.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Reschedule failed');
    }
  };

  const handleSignoff = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/service/tickets/${activeTicket._id}/signoff`, {
        workDone: signoffData.workDone,
        testReadings: {
          requiredTemp: signoffData.requiredTemp,
          actualTemp: signoffData.actualTemp,
          voltage: signoffData.voltage,
          suctionPressure: signoffData.suctionPressure,
          dischargePressure: signoffData.dischargePressure,
          result: signoffData.result
        },
        customerSignoffName: signoffData.customerSignoffName,
        customerSignoffRemarks: signoffData.customerSignoffRemarks
      });
      setShowSignoffModal(false);
      alert('Service successfully signed off by customer and ticket closed with official report!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Signoff failed');
    }
  };

  const downloadReport = (id) => {
    window.open(`/api/service/tickets/${id}/report-pdf`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>After-Sales Service Operations Desk</h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>Breakdown tickets, warranty checks, engineer check-in/out, multi-visit spare workflows, and testing sign-offs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddIcon fontSize="small" /> Log Customer Complaint
        </button>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer</th>
              <th>Serial Number</th>
              <th>Product Model</th>
              <th>Warranty Status</th>
              <th>Visits</th>
              <th>Assigned Engineer</th>
              <th>Ticket Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading service tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No service complaints logged.</td></tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket._id}>
                  <td style={{ fontWeight: 700, color: '#0F2C59' }}>{ticket.ticketNumber}</td>
                  <td style={{ fontWeight: 600 }}>{ticket.customerName}</td>
                  <td style={{ fontWeight: 700 }}>{ticket.serialNumber}</td>
                  <td>{ticket.model}</td>
                  <td>
                    <span className={`status-badge ${ticket.warrantyStatus === 'VALID_FREE' ? 'success' : 'warning'}`}>
                      {ticket.warrantyStatus === 'VALID_FREE' ? 'FREE (WARRANTY)' : 'CHARGEABLE'}
                    </span>
                  </td>
                  <td><span className="status-badge neutral">{ticket.visits?.length || 0} Visits</span></td>
                  <td>{ticket.assignedEngineer || 'Unassigned'}</td>
                  <td>
                    <span className={`status-badge ${ticket.status === 'CLOSED' ? 'success' : ticket.status === 'WAITING_FOR_SPARE' ? 'danger' : 'info'}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {ticket.status === 'OPEN' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTicket(ticket); setShowScheduleModal(true); }}>
                          Assign
                        </button>
                      )}

                      {ticket.status === 'SCHEDULED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTicket(ticket); setShowCheckInModal(true); }}>
                          <LoginIcon fontSize="inherit" /> Check-in
                        </button>
                      )}

                      {ticket.status === 'IN_PROGRESS' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTicket(ticket); setShowDiagnosisModal(true); }}>
                          <FactCheckIcon fontSize="inherit" /> Diagnose
                        </button>
                      )}

                      {ticket.status === 'WAITING_FOR_SPARE' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setActiveTicket(ticket); setShowRescheduleModal(true); }}>
                          <EventRepeatIcon fontSize="inherit" /> Spare Arrived (Visit 2)
                        </button>
                      )}

                      {(ticket.status === 'REPAIR' || ticket.status === 'RE_SCHEDULED') && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setActiveTicket(ticket); setShowSignoffModal(true); }}>
                          <CheckCircleOutlineIcon fontSize="inherit" /> Test & Sign-off
                        </button>
                      )}

                      {ticket.status === 'CLOSED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport(ticket._id)}>
                          <PictureAsPdfIcon fontSize="inherit" /> Report
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

      {/* Log Complaint Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Service Complaint / Ticket</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Account *</label>
                  <select className="form-control" value={createData.customerId} onChange={e => setCreateData({ ...createData, customerId: e.target.value })}>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.customerCode})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Equipment Serial Number *</label>
                  <input className="form-control" required value={createData.serialNumber} onChange={e => setCreateData({ ...createData, serialNumber: e.target.value })} placeholder="CRYO-ULT-2026-0091" />
                </div>
                <div className="form-group">
                  <label>Complaint / Failure Symptoms *</label>
                  <textarea className="form-control" required value={createData.complaintDescription} onChange={e => setCreateData({ ...createData, complaintDescription: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Urgency Priority</label>
                  <select className="form-control" value={createData.priority} onChange={e => setCreateData({ ...createData, priority: e.target.value })}>
                    <option value="Critical">Critical (Biological sample loss risk)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Service Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Service Engineer & Schedule Visit</h3>
              <button className="close-btn" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSchedule}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Assigned Field Engineer *</label>
                  <input className="form-control" required value={scheduleData.engineerName} onChange={e => setScheduleData({ ...scheduleData, engineerName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Engineer Mobile *</label>
                  <input className="form-control" required value={scheduleData.engineerPhone} onChange={e => setScheduleData({ ...scheduleData, engineerPhone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Visit Date & Time *</label>
                  <input className="form-control" type="datetime-local" required value={scheduleData.scheduledDate} onChange={e => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Engineer Site Check-In — {activeTicket?.ticketNumber}</h3>
              <button className="close-btn" onClick={() => setShowCheckInModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCheckIn}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Record engineer timestamped arrival at customer premises and log initial machine condition.
                </p>
                <div className="form-group">
                  <label>Machine Condition on Arrival *</label>
                  <textarea className="form-control" required defaultValue="Temperature alarm sounding; chamber warm (-74°C)" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Site Check-in</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnosis Modal (Handles Spare Check / Spare Unavailable) */}
      {showDiagnosisModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Site Diagnosis & Spare Check</h3>
              <button className="close-btn" onClick={() => setShowDiagnosisModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDiagnosis}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Inspection Findings *</label>
                  <input className="form-control" required value={diagnosisData.inspectionFindings} onChange={e => setDiagnosisData({ ...diagnosisData, inspectionFindings: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Technical Diagnosis *</label>
                  <textarea className="form-control" required value={diagnosisData.diagnosis} onChange={e => setDiagnosisData({ ...diagnosisData, diagnosis: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Are replacement spare parts required?</label>
                  <select className="form-control" value={diagnosisData.spareRequired ? 'yes' : 'no'} onChange={e => setDiagnosisData({ ...diagnosisData, spareRequired: e.target.value === 'yes' })}>
                    <option value="yes">YES — Spare Required (Will check store inventory)</option>
                    <option value="no">NO — Minor calibration / fix without parts</option>
                  </select>
                </div>

                {diagnosisData.spareRequired && (
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F2C59', marginBottom: '8px' }}>REQUIRED SPARE DETAILS</div>
                    <div className="form-group">
                      <label>Spare Part SKU Code</label>
                      <input className="form-control" value={diagnosisData.itemCode} onChange={e => setDiagnosisData({ ...diagnosisData, itemCode: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Part Description</label>
                      <input className="form-control" value={diagnosisData.itemName} onChange={e => setDiagnosisData({ ...diagnosisData, itemName: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Machine Staging Condition if Spare is Unavailable</label>
                      <input className="form-control" value={diagnosisData.machineCondition} onChange={e => setDiagnosisData({ ...diagnosisData, machineCondition: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDiagnosisModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Diagnosis & Check Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Visit Modal (Spare Arrived) */}
      {showRescheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Spare Arrived — Schedule Second Visit (Visit 2)</h3>
              <button className="close-btn" onClick={() => setShowRescheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleReschedule}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Procurement completed and replacement cryogenic spare has been issued by stores. Schedule Visit 2 for replacement and pull-down testing.
                </p>
                <div className="form-group">
                  <label>Visit 2 Date</label>
                  <input className="form-control" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Visit 2</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Readings & Customer Sign-off Modal */}
      {showSignoffModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Service Pull-Down Testing & Customer Sign-off</h3>
              <button className="close-btn" onClick={() => setShowSignoffModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSignoff}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Resolution Work Completed *</label>
                  <textarea className="form-control" required value={signoffData.workDone} onChange={e => setSignoffData({ ...signoffData, workDone: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Target Temp</label>
                    <input className="form-control" value={signoffData.requiredTemp} onChange={e => setSignoffData({ ...signoffData, requiredTemp: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Stabilized Temp *</label>
                    <input className="form-control" required value={signoffData.actualTemp} onChange={e => setSignoffData({ ...signoffData, actualTemp: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Test Result *</label>
                    <select className="form-control" value={signoffData.result} onChange={e => setSignoffData({ ...signoffData, result: e.target.value })}>
                      <option value="PASS">PASS (Conforms to Setpoint)</option>
                      <option value="FAIL">FAIL (Retest Required)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer Sign-off Name *</label>
                    <input className="form-control" required value={signoffData.customerSignoffName} onChange={e => setSignoffData({ ...signoffData, customerSignoffName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Customer Feedback Remarks</label>
                    <input className="form-control" value={signoffData.customerSignoffRemarks} onChange={e => setSignoffData({ ...signoffData, customerSignoffRemarks: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSignoffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Close Ticket & Generate Service Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
