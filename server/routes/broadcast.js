const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const FacebookAPI = require('../utils/facebook');
const scheduler = require('../utils/scheduler');

// GET /api/broadcast - ดึงรายการ broadcast ทั้งหมด
router.get('/', (req, res) => {
  const broadcasts = db.getBroadcasts();
  res.json({ success: true, data: broadcasts });
});

// GET /api/broadcast/stats - ดึงสถิติรวม
router.get('/stats', (req, res) => {
  const stats = db.getStats();
  res.json({ success: true, data: stats });
});

// GET /api/broadcast/:id - ดึงรายละเอียด broadcast
router.get('/:id', (req, res) => {
  const broadcast = db.getBroadcastById(req.params.id);
  if (!broadcast) {
    return res.status(404).json({ success: false, error: 'Broadcast not found' });
  }
  res.json({ success: true, data: broadcast });
});

// POST /api/broadcast - สร้าง broadcast ใหม่
router.post('/', async (req, res) => {
  try {
    const { title, message, targetSegment, targetSegmentNames, scheduleMode, scheduledAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อแคมเปญและข้อความ' });
    }

    const broadcast = db.addBroadcast({
      title,
      message,
      targetSegment: targetSegment || 'all',
      targetSegmentNames: targetSegmentNames || ['ทั้งหมด'],
      status: scheduleMode === 'later' ? 'scheduled' : 'sending',
      scheduledAt: scheduleMode === 'later' ? scheduledAt : null,
    });

    if (scheduleMode === 'later' && scheduledAt) {
      // ตั้งเวลาส่ง
      scheduler.scheduleJob(broadcast.id, scheduledAt);
      res.json({
        success: true,
        data: broadcast,
        message: `ตั้งเวลาส่งเรียบร้อย: ${new Date(scheduledAt).toLocaleString('th-TH')}`,
      });
    } else {
      // ส่งทันที
      scheduler.executeBroadcast(broadcast.id);
      res.json({
        success: true,
        data: broadcast,
        message: 'กำลังส่งข้อความ...',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/broadcast/:id - ลบ broadcast
router.delete('/:id', (req, res) => {
  const broadcast = db.getBroadcastById(req.params.id);
  if (!broadcast) {
    return res.status(404).json({ success: false, error: 'Broadcast not found' });
  }

  // Cancel schedule if needed
  if (broadcast.status === 'scheduled') {
    scheduler.cancelJob(broadcast.id);
  }

  db.deleteBroadcast(req.params.id);
  res.json({ success: true, message: 'ลบเรียบร้อย' });
});

// POST /api/broadcast/:id/cancel - ยกเลิก scheduled broadcast
router.post('/:id/cancel', (req, res) => {
  const broadcast = db.getBroadcastById(req.params.id);
  if (!broadcast) {
    return res.status(404).json({ success: false, error: 'Broadcast not found' });
  }
  if (broadcast.status !== 'scheduled') {
    return res.status(400).json({ success: false, error: 'ไม่สามารถยกเลิกได้ - สถานะไม่ใช่ scheduled' });
  }

  scheduler.cancelJob(broadcast.id);
  db.updateBroadcast(broadcast.id, { status: 'draft' });
  res.json({ success: true, message: 'ยกเลิกกำหนดการส่งเรียบร้อย' });
});

module.exports = router;
