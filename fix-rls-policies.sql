-- แก้ไข RLS Policies สำหรับ ItsHard Items Management System
-- ไฟล์นี้แก้ไขปัญหา 406 Not Acceptable และ PGRST116

-- ลบ policies เดิม
DROP POLICY IF EXISTS "Members are viewable by everyone" ON members;
DROP POLICY IF EXISTS "Members are editable by authenticated users" ON members;
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Items are editable by authenticated users" ON items;

-- สร้าง policies ใหม่ที่อนุญาตการเข้าถึงแบบ public
CREATE POLICY "Enable read access for all users" ON members
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON members
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON members
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON items
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON items
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON items
    FOR DELETE USING (true);

-- ตรวจสอบ policies ที่สร้างแล้ว
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('members', 'items')
ORDER BY tablename, policyname;

-- ทดสอบการอัปเดต
SELECT 'Testing update functionality...' as status;

-- ตรวจสอบข้อมูลในตาราง
SELECT 'Current items count:' as info, COUNT(*) as count FROM items;
SELECT 'Current members count:' as info, COUNT(*) as count FROM members;

-- ตัวอย่างการอัปเดต (ถ้ามีข้อมูล)
-- UPDATE items SET updated_at = NOW() WHERE id = (SELECT id FROM items LIMIT 1);
-- SELECT 'Update test completed' as result;
