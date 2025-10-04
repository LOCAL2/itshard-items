export type ItemSchedule = {
  startISO: string; // datetime-local ISO string (no seconds)
  endISO: string;
};

const STORAGE_KEY = 'item_schedules_v1';
export const SCHEDULES_EVENT = 'item-schedules-updated';

import { schedulesApi } from '@/lib/supabase';

function notifyUpdate() {
  try {
    window.dispatchEvent(new CustomEvent(SCHEDULES_EVENT));
  } catch {}
}

function readCache(): Record<string, ItemSchedule> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(all: Record<string, ItemSchedule>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('localStorage write failed for item schedules:', e);
  }
}

export function getAllItemSchedules(): Record<string, ItemSchedule> {
  return readCache();
}

export async function hydrateItemSchedulesFromServer() {
  try {
    const serverMap = await schedulesApi.getAll();
    const simplified: Record<string, ItemSchedule> = {};
    Object.entries(serverMap).forEach(([id, v]) => {
      simplified[id] = { startISO: v.startISO, endISO: v.endISO };
    });
    writeCache(simplified);
    notifyUpdate();
    return simplified;
  } catch (e) {
    console.error('Failed to hydrate schedules from server:', e);
    return readCache();
  }
}

export async function setItemSchedule(itemId: string, schedule: ItemSchedule) {
  await schedulesApi.upsert(itemId, schedule);
  const all = readCache();
  all[itemId] = schedule;
  writeCache(all);
  notifyUpdate();
}

export async function setManyItemSchedules(itemIds: string[], schedule: ItemSchedule) {
  await schedulesApi.upsertMany(itemIds, schedule);
  const all = readCache();
  itemIds.forEach(id => { all[id] = schedule; });
  writeCache(all);
  notifyUpdate();
}

export async function removeItemSchedule(itemId: string) {
  await schedulesApi.remove(itemId);
  const all = readCache();
  delete all[itemId];
  writeCache(all);
  notifyUpdate();
}

export function formatThaiDateTime(d: Date) {
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

