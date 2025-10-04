-- เพิ่มคอลัมน์ display_order ในตาราง items
-- Migration: Add display_order column to items table

-- เพิ่มคอลัมน์ display_order
ALTER TABLE items 
ADD COLUMN display_order INTEGER;

-- สร้าง index สำหรับ display_order เพื่อเพิ่มประสิทธิภาพการ query
CREATE INDEX idx_items_display_order ON items(display_order);

-- อัปเดตข้อมูลเดิมให้มี display_order ตามลำดับ created_at
WITH ranked_items AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC) as new_order
  FROM items
  WHERE display_order IS NULL
)
UPDATE items 
SET display_order = ranked_items.new_order
FROM ranked_items
WHERE items.id = ranked_items.id;

-- เพิ่ม comment อธิบายคอลัมน์
COMMENT ON COLUMN items.display_order IS 'ลำดับการแสดงผลรายการ (เลขน้อยแสดงก่อน)';