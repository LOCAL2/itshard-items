// ItsHard Items Management System - Supabase Client Configuration
// ไฟล์สำหรับการเชื่อมต่อและใช้งาน Supabase

import { createClient } from '@supabase/supabase-js'
import { Member, Item } from '@/types'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mykojjgtnyhygvmjovkc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a29qamd0bnloeWd2bWpvdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTUyMDksImV4cCI6MjA3NDU3MTIwOX0.NJ-aYs8cJ2ZjB49IdV0FyyLxzenHkcdXIP3TK8sgokI'

// สร้าง Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// ========================================
// Types สำหรับ Supabase
// ========================================

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          name: string
          status: 'ยังไม่ส่ง' | 'ส่งแล้ว'
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'ยังไม่ส่ง' | 'ส่งแล้ว'
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'ยังไม่ส่ง' | 'ส่งแล้ว'
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      manager_whitelist: {
        Row: {
          id: string
          created_at: string
          note: string | null
        }
        Insert: {
          id: string
          created_at?: string
          note?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          note?: string | null
        }
      }
      manager_lock_status: {
        Row: {
          id: string
          attempts: number
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          id: string
          attempts?: number
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          attempts?: number
          locked_until?: string | null
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          item_name: string
          quantity: number
          unit: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_name: string
          quantity?: number
          unit?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_name?: string
          quantity?: number
          unit?: string
          created_at?: string
          updated_at?: string
        }
      }
      item_schedules: {
        Row: {
          item_id: string
          start_iso: string
          end_iso: string
          updated_at: string
        }
        Insert: {
          item_id: string
          start_iso: string
          end_iso: string
          updated_at?: string
        }
        Update: {
          item_id?: string
          start_iso?: string
          end_iso?: string
          updated_at?: string
        }
      }
    }
    Views: {
      member_summary: {
        Row: {
          status: string
          count: number
          percentage: number
        }
      }
      item_summary: {
        Row: {
          unit: string
          item_count: number
          total_quantity: number
        }
      }
      dashboard_stats: {
        Row: {
          total_members: number
          completed_members: number
          pending_members: number
          total_items: number
          total_quantity: number
          completion_percentage: number
        }
      }
    }
    Functions: {
      get_member_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_members: number
          pending_members: number
          completed_members: number
          completion_rate: number
        }[]
      }
      search_members: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          name: string
          status: string
          avatar: string | null
        }[]
      }
      search_items: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          item_name: string
          quantity: number
          unit: string
        }[]
      }
      backup_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          members: any[]
          items: any[]
          backup_date: string
        }[]
      }
      export_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          report_type: string
          data: any
          generated_at: string
        }[]
      }
    }
  }
}

// ========================================
// API Functions สำหรับ Members
// ========================================

