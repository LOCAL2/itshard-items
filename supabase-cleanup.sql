-- ItsHard Items Management System - Cleanup Scripts
-- ไฟล์สำหรับการลบข้อมูลทดสอบและทำความสะอาดฐานข้อมูล

-- ========================================
-- คำเตือน: ไฟล์นี้จะลบข้อมูลทั้งหมด!
-- ใช้เฉพาะใน development หรือเมื่อต้องการ reset ข้อมูล
-- ========================================

-- ========================================
-- การลบข้อมูลทดสอบ
-- ========================================

-- ลบสมาชิกที่เพิ่มสำหรับทดสอบ
DELETE FROM members WHERE name LIKE '%ทดสอบ%';
DELETE FROM members WHERE name LIKE '%ใหม่%';
DELETE FROM members WHERE name LIKE '%ตัวอย่าง%';

-- ลบสินค้าที่เพิ่มสำหรับทดสอบ
DELETE FROM items WHERE item_name LIKE '%ทดสอบ%';
DELETE FROM items WHERE item_name LIKE '%ใหม่%';
DELETE FROM items WHERE item_name LIKE '%ตัวอย่าง%';

-- ========================================
-- การ Reset ข้อมูลเป็นค่าเริ่มต้น
-- ========================================

-- Reset สถานะสมาชิกเป็นค่าเริ่มต้น
UPDATE members 
SET status = 'ยังไม่ส่ง', updated_at = NOW() 
WHERE name IN ('สมชาย ใจดี', 'นายทดสอบ ระบบ');

UPDATE members 
SET status = 'ส่งแล้ว', updated_at = NOW() 
WHERE name IN ('สมหญิง สวยงาม', 'นางสาวตัวอย่าง ข้อมูล');

-- Reset จำนวนสินค้าเป็นค่าเริ่มต้น
UPDATE items 
SET quantity = 5, updated_at = NOW() 
WHERE item_name = 'ข้าวสาร';

UPDATE items 
SET quantity = 2, updated_at = NOW() 
WHERE item_name = 'น้ำปลา';

UPDATE items 
SET quantity = 1000, updated_at = NOW() 
WHERE item_name = 'เงิน';

-- ========================================
-- การลบข้อมูลทั้งหมด (ระวัง!)
-- ========================================

-- ลบข้อมูลทั้งหมดในตาราง items
-- DELETE FROM items;

-- ลบข้อมูลทั้งหมดในตาราง members
-- DELETE FROM members;

-- ลบข้อมูลทั้งหมดในตาราง profiles (ถ้ามี)
-- DELETE FROM profiles;

-- ========================================
-- การลบตารางทั้งหมด (ระวัง!)
-- ========================================

-- ลบ triggers ก่อน
-- DROP TRIGGER IF EXISTS update_members_updated_at ON members;
-- DROP TRIGGER IF EXISTS update_items_updated_at ON items;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ลบ functions
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS get_member_stats();
-- DROP FUNCTION IF EXISTS search_members(TEXT);
-- DROP FUNCTION IF EXISTS search_items(TEXT);
-- DROP FUNCTION IF EXISTS backup_data();
-- DROP FUNCTION IF EXISTS restore_members(JSON);
-- DROP FUNCTION IF EXISTS restore_items(JSON);
-- DROP FUNCTION IF EXISTS export_report();

-- ลบ views
-- DROP VIEW IF EXISTS member_summary;
-- DROP VIEW IF EXISTS item_summary;
-- DROP VIEW IF EXISTS dashboard_stats;

-- ลบตาราง
-- DROP TABLE IF EXISTS items CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- การลบ Storage Buckets (ถ้ามี)
-- ========================================

-- ลบไฟล์ใน storage buckets
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';
-- DELETE FROM storage.objects WHERE bucket_id = 'items';

-- ลบ buckets
-- DELETE FROM storage.buckets WHERE id = 'avatars';
-- DELETE FROM storage.buckets WHERE id = 'items';

-- ========================================
-- การสร้างข้อมูลตัวอย่างใหม่
-- ========================================

