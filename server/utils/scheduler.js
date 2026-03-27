const schedule = require('node-schedule');
const db = require('./store');
const FacebookAPI = require('./facebook');

const scheduledJobs = new Map();

const scheduler = {
  init() {
    console.log('⏰ Scheduler initialized');
    // Check for any pending scheduled broadcasts every minute
    setInterval(() => this.checkScheduled(), 60000);
  },

  checkScheduled() {
    const pending = db.getScheduledBroadcasts();
    const now = new Date();

    for (const broadcast of pending) {
      if (!broadcast.scheduledAt) continue;
      const scheduledTime = new Date(broadcast.scheduledAt);

      if (scheduledTime <= now && !scheduledJobs.has(broadcast.id)) {
        console.log(`📤 Executing scheduled broadcast: ${broadcast.title}`);
        this.executeBroadcast(broadcast.id);
      }
    }
  },

  scheduleJob(broadcastId, dateTime) {
    // Cancel existing job if any
    if (scheduledJobs.has(broadcastId)) {
      scheduledJobs.get(broadcastId).cancel();
    }

    const job = schedule.scheduleJob(new Date(dateTime), () => {
      console.log(`📤 Scheduled broadcast triggered: ${broadcastId}`);
      this.executeBroadcast(broadcastId);
    });

    if (job) {
      scheduledJobs.set(broadcastId, job);
      console.log(`⏰ Broadcast ${broadcastId} scheduled for ${dateTime}`);
    }

    return job;
  },

  cancelJob(broadcastId) {
    if (scheduledJobs.has(broadcastId)) {
      scheduledJobs.get(broadcastId).cancel();
      scheduledJobs.delete(broadcastId);
      console.log(`❌ Cancelled scheduled broadcast: ${broadcastId}`);
    }
  },

  async executeBroadcast(broadcastId) {
    const broadcast = db.getBroadcastById(broadcastId);
    if (!broadcast) return;

    const fb = new FacebookAPI();

    // Update status to sending
    db.updateBroadcast(broadcastId, { status: 'sending', sentAt: new Date().toISOString() });

    // Get recipients
    let recipients;
    if (broadcast.targetSegment === 'all') {
      recipients = db.getSubscribers();
    } else {
      const segmentIds = Array.isArray(broadcast.targetSegment)
        ? broadcast.targetSegment
        : [broadcast.targetSegment];

      const recipientSet = new Set();
      for (const segId of segmentIds) {
        const subs = db.getSubscribersBySegment(segId);
        subs.forEach(s => recipientSet.add(s.id));
      }
      recipients = [...recipientSet].map(id => db.getSubscribers().find(s => s.id === id)).filter(Boolean);
    }

    const recipientIds = recipients.map(r => r.id);

    if (recipientIds.length === 0) {
      db.updateBroadcast(broadcastId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        stats: { total: 0, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0, errors: [] },
      });
      return;
    }

    // Send via Facebook API
    const results = await fb.broadcastMessage(recipientIds, broadcast.message, {
      delayMs: 200, // Rate limiting
      onProgress: (progress) => {
        db.updateBroadcast(broadcastId, {
          stats: {
            total: progress.total,
            sent: progress.results.sent,
            delivered: progress.results.delivered,
            read: 0,
            clicked: 0,
            failed: progress.results.failed,
            errors: progress.results.errors,
          },
        });
      },
    });

    // Update final status
    db.updateBroadcast(broadcastId, {
      status: results.failed === results.total ? 'failed' : 'completed',
      completedAt: new Date().toISOString(),
      stats: {
        total: results.total,
        sent: results.sent,
        delivered: results.delivered,
        read: 0,
        clicked: 0,
        failed: results.failed,
        errors: results.errors,
      },
    });

    // Cleanup
    scheduledJobs.delete(broadcastId);
    console.log(`✅ Broadcast ${broadcastId} completed: ${results.sent}/${results.total} sent`);
  },
};

module.exports = scheduler;
