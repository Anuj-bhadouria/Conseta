-- DPDP Compliance SaaS — schema v1
-- Run: psql -U dpdp_user -d dpdp_scanner -h localhost -W -f schema.sql

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clients (agency's customers / businesses being scanned)
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain      TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL,
  client_key  TEXT NOT NULL UNIQUE,      -- used as data-client-id in widget script
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each scan run against a client's site
CREATE TABLE scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  raw_result  JSONB NOT NULL,            -- full scan-output.json equivalent (forms, cookies, links, isHttps)
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Violations found per scan (output of rule-engine.js)
CREATE TABLE violations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id     UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  rule        TEXT NOT NULL,             -- e.g. 'Rule 15 - Cross-Border Transfer'
  severity    TEXT NOT NULL CHECK (severity IN ('pass', 'flag', 'fail')),
  detail      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent events logged by the embeddable widget (audit trail)
CREATE TABLE consent_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  choice      TEXT NOT NULL CHECK (choice IN ('accept', 'reject', 'partial')),
  ip_hash     TEXT NOT NULL,             -- hashed, not raw IP (still personal data under DPDP, keep in mind)
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX idx_scans_client_id ON scans(client_id);
CREATE INDEX idx_violations_scan_id ON violations(scan_id);
CREATE INDEX idx_consent_logs_client_id ON consent_logs(client_id);