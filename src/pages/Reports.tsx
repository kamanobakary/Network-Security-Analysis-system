import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle, BarChart2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, Cell, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase, Report } from '../lib/supabase';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

function ReportCard({ report }: { report: Report }) {
  const typeLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom' }[report.report_type];
  const typeColor = {
    daily: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    weekly: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    monthly: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    custom: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }[report.report_type];

  const severityData = [
    { name: 'Critical', value: report.critical_alerts, color: '#ef4444' },
    { name: 'High', value: report.high_alerts, color: '#f97316' },
    { name: 'Medium', value: report.medium_alerts, color: '#eab308' },
    { name: 'Low', value: report.low_alerts, color: '#22c55e' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${typeColor}`}>{typeLabel}</span>
          </div>
          <h3 className="text-sm font-semibold text-white">{report.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(report.period_start).toLocaleDateString()} – {new Date(report.period_end).toLocaleDateString()}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-colors">
          <Download className="w-3.5 h-3.5" /> PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-lg font-bold text-white">{report.total_events}</p>
          <p className="text-xs text-slate-400">Total Events</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-lg font-bold text-red-400">{report.critical_alerts}</p>
          <p className="text-xs text-slate-400">Critical</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-lg font-bold text-orange-400">{report.high_alerts}</p>
          <p className="text-xs text-slate-400">High</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-lg font-bold text-emerald-400">{report.attacks_blocked}</p>
          <p className="text-xs text-slate-400">Blocked</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1">Severity Breakdown</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={3}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-24">
          <p className="text-xs text-slate-400 mb-1 text-center">Distribution</p>
          <ResponsiveContainer width="100%" height={80}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" outerRadius={35} dataKey="value" paddingAngle={2}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <p className="text-xs text-slate-400 leading-relaxed">{report.summary}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="w-3.5 h-3.5" />
        Generated {new Date(report.created_at).toLocaleString()}
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generateReport(type: 'daily' | 'weekly' | 'monthly') {
    setGenerating(true);
    const periodMap = { daily: 1, weekly: 7, monthly: 30 };
    const days = periodMap[type];
    const periodStart = new Date(Date.now() - days * 86400000).toISOString();
    const periodEnd = new Date().toISOString();
    const labelMap = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

    const { data: alertData } = await supabase
      .from('security_alerts')
      .select('severity, blocked')
      .gte('timestamp', periodStart);

    const alerts = alertData ?? [];
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;
    const blocked = alerts.filter(a => a.blocked).length;

    await supabase.from('reports').insert({
      title: `${labelMap[type]} Security Report - ${new Date().toLocaleDateString()}`,
      report_type: type,
      period_start: periodStart,
      period_end: periodEnd,
      total_events: alerts.length,
      critical_alerts: critical,
      high_alerts: high,
      medium_alerts: medium,
      low_alerts: low,
      attacks_blocked: blocked,
      summary: `Auto-generated ${type} report. ${alerts.length} total security events detected. ${critical + high} high-priority incidents identified. ${blocked} attacks blocked by automated defenses. Review critical alerts for immediate action items.`,
    });

    await load();
    setGenerating(false);
  }

  const weeklyTrend = [
    { day: 'Mon', events: 82, blocked: 45 },
    { day: 'Tue', events: 94, blocked: 52 },
    { day: 'Wed', events: 71, blocked: 38 },
    { day: 'Thu', events: 108, blocked: 67 },
    { day: 'Fri', events: 124, blocked: 78 },
    { day: 'Sat', events: 56, blocked: 29 },
    { day: 'Sun', events: 43, blocked: 22 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Security Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Automated and manual security reporting</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Generate report */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-sky-400" /> Generate New Report
        </h3>
        <div className="flex flex-wrap gap-3">
          {(['daily', 'weekly', 'monthly'] as const).map(type => (
            <button
              key={type}
              onClick={() => generateReport(type)}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 text-slate-300 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              {generating ? 'Generating...' : `Generate ${type.charAt(0).toUpperCase() + type.slice(1)} Report`}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly trend chart */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" /> Weekly Security Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyTrend}>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="events" fill="#0ea5e9" radius={4} name="Total Events" />
            <Bar dataKey="blocked" fill="#22c55e" radius={4} name="Blocked" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-2 bg-sky-400 rounded-sm inline-block" /> Total Events</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-2 bg-emerald-400 rounded-sm inline-block" /> Blocked</div>
        </div>
      </div>

      {/* Report list */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Report Archive ({reports.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <FileText className="w-10 h-10 text-slate-600" />
            <p className="text-slate-400 text-sm">No reports yet. Generate your first report above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