-- เพิ่มข้อมูลตัวอย่างใหม่
INSERT INTO members (name, status, avatar) VALUES
('สมชาย ใจดี', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('สมหญิง สวยงาม', 'ส่งแล้ว', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
('นายทดสอบ ระบบ', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('นางสาวตัวอย่าง ข้อมูล', 'ส่งแล้ว', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face')
ON CONFLICT DO NOTHING;

INSERT INTO items (item_name, quantity, unit) VALUES
('ข้าวสาร', 5, 'กิโลกรัม'),
('น้ำปลา', 2, 'ขวด'),
('เงิน', 1000, 'บาท'),
('ผักบุ้ง', 3, 'กิโลกรัม'),
('ไข่ไก่', 30, 'ฟอง'),
('น้ำมันพืช', 1, 'ขวด'),
('เกลือ', 1, 'กิโลกรัม'),
('น้ำตาล', 2, 'กิโลกรัม')
ON CONFLICT DO NOTHING;

-- ========================================
-- การตรวจสอบข้อมูลหลัง Cleanup
-- ========================================

-- ตรวจสอบจำนวนข้อมูล
SELECT 'Members' as table_name, COUNT(*) as count FROM members
UNION ALL
SELECT 'Items', COUNT(*) FROM items;

-- ตรวจสอบข้อมูลล่าสุด
SELECT 'Recent Members' as category, name as item_name, updated_at
FROM members 
ORDER BY updated_at DESC 
LIMIT 5
UNION ALL
SELECT 'Recent Items' as category, item_name, updated_at
FROM items 
ORDER BY updated_at DESC 
LIMIT 5
ORDER BY updated_at DESC;

-- ตรวจสอบสถิติ
SELECT * FROM dashboard_stats;

-- ========================================
-- การลบข้อมูลเก่า (มากกว่า 30 วัน)
-- ========================================

-- ลบสมาชิกที่ไม่ได้อัปเดตมากกว่า 30 วัน
-- DELETE FROM members WHERE updated_at < NOW() - INTERVAL '30 days';

-- ลบสินค้าที่ไม่ได้อัปเดตมากกว่า 30 วัน
-- DELETE FROM items WHERE updated_at < NOW() - INTERVAL '30 days';

-- ========================================
-- การลบข้อมูลซ้ำ
-- ========================================

-- ลบสมาชิกซ้ำ (เก็บเฉพาะตัวแรก)
-- DELETE FROM members 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM members 
--     GROUP BY name
-- );

-- ลบสินค้าซ้ำ (เก็บเฉพาะตัวแรก)
-- DELETE FROM items 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM items 
--     GROUP BY item_name
-- );

-- ========================================
-- การลบข้อมูลที่ไม่ถูกต้อง
-- ========================================

-- ลบสมาชิกที่ไม่มีชื่อ
-- DELETE FROM members WHERE name IS NULL OR name = '';

-- ลบสินค้าที่ไม่มีชื่อ
-- DELETE FROM items WHERE item_name IS NULL OR item_name = '';

-- ลบสินค้าที่มีจำนวนติดลบ
-- DELETE FROM items WHERE quantity < 0;

-- ========================================
-- การลบข้อมูลตามเงื่อนไขเฉพาะ
-- ========================================

-- ลบสมาชิกที่มีสถานะไม่ถูกต้อง
-- DELETE FROM members WHERE status NOT IN ('ยังไม่ส่ง', 'ส่งแล้ว');

-- ลบสินค้าที่มีหน่วยไม่ถูกต้อง
-- DELETE FROM items WHERE unit IS NULL OR unit = '';

-- ลบสมาชิกที่มี avatar URL ไม่ถูกต้อง
-- DELETE FROM members WHERE avatar LIKE '%example.com%';

-- ========================================
-- การลบข้อมูลทดสอบทั้งหมด
-- ========================================

-- ลบข้อมูลทดสอบทั้งหมด (ใช้เมื่อต้องการเริ่มใหม่)
-- TRUNCATE TABLE items CASCADE;
-- TRUNCATE TABLE members CASCADE;

-- เพิ่มข้อมูลตัวอย่างใหม่หลังลบทั้งหมด
-- INSERT INTO members (name, status, avatar) VALUES
-- ('สมชาย ใจดี', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
-- ('สมหญิง สวยงาม', 'ส่งแล้ว', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');

-- INSERT INTO items (item_name, quantity, unit) VALUES
-- ('ข้าวสาร', 5, 'กิโลกรัม'),
-- ('น้ำปลา', 2, 'ขวด'),
-- ('เงิน', 1000, 'บาท');

-- ========================================
-- การตรวจสอบสุขภาพฐานข้อมูล
-- ========================================

-- ตรวจสอบขนาดตาราง
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
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

-- ตรวจสอบ constraints
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('members', 'items')
);

-- ========================================
-- การ Optimize ฐานข้อมูล
-- ========================================

-- อัปเดต statistics
-- ANALYZE members;
-- ANALYZE items;

-- Rebuild indexes
-- REINDEX TABLE members;
-- REINDEX TABLE items;

-- Vacuum ตาราง
-- VACUUM ANALYZE members;
-- VACUUM ANALYZE items;
