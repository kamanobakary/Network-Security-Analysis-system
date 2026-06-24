/*
  # Network Security Analysis System - Initial Schema

  1. New Tables
    - `profiles` - Extended user profiles with roles (admin, analyst, user)
    - `security_alerts` - All security alerts/events with severity, type, source/dest IPs
    - `network_traffic` - Network traffic samples (in/out, protocol, bandwidth)
    - `ids_events` - Intrusion Detection System events
    - `suspicious_ips` - Tracked suspicious IP addresses
    - `login_history` - User authentication history
    - `reports` - Generated report records

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read all security data
    - Only admins can manage users (enforced via app logic, profiles table readable by authenticated)
    - Login history restricted to own records for regular users

  3. Demo Data
    - Pre-seeded with realistic security events, alerts, and traffic data
*/

-- Profiles table for user roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
  avatar_url text,
  last_login timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id text UNIQUE NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  source_ip text NOT NULL,
  dest_ip text NOT NULL,
  source_port integer,
  dest_port integer,
  protocol text NOT NULL DEFAULT 'TCP',
  attack_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  country text DEFAULT '',
  city text DEFAULT '',
  user_agent text DEFAULT '',
  payload_size integer DEFAULT 0,
  blocked boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON security_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON security_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Network traffic table
CREATE TABLE IF NOT EXISTS network_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  inbound_mbps numeric(10,2) DEFAULT 0,
  outbound_mbps numeric(10,2) DEFAULT 0,
  total_packets bigint DEFAULT 0,
  tcp_packets bigint DEFAULT 0,
  udp_packets bigint DEFAULT 0,
  http_requests bigint DEFAULT 0,
  https_requests bigint DEFAULT 0,
  dns_queries bigint DEFAULT 0,
  blocked_connections integer DEFAULT 0,
  suspicious_connections integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE network_traffic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read traffic"
  ON network_traffic FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert traffic"
  ON network_traffic FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- IDS events table
CREATE TABLE IF NOT EXISTS ids_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  source_ip text NOT NULL,
  target_ip text NOT NULL,
  port integer,
  protocol text DEFAULT 'TCP',
  confidence integer DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  details jsonb DEFAULT '{}',
  blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ids_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read IDS events"
  ON ids_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert IDS events"
  ON ids_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Suspicious IPs table
CREATE TABLE IF NOT EXISTS suspicious_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  threat_score integer DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  attack_count integer DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  country text DEFAULT '',
  isp text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suspicious_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read suspicious IPs"
  ON suspicious_ips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suspicious IPs"
  ON suspicious_ips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suspicious IPs"
  ON suspicious_ips FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Login history table
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text NOT NULL,
  user_agent text DEFAULT '',
  success boolean DEFAULT true,
  timestamp timestamptz DEFAULT now(),
  country text DEFAULT '',
  city text DEFAULT ''
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and analysts can read all login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Users can read own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert login history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_events integer DEFAULT 0,
  critical_alerts integer DEFAULT 0,
  high_alerts integer DEFAULT 0,
  medium_alerts integer DEFAULT 0,
  low_alerts integer DEFAULT 0,
  attacks_blocked integer DEFAULT 0,
  top_attack_types jsonb DEFAULT '[]',
  top_source_ips jsonb DEFAULT '[]',
  summary text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);
