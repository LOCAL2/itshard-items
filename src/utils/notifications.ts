const KEY = 'itshard_notifications_enabled';

export function isNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return true; // default ON
    return raw === 'true';
  } catch {
    return true;
  }
}

export function setNotificationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, String(enabled));
    window.dispatchEvent(new Event('notifications-changed'));
  } catch {
    // ignore
  }
}

