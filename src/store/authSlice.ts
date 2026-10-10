import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Shop, User } from '../types';
import {
  getActiveShopSession,
  getActiveUserSession,
  getAuthRole,
  saveAuthSession,
  clearAuthSession,
  AUTH_KEYS,
} from '../utils/authStorage';

interface AuthState {
  activeShop: Shop | null;
  activeUser: User | null;
  showAuthModal: boolean;
  authTab: 'login' | 'register';
  authRole: 'customer' | 'seller' | 'admin';
}

const getInitialActiveShop = (): Shop | null => {
  return getActiveShopSession();
};

const getInitialActiveUser = (): User | null => {
  return getActiveUserSession();
};

const getInitialAuthRole = (): 'customer' | 'seller' | 'admin' => {
  const role = getAuthRole();
  if (role === 'seller' || role === 'customer' || role === 'admin') return role;
  const shop = getInitialActiveShop();
  if (shop) return 'seller';
  return 'customer';
};

const initialState: AuthState = {
  activeShop: getInitialActiveShop(),
  activeUser: getInitialActiveUser(),
  showAuthModal: false,
  authTab: 'login',
  authRole: getInitialAuthRole(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setActiveShop(state, action: PayloadAction<Shop | null>) {
      state.activeShop = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          saveAuthSession({
            role: 'seller',
            shop: action.payload,
            id: action.payload.ownerId || action.payload.id,
            name: action.payload.name || action.payload.ownerName,
            number: action.payload.phone || action.payload.whatsapp,
            phone: action.payload.phone || action.payload.whatsapp,
          });
        } else {
          sessionStorage.removeItem(AUTH_KEYS.ACTIVE_SHOP);
          localStorage.removeItem(AUTH_KEYS.ACTIVE_SHOP);
        }
      }
    },
    setActiveUser(state, action: PayloadAction<User | null>) {
      state.activeUser = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          const userRole = (action.payload as any)?.role || state.authRole || 'customer';
          saveAuthSession({
            role: userRole,
            user: action.payload,
            id: action.payload.id,
            name: action.payload.name,
            number: action.payload.phone,
            phone: action.payload.phone,
          });
        } else {
          sessionStorage.removeItem(AUTH_KEYS.ACTIVE_USER);
          localStorage.removeItem(AUTH_KEYS.ACTIVE_USER);
        }
      }
    },
    setAuthRole(state, action: PayloadAction<'customer' | 'seller' | 'admin'>) {
      state.authRole = action.payload;
      if (typeof window !== 'undefined') {
        saveAuthSession({ role: action.payload });
      }
    },
    logout(state) {
      state.activeShop = null;
      state.activeUser = null;
      state.authRole = 'customer';
      if (typeof window !== 'undefined') {
        clearAuthSession();
      }
    },
    setShowAuthModal(state, action: PayloadAction<boolean>) {
      state.showAuthModal = action.payload;
    },
    setAuthTab(state, action: PayloadAction<'login' | 'register'>) {
      state.authTab = action.payload;
    },
  },
});

export const { setActiveShop, setActiveUser, setAuthRole, logout, setShowAuthModal, setAuthTab } = authSlice.actions;
export default authSlice.reducer;
