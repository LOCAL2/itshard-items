// Simple Discord webhook client that can create or update a single message

type WebhookResponse = {
  id: string;
  channel_id: string;
};

const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string | undefined;
const THREAD_ID = import.meta.env.VITE_DISCORD_THREAD_ID as string | undefined;
const STORAGE_KEY = 'itshard_discord_last_message_id';
const EMBED_COLOR_RAW = (import.meta.env.VITE_DISCORD_EMBED_COLOR as string | undefined) || '';
const EMBED_COLOR = (() => {
  if (!EMBED_COLOR_RAW) return 0x58A6FF; // default blue
  if (EMBED_COLOR_RAW.startsWith('0x')) return Number(EMBED_COLOR_RAW);
  const asNumber = Number(EMBED_COLOR_RAW);
  return Number.isFinite(asNumber) ? asNumber : 0x58A6FF;
})();

function getWebhookUrl(): string | null {
  if (!WEBHOOK_URL) return null;
  const url = new URL(WEBHOOK_URL);
  if (THREAD_ID) {
    url.searchParams.set('thread_id', THREAD_ID);
  }
  return url.toString();
}

export function getLastMessageId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastMessageId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function clearLastMessageId() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function normalizeItems(items: Array<{ item_name: string; quantity: number; unit: string; display_order?: number }>) {
  // sort by display_order first, then by name for items without order
  return [...items].sort((a, b) => {
    // If both have display_order, sort by that
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return a.display_order - b.display_order;
    }
    // If only one has display_order, prioritize it
    if (a.display_order !== undefined) return -1;
    if (b.display_order !== undefined) return 1;
    // If neither has display_order, sort by name
    return (a.item_name || '').localeCompare(b.item_name || '', 'th', { sensitivity: 'base' });
  });
}

function buildEmbed(items: Array<{ item_name: string; quantity: number; unit: string; display_order?: number }>) {
  const normalized = normalizeItems(items);
  const title = 'รายการเงิน - สิ่งของที่ต้องส่ง';
  const description = normalized.length === 0
    ? '(ตอนนี้ไม่มีรายการ)'
    : normalized.map((i, index) => `${index + 1}. ${i.item_name} — ${i.quantity.toLocaleString('en-US')} ${i.unit}`).join('\n');
  return {
    content: "",
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title,
        description,
        color: EMBED_COLOR,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

let debounceTimer: number | undefined;
let lastPayloadHash: string | undefined;
let isPosting = false;

export async function upsertItemsMessage(items: Array<{ item_name: string; quantity: number; unit: string; display_order?: number }>): Promise<void> {
  const url = getWebhookUrl();
  if (!url) {
    console.warn('[Discord] VITE_DISCORD_WEBHOOK_URL is not set. Skipping webhook.');
    return; // silently no-op if webhook not configured
  }

  const normalized = normalizeItems(items);
  const body = buildEmbed(normalized);
  const hash = JSON.stringify(normalized);
  if (hash === lastPayloadHash) {
    // no content change; skip
    return;
  }

  // Debounce to avoid rapid duplicate updates
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  await new Promise<void>((resolve) => {
    debounceTimer = window.setTimeout(async () => {
      if (isPosting) {
        // another request in-flight; skip this cycle
        resolve();
        return;
      }
      isPosting = true;
      // If list is empty, delete previous message (if any) and clear state
      if (normalized.length === 0) {
        const lastIdForDelete = getLastMessageId();
        if (lastIdForDelete) {
          try {
            const delUrl = new URL(url);
            delUrl.pathname = `${delUrl.pathname}/messages/${lastIdForDelete}`;
            const res = await fetch(delUrl.toString(), { method: 'DELETE' });
            if (!res.ok) {
              console.warn('[Discord] Failed to delete message:', res.status, res.statusText);
            }
          } catch (e) {
            console.error('[Discord] Error deleting message:', e);
          }
          clearLastMessageId();
        }
        lastPayloadHash = hash;
        isPosting = false;
        resolve();
        return;
      }

      // If we have a previous message id, try to edit that message via webhook token path
      const lastId = getLastMessageId();
      try {
        if (lastId) {
          const editUrl = new URL(url);
          editUrl.pathname = `${editUrl.pathname}/messages/${lastId}`;
          const res = await fetch(editUrl.toString(), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (res.ok) {
            lastPayloadHash = hash;
            isPosting = false;
            resolve();
            return;
          }
          // If 404, the stored message id is invalid (deleted or different webhook) → clear it and proceed to create
          if (res.status === 404) {
            clearLastMessageId();
          }
          // If edit fails (e.g., message deleted), fall through to create
        }

        // Create new message
        const createUrl = new URL(url);
        createUrl.searchParams.set('wait', 'true');
        const res = await fetch(createUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          throw new Error(`Webhook post failed: ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as WebhookResponse;
        if (data?.id) setLastMessageId(data.id);
        lastPayloadHash = hash;
        isPosting = false;
        resolve();
      } catch (e) {
        console.error('Discord webhook error (likely CORS if running in browser):', e);
        isPosting = false;
        resolve();
      }
    }, 500);
  });
}

