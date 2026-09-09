import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Shop, User } from '../types';

interface AuthState {
  activeShop: Shop | null;
  activeUser: User | null;
  showAuthModal: boolean;
  authTab: 'login' | 'register';
  authRole: 'customer' | 'seller';
}

const getInitialActiveShop = (): Shop | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_active_shop');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

const getInitialActiveUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_active_user');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

const getInitialAuthRole = (): 'customer' | 'seller' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_auth_role');
    return (saved === 'seller' || saved === 'customer') ? saved : 'customer';
  }
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
          localStorage.setItem('mlx_active_shop', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('mlx_active_shop');
        }
      }
    },
    setActiveUser(state, action: PayloadAction<User | null>) {
      state.activeUser = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('mlx_active_user', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('mlx_active_user');
        }
      }
    },
    setAuthRole(state, action: PayloadAction<'customer' | 'seller'>) {
      state.authRole = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_auth_role', action.payload);
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

export const { setActiveShop, setActiveUser, setAuthRole, setShowAuthModal, setAuthTab } = authSlice.actions;
export default authSlice.reducer;
