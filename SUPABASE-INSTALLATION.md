# ItsHard Items Management System - Supabase Installation Guide

## ขั้นตอนการติดตั้ง Supabase

### 1. ติดตั้ง Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. ติดตั้ง Supabase CLI (ถ้าต้องการ)

```bash
npm install -g supabase
```

### 3. สร้างไฟล์ Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค:

```bash
cp env.example .env.local
```

จากนั้นแก้ไขไฟล์ `.env.local` และใส่ค่า Supabase URL และ Key ของคุณ:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. รันไฟล์ SQL ใน Supabase

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจคของคุณ
3. ไปที่ **SQL Editor**
4. รันไฟล์ `supabase-schema.sql` ก่อน
5. รันไฟล์ `supabase-setup.sql` (ถ้าต้องการฟีเจอร์เพิ่มเติม)

### 5. ทดสอบการเชื่อมต่อ

รันคำสั่งทดสอบใน SQL Editor:

```sql
SELECT * FROM members LIMIT 5;
SELECT * FROM items LIMIT 5;
```

### 6. อัปเดต Package.json

เพิ่ม dependencies ที่จำเป็น:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

### 7. รันโปรเจค

```bash
npm run dev
```

## การใช้งานในโค้ด

### Import Supabase Client

```typescript
import { supabase, membersApi, itemsApi } from '@/lib/supabase'
```

### ตัวอย่างการใช้งาน

```typescript
// ดึงข้อมูลสมาชิก
const members = await membersApi.getAll()

// เพิ่มสมาชิกใหม่
const newMember = await membersApi.create({
  name: 'ชื่อใหม่',
  status: 'ยังไม่ส่ง',
  avatar: 'https://example.com/avatar.jpg'
})

// อัปเดตสถานะ
await membersApi.updateStatus(memberId, 'ส่งแล้ว')

// ค้นหาสมาชิก
const searchResults = await membersApi.search('สม')
```

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **Connection Error**
   - ตรวจสอบ URL และ Key ใน `.env.local`
   - ตรวจสอบว่าโปรเจค Supabase ยังใช้งานได้

2. **Permission Denied**
   - ตรวจสอบ RLS policies ใน Supabase
   - ตรวจสอบ authentication status

3. **Type Errors**
   - ตรวจสอบ types ใน `src/lib/supabase.ts`
   - รัน `npm run build` เพื่อตรวจสอบ errors

### การแก้ไข

1. ตรวจสอบ Supabase Dashboard logs
2. ใช้ browser developer tools ดู network requests
3. ตรวจสอบ console errors

## การ Deploy

### Vercel

1. เพิ่ม environment variables ใน Vercel dashboard
2. Deploy โปรเจค

### Netlify

1. เพิ่ม environment variables ใน Netlify dashboard
2. Deploy โปรเจค

## การ Backup และ Restore

### Backup ข้อมูล

```sql
SELECT backup_data();
```

### Restore ข้อมูล

```sql
SELECT restore_members('[{"name":"ชื่อ","status":"ยังไม่ส่ง","avatar":"url"}]');
```

## การ Monitor

### ดูสถิติ

```sql
SELECT * FROM dashboard_stats;
```

### ตรวจสอบการใช้งาน

```sql
SELECT * FROM members WHERE updated_at > NOW() - INTERVAL '1 hour';
```

---

สำหรับคำถามเพิ่มเติม กรุณาติดต่อทีมพัฒนา ItsHard
