import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Login from './pages/Login';

const queryClient = new QueryClient();

function RequireAuth({ children, role }: { children: React.ReactElement; role?: 'ADMIN' | 'DRIVER' }) {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? (JSON.parse(userRaw) as any) : null;

  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth role="ADMIN">
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/driver"
            element={
              <RequireAuth role="DRIVER">
                <DriverDashboard />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
