const schedule = require('node-schedule');
const db = require('./store');
const FacebookAPI = require('./facebook');

const scheduledJobs = new Map();

const scheduler = {
  init() {
    console.log('⏰ Scheduler initialized');
    setInterval(() => this.checkScheduled(), 60000);
  },

  async checkScheduled() {
    try {
      const pending = await db.getScheduledBroadcasts();
      const now = new Date();
      for (const bc of pending) {
        if (!bc.scheduledAt) continue;
        if (new Date(bc.scheduledAt) <= now && !scheduledJobs.has(bc.id)) {
          console.log(`📤 Executing scheduled: ${bc.title}`);
          this.executeBroadcast(bc.id);
        }
      }
    } catch (e) { console.error('Scheduler check error:', e.message); }
  },

  scheduleJob(broadcastId, dateTime) {
    if (scheduledJobs.has(broadcastId)) scheduledJobs.get(broadcastId).cancel();
    const job = schedule.scheduleJob(new Date(dateTime), () => {
      console.log(`📤 Triggered: ${broadcastId}`);
      this.executeBroadcast(broadcastId);
    });
    if (job) scheduledJobs.set(broadcastId, job);
  },

  cancelJob(broadcastId) {
    if (scheduledJobs.has(broadcastId)) {
      scheduledJobs.get(broadcastId).cancel();
      scheduledJobs.delete(broadcastId);
    }
  },

  async executeBroadcast(broadcastId) {
    try {
      const broadcast = await db.getBroadcastById(broadcastId);
      if (!broadcast) return;

      const fb = new FacebookAPI();
      await db.updateBroadcast(broadcastId, { status: 'sending', sentAt: new Date().toISOString() });

      // Get recipients
      let recipients;
      if (broadcast.targetSegment === 'all') {
        recipients = await db.getSubscribers();
      } else {
        const segIds = Array.isArray(broadcast.targetSegment) ? broadcast.targetSegment : [broadcast.targetSegment];
        const set = new Set();
        for (const segId of segIds) {
          const subs = await db.getSubscribersBySegment(segId);
          subs.forEach(s => set.add(s.id));
        }
        const allSubs = await db.getSubscribers();
        recipients = [...set].map(id => allSubs.find(s => s.id === id)).filter(Boolean);
      }

      if (!recipients.length) {
        await db.updateBroadcast(broadcastId, { status: 'completed', completedAt: new Date().toISOString(), stats: { total: 0, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0, errors: [] } });
        return;
      }

      const results = await fb.broadcastMessage(recipients.map(r => r.id), broadcast.message, {
        delayMs: 200,
        onProgress: async (progress) => {
          await db.updateBroadcast(broadcastId, {
            stats: { total: progress.total, sent: progress.results.sent, delivered: progress.results.delivered, read: 0, clicked: 0, failed: progress.results.failed, errors: progress.results.errors }
          });
        },
      });

      await db.updateBroadcast(broadcastId, {
        status: results.failed === results.total ? 'failed' : 'completed',
        completedAt: new Date().toISOString(),
        stats: { total: results.total, sent: results.sent, delivered: results.delivered, read: 0, clicked: 0, failed: results.failed, errors: results.errors },
      });

      scheduledJobs.delete(broadcastId);
      console.log(`✅ Broadcast ${broadcastId}: ${results.sent}/${results.total} sent`);
    } catch (e) {
      console.error(`❌ Broadcast ${broadcastId} failed:`, e.message);
      await db.updateBroadcast(broadcastId, { status: 'failed' });
    }
  },
};

module.exports = scheduler;
