import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'user';
  avatar_url: string | null;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
};

export type SecurityAlert = {
  id: string;
  alert_id: string;
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  source_port: number | null;
  dest_port: number | null;
  protocol: string;
  attack_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  country: string;
  blocked: boolean;
};

export type NetworkTraffic = {
  id: string;
  timestamp: string;
  inbound_mbps: number;
  outbound_mbps: number;
  total_packets: number;
  tcp_packets: number;
  udp_packets: number;
  http_requests: number;
  https_requests: number;
  dns_queries: number;
  blocked_connections: number;
  suspicious_connections: number;
};

export type SuspiciousIP = {
  id: string;
  ip_address: string;
  threat_score: number;
  attack_count: number;
  last_seen: string;
  country: string;
  tags: string[];
  is_blocked: boolean;
};

export type IdsEvent = {
  id: string;
  timestamp: string;
  event_type: string;
  source_ip: string;
  target_ip: string;
  port: number | null;
  protocol: string;
  confidence: number;
  blocked: boolean;
};

export type Report = {
  id: string;
  title: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  total_events: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  attacks_blocked: number;
  summary: string;
  created_at: string;
};
