-- อัปเดตข้อมูลสมาชิกใหม่ - ItsHard Items Management System
-- แทนที่ข้อมูลสมาชิกทั้งหมดด้วยข้อมูลใหม่

-- ลบข้อมูลสมาชิกเดิมทั้งหมด
DELETE FROM members;

-- เพิ่มข้อมูลสมาชิกใหม่
INSERT INTO members (name, status, avatar) VALUES
('杰达姆', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/389294709014528001/72c0c589943323676b7cc92d03dc5696.png?size=1024'),
('พ่อค้าขายฝัน ✔', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/848794291232702464/b371987e558cc2b1dfb0b04245e53c6d.png?size=1024'),
('panpis', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/409606154977542155/d139ad81300d393b4021594e8e384a8f.png?size=1024'),
('echo Hello World', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/1416830028271845523/a824ca1f9cee86f32ff207c2190ab98b.png?size=1024'),
('𝖙!𝖒𝖊𝖑𝖊𝖘𝖘 21', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/1348382733520470077/7f951b3e5844d9d41a74eb4e7c31192f.png?size=1024'),
('คนนิครับ', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/1340365102850773178/be291784286bd8c85c622d2028854a63.png?size=1024'),
('wean', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/504905406326243339/345d62b3689516d934528d58782ab8e3.webp?size=512'),
('รัต', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/920610505763225631/31a9daff3b88b4fd22aad84956d2efcc.webp?size=512'),
('mike', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/586851701189771284/70f504a05b5335bf7d9a5633db188e7f.webp?size=512'),
('!Kp', 'ยังไม่ส่ง', 'https://cdn.discordapp.com/avatars/839580183320592384/58fd21bc630db1fc61cb25abce3dae4c.webp?size=512');

-- ตรวจสอบข้อมูลที่เพิ่มแล้ว
SELECT 
    name,
    status,
    avatar,
    created_at
FROM members 
ORDER BY created_at DESC;

-- ดูจำนวนสมาชิกทั้งหมด
SELECT COUNT(*) as total_members FROM members;

-- ดูสถิติสถานะ
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM members), 2) as percentage
FROM members 
GROUP BY status;
