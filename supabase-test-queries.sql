-- ItsHard Items Management System - Test Queries & Examples
-- ไฟล์ตัวอย่างการใช้งานและทดสอบระบบ

-- ========================================
-- การทดสอบพื้นฐาน
-- ========================================

-- 1. ตรวจสอบว่าตารางถูกสร้างแล้ว
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('members', 'items');

-- 2. ตรวจสอบข้อมูลตัวอย่าง
SELECT 'Members Count' as table_name, COUNT(*) as count FROM members
UNION ALL
SELECT 'Items Count', COUNT(*) FROM items;

-- ========================================
-- การจัดการสมาชิก (Members)
-- ========================================

-- ดูสมาชิกทั้งหมด
SELECT * FROM members ORDER BY created_at DESC;

-- เพิ่มสมาชิกใหม่
INSERT INTO members (name, status, avatar) VALUES
('นายใหม่ สมาชิก', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');

-- อัปเดตสถานะสมาชิก
UPDATE members 
SET status = 'ส่งแล้ว', updated_at = NOW() 
WHERE name = 'สมชาย ใจดี';

-- ค้นหาสมาชิกตามชื่อ
SELECT * FROM search_members('สม');

-- ลบสมาชิก (ระวัง!)
-- DELETE FROM members WHERE name = 'ชื่อที่จะลบ';

-- ========================================
-- การจัดการสินค้า (Items)
-- ========================================

-- ดูสินค้าทั้งหมด
SELECT * FROM items ORDER BY created_at DESC;

-- เพิ่มสินค้าใหม่
INSERT INTO items (item_name, quantity, unit) VALUES
('น้ำอัดลม', 6, 'ขวด'),
('ขนมปัง', 2, 'ถุง');

-- อัปเดตจำนวนสินค้า
UPDATE items 
SET quantity = 10, updated_at = NOW() 
WHERE item_name = 'ข้าวสาร';

-- ค้นหาสินค้าตามชื่อ
SELECT * FROM search_items('ข้าว');

-- ลบสินค้า (ระวัง!)
-- DELETE FROM items WHERE item_name = 'ชื่อสินค้าที่จะลบ';

-- ========================================
-- การดูรายงานและสถิติ
-- ========================================

-- ดูสถิติสมาชิก
SELECT * FROM get_member_stats();

-- ดูสรุปสมาชิกตามสถานะ
SELECT * FROM member_summary;

-- ดูสรุปสินค้าตามหน่วย
SELECT * FROM item_summary;

-- ดูสถิติ dashboard
SELECT * FROM dashboard_stats;

-- ========================================
-- การสำรองและคืนข้อมูล
-- ========================================

-- สำรองข้อมูลทั้งหมด
SELECT backup_data();

-- ตัวอย่างการคืนข้อมูลสมาชิก
SELECT restore_members('[
  {"name": "ทดสอบ คืนข้อมูล", "status": "ยังไม่ส่ง", "avatar": "https://example.com/avatar.jpg"}
]');

-- ตัวอย่างการคืนข้อมูลสินค้า
SELECT restore_items('[
  {"item_name": "สินค้าทดสอบ", "quantity": 5, "unit": "ชิ้น"}
]');

-- ========================================
-- การส่งออกรายงาน
-- ========================================

-- ส่งออกรายงานทั้งหมด
SELECT * FROM export_report();

-- ส่งออกรายงานเฉพาะสมาชิก
SELECT json_agg(members) as members_report FROM members;

-- ส่งออกรายงานเฉพาะสินค้า
SELECT json_agg(items) as items_report FROM items;

-- ========================================
-- การค้นหาข้อมูลขั้นสูง
-- ========================================

-- ค้นหาสมาชิกที่ยังไม่ส่ง
SELECT * FROM members WHERE status = 'ยังไม่ส่ง';

-- ค้นหาสินค้าที่มีจำนวนมากกว่า 5
SELECT * FROM items WHERE quantity > 5;

-- ค้นหาสินค้าตามหน่วย
SELECT * FROM items WHERE unit = 'กิโลกรัม';

-- สมาชิกที่เพิ่มล่าสุด
SELECT * FROM members ORDER BY created_at DESC LIMIT 3;

-- สินค้าที่เพิ่มล่าสุด
SELECT * FROM items ORDER BY created_at DESC LIMIT 3;

-- ========================================
-- การวิเคราะห์ข้อมูล
-- ========================================

-- สถิติการส่งของสมาชิก
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM members), 2) as percentage
FROM members 
GROUP BY status;

