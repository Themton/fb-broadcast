# 📡 Facebook Page Broadcast System

ระบบบรอดแคสต์สำหรับเพจ Facebook ผ่าน Messenger API — Full-Stack Web Application

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ ฟีเจอร์

- **📤 บรอดแคสต์ข้อความ** — ส่งข้อความหาสมาชิกทั้งหมดหรือเฉพาะกลุ่ม
- **👥 จัดกลุ่มผู้รับ (Segments)** — แบ่งกลุ่มสมาชิกเพื่อส่งข้อความตรงเป้าหมาย
- **⏰ ตั้งเวลาส่ง** — กำหนดวันเวลาส่งล่วงหน้า
- **📊 สถิติการส่ง** — ดู Funnel (ส่ง → ถึงผู้รับ → อ่าน → คลิก)
- **🔄 Sync สมาชิก** — ดึงรายชื่อสมาชิกจาก Facebook Conversations
- **📝 Template ข้อความ** — เทมเพลตสำเร็จรูปพร้อมใช้
- **🌙 Dark Mode UI** — หน้าตาสวยงาม ใช้งานง่าย

## 🏗️ โครงสร้างโปรเจกต์

```
fb-broadcast-system/
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Entry point
│   │   ├── index.css         # Global styles
│   │   └── utils/
│   │       └── api.js        # API client (axios)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                   # Backend (Express.js)
│   ├── index.js              # Server entry point
│   ├── routes/
│   │   ├── broadcast.js      # Broadcast CRUD + send
│   │   ├── segments.js       # Segment management
│   │   ├── subscribers.js    # Subscriber sync + management
│   │   └── page.js           # Page connection + settings
│   ├── utils/
│   │   ├── facebook.js       # Facebook Graph API wrapper
│   │   ├── store.js          # In-memory data store
│   │   └── scheduler.js      # Scheduled broadcast executor
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json              # Root package (monorepo scripts)
└── README.md
```

## 🚀 เริ่มต้นใช้งาน

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/YOUR_USERNAME/fb-broadcast-system.git
cd fb-broadcast-system
```

### 2. ติดตั้ง Dependencies

```bash
npm run install:all
```

### 3. ตั้งค่า Environment

```bash
cp server/.env.example server/.env
```

แก้ไขไฟล์ `server/.env`:

```env
FB_PAGE_ACCESS_TOKEN=your_page_access_token
FB_PAGE_ID=your_page_id
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 4. รันโปรเจกต์

```bash
# รัน Frontend + Backend พร้อมกัน
npm run dev

# หรือรันแยก
npm run dev:server   # Backend: http://localhost:5000
npm run dev:client   # Frontend: http://localhost:5173
```

## 🔑 การสร้าง Facebook Page Access Token

1. ไปที่ [Facebook Developer Console](https://developers.facebook.com)
2. สร้าง App ใหม่ หรือเลือก App ที่มีอยู่
3. เพิ่ม Product: **Messenger**
4. ไปที่ **Messenger Settings** > **Access Tokens**
5. เลือกเพจที่ต้องการ แล้วกด **Generate Token**
6. คัดลอก Token ไปใส่ในไฟล์ `.env` หรือตั้งค่าผ่านหน้า Settings ของระบบ

### Permissions ที่ต้องการ:
- `pages_messaging` — ส่งข้อความ
- `pages_read_engagement` — อ่านข้อมูลเพจ
- `pages_manage_metadata` — จัดการข้อมูลเพจ

> ⚠️ **หมายเหตุ**: Facebook มี Rate Limit สำหรับ Messenger API อยู่ที่ประมาณ 200 ข้อความ/ชั่วโมง สำหรับ Standard Access

## 📡 API Endpoints

### Page
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/page` | ดึงข้อมูลการเชื่อมต่อเพจ |
| POST | `/api/page/connect` | เชื่อมต่อเพจด้วย Token |
| POST | `/api/page/disconnect` | ยกเลิกการเชื่อมต่อ |
| POST | `/api/page/test` | ทดสอบส่งข้อความ |

### Broadcast
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/broadcast` | ดึงรายการ broadcast ทั้งหมด |
| GET | `/api/broadcast/stats` | ดึงสถิติรวม |
| GET | `/api/broadcast/:id` | ดึงรายละเอียด broadcast |
| POST | `/api/broadcast` | สร้าง broadcast ใหม่ |
| DELETE | `/api/broadcast/:id` | ลบ broadcast |
| POST | `/api/broadcast/:id/cancel` | ยกเลิก scheduled broadcast |

### Segments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/segments` | ดึงรายการกลุ่มทั้งหมด |
| POST | `/api/segments` | สร้างกลุ่มใหม่ |
| PUT | `/api/segments/:id` | แก้ไขกลุ่ม |
| DELETE | `/api/segments/:id` | ลบกลุ่ม |

### Subscribers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscribers` | ดึงรายชื่อสมาชิก |
| POST | `/api/subscribers/sync` | Sync สมาชิกจาก Facebook |
| DELETE | `/api/subscribers/:id` | ลบสมาชิก |

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Axios (HTTP Client)
- Lucide React (Icons)
- CSS Custom Properties (Theming)

**Backend:**
- Node.js + Express.js
- Axios (Facebook Graph API)
- node-schedule (Scheduler)
- In-Memory Store (เปลี่ยนเป็น MongoDB ได้)

## 📦 Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

Server จะ serve ไฟล์ frontend จาก `client/dist/` โดยอัตโนมัติ

## 🤝 Contributing

1. Fork โปรเจกต์
2. สร้าง Branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. เปิด Pull Request

## 📄 License

MIT License — ใช้งานได้อย่างอิสระ
