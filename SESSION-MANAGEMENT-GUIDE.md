# 🔐 ระบบ Session Management - ItsHard Items Management System

ฉันได้สร้างระบบ session management ที่จะจำการเข้าสู่ระบบไว้ 24 ชั่วโมงแล้ว!

## ✨ ฟีเจอร์ใหม่

### 🔄 Auto Login
- ระบบจะจำการเข้าสู่ระบบไว้ **24 ชั่วโมง**
- ไม่ต้องใส่ PIN ใหม่ทุกครั้งที่เข้าหน้า Manager
- เข้าสู่ระบบอัตโนมัติเมื่อมี session ที่ยังไม่หมดอายุ

### ⏰ Session Timer
- แสดงเวลาที่เหลือของ session
- แจ้งเตือนเมื่อ session ใกล้หมดอายุ
- ออกจากระบบอัตโนมัติเมื่อ session หมดอายุ

### 🔧 Session Management
- ปุ่ม "ขยายเวลา" สำหรับเพิ่มเวลาอีก 24 ชั่วโมง
- ปุ่ม "ออกจากระบบ" สำหรับลบ session
- ข้อมูล session ถูกเก็บใน localStorage

## 📁 ไฟล์ที่สร้างให้

### 1. **`src/utils/sessionManager.ts`** - Session Management Utility
- ฟังก์ชันสำหรับจัดการ session
- ตรวจสอบและขยายเวลา session
- ดึงข้อมูล session สำหรับแสดงผล

### 2. **`src/components/SessionInfo.tsx`** - Session Info Component
- แสดงข้อมูล session และเวลาที่เหลือ
- ปุ่มขยายเวลาและออกจากระบบ
- แจ้งเตือนเมื่อ session ใกล้หมดอายุ

### 3. **อัปเดต `src/pages/Manager.tsx`**
- เพิ่มระบบ session management
- Auto login เมื่อมี session ที่ยังไม่หมดอายุ
- แสดงข้อมูล session ในหน้า Manager

## 🚀 วิธีการใช้งาน

### การเข้าสู่ระบบครั้งแรก
1. เข้าหน้า **Manager**
2. ใส่ PIN: **1234**
3. ระบบจะบันทึก session ไว้ 24 ชั่วโมง
4. แสดงข้อความ "ระบบจะจำการเข้าสู่ระบบไว้ 24 ชั่วโมง"

### การเข้าสู่ระบบครั้งต่อไป
1. เข้าหน้า **Manager**
2. ระบบจะตรวจสอบ session อัตโนมัติ
3. หากมี session ที่ยังไม่หมดอายุ จะเข้าสู่ระบบทันที
4. แสดงข้อความ "เข้าสู่ระบบอัตโนมัติ - ยินดีต้อนรับกลับ!"

### การจัดการ Session
- **ขยายเวลา**: คลิกปุ่ม "ขยายเวลา" เพื่อเพิ่มเวลาอีก 24 ชั่วโมง
- **ออกจากระบบ**: คลิกปุ่ม "ออกจากระบบ" เพื่อลบ session
- **ตรวจสอบเวลา**: ดูเวลาที่เหลือในส่วน Session Info

## ⚙️ การตั้งค่า

### Session Duration
```typescript
// ใน sessionManager.ts
private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Session Key
```typescript
// ใน sessionManager.ts
private static readonly SESSION_KEY = 'itshard_manager_session';
```

## 🔍 การตรวจสอบ Session

### ใน Browser Console
```javascript
// ตรวจสอบ session ปัจจุบัน
console.log(SessionManager.getSessionInfo());

// ตรวจสอบเวลาที่เหลือ
console.log(SessionManager.getTimeUntilExpiry());

// ตรวจสอบว่าใกล้หมดอายุหรือไม่
console.log(SessionManager.isSessionNearExpiry());
```

### ใน localStorage
```javascript
// ดูข้อมูล session ใน localStorage
console.log(localStorage.getItem('itshard_manager_session'));
```

## 🎯 ผลลัพธ์ที่คาดหวัง

### ครั้งแรกที่เข้าสู่ระบบ
- ✅ ใส่ PIN: 1234
- ✅ แสดงข้อความ "เข้าสู่ระบบสำเร็จ"
- ✅ บันทึก session ไว้ 24 ชั่วโมง
- ✅ เข้าหน้า Manager ได้ทันที

### ครั้งต่อไปที่เข้าหน้า Manager
- ✅ ตรวจสอบ session อัตโนมัติ
- ✅ เข้าสู่ระบบทันทีโดยไม่ต้องใส่ PIN
- ✅ แสดงข้อความ "เข้าสู่ระบบอัตโนมัติ"
- ✅ แสดงข้อมูล session และเวลาที่เหลือ

### การจัดการ Session
- ✅ แสดงเวลาที่เหลือของ session
- ✅ แจ้งเตือนเมื่อใกล้หมดอายุ
- ✅ ปุ่มขยายเวลาและออกจากระบบ
- ✅ ออกจากระบบอัตโนมัติเมื่อหมดอายุ

## 🛡️ ความปลอดภัย

- Session ถูกเก็บใน localStorage ของ browser
- มีการตรวจสอบเวลาหมดอายุอัตโนมัติ
- Session จะถูกลบเมื่อหมดอายุ
- ไม่มีการเก็บข้อมูลสำคัญใน session

## 🔧 การแก้ไขปัญหา

### Session ไม่ทำงาน
1. ตรวจสอบ localStorage ใน browser
2. ลองลบ session และเข้าสู่ระบบใหม่
3. ตรวจสอบ console errors

### Session หมดอายุเร็ว
1. ตรวจสอบเวลาของระบบ
2. ลองขยายเวลา session
3. เข้าสู่ระบบใหม่

### ไม่สามารถเข้าสู่ระบบอัตโนมัติ
1. ตรวจสอบว่า session ยังไม่หมดอายุ
2. ลองลบ session และเข้าสู่ระบบใหม่
3. ตรวจสอบ localStorage

---

**🎉 ตอนนี้ระบบจะจำการเข้าสู่ระบบไว้ 24 ชั่วโมงแล้ว! ไม่ต้องใส่ PIN ใหม่บ่อยๆ**
