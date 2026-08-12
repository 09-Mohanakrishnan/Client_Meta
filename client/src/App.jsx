import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateRangeProvider } from './context/DateRangeContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import CampaignsPage from './pages/CampaignsPage';
import AdSetsPage from './pages/AdSetsPage';
import AdsPage from './pages/AdsPage';
import ColumnConfigPage from './pages/ColumnConfigPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { RefreshCw } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to enforce authentication and roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <RefreshCw size={24} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DateRangeProvider>
            <Routes>
              {/* Public Access */}
              <Route path="/login" element={<LoginPage />} />

              {/* Console Internal Panel */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="adsets" element={<AdSetsPage />} />
                <Route path="ads" element={<AdsPage />} />

                {/* Column adjustments (Admins/SuperAdmins) */}
                <Route
                  path="columns"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <ColumnConfigPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin/User management settings (SuperAdmins) */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* Security modifications logging (SuperAdmins) */}
                <Route
                  path="audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <AuditLogsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Wildcard redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Notification Provider */}
            <Toaster position="top-right" richColors />
          </DateRangeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
