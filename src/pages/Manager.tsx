import { useState, useEffect, useRef, useCallback } from 'react';
import { Member, Item } from '@/types';
import MemberTable from '@/components/MemberTable';
import DraggableItemTable from '@/components/DraggableItemTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isNotificationsEnabled } from '@/utils/notifications';
import { membersApi, itemsApi, whitelistApi, lockApi } from '@/lib/supabase';
import { AutoUnitDetector } from '@/utils/autoUnitDetector';
import { formatNumberWithCommas } from '@/lib/utils';
import { getAllItemSchedules, hydrateItemSchedulesFromServer, setItemSchedule, setManyItemSchedules, ItemSchedule, removeItemSchedule } from '@/utils/schedules';
import { upsertItemsMessage } from '@/lib/discord';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Manager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [managerUuid, setManagerUuid] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('itshard_manager_uuid');
      if (saved && saved.length > 0) return saved;
      // generate a stable UUID for this browser if not exists
      const generated = (window.crypto && 'randomUUID' in window.crypto)
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem('itshard_manager_uuid', generated);
      return generated;
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  });
  const [uuidValid, setUuidValid] = useState<boolean>(false);
  const [isCheckingUuid, setIsCheckingUuid] = useState<boolean>(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', avatar: '' });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newItem, setNewItem] = useState({ item_name: '', quantity: 0, unit: '' });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemSchedules, setItemSchedules] = useState<Record<string, ItemSchedule>>({});
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTargetItem, setScheduleTargetItem] = useState<Item | null>(null);
  // Confirm deletion dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmContext, setConfirmContext] = useState<{ type: 'member' | 'item'; id: string; label: string } | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastLocalChangeTs, setLastLocalChangeTs] = useState<number | null>(null);
  const [pendingMemberStatuses, setPendingMemberStatuses] = useState<Record<string, { status: Member['status']; ts: number }>>({});
  // PIN attempts limit
  const MAX_PIN_ATTEMPTS = 3;
  const PIN_ATTEMPTS_KEY = 'itshard_manager_pin_attempts';
  const PIN_LOCK_MINUTES = 10; // ระยะเวลาล็อค (นาที)
  const PIN_LOCK_UNTIL_KEY = 'itshard_manager_pin_locked_until';
  const [pinAttempts, setPinAttempts] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(PIN_ATTEMPTS_KEY);
      return raw ? Math.min(parseInt(raw, 10) || 0, MAX_PIN_ATTEMPTS) : 0;
    } catch {
      return 0;
    }
  });
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(PIN_LOCK_UNTIL_KEY);
      const ts = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(ts) ? ts : null;
    } catch {
      return null;
    }
  });
  const isLocked = lockedUntilMs !== null && Date.now() < lockedUntilMs;
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('');
  
  // Duration configuration state
  const [startDateTime, setStartDateTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'hour' | 'day' | 'week' | 'month' | 'year'>('day');

  const computeEndDate = (start: Date, value: number, unit: 'hour' | 'day' | 'week' | 'month' | 'year') => {
    const end = new Date(start);
    if (unit === 'hour') {
      end.setHours(end.getHours() + value);
      return end;
    }
    if (unit === 'day') {
      end.setDate(end.getDate() + value);
      return end;
    }
    if (unit === 'week') {
      end.setDate(end.getDate() + value * 7);
      return end;
    }
    if (unit === 'month') {
      const day = end.getDate();
      end.setMonth(end.getMonth() + value);
      // Handle month overflow (e.g., Jan 31 + 1 month → end of Feb)
      if (end.getDate() < day) {
        end.setDate(0);
      }
      return end;
    }
    if (unit === 'year') {
      const month = end.getMonth();
      const day = end.getDate();
      end.setFullYear(end.getFullYear() + value);
      // Keep at month end if original was month end and overflowed
      if (end.getMonth() !== month) {
        end.setDate(0);
      } else if (end.getDate() < day) {
        end.setDate(0);
      }
      return end;
    }
    return end;
  };

  const startDateObj = new Date(startDateTime);
  const endDateObj = computeEndDate(startDateObj, durationValue, durationUnit);
  const formatThaiDateTime = (d: Date) => d.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
  
  // Refs เพื่อเก็บข้อมูลปัจจุบันสำหรับ real-time checking
  const membersRef = useRef<Member[]>([]);
  const itemsRef = useRef<Item[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Session management functions
  const SESSION_KEY = 'itshard_manager_session';
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const saveSession = () => {
    const sessionData = {
      authenticated: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    // notify others that session changed
    window.dispatchEvent(new Event('manager-session-changed'));
  };

  const checkSession = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // ตรวจสอบว่า session ยังไม่หมดอายุ
      if (now < session.expiresAt) {
        return true;
      } else {
        // Session หมดอายุแล้ว ลบออก
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    // notify others that session changed
    window.dispatchEvent(new Event('manager-session-changed'));
  };

  // ตรวจสอบ UUID ที่บันทึกไว้เมื่อ component mount
  useEffect(() => {
    const validateUuid = async () => {
      if (!managerUuid) {
        setUuidValid(false);
        return;
      }
      setIsCheckingUuid(true);
      try {
        const ok = await whitelistApi.exists(managerUuid);
        setUuidValid(ok);
        // sync lock status from server (if exists)
        try {
          const status = await lockApi.get(managerUuid);
          if (status) {
            const attempts = Math.min(status.attempts || 0, MAX_PIN_ATTEMPTS);
            setPinAttempts(attempts);
            try { localStorage.setItem(PIN_ATTEMPTS_KEY, String(attempts)); } catch {}
            if (status.locked_until) {
              const until = new Date(status.locked_until).getTime();
              setLockedUntilMs(until);
              try { localStorage.setItem(PIN_LOCK_UNTIL_KEY, String(until)); } catch {}
            } else {
              setLockedUntilMs(null);
              try { localStorage.removeItem(PIN_LOCK_UNTIL_KEY); } catch {}
            }
          } else {
            setPinAttempts(0);
            setLockedUntilMs(null);
            try { localStorage.removeItem(PIN_ATTEMPTS_KEY); } catch {}
            try { localStorage.removeItem(PIN_LOCK_UNTIL_KEY); } catch {}
          }
        } catch {}
      } catch (e) {
        console.error('UUID validation error:', e);
        setUuidValid(false);
      } finally {
        setIsCheckingUuid(false);
      }
    };
    validateUuid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto re-sync lock status on window focus and every 15s when UUID valid
  useEffect(() => {
    if (!uuidValid || !managerUuid) return;
    let cancelled = false;
    let hadError = false;
    const sync = async () => {
      try {
        const status = await lockApi.get(managerUuid);
        if (cancelled) return;
        if (status === null) {
          // Likely no access or no row; stop polling quietly
          hadError = true;
          return;
        }
        if (status) {
          const attempts = Math.min(status.attempts || 0, MAX_PIN_ATTEMPTS);
          setPinAttempts(attempts);
          if (status.locked_until) {
            const until = new Date(status.locked_until).getTime();
            setLockedUntilMs(until);
          } else {
            setLockedUntilMs(null);
            try { localStorage.removeItem(PIN_LOCK_UNTIL_KEY); } catch {}
            try { localStorage.removeItem(PIN_ATTEMPTS_KEY); } catch {}
          }
        } else {
          setPinAttempts(0);
          setLockedUntilMs(null);
          try { localStorage.removeItem(PIN_LOCK_UNTIL_KEY); } catch {}
          try { localStorage.removeItem(PIN_ATTEMPTS_KEY); } catch {}
        }
      } catch {
        hadError = true;
      }
    };
    const onFocus = () => { sync(); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      if (!hadError) sync();
    }, 15000);
    sync();
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [uuidValid, managerUuid]);

  // ตรวจสอบ session เมื่อ component mount
  useEffect(() => {
    // ถ้าเคยล็อคไว้ แต่หมดเวลาแล้ว ให้รีเซ็ตตัวนับ
    try {
      const raw = localStorage.getItem(PIN_LOCK_UNTIL_KEY);
      const ts = raw ? parseInt(raw, 10) : NaN;
      if (Number.isFinite(ts) && Date.now() >= ts) {
        localStorage.removeItem(PIN_LOCK_UNTIL_KEY);
        localStorage.removeItem(PIN_ATTEMPTS_KEY);
        setLockedUntilMs(null);
        setPinAttempts(0);
      }
    } catch {}

    const hasValidSession = checkSession();
    if (hasValidSession) {
      setIsAuthenticated(true);
      toast({ 
        title: 'เข้าสู่ระบบอัตโนมัติ', 
        description: 'ยินดีต้อนรับกลับ!' 
      });
    }
    setIsCheckingSession(false);
  }, [toast]);

  // อัปเดตเวลาเพื่อโชว์ countdown ระหว่างล็อค
  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  // Session remaining time ticker (hours:minutes:seconds)
  useEffect(() => {
    const calc = () => {
      try {
        const raw = localStorage.getItem('itshard_manager_session');
        if (!raw) { setSessionTimeLeft(''); return; }
        const parsed = JSON.parse(raw);
        const expiresAt = typeof parsed?.expiresAt === 'number' ? parsed.expiresAt : Date.now();
        const ms = Math.max(0, expiresAt - Date.now());
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setSessionTimeLeft(`${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`);
      } catch {
        setSessionTimeLeft('');
      }
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  // Load schedules from cache, then hydrate from server
  useEffect(() => {
    setItemSchedules(getAllItemSchedules());
    (async () => {
      const fresh = await hydrateItemSchedulesFromServer();
      setItemSchedules(fresh);
    })();
  }, []);

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

  // ดึงข้อมูลจาก Supabase เมื่อเข้าสู่ระบบแล้ว
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Real-time polling ทุกๆ 1000ms - อัปเดตข้อมูลแบบบังคับ
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (!isPageVisible) {
        return;
      }
      // หลีกเลี่ยงทับค่า local ที่เพิ่งอัปเดต (ดีบาวซ์ 3 วินาทีหลังการแก้ไขในเครื่อง)
      if (lastLocalChangeTs && Date.now() - lastLocalChangeTs < 3000) {
        return;
      }

      try {
        // ดึงข้อมูลใหม่จาก database
        const [newMembersData, newItemsData] = await Promise.all([
          membersApi.getAll(),
          itemsApi.getAll()
        ]);

        // ผสานสถานะที่รอ sync (pending) เพื่อกันการเด้งกลับ
        const now = Date.now();
        const PENDING_TTL_MS = 60000; // สูงสุด 60 วินาที
        const pending = pendingMemberStatuses;
        const mergedMembers = newMembersData.map(m => {
          const p = pending[m.id];
          if (p && (now - p.ts) < PENDING_TTL_MS) {
            return { ...m, status: p.status };
          }
          return m;
        });

        // ถ้าค่า server ตรงกับ pending หรือหมดเวลา ให้ลบออก
        const nextPending: Record<string, { status: Member['status']; ts: number }> = { ...pending };
        mergedMembers.forEach(m => {
          const p = nextPending[m.id];
          if (!p) return;
          if (m.status === p.status || (now - p.ts) >= PENDING_TTL_MS) {
            delete nextPending[m.id];
          }
        });
        if (JSON.stringify(nextPending) !== JSON.stringify(pending)) {
          setPendingMemberStatuses(nextPending);
        }
        setMembers(mergedMembers);
        setItems(newItemsData);
        membersRef.current = mergedMembers;
        itemsRef.current = newItemsData;
        
        const oldMembers = membersRef.current;
        const oldItems = itemsRef.current;
        
        const membersChanged = JSON.stringify(oldMembers) !== JSON.stringify(newMembersData);
        const itemsChanged = JSON.stringify(oldItems) !== JSON.stringify(newItemsData);
        
        if (membersChanged) {
          const changes = detectMemberChanges(oldMembers, newMembersData);
          setUpdateCount(prev => prev + 1);
          changes.forEach(change => {
            toast({
              title: 'ข้อมูลสมาชิกได้รับการอัปเดต',
              description: change,
              duration: 3000
            });
          });
        }
        
        if (itemsChanged && isNotificationsEnabled()) {
          const changes = detectItemChanges(oldItems, newItemsData);
          setUpdateCount(prev => prev + 1);
          changes.forEach(change => {
            toast({
              title: 'ข้อมูลสิ่งของได้รับการอัปเดต',
              description: change,
              duration: 3000
            });
          });
        }

        setLastUpdateTime(new Date());
        
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, isPageVisible, toast]);

  // Auto-upsert Discord message every 1 second with the latest items
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      upsertItemsMessage(itemsRef.current.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isPageVisible, lastLocalChangeTs]);

  // ตรวจสอบ page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePinSubmit = async () => {
    if (!uuidValid) {
      toast({ title: 'ยังไม่ได้ยืนยัน UUID', description: 'กรุณายืนยัน UUID ก่อน', variant: 'destructive' });
      return;
    }
    // Always check server-side lock to prevent localStorage bypass
    let currentAttempts = pinAttempts;
    let currentLockedUntil = lockedUntilMs;
    try {
      if (managerUuid) {
        const status = await lockApi.get(managerUuid);
        if (status) {
          currentAttempts = Math.min(status.attempts || 0, MAX_PIN_ATTEMPTS);
          currentLockedUntil = status.locked_until ? new Date(status.locked_until).getTime() : null;
          setPinAttempts(currentAttempts);
          setLockedUntilMs(currentLockedUntil);
          try { localStorage.setItem(PIN_ATTEMPTS_KEY, String(currentAttempts)); } catch {}
          if (currentLockedUntil) {
            try { localStorage.setItem(PIN_LOCK_UNTIL_KEY, String(currentLockedUntil)); } catch {}
          }
        }
      }
    } catch {}

    const serverLocked = currentLockedUntil !== null && Date.now() < (currentLockedUntil || 0);
    if (serverLocked) {
      toast({ title: 'ถูกล็อคชั่วคราว', description: `กรุณาลองใหม่ภายใน ${PIN_LOCK_MINUTES} นาที`, variant: 'destructive' });
      return;
    }
    if (currentAttempts >= MAX_PIN_ATTEMPTS) {
      toast({ title: `พยายามเกิน ${MAX_PIN_ATTEMPTS} ครั้ง`, description: 'ไม่สามารถเข้าสู่ระบบได้', variant: 'destructive' });
      return;
    }
    if (pin === '1669') {
      setIsAuthenticated(true);
      saveSession(); // บันทึก session
      toast({ 
        title: 'เข้าสู่ระบบสำเร็จ', 
        description: 'ระบบจะจำการเข้าสู่ระบบไว้ 24 ชั่วโมง' 
      });
      setPin('');
      // รีเซ็ตตัวนับและการล็อคเมื่อสำเร็จ
      try { localStorage.removeItem(PIN_ATTEMPTS_KEY); } catch {}
      try { localStorage.removeItem(PIN_LOCK_UNTIL_KEY); } catch {}
      setPinAttempts(0);
      setLockedUntilMs(null);
      // reset server lock as well (non-blocking)
      if (managerUuid) { lockApi.reset(managerUuid).catch(() => {}); }
    } else {
      const next = currentAttempts + 1;
      setPinAttempts(next);
      try { localStorage.setItem(PIN_ATTEMPTS_KEY, String(next)); } catch {}
      if (next >= MAX_PIN_ATTEMPTS) {
        const until = Date.now() + PIN_LOCK_MINUTES * 60 * 1000;
        setLockedUntilMs(until);
        try { localStorage.setItem(PIN_LOCK_UNTIL_KEY, String(until)); } catch {}
        toast({ title: `PIN ไม่ถูกต้องครบ ${MAX_PIN_ATTEMPTS} ครั้ง`, description: `ระบบได้ทำการล็อค ${PIN_LOCK_MINUTES} นาที`, variant: 'destructive' });
        // update server lock
        if (managerUuid) {
          lockApi.set(managerUuid, next, new Date(until).toISOString()).catch(() => {});
        }
      } else {
        const remaining = MAX_PIN_ATTEMPTS - next;
        toast({ title: 'PIN ไม่ถูกต้อง', description: `เหลือโอกาสอีก ${remaining} ครั้ง`, variant: 'destructive' });
        // update server attempts without lock
        if (managerUuid) {
          lockApi.set(managerUuid, next, null).catch(() => {});
        }
      }
      setPin('');
    }
  };

  const handleAddMember = async () => {
    if (newMember.name && newMember.avatar) {
      try {
        const member = await membersApi.create({
          name: newMember.name,
          status: 'ยังไม่ส่ง',
          avatar: newMember.avatar
        });
        setMembers([...members, member]);
        membersRef.current = [...members, member]; // อัปเดต ref
        setNewMember({ name: '', avatar: '' });
        setMemberDialogOpen(false);
        toast({ title: 'เพิ่มสมาชิกสำเร็จ' });
      } catch (error) {
        console.error('Error adding member:', error);
        toast({ 
          title: 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก', 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setNewMember({ name: member.name, avatar: member.avatar });
    setMemberDialogOpen(true);
  };

  const handleUpdateMember = async () => {
    if (editingMember && newMember.name && newMember.avatar) {
      try {
        const updatedMember = await membersApi.update(editingMember.id, {
          name: newMember.name,
          avatar: newMember.avatar,
          status: editingMember.status // เก็บสถานะเดิม
        });
        setMembers(members.map(m => m.id === editingMember.id ? updatedMember : m));
        membersRef.current = members.map(m => m.id === editingMember.id ? updatedMember : m); // อัปเดต ref
        setNewMember({ name: '', avatar: '' });
        setEditingMember(null);
        setMemberDialogOpen(false);
        toast({ title: 'แก้ไขข้อมูลสมาชิกสำเร็จ' });
      } catch (error) {
        console.error('Error updating member:', error);
        toast({ 
          title: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสมาชิก', 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await membersApi.delete(id);
      setMembers(members.filter(m => m.id !== id));
      membersRef.current = members.filter(m => m.id !== id); // อัปเดต ref
      toast({ title: 'ลบสมาชิกสำเร็จ' });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({ 
        title: 'เกิดข้อผิดพลาดในการลบสมาชิก', 
        variant: 'destructive' 
      });
    }
  };

  const handleStatusChange = async (id: string, status: Member['status']) => {
    try {
      await membersApi.updateStatus(id, status);
      setMembers(members.map(m => m.id === id ? { ...m, status } : m));
      membersRef.current = members.map(m => m.id === id ? { ...m, status } : m); // อัปเดต ref
      setLastLocalChangeTs(Date.now());
      setPendingMemberStatuses(prev => ({ ...prev, [id]: { status, ts: Date.now() } }));
      toast({ title: 'เปลี่ยนสถานะสำเร็จ' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ 
        title: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 
        variant: 'destructive' 
      });
    }
  };

  const handleAddItem = async () => {
    if (newItem.item_name && newItem.quantity && newItem.unit) {
      try {
        const item = await itemsApi.create({
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          unit: newItem.unit
        });
        const nextItems = [...items, item];
        setItems(nextItems);
        itemsRef.current = nextItems; // อัปเดต ref
        // Update Discord webhook message
        upsertItemsMessage(nextItems.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
        setNewItem({ item_name: '', quantity: 0, unit: '' });
        setItemDialogOpen(false);
        toast({ title: 'เพิ่มสิ่งของสำเร็จ' });
      } catch (error) {
        console.error('Error adding item:', error);
        toast({ 
          title: 'เกิดข้อผิดพลาดในการเพิ่มสิ่งของ', 
          variant: 'destructive' 
        });
      }
    } else {
      toast({ 
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน', 
        description: 'ชื่อสิ่งของ, จำนวน และหน่วย',
        variant: 'destructive' 
      });
    }
  };

  const handleToggleSelectItem = (id: string, checked: boolean) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const openScheduleDialogFor = (item: Item | null) => {
    setScheduleTargetItem(item);
    setScheduleDialogOpen(true);
  };

  // (Removed) schedule prefill for edit dialog per request

  const applySchedule = async () => {
    const start = new Date(startDateTime);
    const end = computeEndDate(start, durationValue, durationUnit);
    const schedule: ItemSchedule = { startISO: start.toISOString(), endISO: end.toISOString() };
    if (scheduleTargetItem) {
      await setItemSchedule(scheduleTargetItem.id, schedule);
      setItemSchedules(getAllItemSchedules());
      toast({ title: `ตั้งระยะเวลาให้ ${scheduleTargetItem.item_name} แล้ว` });
    } else {
      const ids = Array.from(selectedItemIds);
      if (ids.length === 0) {
        toast({ title: 'กรุณาเลือกรายการอย่างน้อย 1 รายการ', variant: 'destructive' });
        return;
      }
      await setManyItemSchedules(ids, schedule);
      setItemSchedules(getAllItemSchedules());
      toast({ title: `ตั้งระยะเวลาให้ ${ids.length} รายการแล้ว` });
    }
    setScheduleDialogOpen(false);
    // Update Discord webhook message after schedules change
    upsertItemsMessage(itemsRef.current.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
  };

  // Deletion confirmation flow
  const requestDelete = (type: 'member' | 'item', id: string) => {
    if (type === 'member') {
      const member = members.find(m => m.id === id);
      const label = member ? member.name : 'สมาชิกนี้';
      setConfirmContext({ type, id, label });
      setConfirmOpen(true);
      return;
    }
    const item = items.find(i => i.id === id);
    const label = item ? `${item.item_name} (${formatNumberWithCommas(item.quantity)} ${item.unit})` : 'รายการนี้';
    setConfirmContext({ type, id, label });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmContext) return;
    try {
      if (confirmContext.type === 'member') {
        await membersApi.delete(confirmContext.id);
        setMembers(members.filter(m => m.id !== confirmContext.id));
        membersRef.current = members.filter(m => m.id !== confirmContext.id);
        toast({ title: 'ลบสมาชิกสำเร็จ' });
      } else {
        await itemsApi.delete(confirmContext.id);
        setItems(items.filter(i => i.id !== confirmContext.id));
        itemsRef.current = items.filter(i => i.id !== confirmContext.id);
        toast({ title: 'ลบสิ่งของสำเร็จ' });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'เกิดข้อผิดพลาดในการลบ', variant: 'destructive' });
    } finally {
      setConfirmOpen(false);
      setConfirmContext(null);
    }
  };

  const handleClearSchedule = async (item: Item) => {
    await removeItemSchedule(item.id);
    setItemSchedules(getAllItemSchedules());
    toast({ title: `ล้างเวลาของ ${item.item_name} แล้ว` });
  };

  const handleClearSelectedSchedules = async () => {
    const ids = Array.from(selectedItemIds);
    for (const id of ids) {
      await removeItemSchedule(id);
    }
    setItemSchedules(getAllItemSchedules());
    toast({ title: `ล้างเวลา ${ids.length} รายการแล้ว` });
  };

  const handleReorderItems = async (reorderedItems: Item[]) => {
    try {
      // อัปเดต state ทันที
      setItems(reorderedItems);
      itemsRef.current = reorderedItems;
      
      // สร้าง array ของ display_order updates
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));
      
      // บันทึกลำดับใหม่ลงฐานข้อมูล
      await itemsApi.updateDisplayOrder(updates);
      
      // อัปเดต Discord webhook message ด้วยลำดับใหม่
      upsertItemsMessage(reorderedItems.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
      
      toast({ title: 'จัดเรียงลำดับสำเร็จ' });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({ 
        title: 'เกิดข้อผิดพลาดในการจัดเรียงลำดับ', 
        variant: 'destructive' 
      });
      // กู้คืนลำดับเดิม
      loadData();
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setNewItem(item);
    setItemDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (editingItem && newItem.item_name && newItem.quantity && newItem.unit) {
      try {
        const updatedItem = await itemsApi.update(editingItem.id, {
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          unit: newItem.unit
        });
        const nextItems = items.map(i => i.id === editingItem.id ? updatedItem : i);
        setItems(nextItems);
        itemsRef.current = nextItems; // อัปเดต ref
        // Update Discord webhook message after edit
        upsertItemsMessage(nextItems.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
        setEditingItem(null);
        setNewItem({ item_name: '', quantity: 0, unit: '' });
        setItemDialogOpen(false);
        toast({ title: 'แก้ไขสิ่งของสำเร็จ' });
      } catch (error) {
        console.error('Error updating item:', error);
        toast({ 
          title: 'เกิดข้อผิดพลาดในการแก้ไขสิ่งของ', 
          variant: 'destructive' 
        });
      }
    } else {
      toast({ 
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน', 
        description: 'ชื่อสิ่งของ, จำนวน และหน่วย',
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await itemsApi.delete(id);
      const nextItems = items.filter(i => i.id !== id);
      setItems(nextItems);
      itemsRef.current = nextItems; // อัปเดต ref
      // Update Discord webhook message after deletion
      upsertItemsMessage(nextItems.map(i => ({ item_name: i.item_name, quantity: i.quantity, unit: i.unit, display_order: i.display_order })));
      toast({ title: 'ลบสิ่งของสำเร็จ' });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ 
        title: 'เกิดข้อผิดพลาดในการลบสิ่งของ', 
        variant: 'destructive' 
      });
    }
  };


  // แสดง loading ขณะตรวจสอบ session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-xl sm:text-2xl">เข้าสู่ระบบจัดการ</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              ระบบจะจำการเข้าสู่ระบบไว้ 24 ชั่วโมง
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="uuid">UUID</Label>
              <div className="group">
                <Input
                  id="uuid"
                  value={managerUuid}
                  onChange={(e) => setManagerUuid(e.target.value.trim())}
                  placeholder="ระบบสร้างให้อัตโนมัติ - ส่งให้ผู้ดูแลเพื่ออนุมัติ"
                  className="text-center filter blur-sm group-hover:blur-none transition"
                  readOnly
                  disabled={isCheckingUuid}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(managerUuid);
                      toast({ title: 'คัดลอก UUID แล้ว' });
                    } catch {
                      toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
                    }
                  }}
                >
                  คัดลอก UUID
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!managerUuid) {
                      toast({ title: 'กรุณากรอก UUID', variant: 'destructive' });
                      return;
                    }
                    setIsCheckingUuid(true);
                    try {
                      const ok = await whitelistApi.exists(managerUuid);
                      setUuidValid(ok);
                      if (ok) {
                        try { localStorage.setItem('itshard_manager_uuid', managerUuid); } catch {}
                        toast({ title: 'ยืนยัน UUID สำเร็จ' });
                      } else {
                        toast({ title: 'UUID ไม่ได้รับอนุญาต', variant: 'destructive' });
                      }
                    } catch (e) {
                      toast({ title: 'ตรวจสอบ UUID ล้มเหลว', variant: 'destructive' });
                    } finally {
                      setIsCheckingUuid(false);
                    }
                  }}
                >
                  ตรวจสอบ UUID
                </Button>
                {isCheckingUuid ? (
                  <span className="text-muted-foreground text-sm">กำลังตรวจสอบ...</span>
                ) : uuidValid ? (
                  <span className="text-green-600 text-sm">คุณได้รับอนุญาตแล้ว</span>
                ) : (
                  <span className="text-muted-foreground text-sm text-red-500">ยังไม่ยืนยัน</span>
                )}
                <div className="w-full text-xs text-muted-foreground">ส่ง UUID นี้ให้ผู้พัฒนาเพื่อระบบจะตรวจสอบและอนุญาต กดปุ่ม "ตรวจสอบ UUID" เพื่อตรวจสอบว่า UUID ของคุณได้รับอนุญาตหรือไม่</div>
              </div>
            </div>
            <div>
              <Label htmlFor="pin">กรอก PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="กรอก PIN 4 หลัก"
                className="text-center text-lg"
                disabled={!uuidValid || pinAttempts >= MAX_PIN_ATTEMPTS || isLocked}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit();
                  }
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => navigate('/')} className="w-full sm:flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
              <Button onClick={handlePinSubmit} className="w-full sm:flex-1" disabled={!uuidValid || pinAttempts >= MAX_PIN_ATTEMPTS || isLocked}>
                เข้าสู่ระบบ
              </Button>
            </div>
            {isLocked && (
              <div className="text-xs text-destructive mt-1 text-center">
                ถูกล็อคชั่วคราว เหลือเวลาอีก {
                  (() => {
                    const remain = Math.max(0, (lockedUntilMs || 0) - nowTick);
                    const m = Math.floor(remain / 60000);
                    const s = Math.floor((remain % 60000) / 1000);
                    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                  })()
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">ระบบจัดการครอบครัว - Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบจะจำการเข้าสู่ระบบไว้ 24 ชั่วโมง
              {sessionTimeLeft && (
                <span className="ml-1">(เหลืออีก {sessionTimeLeft})</span>
              )}
            </p>
            {/* Real-time Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
              </div>
            <div className="flex items-center gap-2">

              <span
                className="text-foreground dark:text-black px-2 py-1 rounded bg-gray-100 dark:bg-gray-200"
              >
                ล่าสุด: {lastUpdateTime.toLocaleTimeString('th-TH')}
              </span>
            </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button variant="outline" onClick={clearSession} className="w-full sm:w-auto">
              ออกจากระบบ
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </div>
        </div>

        

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* จัดการสมาชิก */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-semibold">จัดการสมาชิก</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">เพิ่มสมาชิก</span>
                      <span className="sm:hidden">เพิ่ม</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="w-full max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMember ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="memberName">ชื่อสมาชิก</Label>
                      <Input
                        id="memberName"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="กรอกชื่อสมาชิก"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memberAvatar">ลิงก์รูปภาพ</Label>
                      <Input
                        id="memberAvatar"
                        value={newMember.avatar}
                        onChange={(e) => setNewMember({ ...newMember, avatar: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingMember(null);
                          setNewMember({ name: '', avatar: '' });
                          setMemberDialogOpen(false);
                        }} 
                        className="flex-1"
                      >
                        ยกเลิก
                      </Button>
                      <Button 
                        onClick={editingMember ? handleUpdateMember : handleAddMember} 
                        className="flex-1"
                      >
                        {editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
            <MemberTable 
              members={members} 
              isManagerMode={true}
              onStatusChange={handleStatusChange}
              onEdit={handleEditMember}
              onDelete={(id) => requestDelete('member', id)}
              emptyTitle="ยังไม่มีรายชื่อสมาชิก"
              emptyActionLabel="เพิ่มสมาชิก"
              onEmptyAction={() => setMemberDialogOpen(true)}
            />
          </div>

          {/* จัดการสิ่งของ */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-semibold">จัดการรายการเงิน-สิ่งของ</h2>
              <div className="flex items-center gap-2" />
              <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">
                      {editingItem ? 'แก้ไขสิ่งของ' : 'เพิ่มสิ่งของ'}
                    </span>
                    <span className="sm:hidden">
                      {editingItem ? 'แก้ไข' : 'เพิ่ม'}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'แก้ไขสิ่งของ' : 'เพิ่มสิ่งของใหม่'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="itemName">ชื่อสิ่งของ</Label>
                      <Input
                        id="itemName"
                        value={newItem.item_name}
                        onChange={(e) => {
                          const itemName = e.target.value;
                          setNewItem({ 
                            ...newItem, 
                            item_name: itemName
                            // ไม่ตั้งหน่วยอัตโนมัติ ให้ผู้ใช้เลือกเอง
                          });
                        }}
                        placeholder="เช่น ข้าวสาร, น้ำปลา, เงิน, เงินเขียว"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemQuantity">จำนวน</Label>
                      <Input
                        id="itemQuantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemUnit">หน่วย</Label>
                      <div className="flex gap-2">
                        <Input
                          id="itemUnit"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                          placeholder="เช่น กิโลกรัม, ขวด, บาท"
                          className="flex-1"
                        />
                        {newItem.item_name && AutoUnitDetector.detectUnit(newItem.item_name) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const autoUnit = AutoUnitDetector.detectUnit(newItem.item_name);
                              setNewItem({ ...newItem, unit: autoUnit });
                            }}
                            className="whitespace-nowrap"
                          >
                            ใช้คำแนะนำ
                          </Button>
                        )}
                      </div>
                      {newItem.item_name && AutoUnitDetector.detectUnit(newItem.item_name) && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          💡 คำแนะนำ: หน่วยที่แนะนำคือ "{AutoUnitDetector.detectUnit(newItem.item_name)}" 
                          {newItem.unit === AutoUnitDetector.detectUnit(newItem.item_name) ? ' (กำลังใช้)' : ' - คลิกปุ่ม "ใช้คำแนะนำ" เพื่อใช้'}
                        </p>
                      )}
                    </div>
                  {/* Schedule section removed per request; edit dialog now only shows name, quantity, unit */}
                    <Button 
                      onClick={editingItem ? handleUpdateItem : handleAddItem} 
                      className="w-full"
                    >
                      {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มสิ่งของ'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openScheduleDialogFor(null)} disabled={selectedItemIds.size === 0}>
                  <Clock className="w-4 h-4 mr-1" /> ตั้งเวลา (ที่เลือก)
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearSelectedSchedules} disabled={selectedItemIds.size === 0}>
                  ล้างเวลา (ที่เลือก)
                </Button>
              </div>
            </div>
            <DraggableItemTable 
              items={items} 
              onReorder={handleReorderItems}
              isManagerMode={true}
              onEdit={handleEditItem}
              onDelete={(id) => requestDelete('item', id)}
              schedules={itemSchedules}
              showSelection={true}
              selectedIds={selectedItemIds}
              onToggleSelect={handleToggleSelectItem}
              onScheduleClick={(item) => openScheduleDialogFor(item)}
              onClearScheduleClick={handleClearSchedule}
              emptyTitle="ยังไม่มีรายการสิ่งของ"
              emptyActionLabel="เพิ่มสิ่งของ"
              onEmptyAction={() => setItemDialogOpen(true)}
            />
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{scheduleTargetItem ? `ตั้งเวลา: ${scheduleTargetItem.item_name}` : `ตั้งเวลา (รายการที่เลือก ${selectedItemIds.size} รายการ)`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="scheduleStart">วันเวลาเริ่มต้น</Label>
                    <Input
                      id="scheduleStart"
                      type="datetime-local"
                      className="w-full"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="scheduleValue">ระยะเวลา</Label>
                    <Input
                      id="scheduleValue"
                      type="number"
                      min={1}
                      className="w-full"
                      value={durationValue}
                      onChange={(e) => setDurationValue(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>หน่วย</Label>
                    <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as typeof durationUnit)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">ชั่วโมง</SelectItem>
                        <SelectItem value="day">วัน</SelectItem>
                        <SelectItem value="week">สัปดาห์</SelectItem>
                        <SelectItem value="month">เดือน</SelectItem>
                        <SelectItem value="year">ปี</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  ระบบจะตั้งเป็นช่วง: <span className="font-medium">{formatThaiDateTime(startDateObj)}</span> ถึง <span className="font-medium">{formatThaiDateTime(endDateObj)}</span>
                </div>
                <div className="mt-6 flex justify-between gap-2">
                  <Button variant="destructive" onClick={() => {
                    if (scheduleTargetItem) {
                      handleClearSchedule(scheduleTargetItem);
                    } else {
                      handleClearSelectedSchedules();
                    }
                    setScheduleDialogOpen(false);
                  }}>ล้างเวลา</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>ยกเลิก</Button>
                    <Button onClick={applySchedule}>บันทึก</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Confirm delete dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการลบ</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  คุณต้องการลบ <span className="font-medium">{confirmContext?.label}</span> หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
                  <Button variant="destructive" onClick={confirmDelete}>ยืนยันการลบ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;