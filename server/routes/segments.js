const express = require('express');
const router = express.Router();
const db = require('../utils/store');

router.get('/', async (req, res) => {
  try { res.json({ success: true, data: await db.getSegments() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อกลุ่ม' });
    res.json({ success: true, data: await db.addSegment({ name, color, icon }) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const seg = await db.updateSegment(req.params.id, req.body);
    if (!seg) return res.status(404).json({ success: false, error: 'ไม่พบกลุ่ม' });
    res.json({ success: true, data: seg });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.deleteSegment(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/add-subscriber', async (req, res) => {
  try { await db.addSubscriberToSegment(req.params.id, req.body.subscriberId); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/remove-subscriber', async (req, res) => {
  try { await db.removeSubscriberFromSegment(req.params.id, req.body.subscriberId); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
