-- ItsHard Items Management System - Supabase Schema
-- สร้างตารางสำหรับระบบจัดการสินค้า ItsHard Items

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ตารางสมาชิก (Members)
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ยังไม่ส่ง' CHECK (status IN ('ยังไม่ส่ง', 'ส่งแล้ว')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางสินค้า (Items)
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON items(item_name);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- สร้าง function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง triggers สำหรับอัปเดต updated_at อัตโนมัติ
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มข้อมูลตัวอย่างสำหรับ Members
INSERT INTO members (name, status, avatar) VALUES
('สมชาย ใจดี', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('สมหญิง สวยงาม', 'ส่งแล้ว', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
('นายทดสอบ ระบบ', 'ยังไม่ส่ง', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('นางสาวตัวอย่าง ข้อมูล', 'ส่งแล้ว', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face')
ON CONFLICT DO NOTHING;

-- เพิ่มข้อมูลตัวอย่างสำหรับ Items
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

-- สร้าง Row Level Security (RLS) policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ Members - ให้ทุกคนอ่านได้ แต่แก้ไขได้เฉพาะ authenticated users
CREATE POLICY "Members are viewable by everyone" ON members
    FOR SELECT USING (true);

CREATE POLICY "Members are editable by authenticated users" ON members
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy สำหรับ Items - ให้ทุกคนอ่านได้ แต่แก้ไขได้เฉพาะ authenticated users
CREATE POLICY "Items are viewable by everyone" ON items
    FOR SELECT USING (true);

CREATE POLICY "Items are editable by authenticated users" ON items
    FOR ALL USING (auth.role() = 'authenticated');

-- สร้าง views สำหรับการรายงาน
CREATE OR REPLACE VIEW member_summary AS
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM members), 2) as percentage
FROM members
GROUP BY status;

CREATE OR REPLACE VIEW item_summary AS
SELECT 
    unit,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity
FROM items
GROUP BY unit;

-- สร้าง function สำหรับการจัดการข้อมูล
CREATE OR REPLACE FUNCTION get_member_stats()
RETURNS TABLE (
    total_members BIGINT,
    pending_members BIGINT,
    completed_members BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_members,
        COUNT(*) FILTER (WHERE status = 'ยังไม่ส่ง') as pending_members,
        COUNT(*) FILTER (WHERE status = 'ส่งแล้ว') as completed_members,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'ส่งแล้ว') * 100.0 / COUNT(*), 
            2
        ) as completion_rate
    FROM members;
END;
$$ LANGUAGE plpgsql;

-- สร้าง function สำหรับการค้นหา
CREATE OR REPLACE FUNCTION search_members(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    status VARCHAR(50),
    avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.name, m.status, m.avatar
    FROM members m
    WHERE m.name ILIKE '%' || search_term || '%'
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_items(search_term TEXT)
RETURNS TABLE (
    id UUID,
    item_name VARCHAR(255),
    quantity INTEGER,
    unit VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.item_name, i.quantity, i.unit
    FROM items i
    WHERE i.item_name ILIKE '%' || search_term || '%'
    ORDER BY i.item_name;
END;
$$ LANGUAGE plpgsql;

-- สร้าง comments สำหรับ documentation
COMMENT ON TABLE members IS 'ตารางเก็บข้อมูลสมาชิกในระบบ ItsHard Items';
COMMENT ON TABLE items IS 'ตารางเก็บข้อมูลสินค้าในระบบ ItsHard Items';

COMMENT ON COLUMN members.name IS 'ชื่อสมาชิก';
COMMENT ON COLUMN members.status IS 'สถานะการส่ง (ยังไม่ส่ง/ส่งแล้ว)';
COMMENT ON COLUMN members.avatar IS 'URL รูปภาพโปรไฟล์';

COMMENT ON COLUMN items.item_name IS 'ชื่อสินค้า';
COMMENT ON COLUMN items.quantity IS 'จำนวนสินค้า';
COMMENT ON COLUMN items.unit IS 'หน่วยนับสินค้า';

-- สร้างตัวอย่างการใช้งาน
-- SELECT * FROM get_member_stats();
-- SELECT * FROM search_members('สม');
-- SELECT * FROM search_items('ข้าว');
-- SELECT * FROM member_summary;
-- SELECT * FROM item_summary;
