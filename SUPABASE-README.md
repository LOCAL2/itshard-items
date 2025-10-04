# ItsHard Items Management System - Complete Supabase Package

แพ็คเกจ SQL และไฟล์ที่จำเป็นสำหรับการตั้งค่าฐานข้อมูล Supabase สำหรับระบบจัดการสินค้า ItsHard Items

## 📁 ไฟล์ที่รวมอยู่

### ไฟล์ SQL หลัก
- **`supabase-schema.sql`** - Schema หลักของฐานข้อมูล (ต้องรันก่อน)
- **`supabase-setup.sql`** - การตั้งค่าเพิ่มเติมและฟีเจอร์เสริม
- **`supabase-test-queries.sql`** - ตัวอย่างการใช้งานและทดสอบระบบ
- **`supabase-cleanup.sql`** - สคริปต์สำหรับลบข้อมูลทดสอบ

### ไฟล์ Frontend
- **`src/lib/supabase.ts`** - TypeScript client สำหรับเชื่อมต่อ Supabase
- **`env.example`** - ตัวอย่างไฟล์ environment variables

### ไฟล์เอกสาร
- **`SUPABASE-SETUP.md`** - คู่มือการตั้งค่าและใช้งาน
- **`SUPABASE-INSTALLATION.md`** - คู่มือการติดตั้งและ deploy

## 🚀 การติดตั้งแบบรวดเร็ว

### 1. ติดตั้ง Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. ตั้งค่า Environment Variables

```bash
cp env.example .env.local
```

แก้ไขไฟล์ `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. รัน SQL ใน Supabase

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจค → **SQL Editor**
3. รันไฟล์ `supabase-schema.sql`
4. รันไฟล์ `supabase-setup.sql` (ถ้าต้องการ)

### 4. ทดสอบการเชื่อมต่อ

```sql
SELECT * FROM members LIMIT 5;
SELECT * FROM items LIMIT 5;
```

## 📊 โครงสร้างฐานข้อมูล

### ตารางหลัก

#### `members` - ตารางสมาชิก
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ยังไม่ส่ง' CHECK (status IN ('ยังไม่ส่ง', 'ส่งแล้ว')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `items` - ตารางสินค้า
```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'ชิ้น',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Views และ Functions

- **Views**: `member_summary`, `item_summary`, `dashboard_stats`
- **Functions**: `get_member_stats()`, `search_members()`, `search_items()`, `backup_data()`, `export_report()`

## 🔧 การใช้งานในโค้ด

### Import Supabase Client

```typescript
import { supabase, membersApi, itemsApi, dashboardApi } from '@/lib/supabase'
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

// ดึงสถิติ dashboard
const stats = await dashboardApi.getStats()
```

## 🔒 Security Features

- **Row Level Security (RLS)** เปิดใช้งาน
- **Policies** สำหรับควบคุมการเข้าถึง
- **Authentication** integration
- **Storage** policies สำหรับไฟล์

## 📈 ฟีเจอร์พิเศษ

### Real-time Updates
```typescript
// ฟังการเปลี่ยนแปลงข้อมูลสมาชิก
const subscription = subscribeToMembers((payload) => {
  console.log('Member changed:', payload)
})

// ฟังการเปลี่ยนแปลงข้อมูลสินค้า
const subscription = subscribeToItems((payload) => {
  console.log('Item changed:', payload)
})
```

### การสำรองข้อมูล
```sql
-- สำรองข้อมูลทั้งหมด
SELECT backup_data();

-- ส่งออกรายงาน
SELECT * FROM export_report();
```

### การค้นหา
```sql
-- ค้นหาสมาชิก
SELECT * FROM search_members('สม');

-- ค้นหาสินค้า
SELECT * FROM search_items('ข้าว');
```

## 📋 ข้อมูลตัวอย่าง

ระบบจะสร้างข้อมูลตัวอย่างอัตโนมัติ:

### สมาชิกตัวอย่าง
- สมชาย ใจดี (ยังไม่ส่ง)
- สมหญิง สวยงาม (ส่งแล้ว)
- นายทดสอบ ระบบ (ยังไม่ส่ง)
- นางสาวตัวอย่าง ข้อมูล (ส่งแล้ว)

### สินค้าตัวอย่าง
- ข้าวสาร (5 กิโลกรัม)
- น้ำปลา (2 ขวด)
- เงิน (1000 บาท)
- ผักบุ้ง (3 กิโลกรัม)
- ไข่ไก่ (30 ฟอง)
- น้ำมันพืช (1 ขวด)
- เกลือ (1 กิโลกรัม)
- น้ำตาล (2 กิโลกรัม)

## 🧪 การทดสอบ

### ทดสอบการเชื่อมต่อ
```sql
SELECT * FROM dashboard_stats;
```

### ทดสอบการค้นหา
```sql
SELECT * FROM search_members('สม');
SELECT * FROM search_items('ข้าว');
```

### ทดสอบการสำรองข้อมูล
```sql
SELECT backup_data();
```

## 🧹 การทำความสะอาด

### ลบข้อมูลทดสอบ
```sql
-- รันไฟล์ supabase-cleanup.sql
-- หรือใช้คำสั่งเฉพาะ:

DELETE FROM members WHERE name LIKE '%ทดสอบ%';
DELETE FROM items WHERE item_name LIKE '%ทดสอบ%';
```

### Reset ข้อมูลเป็นค่าเริ่มต้น
```sql
UPDATE members SET status = 'ยังไม่ส่ง' WHERE name = 'สมชาย ใจดี';
UPDATE members SET status = 'ส่งแล้ว' WHERE name = 'สมหญิง สวยงาม';
```

## 🚀 การ Deploy

### Vercel
1. เพิ่ม environment variables ใน Vercel dashboard
2. Deploy โปรเจค

### Netlify
1. เพิ่ม environment variables ใน Netlify dashboard
2. Deploy โปรเจค

## 🔍 Troubleshooting

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

## 📚 เอกสารเพิ่มเติม

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 การสนับสนุน

สำหรับคำถามหรือปัญหาการใช้งาน:
- สร้าง Issue ใน GitHub repository
- ติดต่อทีมพัฒนา ItsHard
- อ่านเอกสารใน `SUPABASE-SETUP.md` และ `SUPABASE-INSTALLATION.md`

## 📄 License

MIT License - ดูไฟล์ LICENSE สำหรับรายละเอียด

---

**ItsHard Items Management System** - ระบบจัดการสินค้าที่พัฒนาด้วย React, TypeScript และ Supabase
