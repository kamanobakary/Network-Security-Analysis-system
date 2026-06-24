import { useState } from 'react';
import { Shield, LayoutDashboard, Network, AlertTriangle, Users, FileText, Brain, ChevronLeft, ChevronRight, Bell, LogOut, Search, Menu, X, Activity, Settings, Radar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'network' | 'alerts' | 'users' | 'reports' | 'ai';

type Props = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'network' as Page, label: 'Network Monitor', icon: Network },
  { id: 'alerts' as Page, label: 'Alerts & IDS', icon: AlertTriangle },
  { id: 'users' as Page, label: 'User Management', icon: Users },
  { id: 'reports' as Page, label: 'Reports', icon: FileText },
  { id: 'ai' as Page, label: 'AI Analysis', icon: Brain },
];

export default function Layout({ children, currentPage, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleColor = {
    admin: 'text-red-400 bg-red-400/10 border-red-400/20',
    analyst: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    user: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }[profile?.role ?? 'user'];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 h-full flex flex-col bg-slate-900 border-r border-slate-800/50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/50 ${collapsed ? 'justify-center px-2' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">NetSec</p>
              <p className="text-sky-400 text-xs tracking-widest uppercase">Analyzer</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                  ${active
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-sky-400' : 'group-hover:text-white'}`} />
                {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
                {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className={`border-t border-slate-800/50 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!collapsed && profile && (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sky-400 text-xs font-bold">{profile.full_name?.[0] || profile.email?.[0] || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{profile.full_name || 'User'}</p>
                <span className={`inline-block text-xs px-1.5 py-0.5 rounded border ${roleColor} mt-0.5`}>
                  {profile.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm ${collapsed ? 'justify-center px-2' : ''}`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-slate-900/80 border-b border-slate-800/50 backdrop-blur-sm flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search events, IPs..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">LIVE</span>
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">5</span>
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
