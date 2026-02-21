import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute     from './components/GuestRoute';

// ── System pages ────────────────────────────────────────────────────────────────
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import SignupPage         from './pages/SignupPage';
import AdminPage          from './pages/AdminPage';
import ManagerDashboard   from './pages/ManagerDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import DashboardPage      from './pages/DashboardPage';   // fallback

// ── Driver pages ────────────────────────────────────────────────────────────────
import DriverRegisterPage  from './pages/DriverRegisterPage';
import DriverLoginPage     from './pages/DriverLoginPage';
import DriverDashboardPage from './pages/DriverDashboardPage';

const TOAST_STYLE = {
  background: '#1a1a2e',
  color: '#f1f1f8',
  border: '1px solid rgba(99,102,241,0.25)',
  borderRadius: '12px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '12px 16px',
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: TOAST_STYLE,
            success: { iconTheme: { primary: '#10b981', secondary: '#1a1a2e' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
          }}
        />

        <Routes>
          {/* ── Public — Landing ─────────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Unified login for ALL roles: ADMIN/MANAGER/DISPATCHER/DRIVER ─── */}
          <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />

          {/* ── Dispatcher self-signup ────────────────────────────────────────── */}
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

          {/* ────────────────────────────────────────────────────────────────────
              ROLE-SPECIFIC DASHBOARDS
              Each role lands on its own page after login
          ─────────────────────────────────────────────────────────────────────── */}

          {/* ADMIN → /admin */}
          <Route path="/admin"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPage /></ProtectedRoute>} />

          {/* MANAGER → /manager/dashboard */}
          <Route path="/manager/dashboard"
            element={<ProtectedRoute allowedRoles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />

          {/* DISPATCHER → /dispatcher/dashboard */}
          <Route path="/dispatcher/dashboard"
            element={<ProtectedRoute allowedRoles={['DISPATCHER']}><DispatcherDashboard /></ProtectedRoute>} />

          {/* Generic /dashboard (fallback — role-aware) */}
          <Route path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* ────────────────────────────────────────────────────────────────────
              DRIVER ROUTES — no system auth, uses separate driver JWT
          ─────────────────────────────────────────────────────────────────────── */}
          <Route path="/driver/register"  element={<DriverRegisterPage />} />
          <Route path="/driver/login"     element={<DriverLoginPage />} />
          <Route path="/driver/dashboard" element={<DriverDashboardPage />} />

          {/* 404 → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
