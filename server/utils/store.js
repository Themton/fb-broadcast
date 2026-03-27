/**
 * Data Store — Supabase
 */
const { getClient } = require('./supabase');
const sb = () => getClient();

// ── Page Config ──
async function getPageConfig() {
  const { data } = await sb().from('page_config').select('*').limit(1).single();
  if (!data) return { connected: false };
  return { id: data.id, pageId: data.page_id, pageName: data.page_name, pageToken: data.page_token, connected: data.connected, connectedAt: data.connected_at, fanCount: data.fan_count, picture: data.picture, category: data.category };
}

async function setPageConfig(config) {
  const current = await getPageConfig();
  const mapped = { updated_at: new Date().toISOString() };
  if (config.pageId !== undefined) mapped.page_id = config.pageId;
  if (config.pageName !== undefined) mapped.page_name = config.pageName;
  if (config.pageToken !== undefined) mapped.page_token = config.pageToken;
  if (config.connected !== undefined) mapped.connected = config.connected;
  if (config.connectedAt !== undefined) mapped.connected_at = config.connectedAt;
  if (config.fanCount !== undefined) mapped.fan_count = config.fanCount;
  if (config.picture !== undefined) mapped.picture = config.picture;
  if (config.category !== undefined) mapped.category = config.category;
  const { data } = await sb().from('page_config').update(mapped).eq('id', current.id).select().single();
  return getPageConfig();
}

// ── Subscribers ──
async function getSubscribers() {
  const { data } = await sb().from('subscribers').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({ id: r.psid, name: r.name, profilePic: r.profile_pic, subscribedAt: r.subscribed_at, lastInteraction: r.last_interaction }));
}

async function addSubscriber(sub) {
  const { data: existing } = await sb().from('subscribers').select('*').eq('psid', sub.id).maybeSingle();
  if (existing) {
    await sb().from('subscribers').update({ name: sub.name || existing.name, profile_pic: sub.profilePic, last_interaction: sub.lastInteraction || new Date().toISOString() }).eq('psid', sub.id);
    return { id: sub.id, name: sub.name || existing.name };
  }
  const { data } = await sb().from('subscribers').insert({ psid: sub.id, name: sub.name || 'Unknown', profile_pic: sub.profilePic, last_interaction: sub.lastInteraction }).select().single();
  return { id: data.psid, name: data.name };
}

async function removeSubscriber(psid) {
  await sb().from('segment_members').delete().eq('subscriber_psid', psid);
  await sb().from('subscribers').delete().eq('psid', psid);
}

async function getSubscribersBySegment(segmentId) {
  if (segmentId === 'all') return await getSubscribers();
  const { data: members } = await sb().from('segment_members').select('subscriber_psid').eq('segment_id', segmentId);
  if (!members || !members.length) return [];
  const { data } = await sb().from('subscribers').select('*').in('psid', members.map(m => m.subscriber_psid));
  return (data || []).map(r => ({ id: r.psid, name: r.name, profilePic: r.profile_pic }));
}

// ── Segments ──
async function getSegments() {
  const { data: segs } = await sb().from('segments').select('*').order('created_at', { ascending: true });
  const results = [];
  for (const seg of (segs || [])) {
    const { count } = await sb().from('segment_members').select('*', { count: 'exact', head: true }).eq('segment_id', seg.id);
    results.push({ id: seg.id, name: seg.name, color: seg.color, icon: seg.icon, count: count || 0 });
  }
  return results;
}

async function addSegment(segment) {
  const { data } = await sb().from('segments').insert({ name: segment.name, color: segment.color || '#6366F1', icon: segment.icon || '📌' }).select().single();
  return { id: data.id, name: data.name, color: data.color, icon: data.icon, count: 0 };
}

async function updateSegment(id, updates) {
  const mapped = {};
  if (updates.name) mapped.name = updates.name;
  if (updates.color) mapped.color = updates.color;
  if (updates.icon) mapped.icon = updates.icon;
  const { data } = await sb().from('segments').update(mapped).eq('id', id).select().single();
  if (!data) return null;
  const { count } = await sb().from('segment_members').select('*', { count: 'exact', head: true }).eq('segment_id', id);
  return { id: data.id, name: data.name, color: data.color, icon: data.icon, count: count || 0 };
}

