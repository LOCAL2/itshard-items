# 🚨 สำคัญ! ต้องตั้งค่า Supabase ก่อนใช้งาน

ตอนนี้แอปของคุณได้เชื่อมต่อกับ Supabase แล้ว แต่ยังต้องตั้งค่าให้เสร็จสมบูรณ์ก่อน

## 📋 ขั้นตอนที่ต้องทำ

### 1. สร้างโปรเจค Supabase ใหม่
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. คลิก "New Project"
3. เลือก Organization และตั้งชื่อโปรเจค
4. รอให้โปรเจคสร้างเสร็จ

### 2. รันไฟล์ SQL
1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คัดลอกเนื้อหาจากไฟล์ `supabase-schema.sql`
3. วางใน SQL Editor และคลิก **Run**

### 3. ตั้งค่า Environment Variables
แก้ไขไฟล์ `.env.local` และใส่ค่า Supabase ของคุณ:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**วิธีหา URL และ Key:**
1. ไปที่ **Settings** → **API** ใน Supabase Dashboard
2. คัดลอก **Project URL** และ **anon public** key

### 4. ทดสอบการเชื่อมต่อ
รันคำสั่งนี้ใน SQL Editor:
```sql
SELECT * FROM members LIMIT 5;
SELECT * FROM items LIMIT 5;
```

### 5. รันแอป
```bash
npm run dev
```

## 🔍 วิธีตรวจสอบว่าทำงานแล้ว

1. **เปิดหน้าเว็บ** - ควรเห็น loading spinner แล้วแสดงข้อมูลจาก Supabase
2. **เพิ่มข้อมูล** - ลองเพิ่มสมาชิกหรือสินค้าใหม่
3. **แก้ไขข้อมูล** - ลองเปลี่ยนสถานะหรือแก้ไขข้อมูล
4. **Real-time** - เปิดหลายแท็บแล้วดูว่าข้อมูลอัปเดตแบบ real-time

## ❌ หากยังไม่ทำงาน

### ตรวจสอบ Console Errors
1. เปิด Developer Tools (F12)
2. ดู Console tab
3. หา error messages

### ปัญหาที่พบบ่อย
1. **Connection Error** - ตรวจสอบ URL และ Key ใน `.env.local`
2. **Permission Denied** - ตรวจสอบ RLS policies ใน Supabase
3. **Data Not Loading** - ตรวจสอบว่าไฟล์ SQL รันสำเร็จแล้ว

### การแก้ไข
1. ตรวจสอบ Supabase Dashboard logs
2. รันคำสั่งทดสอบใน SQL Editor
3. ตรวจสอบ environment variables

## 📞 หากต้องการความช่วยเหลือ

1. อ่านไฟล์ `SUPABASE-SETUP.md` สำหรับรายละเอียดเพิ่มเติม
2. ตรวจสอบไฟล์ `supabase-test-queries.sql` สำหรับตัวอย่างการใช้งาน
3. ถามคำถามใน GitHub Issues

---

**🎯 เมื่อตั้งค่าเสร็จแล้ว แอปจะทำงานแบบ real-time และข้อมูลจะถูกบันทึกใน Supabase!**
