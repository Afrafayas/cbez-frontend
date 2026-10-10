/**
 * Central Authentication & Session Storage Management for MLX Market
 * Securely stores and manages: role, id, token, name, number/phone, and session objects.
 * Primary storage: sessionStorage (cleared when browser session/tab closes for enhanced security).
 * Synchronized with localStorage as a safe recovery backup to prevent sudden session dropping.
 */

export interface AuthSessionData {
  token: string | null;
  role: 'seller' | 'customer' | 'admin' | null;
  id: string | null;
  name: string | null;
  number: string | null;
  phone: string | null;
  shop: any | null;
  user: any | null;
}

export const AUTH_KEYS = {
  // Direct requested keys
  ROLE: 'role',
  ID: 'id',
  TOKEN: 'token',
  NAME: 'name',
  NUMBER: 'number',
  PHONE: 'phone',

  // Namespaced MLX keys for system consistency and Redux compatibility
  MLX_TOKEN: 'mlx_token',
  MLX_ROLE: 'mlx_role',
  MLX_AUTH_ROLE: 'mlx_auth_role',
  MLX_USER_ID: 'mlx_user_id',
  MLX_NAME: 'mlx_user_name',
  MLX_PHONE: 'mlx_user_phone',
  ACTIVE_SHOP: 'mlx_active_shop',
  ACTIVE_USER: 'mlx_active_user',
} as const;

const isBrowser = typeof window !== 'undefined';

/**
 * Save all login data directly to sessionStorage (with safe localStorage backup)
 */
export function saveAuthSession(data: {
  token?: string | null;
  role?: string | null;
  id?: string | null;
  name?: string | null;
  number?: string | null;
  phone?: string | null;
  shop?: any | null;
  user?: any | null;
}): void {
  if (!isBrowser) return;

  try {
    if (data.token) {
      sessionStorage.setItem(AUTH_KEYS.TOKEN, data.token);
      sessionStorage.setItem(AUTH_KEYS.MLX_TOKEN, data.token);
      localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
      localStorage.setItem(AUTH_KEYS.MLX_TOKEN, data.token);
    }

    if (data.role) {
      const normalizedRole = data.role.toLowerCase().trim();
      sessionStorage.setItem(AUTH_KEYS.ROLE, normalizedRole);
      sessionStorage.setItem(AUTH_KEYS.MLX_ROLE, normalizedRole);
      sessionStorage.setItem(AUTH_KEYS.MLX_AUTH_ROLE, normalizedRole);
      localStorage.setItem(AUTH_KEYS.ROLE, normalizedRole);
      localStorage.setItem(AUTH_KEYS.MLX_ROLE, normalizedRole);
      localStorage.setItem(AUTH_KEYS.MLX_AUTH_ROLE, normalizedRole);
    }

    if (data.id) {
      const idStr = String(data.id);
      sessionStorage.setItem(AUTH_KEYS.ID, idStr);
      sessionStorage.setItem(AUTH_KEYS.MLX_USER_ID, idStr);
      localStorage.setItem(AUTH_KEYS.ID, idStr);
      localStorage.setItem(AUTH_KEYS.MLX_USER_ID, idStr);
    }

    if (data.name) {
      sessionStorage.setItem(AUTH_KEYS.NAME, data.name);
      sessionStorage.setItem(AUTH_KEYS.MLX_NAME, data.name);
      localStorage.setItem(AUTH_KEYS.NAME, data.name);
      localStorage.setItem(AUTH_KEYS.MLX_NAME, data.name);
    }

    const contactNumber = data.number || data.phone;
    if (contactNumber) {
      sessionStorage.setItem(AUTH_KEYS.NUMBER, contactNumber);
      sessionStorage.setItem(AUTH_KEYS.PHONE, contactNumber);
      sessionStorage.setItem(AUTH_KEYS.MLX_PHONE, contactNumber);
      localStorage.setItem(AUTH_KEYS.NUMBER, contactNumber);
      localStorage.setItem(AUTH_KEYS.PHONE, contactNumber);
      localStorage.setItem(AUTH_KEYS.MLX_PHONE, contactNumber);
    }

    if (data.shop) {
      const serialized = JSON.stringify(data.shop);
      sessionStorage.setItem(AUTH_KEYS.ACTIVE_SHOP, serialized);
      localStorage.setItem(AUTH_KEYS.ACTIVE_SHOP, serialized);
    }

    if (data.user) {
      const serialized = JSON.stringify(data.user);
      sessionStorage.setItem(AUTH_KEYS.ACTIVE_USER, serialized);
      localStorage.setItem(AUTH_KEYS.ACTIVE_USER, serialized);
    }
  } catch (err) {
    console.warn('Failed to save auth session:', err);
  }
}

