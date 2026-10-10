// Storage utility helper to sync sessionStorage and localStorage for seamless session management

export const getItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

export const setItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage setItem error for key ${key}:`, e);
  }
};

export const removeItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Storage removeItem error for key ${key}:`, e);
  }
};

// Sync all existing mlx_ keys into sessionStorage on app initialization
export const syncStorageToSession = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const keysToSync = [
      'mlx_token',
      'mlx_active_shop',
      'mlx_active_user',
      'mlx_auth_role',
      'mlx_products',
      'mlx_shops',
      'mlx_categories',
      'mlx_leads',
      'mlx_subscription_plans',
      'mlx_user_location',
      'mlx_wishlist',
      'auth',
      'darkMode'
    ];

    keysToSync.forEach(key => {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val) {
        sessionStorage.setItem(key, val);
        localStorage.setItem(key, val);
      }
    });
  } catch (e) {
    console.warn('Storage sync error:', e);
  }
};

// Execute sync immediately on module import
syncStorageToSession();
