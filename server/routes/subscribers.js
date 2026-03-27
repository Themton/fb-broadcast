const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const FacebookAPI = require('../utils/facebook');

// GET /api/subscribers
router.get('/', (req, res) => {
  const subscribers = db.getSubscribers();
  res.json({ success: true, data: subscribers, total: subscribers.length });
});

// POST /api/subscribers/sync - ดึง subscribers จาก Facebook
router.post('/sync', async (req, res) => {
  try {
    const fb = new FacebookAPI();
    const result = await fb.getConversations(100);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    let synced = 0;
    const conversations = result.data?.data || [];

    for (const conv of conversations) {
      const participants = conv.participants?.data || [];
      for (const participant of participants) {
        // Skip page itself
        if (participant.id === process.env.FB_PAGE_ID) continue;

        const profile = await fb.getUserProfile(participant.id);
        db.addSubscriber({
          id: participant.id,
          name: profile.success
            ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim()
            : participant.name || 'Unknown',
          profilePic: profile.success ? profile.data.profile_pic : null,
          lastInteraction: conv.updated_time,
        });
        synced++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${synced} subscribers`,
      total: db.getSubscribers().length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/subscribers/:id
router.delete('/:id', (req, res) => {
  db.removeSubscriber(req.params.id);
  res.json({ success: true });
});

module.exports = router;
