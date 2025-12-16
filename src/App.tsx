import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { RoomProvider } from './contexts/RoomContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy load other pages
const AdminRoomsPage = lazy(() => import('./pages/admin/RoomsPage'));
const AdminRoomEditPage = lazy(() => import('./pages/admin/AdminRoomEditPage'));
const RoomQRPage = lazy(() => import('./pages/admin/RoomQRPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const ProfTodayPage = lazy(() => import('./pages/professor/TodayPage'));
const ProfReservationsPage = lazy(() => import('./pages/professor/ReservationsPage'));
const ProfReportsPage = lazy(() => import('./pages/professor/ReportsPage'));
const CheckInPage = lazy(() => import('./pages/professor/CheckInPage'));
const ScannerPage = lazy(() => import('./pages/professor/ScannerPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Default redirect */}
            <Route
              path="/"
              element={
                <Navigate
                  to={
                    localStorage.getItem('userRole') === 'super-admin' || localStorage.getItem('userRole') === 'admin'
                      ? '/admin/rooms'
                      : '/prof/today'
                  }
                  replace
                />
              }
            />

            {/* Protected routes */}
            {/* Admin routes */}
            <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['super-admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <UsersPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/professors" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminUsersPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/rooms" element={
                <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminRoomsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/rooms/:roomId/edit" element={
                <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminRoomEditPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/rooms/:roomId/qr" element={
                <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <RoomQRPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminReportsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Professor routes */}
            <Route
              path="/prof/today"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <ProfTodayPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prof/reservations"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <ProfReservationsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prof/reports"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <ProfReportsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/checkin"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CheckInPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/professor/scan"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Layout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <ScannerPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
        </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;