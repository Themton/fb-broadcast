import axios from 'axios';

// ── Detect if backend is available ──
const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = isGitHubPages ? null : '/api';

// ── Demo Data ──
const DEMO_SEGMENTS = [
  { id: 'seg_1', name: 'ลูกค้า VIP', color: '#F59E0B', icon: '⭐', count: 342 },
  { id: 'seg_2', name: 'ลูกค้าใหม่', color: '#10B981', icon: '🆕', count: 1205 },
  { id: 'seg_3', name: 'สนใจโปรโมชั่น', color: '#8B5CF6', icon: '🎯', count: 876 },
  { id: 'seg_4', name: 'ไม่ตอบ 30 วัน', color: '#EF4444', icon: '😴', count: 523 },
  { id: 'seg_5', name: 'ซื้อซ้ำ', color: '#3B82F6', icon: '🔄', count: 189 },
];

const DEMO_BROADCASTS = [
  { id: 'bc_1', title: 'โปรโมชั่นปีใหม่ 2026', createdAt: '2026-01-01T09:00:00', targetSegmentNames: ['ทั้งหมด'], status: 'completed', stats: { total: 2946, sent: 2946, delivered: 2891, read: 2104, clicked: 876, failed: 0 } },
  { id: 'bc_2', title: 'แจ้งเปิดสาขาใหม่', createdAt: '2025-12-28T14:00:00', targetSegmentNames: ['ลูกค้า VIP'], status: 'completed', stats: { total: 342, sent: 342, delivered: 340, read: 298, clicked: 145, failed: 2 } },
  { id: 'bc_3', title: 'Flash Sale Weekend', createdAt: '2026-03-28T10:00:00', targetSegmentNames: ['สนใจโปรโมชั่น'], status: 'scheduled', stats: { total: 876, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0 } },
  { id: 'bc_4', title: 'สวัสดีวันสงกรานต์', createdAt: '2026-04-13T08:00:00', targetSegmentNames: ['ทั้งหมด'], status: 'scheduled', stats: { total: 2946, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0 } },
  { id: 'bc_5', title: 'คูปองส่วนลด 20%', createdAt: '2025-12-20T11:00:00', targetSegmentNames: ['ซื้อซ้ำ'], status: 'completed', stats: { total: 189, sent: 189, delivered: 186, read: 152, clicked: 98, failed: 3 } },
  { id: 'bc_6', title: 'อัพเดทสินค้าใหม่', createdAt: '2025-12-15T16:00:00', targetSegmentNames: ['ลูกค้าใหม่'], status: 'completed', stats: { total: 1205, sent: 1205, delivered: 1180, read: 890, clicked: 342, failed: 25 } },
];

let demoState = {
  segments: [...DEMO_SEGMENTS],
  broadcasts: [...DEMO_BROADCASTS],
  pageConfig: { connected: true, pageName: 'Demo Page', pageId: 'demo' },
};

