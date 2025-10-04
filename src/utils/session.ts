export const MANAGER_SESSION_KEY = 'itshard_manager_session';

export type ManagerSession = {
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
};

export function readManagerSession(): ManagerSession | null {
  try {
    const raw = localStorage.getItem(MANAGER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ManagerSession;
  } catch {
    return null;
  }
}

export function hasValidManagerSession(nowTs: number = Date.now()): boolean {
  const session = readManagerSession();
  if (!session) return false;
  return Boolean(session.authenticated) && nowTs < session.expiresAt;
}

export function emitManagerSessionChanged(): void {
  window.dispatchEvent(new Event('manager-session-changed'));
}

