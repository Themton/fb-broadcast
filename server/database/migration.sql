-- ═══════════════════════════════════════════════════════════
-- Facebook Broadcast System - Supabase Migration
-- รันไฟล์นี้ใน Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ── Page Config ──
CREATE TABLE IF NOT EXISTS page_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT DEFAULT '',
  page_name TEXT DEFAULT '',
  page_token TEXT DEFAULT '',
  connected BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMPTZ,
  fan_count INTEGER DEFAULT 0,
  picture TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscribers ──
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  psid TEXT UNIQUE NOT NULL, -- Facebook Page-Scoped ID
  name TEXT DEFAULT 'Unknown',
  profile_pic TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Segments ──
CREATE TABLE IF NOT EXISTS segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  icon TEXT DEFAULT '📌',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Segment Members (Many-to-Many) ──
CREATE TABLE IF NOT EXISTS segment_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  subscriber_psid TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segment_id, subscriber_psid)
);

-- ── Broadcasts ──
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_segment TEXT DEFAULT 'all', -- 'all' or JSON array of segment IDs
  target_segment_names TEXT[] DEFAULT ARRAY['ทั้งหมด'],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stats
  stat_total INTEGER DEFAULT 0,
  stat_sent INTEGER DEFAULT 0,
  stat_delivered INTEGER DEFAULT 0,
  stat_read INTEGER DEFAULT 0,
  stat_clicked INTEGER DEFAULT 0,
  stat_failed INTEGER DEFAULT 0,
  stat_errors JSONB DEFAULT '[]'
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_subscribers_psid ON subscribers(psid);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created ON broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_psid ON segment_members(subscriber_psid);

-- ── Insert default page config ──
INSERT INTO page_config (page_id, page_name, connected)
VALUES ('', '', FALSE)
ON CONFLICT DO NOTHING;

-- ── Insert default segments ──
INSERT INTO segments (name, color, icon) VALUES
  ('ลูกค้า VIP', '#F59E0B', '⭐'),
  ('ลูกค้าใหม่', '#10B981', '🆕'),
  ('สนใจโปรโมชั่น', '#8B5CF6', '🎯')
ON CONFLICT DO NOTHING;

-- ── RLS Policies (Optional - เปิดใช้ถ้าต้องการ) ──
-- ALTER TABLE page_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

SELECT 'Migration completed successfully! ✅' AS result;
