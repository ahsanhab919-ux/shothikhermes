const PREFS_KEY = 'shothik_user_preferences';

export type InterfaceMode = 'beginner' | 'advanced';
export type AppLocale = 'en' | 'bn';

export interface UserPreferences {
  interfaceMode: InterfaceMode;
  locale: AppLocale;
}

const DEFAULT_PREFS: UserPreferences = {
  interfaceMode: 'beginner',
  locale: 'en',
};

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setPreferences(prefs: Partial<UserPreferences>) {
  if (typeof window === 'undefined') return;
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

export function getInterfaceMode(): InterfaceMode {
  return getPreferences().interfaceMode;
}

export function setInterfaceMode(mode: InterfaceMode) {
  return setPreferences({ interfaceMode: mode });
}
