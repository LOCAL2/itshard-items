// อัปเดตข้อมูลสมาชิกใหม่ - ItsHard Items Management System
// ไฟล์สำหรับการแทนที่ข้อมูลสมาชิกทั้งหมดด้วยข้อมูลใหม่

import { membersApi } from '@/lib/supabase';

// ข้อมูลสมาชิกใหม่
const newMembers = [
  {
    name: "杰达姆",
    avatar: "https://cdn.discordapp.com/avatars/389294709014528001/72c0c589943323676b7cc92d03dc5696.png?size=1024"
  },
  {
    name: "พ่อค้าขายฝัน ✔",
    avatar: "https://cdn.discordapp.com/avatars/848794291232702464/b371987e558cc2b1dfb0b04245e53c6d.png?size=1024"
  },
  {
    name: "panpis",
    avatar: "https://cdn.discordapp.com/avatars/409606154977542155/d139ad81300d393b4021594e8e384a8f.png?size=1024"
  },
  {
    name: "echo Hello World",
    avatar: "https://cdn.discordapp.com/avatars/1416830028271845523/a824ca1f9cee86f32ff207c2190ab98b.png?size=1024"
  },
  {
    name: "𝖙!𝖒𝖊𝖑𝖊𝖘𝖘 21",
    avatar: "https://cdn.discordapp.com/avatars/1348382733520470077/7f951b3e5844d9d41a74eb4e7c31192f.png?size=1024"
  },
  {
    name: "คนนิครับ",
    avatar: "https://cdn.discordapp.com/avatars/1340365102850773178/be291784286bd8c85c622d2028854a63.png?size=1024"
  },
  {
    name: "wean",
    avatar: "https://cdn.discordapp.com/avatars/504905406326243339/345d62b3689516d934528d58782ab8e3.webp?size=512"
  },
  {
    name: "รัต",
    avatar: "https://cdn.discordapp.com/avatars/920610505763225631/31a9daff3b88b4fd22aad84956d2efcc.webp?size=512"
  },
  {
    name: "mike",
    avatar: "https://cdn.discordapp.com/avatars/586851701189771284/70f504a05b5335bf7d9a5633db188e7f.webp?size=512"
  },
  {
    name: "!Kp",
    avatar: "https://cdn.discordapp.com/avatars/839580183320592384/58fd21bc630db1fc61cb25abce3dae4c.webp?size=512"
  }
];

// ฟังก์ชันสำหรับอัปเดตข้อมูลสมาชิกทั้งหมด
export const updateAllMembers = async () => {
  try {
    console.log('เริ่มต้นการอัปเดตข้อมูลสมาชิก...');
    
    // ดึงข้อมูลสมาชิกเดิมทั้งหมด
    const existingMembers = await membersApi.getAll();
    console.log(`พบสมาชิกเดิม ${existingMembers.length} คน`);
    
    // ลบสมาชิกเดิมทั้งหมด
    for (const member of existingMembers) {
      await membersApi.delete(member.id);
      console.log(`ลบสมาชิก: ${member.name}`);
    }
    
    // เพิ่มสมาชิกใหม่ทั้งหมด
    const newMembersWithStatus = newMembers.map(member => ({
      ...member,
      status: 'ยังไม่ส่ง' as const
    }));
    
    for (const member of newMembersWithStatus) {
      await membersApi.create(member);
      console.log(`เพิ่มสมาชิกใหม่: ${member.name}`);
    }
    
    console.log('✅ อัปเดตข้อมูลสมาชิกเสร็จสิ้น!');
    console.log(`เพิ่มสมาชิกใหม่ ${newMembers.length} คน`);
    
    return {
      success: true,
      message: `อัปเดตข้อมูลสมาชิกเสร็จสิ้น! เพิ่มสมาชิกใหม่ ${newMembers.length} คน`,
      deletedCount: existingMembers.length,
      addedCount: newMembers.length
    };
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล',
      error: error
    };
  }
};

// ฟังก์ชันสำหรับอัปเดตข้อมูลสมาชิกแบบ batch (เร็วกว่า)
export const updateAllMembersBatch = async () => {
  try {
    console.log('เริ่มต้นการอัปเดตข้อมูลสมาชิกแบบ batch...');
    
    // ดึงข้อมูลสมาชิกเดิมทั้งหมด
    const existingMembers = await membersApi.getAll();
    console.log(`พบสมาชิกเดิม ${existingMembers.length} คน`);
    
    // ลบสมาชิกเดิมทั้งหมดแบบ batch
    const deletePromises = existingMembers.map(member => membersApi.delete(member.id));
    await Promise.all(deletePromises);
    console.log(`ลบสมาชิกเดิม ${existingMembers.length} คนเสร็จสิ้น`);
    
    // เพิ่มสมาชิกใหม่ทั้งหมดแบบ batch
    const newMembersWithStatus = newMembers.map(member => ({
      ...member,
      status: 'ยังไม่ส่ง' as const
    }));
    
    const createPromises = newMembersWithStatus.map(member => membersApi.create(member));
    await Promise.all(createPromises);
    console.log(`เพิ่มสมาชิกใหม่ ${newMembers.length} คนเสร็จสิ้น`);
    
    console.log('✅ อัปเดตข้อมูลสมาชิกแบบ batch เสร็จสิ้น!');
    
    return {
      success: true,
      message: `อัปเดตข้อมูลสมาชิกเสร็จสิ้น! เพิ่มสมาชิกใหม่ ${newMembers.length} คน`,
      deletedCount: existingMembers.length,
      addedCount: newMembers.length
    };
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล',
      error: error
    };
  }
};

// ฟังก์ชันสำหรับตรวจสอบข้อมูลสมาชิกปัจจุบัน
export const checkCurrentMembers = async () => {
  try {
    const members = await membersApi.getAll();
    console.log('ข้อมูลสมาชิกปัจจุบัน:');
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.status}`);
    });
    
    return {
      success: true,
      members: members,
      count: members.length
    };
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    return {
      success: false,
      error: error
    };
  }
};

// ฟังก์ชันสำหรับอัปเดตสถานะสมาชิกบางคน
export const updateMemberStatus = async (memberName: string, status: 'ยังไม่ส่ง' | 'ส่งแล้ว') => {
  try {
    const members = await membersApi.getAll();
    const member = members.find(m => m.name === memberName);
    
    if (!member) {
      throw new Error(`ไม่พบสมาชิกชื่อ: ${memberName}`);
    }
    
    await membersApi.updateStatus(member.id, status);
    console.log(`✅ อัปเดตสถานะ ${memberName} เป็น: ${status}`);
    
    return {
      success: true,
      message: `อัปเดตสถานะ ${memberName} เป็น: ${status}`
    };
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Export ข้อมูลสมาชิกใหม่สำหรับใช้ที่อื่น
export { newMembers };

// ตัวอย่างการใช้งาน:
/*
// อัปเดตข้อมูลสมาชิกทั้งหมด
const result = await updateAllMembers();
console.log(result);

// ตรวจสอบข้อมูลปัจจุบัน
const current = await checkCurrentMembers();
console.log(current);

// อัปเดตสถานะสมาชิก
await updateMemberStatus('杰达姆', 'ส่งแล้ว');
*/
