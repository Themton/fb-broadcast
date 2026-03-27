# 📡 Facebook Page Broadcast System

ระบบบรอดแคสต์ข้อความผ่าน Facebook Messenger API พร้อมใช้งานจริง

**Stack:** React + Express.js + Supabase + GitHub Pages + Railway

## 🚀 ขั้นตอนตั้งค่า (ทำครั้งเดียว)

### ขั้นตอนที่ 1: สร้าง Supabase Database

1. ไปที่ [supabase.com](https://supabase.com) → สร้างบัญชี/เข้าสู่ระบบ
2. กด **New Project** → ตั้งชื่อ เลือก Region ใกล้ตัว (Singapore)
3. รอสร้างเสร็จ → ไปที่ **SQL Editor**
4. คัดลอกเนื้อหาจากไฟล์ `server/database/migration.sql` แล้ววางใน SQL Editor → กด **Run**
5. ไปที่ **Settings > API** → คัดลอก:
   - `Project URL` → นี่คือ `SUPABASE_URL`
   - `service_role` key (ใต้ Project API Keys) → นี่คือ `SUPABASE_SERVICE_KEY`

### ขั้นตอนที่ 2: Deploy Backend บน Railway

1. ไปที่ [railway.app](https://railway.app) → เข้าสู่ระบบด้วย GitHub
2. กด **New Project** → เลือก **Deploy from GitHub repo**
3. เลือก repo `fb-broadcast` → Deploy
4. ไปที่ **Variables** → เพิ่ม Environment Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJI...
PORT=5000
NODE_ENV=production
CLIENT_URL=https://themton.github.io
```

5. ไปที่ **Settings > Networking** → กด **Generate Domain** → คัดลอก URL (เช่น `https://fb-broadcast-production-xxxx.up.railway.app`)

### ขั้นตอนที่ 3: อัพเดท Frontend ให้เชื่อม Backend

1. ไปที่ GitHub repo > **Settings > Pages** → เลือก Branch: `gh-pages`, Folder: `/ (root)` → Save
2. ไปที่ repo > **Settings > Secrets and variables > Actions** > **Variables** tab
3. เพิ่ม Variable: `VITE_API_URL` = `https://your-railway-url.up.railway.app`
4. Frontend จะเชื่อมต่อ Backend อัตโนมัติ

### ขั้นตอนที่ 4: สร้าง Facebook Page Access Token

1. ไปที่ [developers.facebook.com](https://developers.facebook.com) → สร้าง App (ประเภท Business)
2. เพิ่ม Product: **Messenger**
3. **Messenger Settings** → Token Generation → เลือกเพจ → Generate Token
4. คัดลอก Token → ใส่ในหน้า **ตั้งค่า** ของระบบ (หรือเพิ่มใน Railway Variables)

**Permissions ที่ต้องการ:**
- `pages_messaging`
- `pages_read_engagement`
- `pages_manage_metadata`

## 🏗️ โครงสร้าง

```
├── client/                 # Frontend (React + Vite)
│   └── src/utils/api.js    # API client (auto-detect backend)
├── server/                 # Backend (Express.js)
│   ├── database/migration.sql  # Supabase schema
│   ├── utils/
│   │   ├── supabase.js     # Supabase client
│   │   ├── store.js        # Data operations
│   │   ├── facebook.js     # Facebook Graph API
│   │   └── scheduler.js    # Scheduled broadcasts
│   └── routes/             # API endpoints
├── Procfile                # Railway deploy config
└── nixpacks.toml           # Railway build config
```

## 💻 พัฒนาในเครื่อง

```bash
# Clone
git clone https://github.com/Themton/fb-broadcast.git
cd fb-broadcast

# ตั้งค่า
cp server/.env.example server/.env
# แก้ไข .env ใส่ SUPABASE_URL, SUPABASE_SERVICE_KEY

# ติดตั้ง
cd server && npm install && cd ..
cd client && npm install && cd ..

# รัน
npm run dev
```

## 📄 License

MIT
