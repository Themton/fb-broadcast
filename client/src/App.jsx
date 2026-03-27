import { useState, useEffect, useRef, useCallback } from 'react';
import { broadcastAPI, segmentAPI, subscriberAPI, pageAPI, healthCheck } from './utils/api';
import {
  Send, Users, BarChart3, Clock, Plus, Trash2, Check, X,
  Search, Inbox, Tag, Eye, Zap, Calendar, Facebook, RefreshCw,
  Settings, ChevronRight, MessageSquare, Wifi, WifiOff, Loader2
} from 'lucide-react';

// ── Toast ──
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
  );
}

// ── Stat Card ──
function StatCard({ icon, label, value, sub, color, delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Compose Modal ──
function ComposeModal({ onClose, onSend, segments, loading }) {
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [scheduleMode, setScheduleMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const templates = {
    '🎉 โปรโมชั่น': 'สวัสดีค่ะ 🎉\n\nเรามีโปรโมชั่นพิเศษ!\n🔥 ลดสูงสุด 50%\n📅 ถึงสิ้นเดือนนี้เท่านั้น\n\nสนใจกดลิงก์ด้านล่างเลยค่ะ 👇',
    '📢 ประกาศ': '📢 แจ้งข่าวสำคัญ!\n\nสวัสดีค่ะ เรามีข่าวดีจะแจ้งให้ทราบ...\n\nติดตามรายละเอียดเพิ่มเติมได้ที่เพจของเราค่ะ',
    '🙏 ขอบคุณ': 'สวัสดีค่ะ 🙏\n\nขอบคุณที่เป็นลูกค้าของเรานะคะ ❤️\nเรามีของขวัญพิเศษให้คุณ...',
    '📦 แจ้งสถานะ': 'สวัสดีค่ะ\n\n📦 แจ้งอัพเดทสถานะ\nรายละเอียดเพิ่มเติม...',
  };

  const toggleSeg = (id) => setSelectedSegments(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  const handleSend = () => {
    if (!msg.trim() || !title.trim()) return;
    let scheduledAt = null;
    if (scheduleMode === 'later' && scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }
    onSend({
      title,
      message: msg,
      targetSegment: target === 'all' ? 'all' : selectedSegments,
      targetSegmentNames: target === 'all'
        ? ['ทั้งหมด']
        : segments.filter(s => selectedSegments.includes(s.id)).map(s => s.name),
      scheduleMode,
      scheduledAt,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal compose-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-icon"><Send size={18} /></div>
            <div>
              <h2>สร้างข้อความบรอดแคสต์</h2>
              <p className="modal-subtitle">ส่งข้อความถึงสมาชิกของคุณ</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>ชื่อแคมเปญ</label>
            <input type="text" placeholder="เช่น โปรโมชั่นเดือนเมษายน" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>ข้อความ</label>
            <textarea ref={ref} placeholder="พิมพ์ข้อความที่ต้องการส่ง..." value={msg} onChange={e => setMsg(e.target.value)} rows={5} />
            <div className="char-count">{msg.length} / 2,000</div>
          </div>

          <div className="template-chips">
            {Object.keys(templates).map(t => (
              <button key={t} className="chip" onClick={() => setMsg(templates[t])}>{t}</button>
            ))}
          </div>

          <div className="form-group">
            <label>กลุ่มผู้รับ</label>
            <div className="target-options">
              <label className={`target-option ${target === 'all' ? 'active' : ''}`}>
                <input type="radio" name="target" checked={target === 'all'} onChange={() => setTarget('all')} />
                <Users size={16} /><span>ส่งทั้งหมด</span>
              </label>
              <label className={`target-option ${target === 'segment' ? 'active' : ''}`}>
                <input type="radio" name="target" checked={target === 'segment'} onChange={() => setTarget('segment')} />
                <Tag size={16} /><span>เลือกกลุ่ม</span>
              </label>
            </div>
          </div>

          {target === 'segment' && (
            <div className="segment-picker">
              {segments.map(seg => (
                <button key={seg.id} className={`segment-chip ${selectedSegments.includes(seg.id) ? 'selected' : ''}`}
                  onClick={() => toggleSeg(seg.id)}
                  style={selectedSegments.includes(seg.id) ? { borderColor: seg.color, background: `${seg.color}15` } : {}}>
                  <span>{seg.icon}</span>
                  <span>{seg.name}</span>
                  <span className="seg-count">{(seg.count || 0).toLocaleString()}</span>
                  {selectedSegments.includes(seg.id) && <Check size={14} />}
                </button>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>กำหนดการส่ง</label>
            <div className="target-options">
              <label className={`target-option ${scheduleMode === 'now' ? 'active' : ''}`}>
                <input type="radio" name="schedule" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} />
                <Zap size={16} /><span>ส่งทันที</span>
              </label>
              <label className={`target-option ${scheduleMode === 'later' ? 'active' : ''}`}>
                <input type="radio" name="schedule" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} />
                <Calendar size={16} /><span>ตั้งเวลา</span>
              </label>
            </div>
          </div>

          {scheduleMode === 'later' && (
            <div className="schedule-inputs">
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={handleSend}
              disabled={!msg.trim() || !title.trim() || loading || (target === 'segment' && !selectedSegments.length)}>
              {loading ? <><Loader2 size={16} className="spin" /> กำลังส่ง...</>
                : scheduleMode === 'now' ? <><Send size={16} /> ส่งเลย</> : <><Clock size={16} /> ตั้งเวลา</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats Modal ──
function StatsModal({ campaign, onClose }) {
  if (!campaign) return null;
  const s = campaign.stats || campaign;
  const dr = s.delivered ? ((s.delivered / s.sent) * 100).toFixed(1) : 0;
  const rr = s.delivered ? ((s.read / s.delivered) * 100).toFixed(1) : 0;
  const cr = s.read ? ((s.clicked / s.read) * 100).toFixed(1) : 0;

  const stages = [
    { label: 'ส่งแล้ว', value: s.sent || s.total || 0, pct: 100, color: '#6366F1' },
    { label: 'ถึงผู้รับ', value: s.delivered || 0, pct: dr, color: '#10B981' },
    { label: 'อ่านแล้ว', value: s.read || 0, pct: rr, color: '#3B82F6' },
    { label: 'คลิก', value: s.clicked || 0, pct: cr, color: '#F59E0B' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{campaign.title}</h2>
            <p className="modal-subtitle">{campaign.createdAt || campaign.date}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="funnel">
            {stages.map((st, i) => (
              <div key={i} className="funnel-stage">
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width: `${Math.max(st.pct, 5)}%`, background: st.color }} />
                </div>
                <div className="funnel-info">
                  <span className="funnel-label">{st.label}</span>
                  <span className="funnel-value" style={{ color: st.color }}>{(st.value || 0).toLocaleString()}</span>
                  <span className="funnel-pct">{st.pct}%</span>
                </div>
              </div>
            ))}
          </div>
          {s.failed > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: '#EF444415', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
              ⚠️ ส่งไม่สำเร็จ {s.failed} ข้อความ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── MAIN APP ──
// ══════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [segments, setSegments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [stats, setStats] = useState({});
  const [subscribers, setSubscribers] = useState([]);
  const [pageConfig, setPageConfig] = useState({ connected: false });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);

  // Settings form
  const [pageName, setPageName] = useState('');
  const [pageToken, setPageToken] = useState('');
  const [newSegName, setNewSegName] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch Data ──
  const fetchData = useCallback(async () => {
    try {
      const [bcRes, segRes, statsRes, pageRes] = await Promise.allSettled([
        broadcastAPI.getAll(),
        segmentAPI.getAll(),
        broadcastAPI.getStats(),
        pageAPI.getConfig(),
      ]);
      if (bcRes.status === 'fulfilled') setBroadcasts(bcRes.value.data.data || []);
      if (segRes.status === 'fulfilled') setSegments(segRes.value.data.data || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data || {});
      if (pageRes.status === 'fulfilled') {
        setPageConfig(pageRes.value.data.data || {});
        setPageName(pageRes.value.data.data?.pageName || '');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Send Broadcast ──
  const handleSend = async (data) => {
    setLoading(true);
    try {
      const res = await broadcastAPI.create(data);
      showToast(res.data.message || '✅ ส่งสำเร็จ!');
      setShowCompose(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
    setLoading(false);
  };

  // ── Connect Page ──
  const handleConnect = async () => {
    if (!pageToken) return;
    setLoading(true);
    try {
      const res = await pageAPI.connect({ pageToken, pageName });
      showToast(res.data.message || '✅ เชื่อมต่อสำเร็จ!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'เชื่อมต่อล้มเหลว', 'error');
    }
    setLoading(false);
  };

  // ── Sync Subscribers ──
  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await subscriberAPI.sync();
      showToast(res.data.message || '✅ Sync สำเร็จ!');
      const subRes = await subscriberAPI.getAll();
      setSubscribers(subRes.data.data || []);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Sync ล้มเหลว', 'error');
    }
    setLoading(false);
  };

  // ── Add Segment ──
  const handleAddSegment = async () => {
    if (!newSegName.trim()) return;
    try {
      await segmentAPI.create({ name: newSegName, color: '#6366F1', icon: '📌' });
      setNewSegName('');
      fetchData();
      showToast('✅ เพิ่มกลุ่มสำเร็จ');
    } catch (err) {
      showToast('เพิ่มกลุ่มล้มเหลว', 'error');
    }
  };

  // ── Delete Segment ──
  const handleDeleteSegment = async (id) => {
    try {
      await segmentAPI.delete(id);
      fetchData();
      showToast('ลบกลุ่มเรียบร้อย');
    } catch (err) {
      showToast('ลบกลุ่มล้มเหลว', 'error');
    }
  };

  // ── Delete Broadcast ──
  const handleDeleteBroadcast = async (id) => {
    try {
      await broadcastAPI.delete(id);
      fetchData();
      showToast('ลบเรียบร้อย');
    } catch (err) {
      showToast('ลบล้มเหลว', 'error');
    }
  };

  const filtered = broadcasts.filter(h => {
    if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo"><Facebook size={22} /></div>
          <div className="logo-text">
            <h1>Broadcast Center</h1>
            <span>Facebook Page Messenger</span>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-badge ${pageConfig.connected ? 'connected' : 'disconnected'}`}>
            <div className={`dot ${pageConfig.connected ? 'on' : 'off'}`} />
            {pageConfig.connected ? (pageConfig.pageName || 'Connected') : 'ยังไม่เชื่อมต่อ'}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {[
          ['dashboard', <BarChart3 size={16} />, 'แดชบอร์ด'],
          ['history', <Inbox size={16} />, 'ประวัติการส่ง'],
          ['segments', <Users size={16} />, 'กลุ่มผู้รับ'],
          ['settings', <Settings size={16} />, 'ตั้งค่า'],
        ].map(([key, icon, label]) => (
          <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {icon} {label}
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className="main">
        {/* Dashboard */}
        {tab === 'dashboard' && (
          <>
            <div className="page-header">
              <div>
                <h2>ภาพรวม</h2>
                <p className="page-sub">สถิติการบรอดแคสต์ทั้งหมด</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
                <Send size={16} /> สร้างบรอดแคสต์
              </button>
            </div>

            <div className="stats-grid">
              <StatCard icon={<Users size={20} />} label="สมาชิกทั้งหมด" value={stats.totalSubscribers || 0} color="#4F6BF6" delay={0} />
              <StatCard icon={<Send size={20} />} label="ข้อความที่ส่ง" value={stats.totalSent || 0} color="#10B981" delay={100} />
              <StatCard icon={<Eye size={20} />} label="อัตราอ่าน" value={`${stats.avgReadRate || 0}%`} color="#3B82F6" delay={200} />
              <StatCard icon={<Clock size={20} />} label="รอส่ง" value={stats.scheduledCount || 0} color="#F59E0B" delay={300} />
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>ล่าสุด</h3>
            {broadcasts.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📭</div>
                <p>ยังไม่มีข้อมูลบรอดแคสต์</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCompose(true)}>
                  <Plus size={16} /> สร้างบรอดแคสต์แรก
                </button>
              </div>
            ) : (
              <div className="history-table">
                <div className="table-header">
                  <span>แคมเปญ</span><span>กลุ่ม</span><span>ส่งแล้ว</span><span>สถานะ</span><span></span>
                </div>
                {broadcasts.slice(0, 5).map((h, i) => (
                  <div key={h.id} className="table-row" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="campaign-name">
                      {h.title}
                      <span className="campaign-date">{new Date(h.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                    <span><span className="segment-badge">{(h.targetSegmentNames || []).join(', ')}</span></span>
                    <span className="metric">{(h.stats?.sent || 0).toLocaleString()}</span>
                    <span>
                      <span className={`status-badge status-${h.status}`}>
                        {h.status === 'completed' ? '✓ ส่งแล้ว' : h.status === 'scheduled' ? '⏰ รอส่ง' : h.status === 'sending' ? '📤 กำลังส่ง' : h.status}
                      </span>
                    </span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {h.status === 'completed' && (
                        <button className="btn-icon" onClick={() => setSelectedCampaign(h)} title="ดูสถิติ"><Eye size={14} /></button>
                      )}
                      <button className="btn-icon" onClick={() => handleDeleteBroadcast(h.id)} title="ลบ"><Trash2 size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* History */}
        {tab === 'history' && (
          <>
            <div className="toolbar">
              <div className="toolbar-left">
                <div className="search-box">
                  <Search size={14} />
                  <input placeholder="ค้นหาแคมเปญ..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                  {[['all', 'ทั้งหมด'], ['completed', 'ส่งแล้ว'], ['scheduled', 'รอส่ง'], ['sending', 'กำลังส่ง']].map(([k, v]) => (
                    <button key={k} className={`filter-chip ${filterStatus === k ? 'active' : ''}`} onClick={() => setFilterStatus(k)}>{v}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowCompose(true)}><Plus size={16} /> สร้างใหม่</button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty"><div className="empty-icon">📭</div><p>ไม่พบข้อมูล</p></div>
            ) : (
              <div className="history-table">
                <div className="table-header">
                  <span>แคมเปญ</span><span>กลุ่ม</span><span>ส่งแล้ว</span><span>สถานะ</span><span></span>
                </div>
                {filtered.map((h, i) => (
                  <div key={h.id} className="table-row" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="campaign-name">
                      {h.title}
                      <span className="campaign-date">{new Date(h.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                    <span><span className="segment-badge">{(h.targetSegmentNames || []).join(', ')}</span></span>
                    <span className="metric">{(h.stats?.sent || 0).toLocaleString()}</span>
                    <span>
                      <span className={`status-badge status-${h.status}`}>
                        {h.status === 'completed' ? '✓ ส่งแล้ว' : h.status === 'scheduled' ? '⏰ รอส่ง' : h.status === 'sending' ? '📤 กำลังส่ง' : h.status}
                      </span>
                    </span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {h.status === 'completed' && (
                        <button className="btn-icon" onClick={() => setSelectedCampaign(h)}><Eye size={14} /></button>
                      )}
                      <button className="btn-icon" onClick={() => handleDeleteBroadcast(h.id)}><Trash2 size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Segments */}
        {tab === 'segments' && (
          <>
            <div className="page-header">
              <div>
                <h2>กลุ่มผู้รับ</h2>
                <p className="page-sub">จัดกลุ่มสมาชิกเพื่อส่งข้อความตรงเป้าหมาย</p>
              </div>
              <button className="btn btn-ghost" onClick={handleSync} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} /> Sync สมาชิก
              </button>
            </div>

            <div className="add-segment-row" style={{ marginBottom: 20 }}>
              <input placeholder="ชื่อกลุ่มใหม่..." value={newSegName} onChange={e => setNewSegName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSegment()} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={handleAddSegment}><Plus size={14} /> เพิ่ม</button>
            </div>

            <div className="segments-grid">
              {segments.map((seg, i) => (
                <div key={seg.id} className="segment-card" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="seg-card-icon">{seg.icon}</div>
                  <div className="seg-card-info" style={{ flex: 1 }}>
                    <div className="seg-card-name">{seg.name}</div>
                    <div className="seg-card-count">{(seg.count || 0).toLocaleString()} คน</div>
                  </div>
                  <button className="btn-icon" onClick={() => handleDeleteSegment(seg.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="connect-section">
            <div className="connect-fb-icon"><Facebook size={30} /></div>
            <h2>เชื่อมต่อ Facebook Page</h2>
            <p>ใส่ Page Access Token เพื่อเชื่อมต่อกับ Messenger API</p>
            {pageConfig.connected && (
              <div style={{ padding: 12, background: '#10B98115', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#10B981' }}>
                ✅ เชื่อมต่อกับเพจ "{pageConfig.pageName}" แล้ว
              </div>
            )}
            <div className="form-row">
              <label>ชื่อเพจ</label>
              <input placeholder="ชื่อเพจ Facebook ของคุณ" value={pageName} onChange={e => setPageName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Page Access Token</label>
              <input type="password" placeholder="EAAxxxxxxx..." value={pageToken} onChange={e => setPageToken(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={handleConnect} disabled={!pageToken || loading}>
              {loading ? <><Loader2 size={16} className="spin" /> กำลังเชื่อมต่อ...</>
                : <><Zap size={16} /> {pageConfig.connected ? 'เชื่อมต่อใหม่' : 'เชื่อมต่อเพจ'}</>}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 16 }}>
              สร้าง Page Access Token ได้จาก{' '}
              <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                Facebook Developer Console
              </a>
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSend={handleSend} segments={segments} loading={loading} />}
      {selectedCampaign && <StatsModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}

      <Toast toast={toast} />
    </div>
  );
}
