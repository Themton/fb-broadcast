const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const FacebookAPI = require('../utils/facebook');

// GET /api/page - ดึงข้อมูลเพจ
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getPageConfig() });
});

// POST /api/page/connect - เชื่อมต่อเพจ
router.post('/connect', async (req, res) => {
  try {
    const { pageToken, pageName, pageId } = req.body;

    if (!pageToken) {
      return res.status(400).json({ success: false, error: 'กรุณากรอก Page Access Token' });
    }

    // Validate token with Facebook
    const fb = new FacebookAPI(pageToken);
    const pageInfo = await fb.getPageInfo();

    if (!pageInfo.success) {
      return res.status(400).json({
        success: false,
        error: `Token ไม่ถูกต้อง: ${pageInfo.error}`,
      });
    }

    // Update config
    const config = db.setPageConfig({
      pageId: pageInfo.data.id || pageId,
      pageName: pageInfo.data.name || pageName,
      pageToken,
      connected: true,
      connectedAt: new Date().toISOString(),
      fanCount: pageInfo.data.fan_count,
      picture: pageInfo.data.picture?.data?.url,
      category: pageInfo.data.category,
    });

    // Update env for runtime
    process.env.FB_PAGE_ACCESS_TOKEN = pageToken;
    process.env.FB_PAGE_ID = pageInfo.data.id || pageId;

    res.json({
      success: true,
      data: config,
      message: `เชื่อมต่อเพจ "${pageInfo.data.name}" สำเร็จ`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/page/disconnect - ยกเลิกการเชื่อมต่อ
router.post('/disconnect', (req, res) => {
  db.setPageConfig({
    connected: false,
    pageToken: '',
    connectedAt: null,
  });
  process.env.FB_PAGE_ACCESS_TOKEN = '';
  res.json({ success: true, message: 'ยกเลิกการเชื่อมต่อเรียบร้อย' });
});

// POST /api/page/test - ทดสอบส่งข้อความ
router.post('/test', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) {
      return res.status(400).json({ success: false, error: 'กรุณากรอก recipientId และ message' });
    }

    const fb = new FacebookAPI();
    const result = await fb.sendMessage(recipientId, message);

    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
