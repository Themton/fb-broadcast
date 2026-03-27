/**
 * In-Memory Data Store
 * สามารถเปลี่ยนเป็น MongoDB ได้ในภายหลัง
 */

let store = {
  // ── Page Config ──
  pageConfig: {
    pageId: process.env.FB_PAGE_ID || '',
    pageName: '',
    pageToken: process.env.FB_PAGE_ACCESS_TOKEN || '',
    connected: false,
    connectedAt: null,
  },

  // ── Subscribers ──
  subscribers: [],

  // ── Segments ──
  segments: [
    { id: 'seg_1', name: 'ลูกค้า VIP', color: '#F59E0B', icon: '⭐', subscriberIds: [], createdAt: new Date().toISOString() },
    { id: 'seg_2', name: 'ลูกค้าใหม่', color: '#10B981', icon: '🆕', subscriberIds: [], createdAt: new Date().toISOString() },
    { id: 'seg_3', name: 'สนใจโปรโมชั่น', color: '#8B5CF6', icon: '🎯', subscriberIds: [], createdAt: new Date().toISOString() },
  ],

  // ── Broadcasts ──
  broadcasts: [],

  // ── Stats ──
  stats: {
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalClicked: 0,
  },
};

const db = {
  // ── Page Config ──
  getPageConfig: () => store.pageConfig,
  setPageConfig: (config) => {
    store.pageConfig = { ...store.pageConfig, ...config };
    return store.pageConfig;
  },

  // ── Subscribers ──
  getSubscribers: () => store.subscribers,
  addSubscriber: (sub) => {
    const existing = store.subscribers.find(s => s.id === sub.id);
    if (existing) {
      Object.assign(existing, sub);
      return existing;
    }
    const newSub = {
      id: sub.id,
      name: sub.name || 'Unknown',
      profilePic: sub.profilePic || null,
      segments: sub.segments || [],
      subscribedAt: sub.subscribedAt || new Date().toISOString(),
      lastInteraction: sub.lastInteraction || new Date().toISOString(),
    };
    store.subscribers.push(newSub);
    return newSub;
  },
  removeSubscriber: (id) => {
    store.subscribers = store.subscribers.filter(s => s.id !== id);
  },
  getSubscribersBySegment: (segmentId) => {
    if (segmentId === 'all') return store.subscribers;
    const segment = store.segments.find(s => s.id === segmentId);
    if (!segment) return [];
    return store.subscribers.filter(s => segment.subscriberIds.includes(s.id));
  },

  // ── Segments ──
  getSegments: () => store.segments.map(seg => ({
    ...seg,
    count: seg.subscriberIds.length,
  })),
  addSegment: (segment) => {
    const newSeg = {
      id: `seg_${Date.now()}`,
      name: segment.name,
      color: segment.color || '#6366F1',
      icon: segment.icon || '📌',
      subscriberIds: segment.subscriberIds || [],
      createdAt: new Date().toISOString(),
    };
    store.segments.push(newSeg);
    return { ...newSeg, count: newSeg.subscriberIds.length };
  },
  updateSegment: (id, updates) => {
    const seg = store.segments.find(s => s.id === id);
    if (!seg) return null;
    Object.assign(seg, updates);
    return { ...seg, count: seg.subscriberIds.length };
  },
  deleteSegment: (id) => {
    store.segments = store.segments.filter(s => s.id !== id);
  },
  addSubscriberToSegment: (segmentId, subscriberId) => {
    const seg = store.segments.find(s => s.id === segmentId);
    if (seg && !seg.subscriberIds.includes(subscriberId)) {
      seg.subscriberIds.push(subscriberId);
    }
  },
  removeSubscriberFromSegment: (segmentId, subscriberId) => {
    const seg = store.segments.find(s => s.id === segmentId);
    if (seg) {
      seg.subscriberIds = seg.subscriberIds.filter(id => id !== subscriberId);
    }
  },

  // ── Broadcasts ──
  getBroadcasts: () => store.broadcasts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  getBroadcastById: (id) => store.broadcasts.find(b => b.id === id),
  addBroadcast: (broadcast) => {
    const newBroadcast = {
      id: `bc_${Date.now()}`,
      title: broadcast.title,
      message: broadcast.message,
      targetSegment: broadcast.targetSegment || 'all',
      targetSegmentNames: broadcast.targetSegmentNames || ['ทั้งหมด'],
      status: broadcast.status || 'draft', // draft, scheduled, sending, completed, failed
      scheduledAt: broadcast.scheduledAt || null,
      sentAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      stats: {
        total: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        failed: 0,
        errors: [],
      },
    };
    store.broadcasts.push(newBroadcast);
    return newBroadcast;
  },
  updateBroadcast: (id, updates) => {
    const bc = store.broadcasts.find(b => b.id === id);
    if (!bc) return null;
    Object.assign(bc, updates);
    return bc;
  },
  deleteBroadcast: (id) => {
    store.broadcasts = store.broadcasts.filter(b => b.id !== id);
  },
  getScheduledBroadcasts: () => {
    return store.broadcasts.filter(b => b.status === 'scheduled');
  },

  // ── Stats ──
  getStats: () => {
    const completed = store.broadcasts.filter(b => b.status === 'completed');
    return {
      totalSubscribers: store.subscribers.length,
      totalBroadcasts: store.broadcasts.length,
      totalSent: completed.reduce((a, b) => a + b.stats.sent, 0),
      totalDelivered: completed.reduce((a, b) => a + b.stats.delivered, 0),
      totalRead: completed.reduce((a, b) => a + b.stats.read, 0),
      totalClicked: completed.reduce((a, b) => a + b.stats.clicked, 0),
      scheduledCount: store.broadcasts.filter(b => b.status === 'scheduled').length,
      avgReadRate: completed.length > 0
        ? (completed.reduce((a, b) => a + (b.stats.delivered > 0 ? b.stats.read / b.stats.delivered : 0), 0) / completed.length * 100).toFixed(1)
        : 0,
    };
  },

  // ── Reset ──
  reset: () => {
    store.subscribers = [];
    store.broadcasts = [];
  },
};

module.exports = db;
