import { useState, useEffect, useRef, useCallback } from 'react';
import { Member, Item } from '@/types';
import MemberTable from '@/components/MemberTable';
import ItemTable from '@/components/ItemTable';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { membersApi, itemsApi } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithCommas } from '@/lib/utils';
import RollingNumber from '@/components/RollingNumber';
import { getAllItemSchedules, hydrateItemSchedulesFromServer, SCHEDULES_EVENT } from '@/utils/schedules';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isNotificationsEnabled } from '@/utils/notifications';


// CountUp hook (top-level) - must be defined outside components
const useCountUp = (target: number, durationMs = 1200) => {
  const [value, setValue] = useState(0);
  const startTs = useRef<number | null>(null);
  const fromRef = useRef(0);
  const toRef = useRef(target);
  useEffect(() => {
    fromRef.current = value;
    toRef.current = target;
    startTs.current = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (startTs.current === null) startTs.current = ts;
      const p = Math.min(1, (ts - startTs.current) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const next = Math.round(fromRef.current + (toRef.current - fromRef.current) * eased);
      setValue(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
};

const Index = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [itemSchedules, setItemSchedules] = useState<Record<string, { startISO: string; endISO: string }>>({});
  const [showCalendar, setShowCalendar] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('show_calendar_view');
      return raw === null ? true : raw === '1';
    } catch { return true; }
  });

  // Refs เพื่อเก็บข้อมูลปัจจุบันสำหรับ real-time checking
  const membersRef = useRef<Member[]>([]);
  const itemsRef = useRef<Item[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const lastMembersToastAt = useRef<number>(0);
  const lastItemsToastAt = useRef<number>(0);
  const TOAST_COOLDOWN_MS = 10000; // 10s cooldown to avoid spam

  // CountUp values (call hooks unconditionally before any early returns)
  const totalTarget = members.length;
  const sentTarget = members.filter(m => m.status === 'ส่งแล้ว').length;
  const notSentTarget = members.filter(m => m.status === 'ยังไม่ส่ง').length;
  const totalCount = useCountUp(totalTarget);
  const sentCount = useCountUp(sentTarget);
  const notSentCount = useCountUp(notSentTarget);

  // โหลดตารางเวลา
  useEffect(() => {
    setItemSchedules(getAllItemSchedules());
    (async () => {
      const fresh = await hydrateItemSchedulesFromServer();
      setItemSchedules(fresh);
    })();
    const handle = () => setItemSchedules(getAllItemSchedules());
    window.addEventListener(SCHEDULES_EVENT, handle);
    window.addEventListener('storage', handle);
    return () => {
      window.removeEventListener(SCHEDULES_EVENT, handle);
      window.removeEventListener('storage', handle);
    };
  }, []);

  // Persist calendar visibility
  useEffect(() => {
    try { localStorage.setItem('show_calendar_view', showCalendar ? '1' : '0'); } catch { }
  }, [showCalendar]);

  // Sync calendar visibility with Settings (NavBar) and other tabs
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('show_calendar_view');
        setShowCalendar(raw === null ? true : raw === '1');
      } catch { }
    };
    window.addEventListener('show-calendar-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('show-calendar-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // ฟังก์ชันตรวจสอบการเปลี่ยนแปลงในข้อมูลสมาชิก
  const detectMemberChanges = (oldMembers: Member[], newMembers: Member[]) => {
    const changes: string[] = [];

    // ตรวจสอบสมาชิกที่เพิ่มใหม่
    const newMemberIds = newMembers.map(m => m.id);
    const oldMemberIds = oldMembers.map(m => m.id);
    const addedMembers = newMembers.filter(m => !oldMemberIds.includes(m.id));

    addedMembers.forEach(member => {
      changes.push(`เพิ่มสมาชิกใหม่: ${member.name}`);
    });

    // ตรวจสอบสมาชิกที่ถูกลบ
    const removedMembers = oldMembers.filter(m => !newMemberIds.includes(m.id));
    removedMembers.forEach(member => {
      changes.push(`ลบสมาชิก: ${member.name}`);
    });

    // ตรวจสอบการเปลี่ยนแปลงในข้อมูลสมาชิกที่มีอยู่
    oldMembers.forEach(oldMember => {
      const newMember = newMembers.find(m => m.id === oldMember.id);
      if (newMember) {
        // ตรวจสอบการเปลี่ยนแปลงชื่อ
        if (oldMember.name !== newMember.name) {
          changes.push(`${oldMember.name} เปลี่ยนชื่อเป็น ${newMember.name}`);
        }

        // ตรวจสอบการเปลี่ยนแปลงสถานะ
        if (oldMember.status !== newMember.status) {
          changes.push(`${newMember.name} ถูกอัปเดตสถานะเป็น ${newMember.status}`);
        }

        // ตรวจสอบการเปลี่ยนแปลงรูปภาพ
        if (oldMember.avatar !== newMember.avatar) {
          changes.push(`${newMember.name} เปลี่ยนรูปภาพ`);
        }
      }
    });

    return changes;
  };

  // ฟังก์ชันตรวจสอบการเปลี่ยนแปลงในข้อมูลสิ่งของ
  const detectItemChanges = (oldItems: Item[], newItems: Item[]) => {
    const changes: string[] = [];

    // ตรวจสอบสิ่งของที่เพิ่มใหม่
    const newItemIds = newItems.map(i => i.id);
    const oldItemIds = oldItems.map(i => i.id);
    const addedItems = newItems.filter(i => !oldItemIds.includes(i.id));

    addedItems.forEach(item => {
      changes.push(`เพิ่มสิ่งของใหม่: ${item.item_name} (${formatNumberWithCommas(item.quantity)} ${item.unit})`);
    });

    // ตรวจสอบสิ่งของที่ถูกลบ
    const removedItems = oldItems.filter(i => !newItemIds.includes(i.id));
    removedItems.forEach(item => {
      changes.push(`ลบสิ่งของ: ${item.item_name}`);
    });

    // ตรวจสอบการเปลี่ยนแปลงในข้อมูลสิ่งของที่มีอยู่
    oldItems.forEach(oldItem => {
      const newItem = newItems.find(i => i.id === oldItem.id);
      if (newItem) {
        // ตรวจสอบการเปลี่ยนแปลงชื่อ
        if (oldItem.item_name !== newItem.item_name) {
          changes.push(`${oldItem.item_name} เปลี่ยนชื่อเป็น ${newItem.item_name}`);
        }

        // ตรวจสอบการเปลี่ยนแปลงจำนวน
        if (oldItem.quantity !== newItem.quantity) {
          changes.push(`${newItem.item_name} เปลี่ยนจำนวนจาก ${formatNumberWithCommas(oldItem.quantity)} เป็น ${formatNumberWithCommas(newItem.quantity)} ${newItem.unit}`);
        }

        // ตรวจสอบการเปลี่ยนแปลงหน่วย
        if (oldItem.unit !== newItem.unit) {
          changes.push(`${newItem.item_name} เปลี่ยนหน่วยจาก ${oldItem.unit} เป็น ${newItem.unit}`);
        }
      }
    });

    return changes;
  };

  // ดึงข้อมูลจาก Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [membersData, itemsData] = await Promise.all([
          membersApi.getAll(),
          itemsApi.getAll()
        ]);
        setMembers(membersData);
        setItems(itemsData);
        // อัปเดต refs
        membersRef.current = membersData;
        itemsRef.current = itemsData;
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Real-time polling ทุกๆ 1000ms - อัปเดตข้อมูลแบบบังคับ
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isPageVisible) {
        return;
      }

      try {
        // ดึงข้อมูลใหม่จาก database
        const [newMembersData, newItemsData] = await Promise.all([
          membersApi.getAll(),
          itemsApi.getAll()
        ]);

        const oldMembers = membersRef.current;
        const oldItems = itemsRef.current;

        const membersChanged = JSON.stringify(oldMembers) !== JSON.stringify(newMembersData);
        const itemsChanged = JSON.stringify(oldItems) !== JSON.stringify(newItemsData);

        if (membersChanged && isNotificationsEnabled()) {
          const now = Date.now();
          if (now - lastMembersToastAt.current > TOAST_COOLDOWN_MS) {
            const changes = detectMemberChanges(oldMembers, newMembersData);
            setUpdateCount(prev => prev + 1);
            if (changes.length > 0) {
              const head = changes.slice(0, 2).join(' • ');
              const more = changes.length > 2 ? ` (+${changes.length - 2})` : '';
              toast({
                title: 'ข้อมูลสมาชิกได้รับการอัปเดต',
                description: head + more,
                duration: 3000
              });
            }
            lastMembersToastAt.current = now;
          }
        }

        if (itemsChanged && isNotificationsEnabled()) {
          const now = Date.now();
          if (now - lastItemsToastAt.current > TOAST_COOLDOWN_MS) {
            const changes = detectItemChanges(oldItems, newItemsData);
            setUpdateCount(prev => prev + 1);
            if (changes.length > 0) {
              const head = changes.slice(0, 2).join(' • ');
              const more = changes.length > 2 ? ` (+${changes.length - 2})` : '';
              toast({
                title: 'ข้อมูลสิ่งของได้รับการอัปเดต',
                description: head + more,
                duration: 3000
              });
            }
            lastItemsToastAt.current = now;
          }
        }

        // อัปเดต state และ refs
        setMembers(newMembersData);
        setItems(newItemsData);
        membersRef.current = newMembersData;
        itemsRef.current = newItemsData;

        setLastUpdateTime(new Date());

      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPageVisible, toast]);

  // ตรวจสอบ page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* สรุปยอดรวม ส่งแล้ว vs ยังไม่ส่ง */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded border p-4">
            <div className="text-sm text-muted-foreground">สมาชิกทั้งหมด</div>
            <RollingNumber className="text-2xl font-semibold" value={totalCount} />
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-muted-foreground">ส่งแล้ว</div>
            <RollingNumber className="text-2xl font-semibold text-green-600" value={sentCount} />
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-muted-foreground">ยังไม่ส่ง</div>
            <RollingNumber className="text-2xl font-semibold text-red-600" value={notSentCount} />
          </div>
        </div>

        {/* มุมมองปฏิทิน */}
        {showCalendar && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">ตารางเวลาการส่งสิ่งของ</h2>
            <ScheduleCalendar items={items} schedules={itemSchedules} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ตารางสมาชิก */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">รายชื่อสมาชิก</h2>
            <MemberTable members={members} />
          </div>

          {/* ตารางสิ่งของ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">รายการเงิน - สิ่งของที่ต้องส่ง</h2>
            <ItemTable items={items} schedules={itemSchedules} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
