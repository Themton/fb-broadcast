const express = require('express');
const router = express.Router();
const db = require('../utils/store');

// GET /api/segments
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getSegments() });
});

// POST /api/segments
router.post('/', (req, res) => {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อกลุ่ม' });
  const segment = db.addSegment({ name, color, icon });
  res.json({ success: true, data: segment });
});

// PUT /api/segments/:id
router.put('/:id', (req, res) => {
  const segment = db.updateSegment(req.params.id, req.body);
  if (!segment) return res.status(404).json({ success: false, error: 'ไม่พบกลุ่ม' });
  res.json({ success: true, data: segment });
});

// DELETE /api/segments/:id
router.delete('/:id', (req, res) => {
  db.deleteSegment(req.params.id);
  res.json({ success: true, message: 'ลบกลุ่มเรียบร้อย' });
});

// POST /api/segments/:id/add-subscriber
router.post('/:id/add-subscriber', (req, res) => {
  const { subscriberId } = req.body;
  db.addSubscriberToSegment(req.params.id, subscriberId);
  res.json({ success: true });
});

// POST /api/segments/:id/remove-subscriber
router.post('/:id/remove-subscriber', (req, res) => {
  const { subscriberId } = req.body;
  db.removeSubscriberFromSegment(req.params.id, subscriberId);
  res.json({ success: true });
});

module.exports = router;
