const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const FacebookAPI = require('../utils/facebook');

router.get('/', async (req, res) => {
  try {
    const subs = await db.getSubscribers();
    res.json({ success: true, data: subs, total: subs.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/sync', async (req, res) => {
  try {
    const fb = new FacebookAPI();
    const result = await fb.getConversations(100);
    if (!result.success) return res.status(400).json({ success: false, error: result.error });

    let synced = 0;
    for (const conv of (result.data?.data || [])) {
      for (const p of (conv.participants?.data || [])) {
        if (p.id === process.env.FB_PAGE_ID) continue;
        const profile = await fb.getUserProfile(p.id);
        await db.addSubscriber({
          id: p.id,
          name: profile.success ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim() : p.name || 'Unknown',
          profilePic: profile.success ? profile.data.profile_pic : null,
          lastInteraction: conv.updated_time,
        });
        synced++;
      }
    }
    const subs = await db.getSubscribers();
    res.json({ success: true, message: `Sync สำเร็จ ${synced} คน`, total: subs.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.removeSubscriber(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
