import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, Download, Eye, CheckCircle, Clock, XCircle, Radar, Shield, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase, SecurityAlert, IdsEvent } from '../lib/supabase';

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${map[severity] || ''}`}>{severity}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ElementType }> = {
    open: { cls: 'bg-red-500/20 text-red-400', icon: XCircle },
    investigating: { cls: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    resolved: { cls: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
    false_positive: { cls: 'bg-slate-500/20 text-slate-400', icon: Shield },
  };
  const { cls, icon: Icon } = map[status] || map['open'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#ef4444' : value >= 70 ? '#f97316' : '#eab308';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
}

type AlertWithExpand = SecurityAlert & { expanded?: boolean };

export default function AlertsIDS() {
  const [alerts, setAlerts] = useState<AlertWithExpand[]>([]);
  const [idsEvents, setIdsEvents] = useState<IdsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'alerts' | 'ids'>('alerts');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const [alertsRes, idsRes] = await Promise.all([
      supabase.from('security_alerts').select('*').order('timestamp', { ascending: false }),
      supabase.from('ids_events').select('*').order('timestamp', { ascending: false }),
    ]);
    setAlerts(alertsRes.data ?? []);
    setIdsEvents(idsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('security_alerts').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: status as SecurityAlert['status'] } : a));
  }

  const attackTypes = useMemo(() => ['all', ...Array.from(new Set(alerts.map(a => a.attack_type)))], [alerts]);

  const filtered = useMemo(() => alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.attack_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.source_ip.includes(q) || a.dest_ip.includes(q) || a.attack_type.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.alert_id.toLowerCase().includes(q);
    }
    return true;
  }), [alerts, severityFilter, statusFilter, typeFilter, search]);

  function exportCSV() {
    const headers = ['ID', 'Timestamp', 'Source IP', 'Dest IP', 'Protocol', 'Attack Type', 'Severity', 'Status', 'Country', 'Blocked', 'Description'];
    const rows = filtered.map(a => [a.alert_id, a.timestamp, a.source_ip, a.dest_ip, a.protocol, a.attack_type, a.severity, a.status, a.country, a.blocked, `"${a.description}"`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const idsTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    idsEvents.forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    return counts;
  }, [idsEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="w-10 h-10 text-sky-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading security events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Alerts & IDS</h1>
          <p className="text-sm text-slate-400 mt-0.5">Intrusion detection and security alert management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-lg text-xs transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* IDS detection modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { type: 'Brute Force', icon: Zap, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { type: 'DDoS', icon: Radar, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { type: 'Port Scanning', icon: Eye, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          { type: 'SQL Injection', icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { type: 'XSS', icon: AlertTriangle, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
          { type: 'Malware', icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        ].map(({ type, icon: Icon, color }) => (
          <div key={type} className={`border rounded-xl p-3.5 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{type}</span>
            </div>
            <p className="text-xl font-bold">{idsTypeCounts[type] || 0}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span className="text-xs opacity-70">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'alerts' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Security Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('ids')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ids' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          IDS Events ({idsEvents.length})
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl">
          {/* Filters */}
          <div className="p-4 border-b border-slate-800/50 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search IP, type, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
              />
            </div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500"
            >
              {attackTypes.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
              ))}
            </select>
            <span className="px-3 py-2 bg-slate-800/30 rounded-lg text-xs text-slate-400 flex items-center">
              {filtered.length} of {alerts.length} alerts
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Date/Time</th>
                  <th className="px-4 py-3 text-left font-medium">Source IP</th>
                  <th className="px-4 py-3 text-left font-medium">Dest IP</th>
                  <th className="px-4 py-3 text-left font-medium">Attack Type</th>
                  <th className="px-4 py-3 text-left font-medium">Severity</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(alert => (
                  <>
                    <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}>
                      <td className="px-4 py-3 font-mono text-sky-400">{alert.alert_id}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{alert.source_ip}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{alert.dest_ip}</td>
                      <td className="px-4 py-3 text-white font-medium">{alert.attack_type}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                      <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {alert.status !== 'investigating' && (
                            <button onClick={() => updateStatus(alert.id, 'investigating')} className="px-2 py-1 text-yellow-400 hover:bg-yellow-400/10 rounded text-xs transition-colors">Investigate</button>
                          )}
                          {alert.status !== 'resolved' && (
                            <button onClick={() => updateStatus(alert.id, 'resolved')} className="px-2 py-1 text-emerald-400 hover:bg-emerald-400/10 rounded text-xs transition-colors">Resolve</button>
                          )}
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === alert.id ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    {expandedId === alert.id && (
                      <tr className="bg-slate-800/20">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-2">
                              <p className="text-slate-400 font-medium uppercase tracking-wider">Connection Details</p>
                              <p className="text-slate-300">Protocol: <span className="text-white">{alert.protocol}</span></p>
                              <p className="text-slate-300">Src Port: <span className="text-white">{alert.source_port ?? 'N/A'}</span></p>
                              <p className="text-slate-300">Dst Port: <span className="text-white">{alert.dest_port ?? 'N/A'}</span></p>
                              <p className="text-slate-300">Country: <span className="text-white">{alert.country || 'Unknown'}</span></p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-slate-400 font-medium uppercase tracking-wider">Threat Info</p>
                              <p className="text-slate-300">Blocked: <span className={alert.blocked ? 'text-emerald-400' : 'text-red-400'}>{alert.blocked ? 'Yes' : 'No'}</span></p>
                              <p className="text-slate-300">Alert ID: <span className="text-sky-400 font-mono">{alert.alert_id}</span></p>
                              <p className="text-slate-300">Detected: <span className="text-white">{new Date(alert.timestamp).toLocaleString()}</span></p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-slate-400 font-medium uppercase tracking-wider">Description</p>
                              <p className="text-slate-300 leading-relaxed">{alert.description}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ids' && (
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl">
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-semibold text-white">IDS Event Log</span>
              <span className="text-xs text-slate-400 ml-2">{idsEvents.length} events</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">Event Type</th>
                  <th className="px-4 py-3 text-left font-medium">Source IP</th>
                  <th className="px-4 py-3 text-left font-medium">Target IP</th>
                  <th className="px-4 py-3 text-left font-medium">Port</th>
                  <th className="px-4 py-3 text-left font-medium">Protocol</th>
                  <th className="px-4 py-3 text-left font-medium">Confidence</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {idsEvents.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(ev.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white font-medium">{ev.event_type}</td>
                    <td className="px-4 py-3 font-mono text-sky-400">{ev.source_ip}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{ev.target_ip}</td>
                    <td className="px-4 py-3 text-slate-300">{ev.port ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{ev.protocol}</td>
                    <td className="px-4 py-3"><ConfidenceBar value={ev.confidence} /></td>
                    <td className="px-4 py-3">
                      {ev.blocked
                        ? <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-medium">Blocked</span>
                        : <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded font-medium">Monitoring</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
