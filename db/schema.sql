-- Optional Neon database schema for persistent favorites.
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  channel_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Short-lived TV/phone pairing sessions. Expired sessions are pruned when a new one is created.
CREATE TABLE IF NOT EXISTS pairing_sessions (
  session_id TEXT PRIMARY KEY,
  code CHAR(8) NOT NULL,
  tv_secret TEXT NOT NULL,
  phone_secret TEXT,
  channel_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'paired', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS pairing_sessions_code_idx ON pairing_sessions (code);
CREATE INDEX IF NOT EXISTS pairing_sessions_expiry_idx ON pairing_sessions (expires_at);
