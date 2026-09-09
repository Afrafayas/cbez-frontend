import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SourcingToast } from '../types';

interface UiState {
  toasts: SourcingToast[];
  activeView: 'marketplace' | 'seller-dashboard' | 'customer-dashboard';
  dashboardTab: 'listings' | 'profile' | 'leads' | 'followers';
}

const initialState: UiState = {
  toasts: [],
  activeView: 'marketplace',
  dashboardTab: 'listings',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<{ message: string; type: 'info' | 'success' | 'warning' }>) {
      const id = Date.now();
      state.toasts.push({
        id,
        message: action.payload.message,
        type: action.payload.type,
      });
    },
    removeToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    setActiveView(state, action: PayloadAction<'marketplace' | 'seller-dashboard' | 'customer-dashboard'>) {
      state.activeView = action.payload;
    },
    setDashboardTab(state, action: PayloadAction<'listings' | 'profile' | 'leads' | 'followers'>) {
      state.dashboardTab = action.payload;
    },
  },
});

export const { addToast, removeToast, setActiveView, setDashboardTab } = uiSlice.actions;
export default uiSlice.reducer;
