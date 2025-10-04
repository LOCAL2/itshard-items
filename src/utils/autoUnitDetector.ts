// Auto Unit Detection Utility - ItsHard Items Management System
// ระบบตรวจสอบและตั้งหน่วยอัตโนมัติตามชื่อสิ่งของ

export interface UnitRule {
  keywords: string[];
  unit: string;
  description: string;
}

export class AutoUnitDetector {
  private static readonly UNIT_RULES: UnitRule[] = [
    {
      keywords: ['เงิน', 'เงินเขียว', 'เงินผิดกฎหมาย', 'เงินแดง', 'เงินดำ', 'บาท', 'dollar', 'usd', 'เงินสด', 'ธนบัตร'],
      unit: 'บาท',
      description: 'สิ่งของที่เกี่ยวข้องกับเงิน'
    },
    {
      keywords: ['น้ำ', 'น้ำปลา', 'น้ำมัน', 'น้ำอัดลม', 'น้ำผลไม้', 'น้ำดื่ม'],
      unit: 'แก้ว',
      description: 'เครื่องดื่มและของเหลว'
    },
    {
      keywords: ['รถ','ยานพาหนะ'],
      unit: 'คัน',
      description: 'ยานพาหนะ'
    },
  ];

  /**
   * ตรวจสอบและคืนค่าหน่วยที่เหมาะสมตามชื่อสิ่งของ
   */
  static detectUnit(itemName: string): string {
    if (!itemName || typeof itemName !== 'string') {
      return '';
    }

    const lowerName = itemName.toLowerCase().trim();

    // ค้นหาคำที่ตรงกับกฎเกณฑ์
    for (const rule of this.UNIT_RULES) {
      for (const keyword of rule.keywords) {
        if (lowerName.includes(keyword.toLowerCase())) {
          console.log(`Auto-detected unit "${rule.unit}" for "${itemName}" (matched: "${keyword}")`);
          return rule.unit;
        }
      }
    }

    // ถ้าไม่พบคำที่ตรงกับกฎเกณฑ์ ให้คืนค่า "ชิ้น" เป็นค่าเริ่มต้น
    console.log(`Auto-detected unit "ชิ้น" for "${itemName}" (default unit)`);
    return 'ชิ้น';
  }

  /**
   * ตรวจสอบว่าชื่อสิ่งของจะถูกตั้งหน่วยอัตโนมัติหรือไม่
   * ตอนนี้จะคืนค่า true เสมอ เพราะมีค่าเริ่มต้นเป็น "ชิ้น"
   */
  static willAutoDetect(itemName: string): boolean {
    return true; // ตอนนี้จะตรวจสอบได้เสมอ เพราะมีค่าเริ่มต้น
  }

  /**
   * ดึงข้อมูลกฎเกณฑ์ทั้งหมด
   */
  static getAllRules(): UnitRule[] {
    return [...this.UNIT_RULES];
  }

  /**
   * ดึงข้อมูลกฎเกณฑ์สำหรับคำที่กำหนด
   */
  static getRuleForKeyword(keyword: string): UnitRule | null {
    const lowerKeyword = keyword.toLowerCase();
    
    for (const rule of this.UNIT_RULES) {
      if (rule.keywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
        return rule;
      }
    }
    
    return null;
  }

  /**
   * เพิ่มกฎเกณฑ์ใหม่
   */
  static addRule(keywords: string[], unit: string, description: string): void {
    const newRule: UnitRule = {
      keywords: keywords.map(k => k.toLowerCase()),
      unit,
      description
    };
    
    this.UNIT_RULES.push(newRule);
    console.log(`Added new unit rule: ${keywords.join(', ')} -> ${unit}`);
  }

  /**
   * ลบกฎเกณฑ์
   */
  static removeRule(keyword: string): boolean {
    const index = this.UNIT_RULES.findIndex(rule => 
      rule.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    if (index !== -1) {
      const removedRule = this.UNIT_RULES.splice(index, 1)[0];
      console.log(`Removed unit rule: ${removedRule.keywords.join(', ')} -> ${removedRule.unit}`);
      return true;
    }
    
    return false;
  }

  /**
   * ทดสอบการตรวจสอบหน่วยสำหรับชื่อสิ่งของหลายๆ ชื่อ
   */
  static testDetection(testItems: string[]): Array<{item: string, detectedUnit: string, willAutoDetect: boolean}> {
    return testItems.map(item => ({
      item,
      detectedUnit: this.detectUnit(item),
      willAutoDetect: this.willAutoDetect(item)
    }));
  }

  /**
   * ดึงสถิติการใช้งานกฎเกณฑ์
   */
  static getRuleStats(): Array<{rule: UnitRule, usageCount: number}> {
    // ในระบบจริงอาจจะเก็บสถิติการใช้งาน
    // ตอนนี้คืนค่าเป็น 0 สำหรับทุกกฎเกณฑ์
    return this.UNIT_RULES.map(rule => ({
      rule,
      usageCount: 0
    }));
  }
}

// Export สำหรับใช้งานง่าย
export const autoUnitDetector = AutoUnitDetector;

// ตัวอย่างการใช้งาน:
/*
// ตรวจสอบหน่วยอัตโนมัติ
const unit = AutoUnitDetector.detectUnit('เงินเขียว');
console.log(unit); // "บาท"

// ตรวจสอบว่าจะถูกตั้งหน่วยอัตโนมัติหรือไม่
const willAuto = AutoUnitDetector.willAutoDetect('เงินแดง');
console.log(willAuto); // true

// ทดสอบหลายๆ ชื่อ
const testResults = AutoUnitDetector.testDetection([
  'เงินเขียว',
  'ข้าวสาร',
  'น้ำปลา',
  'ไข่ไก่',
  'ผักบุ้ง',
  'ของอื่นๆ'
]);
console.log(testResults);

// เพิ่มกฎเกณฑ์ใหม่
AutoUnitDetector.addRule(['ทอง', 'ทองคำ'], 'กรัม', 'ทองและอัญมณี');

// ดึงกฎเกณฑ์ทั้งหมด
const allRules = AutoUnitDetector.getAllRules();
console.log(allRules);
*/