// ── Demo Mode API ──
const demoAPI = {
  page: {
    getConfig: () => Promise.resolve({ data: { success: true, data: demoState.pageConfig } }),
    connect: (data) => {
      demoState.pageConfig = { ...demoState.pageConfig, ...data, connected: true, connectedAt: new Date().toISOString() };
      return Promise.resolve({ data: { success: true, data: demoState.pageConfig, message: 'เชื่อมต่อสำเร็จ (Demo Mode)' } });
    },
    disconnect: () => { demoState.pageConfig.connected = false; return Promise.resolve({ data: { success: true } }); },
    test: () => Promise.resolve({ data: { success: true } }),
  },
  broadcast: {
    getAll: () => Promise.resolve({ data: { success: true, data: demoState.broadcasts } }),
    getById: (id) => Promise.resolve({ data: { success: true, data: demoState.broadcasts.find(b => b.id === id) } }),
    getStats: () => {
      const completed = demoState.broadcasts.filter(b => b.status === 'completed');
      const totalDelivered = completed.reduce((a, b) => a + b.stats.delivered, 0);
      const totalRead = completed.reduce((a, b) => a + b.stats.read, 0);
      return Promise.resolve({ data: { success: true, data: {
        totalSubscribers: 2946,
        totalBroadcasts: demoState.broadcasts.length,
        totalSent: completed.reduce((a, b) => a + b.stats.sent, 0),
        totalDelivered,
        totalRead,
        totalClicked: completed.reduce((a, b) => a + b.stats.clicked, 0),
        scheduledCount: demoState.broadcasts.filter(b => b.status === 'scheduled').length,
        avgReadRate: totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : 0,
      }}});
    },
    create: (data) => {
      const isNow = data.scheduleMode !== 'later';
      const total = data.targetSegment === 'all' ? 2946
        : demoState.segments.filter(s => (data.targetSegment || []).includes(s.id)).reduce((a, s) => a + s.count, 0);
      const newBc = {
        id: `bc_${Date.now()}`, title: data.title, message: data.message,
        createdAt: new Date().toISOString(), targetSegmentNames: data.targetSegmentNames || ['ทั้งหมด'],
        status: isNow ? 'completed' : 'scheduled',
        stats: { total, sent: isNow ? total : 0, delivered: isNow ? Math.floor(total * 0.98) : 0,
          read: isNow ? Math.floor(total * 0.72) : 0, clicked: isNow ? Math.floor(total * 0.35) : 0, failed: isNow ? Math.floor(total * 0.01) : 0 },
      };
      demoState.broadcasts = [newBc, ...demoState.broadcasts];
      return Promise.resolve({ data: { success: true, data: newBc, message: isNow ? `✅ ส่งถึง ${total.toLocaleString()} คน (Demo)` : '⏰ ตั้งเวลาเรียบร้อย (Demo)' } });
    },
    delete: (id) => { demoState.broadcasts = demoState.broadcasts.filter(b => b.id !== id); return Promise.resolve({ data: { success: true } }); },
    cancel: (id) => { const bc = demoState.broadcasts.find(b => b.id === id); if (bc) bc.status = 'draft'; return Promise.resolve({ data: { success: true } }); },
  },
  segment: {
    getAll: () => Promise.resolve({ data: { success: true, data: demoState.segments } }),
    create: (data) => {
      const seg = { id: `seg_${Date.now()}`, name: data.name, color: data.color || '#6366F1', icon: data.icon || '📌', count: 0 };
      demoState.segments.push(seg);
      return Promise.resolve({ data: { success: true, data: seg } });
    },
    update: (id, data) => { const seg = demoState.segments.find(s => s.id === id); if (seg) Object.assign(seg, data); return Promise.resolve({ data: { success: true, data: seg } }); },
    delete: (id) => { demoState.segments = demoState.segments.filter(s => s.id !== id); return Promise.resolve({ data: { success: true } }); },
  },
  subscriber: {
    getAll: () => Promise.resolve({ data: { success: true, data: [], total: 2946 } }),
    sync: () => Promise.resolve({ data: { success: true, message: 'Demo Mode: ต้องเชื่อมต่อ Backend เพื่อ Sync' } }),
    delete: () => Promise.resolve({ data: { success: true } }),
  },
};

// ── Real API ──
const api = API_BASE ? axios.create({ baseURL: API_BASE, timeout: 30000, headers: { 'Content-Type': 'application/json' } }) : null;
const realAPI = {
  page: { getConfig: () => api.get('/page'), connect: (data) => api.post('/page/connect', data), disconnect: () => api.post('/page/disconnect'), test: (data) => api.post('/page/test', data) },
  broadcast: { getAll: () => api.get('/broadcast'), getById: (id) => api.get(`/broadcast/${id}`), getStats: () => api.get('/broadcast/stats'), create: (data) => api.post('/broadcast', data), delete: (id) => api.delete(`/broadcast/${id}`), cancel: (id) => api.post(`/broadcast/${id}/cancel`) },
  segment: { getAll: () => api.get('/segments'), create: (data) => api.post('/segments', data), update: (id, data) => api.put(`/segments/${id}`, data), delete: (id) => api.delete(`/segments/${id}`) },
  subscriber: { getAll: () => api.get('/subscribers'), sync: () => api.post('/subscribers/sync'), delete: (id) => api.delete(`/subscribers/${id}`) },
};

// ── Export ──
export const isDemoMode = isGitHubPages || !API_BASE;
export const pageAPI = isDemoMode ? demoAPI.page : realAPI.page;
export const broadcastAPI = isDemoMode ? demoAPI.broadcast : realAPI.broadcast;
export const segmentAPI = isDemoMode ? demoAPI.segment : realAPI.segment;
export const subscriberAPI = isDemoMode ? demoAPI.subscriber : realAPI.subscriber;
export const healthCheck = () => isDemoMode ? Promise.resolve({ data: { status: 'demo' } }) : api.get('/health');
export default api;
