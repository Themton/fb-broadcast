const axios = require('axios');

const FB_API_VERSION = 'v19.0';
const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

class FacebookAPI {
  constructor(pageAccessToken) {
    this.token = pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN;
    this.pageId = process.env.FB_PAGE_ID;
  }

  /**
   * ส่งข้อความไปยังผู้ใช้ผ่าน Messenger
   */
  async sendMessage(recipientId, message, messageTag = 'ACCOUNT_UPDATE') {
    try {
      const response = await axios.post(
        `${FB_BASE_URL}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'MESSAGE_TAG',
          tag: messageTag,
        },
        {
          params: { access_token: this.token },
          timeout: 10000,
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      console.error(`❌ Send failed to ${recipientId}:`, errMsg);
      return { success: false, error: errMsg, recipientId };
    }
  }

  /**
   * ส่งข้อความพร้อมปุ่ม
   */
  async sendMessageWithButtons(recipientId, text, buttons, messageTag = 'ACCOUNT_UPDATE') {
    try {
      const response = await axios.post(
        `${FB_BASE_URL}/me/messages`,
        {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text,
                buttons: buttons.map(btn => ({
                  type: 'web_url',
                  url: btn.url,
                  title: btn.title,
                })),
              },
            },
          },
          messaging_type: 'MESSAGE_TAG',
          tag: messageTag,
        },
        {
          params: { access_token: this.token },
          timeout: 10000,
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errMsg, recipientId };
    }
  }

  /**
   * ส่งรูปภาพ
   */
  async sendImage(recipientId, imageUrl, messageTag = 'ACCOUNT_UPDATE') {
    try {
      const response = await axios.post(
        `${FB_BASE_URL}/me/messages`,
        {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'image',
              payload: { url: imageUrl, is_reusable: true },
            },
          },
          messaging_type: 'MESSAGE_TAG',
          tag: messageTag,
        },
        {
          params: { access_token: this.token },
          timeout: 15000,
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errMsg, recipientId };
    }
  }

  /**
   * ดึงข้อมูลเพจ
   */
  async getPageInfo() {
    try {
      const response = await axios.get(`${FB_BASE_URL}/me`, {
        params: {
          access_token: this.token,
          fields: 'id,name,fan_count,picture,category',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  /**
   * ดึงรายชื่อ conversations (subscribers)
   */
  async getConversations(limit = 100, after = null) {
    try {
      const params = {
        access_token: this.token,
        fields: 'participants,updated_time',
        limit,
      };
      if (after) params.after = after;

      const response = await axios.get(`${FB_BASE_URL}/me/conversations`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้
   */
  async getUserProfile(userId) {
    try {
      const response = await axios.get(`${FB_BASE_URL}/${userId}`, {
        params: {
          access_token: this.token,
          fields: 'first_name,last_name,profile_pic',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  /**
   * Broadcast ส่งข้อความหาหลายคน (มี rate limit 200/hr)
   */
  async broadcastMessage(recipientIds, message, options = {}) {
    const { delayMs = 100, messageTag = 'ACCOUNT_UPDATE', onProgress } = options;
    const results = {
      total: recipientIds.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < recipientIds.length; i++) {
      const id = recipientIds[i];
      const result = await this.sendMessage(id, message, messageTag);

      if (result.success) {
        results.sent++;
        results.delivered++;
      } else {
        results.failed++;
        results.errors.push({ recipientId: id, error: result.error });
      }

      // Progress callback
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: recipientIds.length,
          percent: Math.round(((i + 1) / recipientIds.length) * 100),
          results,
        });
      }

      // Rate limiting delay
      if (i < recipientIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * ตรวจสอบ Token ว่ายังใช้งานได้
   */
  async validateToken() {
    try {
      const response = await axios.get(`${FB_BASE_URL}/debug_token`, {
        params: {
          input_token: this.token,
          access_token: this.token,
        },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }
}

module.exports = FacebookAPI;
