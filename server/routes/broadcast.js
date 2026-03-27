const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const scheduler = require('../utils/scheduler');

router.get('/', async (req, res) => {
  try { res.json({ success: true, data: await db.getBroadcasts() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try { res.json({ success: true, data: await db.getStats() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const bc = await db.getBroadcastById(req.params.id);
    if (!bc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: bc });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, message, targetSegment, targetSegmentNames, scheduleMode, scheduledAt } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อแคมเปญและข้อความ' });

    const broadcast = await db.addBroadcast({
      title, message, targetSegment: targetSegment || 'all',
      targetSegmentNames: targetSegmentNames || ['ทั้งหมด'],
      status: scheduleMode === 'later' ? 'scheduled' : 'sending',
      scheduledAt: scheduleMode === 'later' ? scheduledAt : null,
    });

    if (scheduleMode === 'later' && scheduledAt) {
      scheduler.scheduleJob(broadcast.id, scheduledAt);
      res.json({ success: true, data: broadcast, message: `ตั้งเวลาส่งเรียบร้อย` });
    } else {
      scheduler.executeBroadcast(broadcast.id);
      res.json({ success: true, data: broadcast, message: 'กำลังส่งข้อความ...' });
    }
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const bc = await db.getBroadcastById(req.params.id);
    if (bc && bc.status === 'scheduled') scheduler.cancelJob(bc.id);
    await db.deleteBroadcast(req.params.id);
    res.json({ success: true, message: 'ลบเรียบร้อย' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const bc = await db.getBroadcastById(req.params.id);
    if (!bc) return res.status(404).json({ success: false, error: 'Not found' });
    if (bc.status !== 'scheduled') return res.status(400).json({ success: false, error: 'ไม่สามารถยกเลิกได้' });
    scheduler.cancelJob(bc.id);
    await db.updateBroadcast(bc.id, { status: 'draft' });
    res.json({ success: true, message: 'ยกเลิกเรียบร้อย' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
