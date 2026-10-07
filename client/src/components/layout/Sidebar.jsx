import React from 'react';
import { NavLink } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import BuildIcon from '@mui/icons-material/Build';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import SecurityIcon from '@mui/icons-material/Security';
import AcUnitIcon from '@mui/icons-material/AcUnit';

export default function Sidebar() {
  const navGroups = [
    {
      title: 'CORE OVERVIEW',
      items: [
        { label: 'ERP Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> }
      ]
    },
    {
      title: 'COMMERCIAL SALES',
      items: [
        { label: 'Leads & Enquiries', path: '/sales/leads', icon: <TrendingUpIcon fontSize="small" /> },
        { label: 'Customer Directory', path: '/sales/customers', icon: <PeopleIcon fontSize="small" /> },
        { label: 'Quotations & Revisions', path: '/sales/quotations', icon: <RequestQuoteIcon fontSize="small" /> },
        { label: 'Proforma Invoices', path: '/sales/proformas', icon: <ReceiptIcon fontSize="small" /> },
        { label: 'Customer PO Verification', path: '/sales/customer-pos', icon: <AssignmentIcon fontSize="small" /> },
        { label: 'Sales Orders', path: '/sales/orders', icon: <ShoppingCartIcon fontSize="small" /> },
        { label: 'Payment Verifications', path: '/sales/payments', icon: <PaymentIcon fontSize="small" /> }
      ]
    },
    {
      title: 'PRODUCTS & ENGINEERING',
      items: [
        { label: 'Product Master & Pricing', path: '/products', icon: <Inventory2Icon fontSize="small" /> },
        { label: 'BOM & Version Control', path: '/products/boms', icon: <AccountTreeIcon fontSize="small" /> }
      ]
    },
    {
      title: 'MANUFACTURING & STORES',
      items: [
        { label: 'Production Orders', path: '/production', icon: <PrecisionManufacturingIcon fontSize="small" /> },
        { label: 'Inventory Stock Master', path: '/inventory', icon: <Inventory2Icon fontSize="small" /> },
        { label: 'Stock Movement Ledger', path: '/inventory/ledger', icon: <HistoryEduIcon fontSize="small" /> },
        { label: 'Procurement & GRN', path: '/procurement', icon: <ShoppingCartIcon fontSize="small" /> }
      ]
    },
    {
      title: 'QUALITY & FULFILLMENT',
      items: [
        { label: 'Quality Assurance & Testing', path: '/qa', icon: <VerifiedIcon fontSize="small" /> },
        { label: 'Dispatch & Shipments', path: '/dispatch', icon: <LocalShippingIcon fontSize="small" /> },
        { label: 'Installation & Warranty', path: '/installations', icon: <SecurityIcon fontSize="small" /> }
      ]
    },
    {
      title: 'AFTER-SALES SERVICE',
      items: [
        { label: 'Service Operations Desk', path: '/service', icon: <BuildIcon fontSize="small" /> }
      ]
    },
    {
      title: 'SYSTEM COMPLIANCE',
      items: [
        { label: 'Security & Audit Trail', path: '/audit', icon: <HistoryEduIcon fontSize="small" /> }
      ]
    }
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0B192C',
      color: '#94A3B8',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      userSelect: 'none',
      borderRight: '1px solid #1E293B'
    }}>
      {/* Brand Header */}
      <div style={{
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #1E293B',
        backgroundColor: '#071424'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: '#1E40AF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <AcUnitIcon style={{ fontSize: '20px' }} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.3px', lineHeight: 1.2 }}>
            CRYO SCIENTIFIC
          </div>
          <div style={{ fontSize: '10px', color: '#60A5FA', letterSpacing: '0.5px' }}>
            PRODUCTION ERP
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 8px'
      }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#475569',
              padding: '0 10px 4px 10px',
              letterSpacing: '0.6px'
            }}>
              {group.title}
            </div>
            {group.items.map((item, iIdx) => (
              <NavLink
                key={iIdx}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '4px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  backgroundColor: isActive ? '#1E40AF' : 'transparent',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  transition: 'background 120ms ease'
                })}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid #1E293B',
        fontSize: '10px',
        color: '#64748B',
        backgroundColor: '#071424',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>ISO 9001:2015 Mfg ERP</span>
        <span>v2.4.0</span>
      </div>
    </aside>
  );
}
