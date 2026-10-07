import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading real-time enterprise metrics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>Manufacturing & Operations Command</h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Real-time production, commercial sales, quality control, and field service tracking.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/sales/leads')}>
            <AddCircleOutlineIcon fontSize="small" /> New Lead
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sales/quotations')}>
            <AddCircleOutlineIcon fontSize="small" /> Create Quotation
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/service')}>
            <BuildIcon fontSize="small" /> Service Desk
          </button>
        </div>
      </div>

      {/* 1. Commercial Sales & Financial Health */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', marginBottom: '10px' }}>
          COMMERCIAL SALES & FINANCIAL PIPELINE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <div className="stat-card" onClick={() => navigate('/sales/leads')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Active Leads</span>
            <span className="stat-value">{stats?.sales?.openLeads || 0}</span>
            <span className="stat-sub">Direct inquiries in qualification</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/sales/quotations')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Quotation Pipeline Value</span>
            <span className="stat-value">₹{(stats?.sales?.totalQuotationValue || 0).toLocaleString('en-IN')}</span>
            <span className="stat-sub">{stats?.sales?.openQuotations || 0} quotes under review</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/sales/orders')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Confirmed Orders (Won)</span>
            <span className="stat-value">{stats?.sales?.wonOrders || 0}</span>
            <span className="stat-sub">Order Value: ₹{(stats?.sales?.totalSalesOrderValue || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/sales/payments')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Advance Verified</span>
            <span className="stat-value" style={{ color: '#059669' }}>₹{(stats?.sales?.totalPaymentsReceived || 0).toLocaleString('en-IN')}</span>
            <span className="stat-sub">Pending Due: ₹{(stats?.sales?.pendingPayments || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 2. Production & Manufacturing Floor */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', marginBottom: '10px' }}>
          PLANT PRODUCTION & INVENTORY STORES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <div className="stat-card" onClick={() => navigate('/production')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Active Manufacturing</span>
            <span className="stat-value">{stats?.production?.activeProduction || 0} Orders</span>
            <span className="stat-sub">{stats?.production?.completedProduction || 0} Orders Completed</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/production')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Material Shortages</span>
            <span className="stat-value" style={{ color: stats?.production?.materialShortages > 0 ? '#DC2626' : '#059669' }}>
              {stats?.production?.materialShortages || 0} Alerts
            </span>
            <span className="stat-sub">Automated PR triggers initiated</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Low Stock Inventory</span>
            <span className="stat-value" style={{ color: stats?.inventory?.lowStockCount > 0 ? '#D97706' : '#059669' }}>
              {stats?.inventory?.lowStockCount || 0} SKUs
            </span>
            <span className="stat-sub">Out of {stats?.inventory?.totalItems || 0} store items</span>
          </div>

          <div className="stat-card" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
            <span className="stat-label">Store Inventory Value</span>
            <span className="stat-value">₹{(stats?.inventory?.totalStockValue || 0).toLocaleString('en-IN')}</span>
            <span className="stat-sub">Raw materials, compressors & spares</span>
          </div>
        </div>
      </div>

      {/* 3. Quality, Dispatch & Field Service Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Quality & Dispatch */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <VerifiedIcon style={{ fontSize: '18px', color: '#2563EB' }} /> Quality Assurance & Logistics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>QA Inspected & Certified (PASS):</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>{stats?.quality?.qaPassed || 0} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Finished Units Ready to Dispatch:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{stats?.dispatch?.readyForDispatch || 0} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Shipments Currently In Transit:</span>
              <span style={{ fontWeight: 700, color: '#2563EB' }}>{stats?.dispatch?.inTransitShipments || 0} consignments</span>
            </div>
          </div>
        </div>

        {/* Service Operations Desk */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BuildIcon style={{ fontSize: '18px', color: '#059669' }} /> After-Sales Field Service
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Open Service Complaints:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{stats?.service?.openServiceTickets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WarningAmberIcon style={{ fontSize: '16px', color: '#D97706' }} /> Waiting for Spare Parts:
              </span>
              <span style={{ fontWeight: 700, color: '#D97706' }}>{stats?.service?.waitingForSpareTickets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Resolved & Closed Tickets:</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>{stats?.service?.closedTickets || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real System Audit Trail Feed */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
          Recent Operations Audit Trail
        </div>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity / ID</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>No recent activity logged.</td></tr>
              ) : (
                stats.recentActivity.map(act => (
                  <tr key={act._id}>
                    <td><span className="status-badge info">{act.action}</span></td>
                    <td style={{ fontWeight: 600 }}>{act.entityNumber || act.entityType}</td>
                    <td>{act.performedBy}</td>
                    <td><span className="status-badge neutral">{act.userRole}</span></td>
                    <td style={{ maxWidth: '380px' }}>{act.details}</td>
                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
