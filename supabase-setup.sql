-- Supabase Setup Instructions
-- คำแนะนำการตั้งค่า Supabase สำหรับ ItsHard Items Management System

-- 1. สร้างโปรเจคใหม่ใน Supabase Dashboard
-- 2. ไปที่ SQL Editor
-- 3. รันไฟล์ supabase-schema.sql ก่อน
-- 4. จากนั้นรันไฟล์นี้เพื่อตั้งค่าเพิ่มเติม

-- ตั้งค่า Authentication (ถ้าต้องการ)
-- สร้างตาราง profiles สำหรับเก็บข้อมูลผู้ใช้เพิ่มเติม
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง RLS policies สำหรับ profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- สร้าง function สำหรับจัดการ profile เมื่อสร้าง user ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง trigger สำหรับ auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ตั้งค่า Storage สำหรับเก็บรูปภาพ (ถ้าต้องการ)
-- สร้าง bucket สำหรับเก็บรูปภาพ
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('items', 'items', true);

-- สร้าง policies สำหรับ storage
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Item images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'items');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can upload item images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'items' AND 
        auth.role() = 'authenticated'
    );

-- สร้าง function สำหรับการ backup ข้อมูล
CREATE OR REPLACE FUNCTION backup_data()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'members', (SELECT json_agg(members) FROM members),
        'items', (SELECT json_agg(items) FROM items),
        'backup_date', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- สร้าง function สำหรับการ restore ข้อมูล
CREATE OR REPLACE FUNCTION restore_members(members_data JSON)
RETURNS INTEGER AS $$
DECLARE
    member JSON;
    inserted_count INTEGER := 0;
BEGIN
    FOR member IN SELECT * FROM json_array_elements(members_data)
    LOOP
        INSERT INTO members (name, status, avatar)
        VALUES (
            member->>'name',
            member->>'status',
            member->>'avatar'
        )
        ON CONFLICT DO NOTHING;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION restore_items(items_data JSON)
RETURNS INTEGER AS $$
DECLARE
    item JSON;
    inserted_count INTEGER := 0;
BEGIN
    FOR item IN SELECT * FROM json_array_elements(items_data)
    LOOP
        INSERT INTO items (item_name, quantity, unit)
        VALUES (
            item->>'item_name',
            (item->>'quantity')::INTEGER,
            item->>'unit'
        )
        ON CONFLICT DO NOTHING;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- สร้าง views สำหรับ dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM members) as total_members,
    (SELECT COUNT(*) FROM members WHERE status = 'ส่งแล้ว') as completed_members,
    (SELECT COUNT(*) FROM members WHERE status = 'ยังไม่ส่ง') as pending_members,
    (SELECT COUNT(*) FROM items) as total_items,
    (SELECT SUM(quantity) FROM items) as total_quantity,
    ROUND(
        (SELECT COUNT(*) FROM members WHERE status = 'ส่งแล้ว') * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM members), 0), 
        2
    ) as completion_percentage;

-- สร้าง function สำหรับการส่งออกรายงาน
CREATE OR REPLACE FUNCTION export_report()
RETURNS TABLE (
    report_type TEXT,
    data JSON,
    generated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'members_report'::TEXT,
        (SELECT json_agg(members) FROM members)::JSON,
        NOW()
    UNION ALL
    SELECT 
        'items_report'::TEXT,
        (SELECT json_agg(items) FROM items)::JSON,
        NOW()
    UNION ALL
    SELECT 
        'summary_report'::TEXT,
        (SELECT json_agg(dashboard_stats) FROM dashboard_stats)::JSON,
        NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments สำหรับ documentation
COMMENT ON TABLE profiles IS 'ตารางเก็บข้อมูลโปรไฟล์ผู้ใช้เพิ่มเติม';
COMMENT ON FUNCTION backup_data() IS 'ฟังก์ชันสำหรับ backup ข้อมูลทั้งหมด';
COMMENT ON FUNCTION restore_members(JSON) IS 'ฟังก์ชันสำหรับ restore ข้อมูลสมาชิก';
COMMENT ON FUNCTION restore_items(JSON) IS 'ฟังก์ชันสำหรับ restore ข้อมูลสินค้า';
COMMENT ON VIEW dashboard_stats IS 'View สำหรับแสดงสถิติใน dashboard';

-- ตัวอย่างการใช้งาน
-- SELECT * FROM dashboard_stats;
-- SELECT * FROM export_report();
-- SELECT backup_data();
