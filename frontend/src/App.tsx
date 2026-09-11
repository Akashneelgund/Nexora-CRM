import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout & Common Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/common/CommandPalette';
import { LowStockModal } from './components/common/LowStockModal';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { LeadDetailPage } from './pages/Leads/LeadDetailPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { SalesPage } from './pages/Sales/SalesPage';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { CallingPage } from './pages/Calling/CallingPage';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Loading NEXORA Suite...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          onOpenNewLead={() => setNewLeadModalOpen(true)}
          onOpenNewSale={() => setNewSaleModalOpen(true)}
          onOpenNewPayment={() => setRecordPaymentOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-[#0B0F19]">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  onOpenNewLead={() => setNewLeadModalOpen(true)}
                  onOpenNewSale={() => setNewSaleModalOpen(true)}
                  onOpenNewPayment={() => setRecordPaymentOpen(true)}
                />
              }
            />
            <Route
              path="/leads"
              element={
                <LeadsPage
                  isNewLeadModalOpen={newLeadModalOpen}
                  setIsNewLeadModalOpen={setNewLeadModalOpen}
                />
              }
            />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route
              path="/sales"
              element={
                <SalesPage
                  isNewSaleModalOpen={newSaleModalOpen}
                  setIsNewSaleModalOpen={setNewSaleModalOpen}
                />
              }
            />
            <Route
              path="/payments"
              element={
                <PaymentsPage
                  isRecordPaymentOpen={recordPaymentOpen}
                  setIsRecordPaymentOpen={setRecordPaymentOpen}
                />
              }
            />
            <Route path="/calling" element={<CallingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <MobileNav />
      </div>

      {/* Global Modals & Notifications */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
      <LowStockModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
