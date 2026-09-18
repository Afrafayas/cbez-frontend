import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Shop, Lead, SubscriptionPlan } from '../types';
import { INITIAL_SHOPS, INITIAL_PRODUCTS, INITIAL_LEADS, INITIAL_SUBSCRIPTION_PLANS } from '../data/mockData';

interface ProductsState {
  items: Product[];
  shops: Shop[];
  leads: Lead[];
  subscriptionPlans: SubscriptionPlan[];
  selectedProduct: Product | null;
  showAddEditModal: boolean;
  productToEdit: Product | null;
}

const getInitialShops = (): Shop[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_shops');
    return saved ? JSON.parse(saved) : INITIAL_SHOPS;
  }
  return INITIAL_SHOPS;
};

const getInitialProducts = (): Product[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  }
  return INITIAL_PRODUCTS;
};

const getInitialLeads = (): Lead[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  }
  return INITIAL_LEADS;
};

const getInitialPlans = (): SubscriptionPlan[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mlx_subscription_plans');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_PLANS;
  }
  return INITIAL_SUBSCRIPTION_PLANS;
};

const initialState: ProductsState = {
  items: getInitialProducts(),
  shops: getInitialShops(),
  leads: getInitialLeads(),
  subscriptionPlans: getInitialPlans(),
  selectedProduct: null,
  showAddEditModal: false,
  productToEdit: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addShop(state, action: PayloadAction<Shop>) {
      state.shops.push(action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_shops', JSON.stringify(state.shops));
      }
    },
    updateShop(state, action: PayloadAction<Shop>) {
      state.shops = state.shops.map(s => s.id === action.payload.id ? action.payload : s);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_shops', JSON.stringify(state.shops));
      }
    },
    addProduct(state, action: PayloadAction<Product>) {
      const exists = state.items.some(p => p.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mlx_products', JSON.stringify(state.items));
        }
      }
    },
    editProduct(state, action: PayloadAction<Product>) {
      state.items = state.items.map(p => p.id === action.payload.id ? action.payload : p);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_products', JSON.stringify(state.items));
      }
      if (state.selectedProduct && state.selectedProduct.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    },
    deleteProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_products', JSON.stringify(state.items));
      }
    },
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
    },
    setShowAddEditModal(state, action: PayloadAction<boolean>) {
      state.showAddEditModal = action.payload;
    },
    setProductToEdit(state, action: PayloadAction<Product | null>) {
      state.productToEdit = action.payload;
    },
    addLead(state, action: PayloadAction<Lead>) {
      state.leads.unshift(action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_leads', JSON.stringify(state.leads));
      }
    },
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
    },
    setShops(state, action: PayloadAction<Shop[]>) {
      const shopMap = new Map<string, Shop>();
      INITIAL_SHOPS.forEach(s => shopMap.set(String(s.id), s));
      (action.payload || []).forEach(s => shopMap.set(String(s.id), s));
      state.shops = Array.from(shopMap.values());
    },
    setLeads(state, action: PayloadAction<Lead[]>) {
      state.leads = action.payload;
    },
    setSubscriptionPlans(state, action: PayloadAction<SubscriptionPlan[]>) {
      state.subscriptionPlans = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    addSubscriptionPlan(state, action: PayloadAction<SubscriptionPlan>) {
      state.subscriptionPlans.push(action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    updateSubscriptionPlan(state, action: PayloadAction<SubscriptionPlan>) {
      state.subscriptionPlans = state.subscriptionPlans.map(p => p.id === action.payload.id ? action.payload : p);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    deleteSubscriptionPlan(state, action: PayloadAction<string>) {
      state.subscriptionPlans = state.subscriptionPlans.filter(p => p.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    toggleSubscriptionPlanStatus(state, action: PayloadAction<string>) {
      state.subscriptionPlans = state.subscriptionPlans.map(p => {
        if (p.id === action.payload) {
          return { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    }
  },
});

export const { 
  addShop, 
  updateShop,
  addProduct, 
  editProduct, 
  deleteProduct, 
  setSelectedProduct, 
  setShowAddEditModal, 
  setProductToEdit,
  addLead,
  setProducts,
  setShops,
  setLeads,
  setSubscriptionPlans,
  addSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanStatus
} = productsSlice.actions;

export default productsSlice.reducer;
