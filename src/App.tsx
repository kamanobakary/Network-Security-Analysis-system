import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NetworkMonitor from './pages/NetworkMonitor';
import AlertsIDS from './pages/AlertsIDS';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import AIAnalysis from './pages/AIAnalysis';
import { Shield } from 'lucide-react';

type Page = 'dashboard' | 'network' | 'alerts' | 'users' | 'reports' | 'ai';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-sky-400 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm">Initializing security system...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    network: <NetworkMonitor />,
    alerts: <AlertsIDS />,
    users: <UserManagement />,
    reports: <Reports />,
    ai: <AIAnalysis />,
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {pages[currentPage]}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
