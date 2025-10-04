// Debug Utility สำหรับ Supabase - ItsHard Items Management System
// ไฟล์สำหรับ debug และแก้ไขปัญหา Supabase

import { supabase } from '@/lib/supabase';

export class SupabaseDebugger {
  /**
   * ตรวจสอบการเชื่อมต่อ Supabase
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Connection error:', error);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
  }

  /**
   * ตรวจสอบ RLS policies
   */
  static async checkRLSPolicies(): Promise<void> {
    try {
      // ทดสอบ SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('members')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('❌ SELECT policy error:', selectError);
      } else {
        console.log('✅ SELECT policy working');
      }

      // ทดสอบ INSERT
      const testMember = {
        name: 'Test Member',
        status: 'ยังไม่ส่ง',
        avatar: 'https://example.com/test.jpg'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('members')
        .insert([testMember])
        .select();

      if (insertError) {
        console.error('❌ INSERT policy error:', insertError);
      } else {
        console.log('✅ INSERT policy working');
        
        // ลบข้อมูลทดสอบ
        if (insertData && insertData[0]) {
          await supabase
            .from('members')
            .delete()
            .eq('id', insertData[0].id);
        }
      }

      // ทดสอบ UPDATE
      const { data: members } = await supabase
        .from('members')
        .select('id')
        .limit(1);

      if (members && members.length > 0) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', members[0].id);

        if (updateError) {
          console.error('❌ UPDATE policy error:', updateError);
        } else {
          console.log('✅ UPDATE policy working');
        }
      }

    } catch (error) {
      console.error('❌ RLS policy check failed:', error);
    }
  }

  /**
   * ตรวจสอบข้อมูลในตาราง
   */
  static async checkTableData(): Promise<void> {
    try {
      // ตรวจสอบ members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*');

      if (membersError) {
        console.error('❌ Members table error:', membersError);
      } else {
        console.log(`✅ Members table: ${members?.length || 0} records`);
      }

      // ตรวจสอบ items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*');

      if (itemsError) {
        console.error('❌ Items table error:', itemsError);
      } else {
        console.log(`✅ Items table: ${items?.length || 0} records`);
      }

    } catch (error) {
      console.error('❌ Table data check failed:', error);
    }
  }

  /**
   * ทดสอบการอัปเดต item
   */
  static async testUpdateItem(itemId: string): Promise<boolean> {
    try {
      console.log(`Testing update for item ID: ${itemId}`);

      // ตรวจสอบว่า item มีอยู่หรือไม่
      const { data: existingItem, error: selectError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (selectError) {
        console.error('❌ Item not found:', selectError);
        return false;
      }

      console.log('✅ Item found:', existingItem);

      // ทดสอบการอัปเดต
      const { data: updatedItem, error: updateError } = await supabase
        .from('items')
        .update({ 
          updated_at: new Date().toISOString(),
          item_name: existingItem.item_name + ' (updated)'
        })
        .eq('id', itemId)
        .select();

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        return false;
      }

      console.log('✅ Update successful:', updatedItem);

      // คืนค่าชื่อเดิม
      await supabase
        .from('items')
        .update({ 
          item_name: existingItem.item_name,
          updated_at: existingItem.updated_at
        })
        .eq('id', itemId);

      return true;

    } catch (error) {
      console.error('❌ Test update failed:', error);
      return false;
    }
  }

  /**
   * รันการตรวจสอบทั้งหมด
   */
  static async runFullDiagnostic(): Promise<void> {
    console.log('🔍 Starting Supabase diagnostic...');
    
    // ตรวจสอบการเชื่อมต่อ
    const isConnected = await this.checkConnection();
    if (!isConnected) {
      console.error('❌ Cannot proceed - connection failed');
      return;
    }

    // ตรวจสอบข้อมูลในตาราง
    await this.checkTableData();

    // ตรวจสอบ RLS policies
    await this.checkRLSPolicies();

    console.log('✅ Diagnostic completed');
  }

  /**
   * แก้ไขปัญหา RLS policies
   */
  static async fixRLSPolicies(): Promise<void> {
    console.log('🔧 Attempting to fix RLS policies...');
    
    try {
      // สร้าง SQL สำหรับแก้ไข policies
      const fixSQL = `
        -- ลบ policies เดิม
        DROP POLICY IF EXISTS "Members are viewable by everyone" ON members;
        DROP POLICY IF EXISTS "Members are editable by authenticated users" ON members;
        DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
        DROP POLICY IF EXISTS "Items are editable by authenticated users" ON items;

        -- สร้าง policies ใหม่
        CREATE POLICY "Enable read access for all users" ON members FOR SELECT USING (true);
        CREATE POLICY "Enable insert for all users" ON members FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for all users" ON members FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for all users" ON members FOR DELETE USING (true);

        CREATE POLICY "Enable read access for all users" ON items FOR SELECT USING (true);
        CREATE POLICY "Enable insert for all users" ON items FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for all users" ON items FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for all users" ON items FOR DELETE USING (true);
      `;

      console.log('📝 Please run this SQL in Supabase Dashboard:');
      console.log(fixSQL);

    } catch (error) {
      console.error('❌ Failed to generate fix SQL:', error);
    }
  }
}

// Export สำหรับใช้งานง่าย
export const supabaseDebugger = SupabaseDebugger;

// ตัวอย่างการใช้งาน:
/*
// รันการตรวจสอบทั้งหมด
SupabaseDebugger.runFullDiagnostic();

// ตรวจสอบการเชื่อมต่อ
SupabaseDebugger.checkConnection();

// ทดสอบการอัปเดต item
SupabaseDebugger.testUpdateItem('your-item-id');

// แก้ไขปัญหา RLS policies
SupabaseDebugger.fixRLSPolicies();
*/
