import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Layout from './components/layout/Layout.jsx';
import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';

// Sales
import Leads from './pages/sales/Leads.jsx';
import Customers from './pages/sales/Customers.jsx';
import Quotations from './pages/sales/Quotations.jsx';
import ProformaInvoices from './pages/sales/ProformaInvoices.jsx';
import CustomerPOs from './pages/sales/CustomerPOs.jsx';
import SalesOrders from './pages/sales/SalesOrders.jsx';
import Payments from './pages/sales/Payments.jsx';

// Products & Inventory
import Products from './pages/products/Products.jsx';
import BOMs from './pages/products/BOMs.jsx';
import Inventory from './pages/inventory/Inventory.jsx';
import StockLedger from './pages/inventory/StockLedger.jsx';

// Manufacturing, Quality & Dispatch
import Production from './pages/production/Production.jsx';
import Procurement from './pages/procurement/Procurement.jsx';
import QA from './pages/qa/QA.jsx';
import Dispatch from './pages/dispatch/Dispatch.jsx';

// Field & After-Sales
import Installation from './pages/installation/Installation.jsx';
import Service from './pages/service/Service.jsx';
import AuditLogs from './pages/audit/AuditLogs.jsx';

// Public Portals
import PublicQuotation from './pages/public/PublicQuotation.jsx';
import PublicOrderTracking from './pages/public/PublicOrderTracking.jsx';

function ProtectedRoute({ children }) {
  const { token } = useSelector(state => state.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Customer Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/quotation/view/:token" element={<PublicQuotation />} />
      <Route path="/track/:token" element={<PublicOrderTracking />} />

      {/* Internal Protected ERP Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        {/* Sales */}
        <Route path="sales/leads" element={<Leads />} />
        <Route path="sales/customers" element={<Customers />} />
        <Route path="sales/quotations" element={<Quotations />} />
        <Route path="sales/proformas" element={<ProformaInvoices />} />
        <Route path="sales/customer-pos" element={<CustomerPOs />} />
        <Route path="sales/orders" element={<SalesOrders />} />
        <Route path="sales/payments" element={<Payments />} />

        {/* Products */}
        <Route path="products" element={<Products />} />
        <Route path="products/boms" element={<BOMs />} />

        {/* Inventory */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/ledger" element={<StockLedger />} />

        {/* Production & Procurement */}
        <Route path="production" element={<Production />} />
        <Route path="procurement" element={<Procurement />} />

        {/* Quality, Dispatch, Installation & Warranty */}
        <Route path="qa" element={<QA />} />
        <Route path="dispatch" element={<Dispatch />} />
        <Route path="installations" element={<Installation />} />
        <Route path="warranties" element={<Installation />} />

        {/* Service */}
        <Route path="service" element={<Service />} />

        {/* Audit */}
        <Route path="audit" element={<AuditLogs />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