export const membersApi = {
  // ดึงข้อมูลสมาชิกทั้งหมด
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // ดึงข้อมูลสมาชิกตาม ID
  async getById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // เพิ่มสมาชิกใหม่
  async create(member: Omit<Member, 'id'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert([member])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // อัปเดตข้อมูลสมาชิก
  async update(id: string, updates: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    // If RLS disallows returning rows after update, `data` may be empty even when update succeeded.
    // In that case, return a merged object from the provided updates to avoid breaking callers.
    if (!data || data.length === 0) {
      return {
        id,
        // Best-effort merge; callers that need full shape should refetch
        name: (updates as any).name ?? '',
        avatar: (updates as any).avatar ?? '',
        status: (updates as any).status ?? 'ยังไม่ส่ง',
      } as Member;
    }

    return data[0];
  },

  // ลบสมาชิก
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ค้นหาสมาชิก
  async search(searchTerm: string): Promise<Member[]> {
    const { data, error } = await supabase
      .rpc('search_members', { search_term: searchTerm })

    if (error) throw error
    return data || []
  },

  // อัปเดตสถานะสมาชิก
  async updateStatus(id: string, status: Member['status']): Promise<Member> {
    return this.update(id, { status })
  },

  // ดึงสถิติสมาชิก
  async getStats() {
    const { data, error } = await supabase
      .rpc('get_member_stats')

    if (error) throw error
    return data?.[0] || null
  }
}

// ========================================
// API Functions สำหรับ Items
// ========================================

export const itemsApi = {
  // ดึงข้อมูลสินค้าทั้งหมด
  async getAll(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // ดึงข้อมูลสินค้าตาม ID
  async getById(id: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // เพิ่มสินค้าใหม่
  async create(item: Omit<Item, 'id'>): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // อัปเดตข้อมูลสินค้า
  async update(id: string, updates: Partial<Item>): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`Item with id ${id} not found or no rows updated`);
    }

    return data[0];
  },

  // ลบสินค้า
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // อัปเดตลำดับการแสดงผล
  async updateDisplayOrder(items: { id: string; display_order: number }[]): Promise<void> {
    // ใช้ Promise.all เพื่อ update หลายรายการพร้อมกัน
    const updatePromises = items.map(item => 
      supabase
        .from('items')
        .update({ 
          display_order: item.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
    );

    const results = await Promise.all(updatePromises);
    
    // ตรวจสอบ error จากทุก update
    for (const result of results) {
      if (result.error) throw result.error;
    }
  },

  // ค้นหาสินค้า
  async search(searchTerm: string): Promise<Item[]> {
    const { data, error } = await supabase
      .rpc('search_items', { search_term: searchTerm })

    if (error) throw error
    return data || []
  },

  // อัปเดตจำนวนสินค้า
  async updateQuantity(id: string, quantity: number): Promise<Item> {
    return this.update(id, { quantity })
  }
}

// ========================================
// API Functions สำหรับ Item Schedules
// ========================================

export const schedulesApi = {
  async getAll(): Promise<Record<string, { startISO: string; endISO: string; updated_at: string }>> {
    const { data, error } = await supabase
      .from('item_schedules')
      .select('item_id, start_iso, end_iso, updated_at');
    if (error) throw error;
    const map: Record<string, { startISO: string; endISO: string; updated_at: string }> = {};
    (data || []).forEach((row: any) => {
      map[row.item_id] = {
        startISO: row.start_iso,
        endISO: row.end_iso,
        updated_at: row.updated_at,
      };
    });
    return map;
  },
  async upsert(itemId: string, schedule: { startISO: string; endISO: string }) {
    const { error } = await supabase
      .from('item_schedules')
      .upsert({
        item_id: itemId,
        start_iso: schedule.startISO,
        end_iso: schedule.endISO,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'item_id' });
    if (error) throw error;
  },
  async upsertMany(itemIds: string[], schedule: { startISO: string; endISO: string }) {
    if (itemIds.length === 0) return;
    const rows = itemIds.map(id => ({
      item_id: id,
      start_iso: schedule.startISO,
      end_iso: schedule.endISO,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('item_schedules')
      .upsert(rows, { onConflict: 'item_id' });
    if (error) throw error;
  },
  async remove(itemId: string) {
    const { error } = await supabase
      .from('item_schedules')
      .delete()
      .eq('item_id', itemId);
    if (error) throw error;
  },
  async removeMany(itemIds: string[]) {
    if (itemIds.length === 0) return;
    const { error } = await supabase
      .from('item_schedules')
      .delete()
      .in('item_id', itemIds);
    if (error) throw error;
  },
}

// ========================================
// API Functions สำหรับ Dashboard
// ========================================

export const dashboardApi = {
  // ดึงสถิติ dashboard
  async getStats() {
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  // ดึงสรุปสมาชิก
  async getMemberSummary() {
    const { data, error } = await supabase
      .from('member_summary')
      .select('*')

    if (error) throw error
    return data || []
  },

  // ดึงสรุปสินค้า
  async getItemSummary() {
    const { data, error } = await supabase
      .from('item_summary')
      .select('*')

    if (error) throw error
    return data || []
  },

  // ส่งออกรายงาน
  async exportReport() {
    const { data, error } = await supabase
      .rpc('export_report')

    if (error) throw error
    return data || []
  }
}

// ========================================
// Real-time Subscriptions
// ========================================

export const subscribeToMembers = (callback: (payload: any) => void) => {
  return supabase
    .channel('members_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'members' }, 
      callback
    )
    .subscribe()
}

export const subscribeToItems = (callback: (payload: any) => void) => {
  return supabase
    .channel('items_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'items' }, 
      callback
    )
    .subscribe()
}

// ========================================
// Manager Whitelist API
// ========================================

export const whitelistApi = {
  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('manager_whitelist')
      .select('id')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return !!(data && data.length > 0);
  },
  async add(id: string, note?: string | null) {
    const { error } = await supabase
      .from('manager_whitelist')
      .insert([{ id, note: note ?? null }]);
    if (error) throw error;
  }
}

// ========================================
// Manager Lock API (per UUID)
// ========================================

export const lockApi = {
  async get(id: string) {
    const { data, error } = await supabase
      .from('manager_lock_status')
      .select('id, attempts, locked_until, updated_at')
      .eq('id', id)
      .single();
    // Treat 406 (Not Acceptable) and PGRST116 (no rows) as non-fatal: return null to avoid console spam
    if (error) {
      if (error.code === '406' || error.code === 'PGRST116') {
        return null as unknown as Database['public']['Tables']['manager_lock_status']['Row'] | null;
      }
      throw error;
    }
    return data as (Database['public']['Tables']['manager_lock_status']['Row'] | null);
  },
  async set(id: string, attempts: number, lockedUntilISO: string | null) {
    const { error } = await supabase
      .from('manager_lock_status')
      .upsert({ id, attempts, locked_until: lockedUntilISO, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
  },
  async reset(id: string) {
    const { error } = await supabase
      .from('manager_lock_status')
      .upsert({ id, attempts: 0, locked_until: null, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
  }
}

// ========================================
// Authentication Functions
// ========================================

export const authApi = {
  // เข้าสู่ระบบ
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // สมัครสมาชิก
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },

  // ออกจากระบบ
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // ฟังการเปลี่ยนแปลงสถานะการเข้าสู่ระบบ
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// ========================================
// Utility Functions
// ========================================

export const utils = {
  // แปลงข้อมูลจาก Supabase เป็น Type ที่ใช้ในแอป
  mapMemberToApp(member: any): Member {
    return {
      id: member.id,
      name: member.name,
      status: member.status,
      avatar: member.avatar || ''
    }
  },

  mapItemToApp(item: any): Item {
    return {
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit
    }
  },

  // จัดการ error
  handleError(error: any): string {
    console.error('Supabase Error:', error)
    
    if (error.message) {
      return error.message
    }
    
    if (error.details) {
      return error.details
    }
    
    return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  },

  // ตรวจสอบการเชื่อมต่อ
  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('count')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }
}

// ========================================
// Export ทั้งหมด
// ========================================

export default {
  supabase,
  membersApi,
  itemsApi,
  // whitelist api intentionally not exported here; use named export
  dashboardApi,
  authApi,
  subscribeToMembers,
  subscribeToItems,
  utils
}
