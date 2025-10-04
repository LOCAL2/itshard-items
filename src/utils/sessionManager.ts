// Session Management Utility - ItsHard Items Management System
// ระบบจัดการ session สำหรับการเข้าสู่ระบบ Manager

export interface SessionData {
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'itshard_manager_session';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * บันทึก session ลง localStorage
   */
  static saveSession(): void {
    const sessionData: SessionData = {
      authenticated: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * ตรวจสอบว่า session ยังใช้งานได้หรือไม่
   */
  static checkSession(): boolean {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        console.log('No session found');
        return false;
      }

      const session: SessionData = JSON.parse(sessionData);
      const now = Date.now();

      // ตรวจสอบว่า session ยังไม่หมดอายุ
      if (now < session.expiresAt) {
        console.log('Valid session found');
        return true;
      } else {
        // Session หมดอายุแล้ว ลบออก
        console.log('Session expired, removing...');
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * ลบ session ออกจาก localStorage
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * ดึงข้อมูล session ปัจจุบัน
   */
  static getSessionData(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      return JSON.parse(sessionData) as SessionData;
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  /**
   * ตรวจสอบว่า session จะหมดอายุในอีกกี่ชั่วโมง
   */
  static getTimeUntilExpiry(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const now = Date.now();
    const timeLeft = sessionData.expiresAt - now;
    
    // แปลงเป็นชั่วโมง
    return Math.max(0, Math.floor(timeLeft / (60 * 60 * 1000)));
  }

  /**
   * ตรวจสอบว่า session จะหมดอายุในอีกกี่นาที
   */
  static getMinutesUntilExpiry(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const now = Date.now();
    const timeLeft = sessionData.expiresAt - now;
    
    // แปลงเป็นนาที
    return Math.max(0, Math.floor(timeLeft / (60 * 1000)));
  }

  /**
   * ตรวจสอบว่า session จะหมดอายุในอีกกี่วินาที
   */
  static getSecondsUntilExpiry(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const now = Date.now();
    const timeLeft = sessionData.expiresAt - now;
    
    // แปลงเป็นวินาที
    return Math.max(0, Math.floor(timeLeft / 1000));
  }

  /**
   * ขยายเวลาของ session ออกไปอีก 24 ชั่วโมง
   */
  static extendSession(): void {
    const sessionData = this.getSessionData();
    if (!sessionData) {
      console.log('No session to extend');
      return;
    }

    const newSessionData: SessionData = {
      ...sessionData,
      expiresAt: Date.now() + this.SESSION_DURATION
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(newSessionData));
      console.log('Session extended successfully');
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }

  /**
   * ตรวจสอบว่า session ใกล้หมดอายุ (เหลือน้อยกว่า 1 ชั่วโมง)
   */
  static isSessionNearExpiry(): boolean {
    return this.getTimeUntilExpiry() < 1;
  }

  /**
   * ตรวจสอบว่า session หมดอายุแล้วหรือไม่
   */
  static isSessionExpired(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return true;

    return Date.now() >= sessionData.expiresAt;
  }

  /**
   * ดึงข้อมูล session สำหรับแสดงผล
   */
  static getSessionInfo(): {
    isValid: boolean;
    timeLeft: string;
    expiresAt: string;
    isNearExpiry: boolean;
  } {
    const sessionData = this.getSessionData();
    const isValid = this.checkSession();
    
    if (!sessionData || !isValid) {
      return {
        isValid: false,
        timeLeft: '0 ชั่วโมง 0 นาที',
        expiresAt: 'หมดอายุแล้ว',
        isNearExpiry: false
      };
    }

    const hours = this.getTimeUntilExpiry();
    const minutes = this.getMinutesUntilExpiry() % 60;
    const timeLeft = `${hours} ชั่วโมง ${minutes} นาที`;
    
    const expiresAt = new Date(sessionData.expiresAt).toLocaleString('th-TH');
    const isNearExpiry = this.isSessionNearExpiry();

    return {
      isValid,
      timeLeft,
      expiresAt,
      isNearExpiry
    };
  }
}

// Export สำหรับใช้งานง่าย
export const sessionManager = SessionManager;

// ตัวอย่างการใช้งาน:
/*
// บันทึก session
SessionManager.saveSession();

// ตรวจสอบ session
const isValid = SessionManager.checkSession();

// ลบ session
SessionManager.clearSession();

// ดึงข้อมูล session
const sessionInfo = SessionManager.getSessionInfo();
console.log(sessionInfo);

// ขยาย session
SessionManager.extendSession();
*/
