const express = require('express');
const router = express.Router();
const db = require('../utils/store');
const FacebookAPI = require('../utils/facebook');

router.get('/', async (req, res) => {
  try { res.json({ success: true, data: await db.getPageConfig() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/connect', async (req, res) => {
  try {
    const { pageToken, pageName, pageId } = req.body;
    if (!pageToken) return res.status(400).json({ success: false, error: 'กรุณากรอก Page Access Token' });

    const fb = new FacebookAPI(pageToken);
    const pageInfo = await fb.getPageInfo();
    if (!pageInfo.success) return res.status(400).json({ success: false, error: `Token ไม่ถูกต้อง: ${pageInfo.error}` });

    const config = await db.setPageConfig({
      pageId: pageInfo.data.id || pageId,
      pageName: pageInfo.data.name || pageName,
      pageToken,
      connected: true,
      connectedAt: new Date().toISOString(),
      fanCount: pageInfo.data.fan_count,
      picture: pageInfo.data.picture?.data?.url,
      category: pageInfo.data.category,
    });

    process.env.FB_PAGE_ACCESS_TOKEN = pageToken;
    process.env.FB_PAGE_ID = pageInfo.data.id || pageId;

    res.json({ success: true, data: config, message: `เชื่อมต่อเพจ "${pageInfo.data.name}" สำเร็จ` });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/disconnect', async (req, res) => {
  try {
    await db.setPageConfig({ connected: false, pageToken: '', connectedAt: null });
    process.env.FB_PAGE_ACCESS_TOKEN = '';
    res.json({ success: true, message: 'ยกเลิกการเชื่อมต่อเรียบร้อย' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/test', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) return res.status(400).json({ success: false, error: 'กรุณากรอก recipientId และ message' });
    const fb = new FacebookAPI();
    res.json(await fb.sendMessage(recipientId, message));
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
