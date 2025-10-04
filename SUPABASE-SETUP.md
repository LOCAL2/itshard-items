# ItsHard Items Management System - Supabase Database Setup

ไฟล์ SQL สำหรับตั้งค่าฐานข้อมูล Supabase สำหรับระบบจัดการสินค้า ItsHard Items

## ไฟล์ที่รวมอยู่

1. **`supabase-schema.sql`** - Schema หลักของฐานข้อมูล
2. **`supabase-setup.sql`** - การตั้งค่าเพิ่มเติมและฟีเจอร์เสริม

## ขั้นตอนการติดตั้ง

### 1. สร้างโปรเจค Supabase ใหม่

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. คลิก "New Project"
3. เลือก Organization และตั้งชื่อโปรเจค
4. รอให้โปรเจคสร้างเสร็จ

### 2. รัน Schema หลัก

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คัดลอกเนื้อหาจากไฟล์ `supabase-schema.sql`
3. วางใน SQL Editor และคลิก **Run**

### 3. รันการตั้งค่าเพิ่มเติม (ถ้าต้องการ)

1. คัดลอกเนื้อหาจากไฟล์ `supabase-setup.sql`
2. วางใน SQL Editor และคลิก **Run**

## โครงสร้างฐานข้อมูล

### ตารางหลัก

#### `members` - ตารางสมาชิก
- `id` (UUID) - Primary Key
- `name` (VARCHAR) - ชื่อสมาชิก
- `status` (VARCHAR) - สถานะ ('ยังไม่ส่ง' หรือ 'ส่งแล้ว')
- `avatar` (TEXT) - URL รูปภาพโปรไฟล์
- `created_at` (TIMESTAMP) - วันที่สร้าง
- `updated_at` (TIMESTAMP) - วันที่อัปเดตล่าสุด

#### `items` - ตารางสินค้า
- `id` (UUID) - Primary Key
- `item_name` (VARCHAR) - ชื่อสินค้า
- `quantity` (INTEGER) - จำนวน
- `unit` (VARCHAR) - หน่วยนับ
- `created_at` (TIMESTAMP) - วันที่สร้าง
- `updated_at` (TIMESTAMP) - วันที่อัปเดตล่าสุด

### Views และ Functions

#### Views
- `member_summary` - สรุปข้อมูลสมาชิกตามสถานะ
- `item_summary` - สรุปข้อมูลสินค้าตามหน่วย
- `dashboard_stats` - สถิติสำหรับ dashboard

#### Functions
- `get_member_stats()` - ดึงสถิติสมาชิก
- `search_members(search_term)` - ค้นหาสมาชิก
- `search_items(search_term)` - ค้นหาสินค้า
- `backup_data()` - สำรองข้อมูล
- `restore_members(data)` - คืนข้อมูลสมาชิก
- `restore_items(data)` - คืนข้อมูลสินค้า
- `export_report()` - ส่งออกรายงาน

## ข้อมูลตัวอย่าง

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

## การเชื่อมต่อจาก Frontend

### 1. ติดตั้ง Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. สร้างไฟล์ config

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 3. ตัวอย่างการใช้งาน

```typescript
// ดึงข้อมูลสมาชิก
const { data: members, error } = await supabase
  .from('members')
  .select('*')

// ดึงข้อมูลสินค้า
const { data: items, error } = await supabase
  .from('items')
  .select('*')

// เพิ่มสมาชิกใหม่
const { data, error } = await supabase
  .from('members')
  .insert([
    { name: 'ชื่อใหม่', status: 'ยังไม่ส่ง', avatar: 'url' }
  ])

// อัปเดตสถานะสมาชิก
const { data, error } = await supabase
  .from('members')
  .update({ status: 'ส่งแล้ว' })
  .eq('id', memberId)
```

## Security Features

- **Row Level Security (RLS)** เปิดใช้งานสำหรับทุกตาราง
- **Policies** สำหรับควบคุมการเข้าถึงข้อมูล
- **Authentication** integration พร้อมใช้งาน
- **Storage** policies สำหรับการอัปโหลดไฟล์

## การสำรองข้อมูล

```sql
-- สำรองข้อมูลทั้งหมด
SELECT backup_data();

-- คืนข้อมูลสมาชิก
SELECT restore_members('[{"name":"ชื่อ","status":"ยังไม่ส่ง","avatar":"url"}]');

-- คืนข้อมูลสินค้า
SELECT restore_items('[{"item_name":"สินค้า","quantity":1,"unit":"ชิ้น"}]');
```

## การส่งออกรายงาน

```sql
-- ส่งออกรายงานทั้งหมด
SELECT * FROM export_report();

-- ดูสถิติ dashboard
SELECT * FROM dashboard_stats;
```

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **Permission denied** - ตรวจสอบ RLS policies
2. **Function not found** - รัน schema ใหม่
3. **Data not showing** - ตรวจสอบ authentication

### การแก้ไข

1. ตรวจสอบ logs ใน Supabase Dashboard
2. รัน SQL queries ทีละส่วน
3. ตรวจสอบ browser console สำหรับ errors

## การอัปเดต

เมื่อมีการเปลี่ยนแปลง schema:

1. Backup ข้อมูลเดิม
2. รัน migration scripts
3. ทดสอบการทำงาน
4. Deploy ไปยัง production

---

สำหรับคำถามหรือปัญหาการใช้งาน กรุณาติดต่อทีมพัฒนา ItsHard