-- สถิติสินค้าตามหน่วย
SELECT 
    unit,
    COUNT(*) as item_types,
    SUM(quantity) as total_quantity,
    AVG(quantity) as avg_quantity
FROM items 
GROUP BY unit 
ORDER BY total_quantity DESC;

-- สมาชิกที่ส่งแล้วและยังไม่ส่ง
SELECT 
    CASE 
        WHEN status = 'ส่งแล้ว' THEN 'Completed'
        ELSE 'Pending'
    END as status_group,
    COUNT(*) as count
FROM members 
GROUP BY status;

-- ========================================
-- การทดสอบ Performance
-- ========================================

-- ทดสอบการค้นหาเร็ว
EXPLAIN ANALYZE SELECT * FROM members WHERE name ILIKE '%สม%';

-- ทดสอบการเรียงลำดับ
EXPLAIN ANALYZE SELECT * FROM items ORDER BY created_at DESC LIMIT 10;

-- ทดสอบการนับ
EXPLAIN ANALYZE SELECT COUNT(*) FROM members WHERE status = 'ส่งแล้ว';

-- ========================================
-- การทดสอบ Security (RLS)
-- ========================================

-- ทดสอบการเข้าถึงข้อมูล (ต้องรันใน context ของ authenticated user)
-- SELECT current_user, session_user;

-- ทดสอบ policies
-- SET ROLE authenticated;
-- SELECT * FROM members; -- ควรทำงานได้
-- SET ROLE anon;
-- SELECT * FROM members; -- ควรทำงานได้ (read-only)

-- ========================================
-- การทำความสะอาดข้อมูลทดสอบ
-- ========================================

-- ลบข้อมูลทดสอบ (ระวัง! ใช้เฉพาะใน development)
-- DELETE FROM members WHERE name LIKE '%ทดสอบ%';
-- DELETE FROM items WHERE item_name LIKE '%ทดสอบ%';

-- Reset ข้อมูลเป็นค่าเริ่มต้น
-- UPDATE members SET status = 'ยังไม่ส่ง' WHERE name IN ('สมชาย ใจดี', 'นายทดสอบ ระบบ');
-- UPDATE members SET status = 'ส่งแล้ว' WHERE name IN ('สมหญิง สวยงาม', 'นางสาวตัวอย่าง ข้อมูล');

-- ========================================
-- การตรวจสอบสุขภาพระบบ
-- ========================================

-- ตรวจสอบขนาดตาราง
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'items');

-- ตรวจสอบ indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'items');

-- ตรวจสอบ functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%member%' OR routine_name LIKE '%item%';

-- ========================================
-- ตัวอย่างการใช้งานใน Production
-- ========================================

-- การเพิ่มสมาชิกแบบ batch
INSERT INTO members (name, status, avatar) VALUES
('สมาชิก 1', 'ยังไม่ส่ง', 'https://example.com/avatar1.jpg'),
('สมาชิก 2', 'ยังไม่ส่ง', 'https://example.com/avatar2.jpg'),
('สมาชิก 3', 'ส่งแล้ว', 'https://example.com/avatar3.jpg');

-- การอัปเดตสถานะแบบ batch
UPDATE members 
SET status = 'ส่งแล้ว', updated_at = NOW() 
WHERE name IN ('สมาชิก 1', 'สมาชิก 2');

-- การเพิ่มสินค้าแบบ batch
INSERT INTO items (item_name, quantity, unit) VALUES
('สินค้า A', 10, 'ชิ้น'),
('สินค้า B', 5, 'กิโลกรัม'),
('สินค้า C', 3, 'ขวด');

-- การอัปเดตจำนวนสินค้าแบบ batch
UPDATE items 
SET quantity = quantity + 5, updated_at = NOW() 
WHERE unit = 'กิโลกรัม';

-- ========================================
-- การ Monitor และ Logging
-- ========================================

-- ดูการใช้งานล่าสุด
SELECT 
    'members' as table_name,
    MAX(updated_at) as last_updated,
    COUNT(*) as total_records
FROM members
UNION ALL
SELECT 
    'items' as table_name,
    MAX(updated_at) as last_updated,
    COUNT(*) as total_records
FROM items;

-- ตรวจสอบข้อมูลที่เปลี่ยนแปลงล่าสุด
SELECT 
    'Recent Members' as category,
    name as item_name,
    updated_at
FROM members 
WHERE updated_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Recent Items' as category,
    item_name,
    updated_at
FROM items 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