async function deleteSegment(id) {
  await sb().from('segment_members').delete().eq('segment_id', id);
  await sb().from('segments').delete().eq('id', id);
}

async function addSubscriberToSegment(segmentId, subscriberId) {
  await sb().from('segment_members').upsert({ segment_id: segmentId, subscriber_psid: subscriberId }, { onConflict: 'segment_id,subscriber_psid' });
}

async function removeSubscriberFromSegment(segmentId, subscriberId) {
  await sb().from('segment_members').delete().match({ segment_id: segmentId, subscriber_psid: subscriberId });
}

// ── Broadcasts ──
async function getBroadcasts() {
  const { data } = await sb().from('broadcasts').select('*').order('created_at', { ascending: false });
  return (data || []).map(fmtBc);
}

async function getBroadcastById(id) {
  const { data } = await sb().from('broadcasts').select('*').eq('id', id).single();
  return fmtBc(data);
}

async function addBroadcast(bc) {
  const { data } = await sb().from('broadcasts').insert({
    title: bc.title, message: bc.message, target_segment: bc.targetSegment || 'all',
    target_segment_names: bc.targetSegmentNames || ['ทั้งหมด'], status: bc.status || 'draft', scheduled_at: bc.scheduledAt,
  }).select().single();
  return fmtBc(data);
}

async function updateBroadcast(id, updates) {
  const mapped = {};
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.sentAt) mapped.sent_at = updates.sentAt;
  if (updates.completedAt) mapped.completed_at = updates.completedAt;
  if (updates.stats) {
    mapped.stat_total = updates.stats.total; mapped.stat_sent = updates.stats.sent;
    mapped.stat_delivered = updates.stats.delivered; mapped.stat_read = updates.stats.read;
    mapped.stat_clicked = updates.stats.clicked; mapped.stat_failed = updates.stats.failed;
    mapped.stat_errors = JSON.stringify(updates.stats.errors || []);
  }
  const { data } = await sb().from('broadcasts').update(mapped).eq('id', id).select().single();
  return fmtBc(data);
}

async function deleteBroadcast(id) { await sb().from('broadcasts').delete().eq('id', id); }

async function getScheduledBroadcasts() {
  const { data } = await sb().from('broadcasts').select('*').eq('status', 'scheduled');
  return (data || []).map(fmtBc);
}

function fmtBc(r) {
  if (!r) return null;
  return { id: r.id, title: r.title, message: r.message, targetSegment: r.target_segment, targetSegmentNames: r.target_segment_names || [],
    status: r.status, scheduledAt: r.scheduled_at, sentAt: r.sent_at, completedAt: r.completed_at, createdAt: r.created_at,
    stats: { total: r.stat_total||0, sent: r.stat_sent||0, delivered: r.stat_delivered||0, read: r.stat_read||0, clicked: r.stat_clicked||0, failed: r.stat_failed||0, errors: r.stat_errors||[] }};
}

// ── Stats ──
async function getStats() {
  const { count: totalSubs } = await sb().from('subscribers').select('*', { count: 'exact', head: true });
  const { data: all } = await sb().from('broadcasts').select('*');
  const bcs = all || [];
  const done = bcs.filter(b => b.status === 'completed');
  const tDel = done.reduce((a, b) => a + (b.stat_delivered||0), 0);
  const tRead = done.reduce((a, b) => a + (b.stat_read||0), 0);
  return { totalSubscribers: totalSubs||0, totalBroadcasts: bcs.length, totalSent: done.reduce((a,b) => a+(b.stat_sent||0),0),
    totalDelivered: tDel, totalRead: tRead, totalClicked: done.reduce((a,b) => a+(b.stat_clicked||0),0),
    scheduledCount: bcs.filter(b => b.status==='scheduled').length,
    avgReadRate: tDel > 0 ? ((tRead/tDel)*100).toFixed(1) : 0 };
}

module.exports = {
  getPageConfig, setPageConfig, getSubscribers, addSubscriber, removeSubscriber, getSubscribersBySegment,
  getSegments, addSegment, updateSegment, deleteSegment, addSubscriberToSegment, removeSubscriberFromSegment,
  getBroadcasts, getBroadcastById, addBroadcast, updateBroadcast, deleteBroadcast, getScheduledBroadcasts, getStats,
};