/**
 * Retrieve auth token (checks sessionStorage first, then localStorage fallback)
 */
export function getAuthToken(): string | null {
  if (!isBrowser) return null;
  return (
    sessionStorage.getItem(AUTH_KEYS.TOKEN) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_TOKEN) ||
    localStorage.getItem(AUTH_KEYS.TOKEN) ||
    localStorage.getItem(AUTH_KEYS.MLX_TOKEN)
  );
}

/**
 * Retrieve user/seller role ('seller' | 'customer' | 'admin' | null)
 */
export function getAuthRole(): 'seller' | 'customer' | 'admin' | null {
  if (!isBrowser) return null;
  const role =
    sessionStorage.getItem(AUTH_KEYS.ROLE) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_ROLE) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_AUTH_ROLE) ||
    localStorage.getItem(AUTH_KEYS.ROLE) ||
    localStorage.getItem(AUTH_KEYS.MLX_ROLE) ||
    localStorage.getItem(AUTH_KEYS.MLX_AUTH_ROLE);

  if (role === 'seller' || role === 'customer' || role === 'admin') {
    return role;
  }
  return null;
}

/**
 * Retrieve user/seller ID
 */
export function getAuthUserId(): string | null {
  if (!isBrowser) return null;
  return (
    sessionStorage.getItem(AUTH_KEYS.ID) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_USER_ID) ||
    localStorage.getItem(AUTH_KEYS.ID) ||
    localStorage.getItem(AUTH_KEYS.MLX_USER_ID)
  );
}

/**
 * Retrieve user/seller name
 */
export function getAuthUserName(): string | null {
  if (!isBrowser) return null;
  return (
    sessionStorage.getItem(AUTH_KEYS.NAME) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_NAME) ||
    localStorage.getItem(AUTH_KEYS.NAME) ||
    localStorage.getItem(AUTH_KEYS.MLX_NAME)
  );
}

/**
 * Retrieve user/seller phone number
 */
export function getAuthUserNumber(): string | null {
  if (!isBrowser) return null;
  return (
    sessionStorage.getItem(AUTH_KEYS.NUMBER) ||
    sessionStorage.getItem(AUTH_KEYS.PHONE) ||
    sessionStorage.getItem(AUTH_KEYS.MLX_PHONE) ||
    localStorage.getItem(AUTH_KEYS.NUMBER) ||
    localStorage.getItem(AUTH_KEYS.PHONE) ||
    localStorage.getItem(AUTH_KEYS.MLX_PHONE)
  );
}

export const getAuthUserPhone = getAuthUserNumber;

/**
 * Retrieve active shop from session
 */
export function getActiveShopSession(): any | null {
  if (!isBrowser) return null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEYS.ACTIVE_SHOP) || localStorage.getItem(AUTH_KEYS.ACTIVE_SHOP);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieve active customer user from session
 */
export function getActiveUserSession(): any | null {
  if (!isBrowser) return null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEYS.ACTIVE_USER) || localStorage.getItem(AUTH_KEYS.ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieve full auth session data bundle
 */
export function getAuthSessionData(): AuthSessionData {
  return {
    token: getAuthToken(),
    role: getAuthRole(),
    id: getAuthUserId(),
    name: getAuthUserName(),
    number: getAuthUserNumber(),
    phone: getAuthUserPhone(),
    shop: getActiveShopSession(),
    user: getActiveUserSession(),
  };
}

/**
 * Clear all login and session storage data upon logout
 */
export function clearAuthSession(): void {
  if (!isBrowser) return;
  try {
    const keysToRemove = [
      AUTH_KEYS.ROLE,
      AUTH_KEYS.ID,
      AUTH_KEYS.TOKEN,
      AUTH_KEYS.NAME,
      AUTH_KEYS.NUMBER,
      AUTH_KEYS.PHONE,
      AUTH_KEYS.MLX_TOKEN,
      AUTH_KEYS.MLX_ROLE,
      AUTH_KEYS.MLX_AUTH_ROLE,
      AUTH_KEYS.MLX_USER_ID,
      AUTH_KEYS.MLX_NAME,
      AUTH_KEYS.MLX_PHONE,
      AUTH_KEYS.ACTIVE_SHOP,
      AUTH_KEYS.ACTIVE_USER,
    ];

    keysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn('Failed to clear auth session:', err);
  }
}
