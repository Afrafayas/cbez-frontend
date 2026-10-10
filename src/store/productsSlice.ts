import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Shop, Lead, SubscriptionPlan, Category } from '../types';
import { INITIAL_SHOPS, INITIAL_PRODUCTS, INITIAL_LEADS, INITIAL_SUBSCRIPTION_PLANS } from '../data/mockData';
import { getDeletedProductIds, addDeletedProductId, removeDeletedProductId } from '../utils/subscriptionUtils';
import { getItem, setItem } from '../utils/storage';

interface ProductsState {
  items: Product[];
  shops: Shop[];
  leads: Lead[];
  subscriptionPlans: SubscriptionPlan[];
  categories: Category[];
  selectedProduct: Product | null;
  showAddEditModal: boolean;
  productToEdit: Product | null;
}

const getInitialShops = (): Shop[] => {
  if (typeof window !== 'undefined') {
    const saved = getItem('mlx_shops');
    return saved ? JSON.parse(saved) : INITIAL_SHOPS;
  }
  return INITIAL_SHOPS;
};

const getInitialProducts = (): Product[] => {
  if (typeof window !== 'undefined') {
    const saved = getItem('mlx_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  }
  return INITIAL_PRODUCTS;
};

const getInitialLeads = (): Lead[] => {
  if (typeof window !== 'undefined') {
    const saved = getItem('mlx_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  }
  return INITIAL_LEADS;
};

const getInitialPlans = (): SubscriptionPlan[] => {
  if (typeof window !== 'undefined') {
    const saved = getItem('mlx_subscription_plans');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_PLANS;
  }
  return INITIAL_SUBSCRIPTION_PLANS;
};

const getInitialCategories = (): Category[] => {
  if (typeof window !== 'undefined') {
    const saved = getItem('mlx_categories');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

const initialState: ProductsState = {
  items: getInitialProducts(),
  shops: getInitialShops(),
  leads: getInitialLeads(),
  subscriptionPlans: getInitialPlans(),
  categories: getInitialCategories(),
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
        setItem('mlx_shops', JSON.stringify(state.shops));
      }
    },
    updateShop(state, action: PayloadAction<Shop>) {
      state.shops = state.shops.map(s => s.id === action.payload.id ? action.payload : s);
      if (typeof window !== 'undefined') {
        setItem('mlx_shops', JSON.stringify(state.shops));
      }
    },
    addProduct(state, action: PayloadAction<Product>) {
      if (action.payload && action.payload.id) {
        removeDeletedProductId(action.payload.id);
      }
      const exists = state.items.some(p => p.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      } else {
        state.items = state.items.map(p => p.id === action.payload.id ? action.payload : p);
      }
      if (typeof window !== 'undefined') {
        setItem('mlx_products', JSON.stringify(state.items));
      }
    },
    editProduct(state, action: PayloadAction<Product>) {
      state.items = state.items.map(p => p.id === action.payload.id ? action.payload : p);
      if (typeof window !== 'undefined') {
        setItem('mlx_products', JSON.stringify(state.items));
      }
      if (state.selectedProduct && state.selectedProduct.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    },
    deleteProduct(state, action: PayloadAction<string>) {
      if (action.payload) {
        addDeletedProductId(action.payload);
      }
      state.items = state.items.filter(p => String(p.id) !== String(action.payload));
      if (typeof window !== 'undefined') {
        setItem('mlx_products', JSON.stringify(state.items));
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
        setItem('mlx_leads', JSON.stringify(state.leads));
      }
    },
    setProducts(state, action: PayloadAction<Product[]>) {
      const deletedIds = getDeletedProductIds();
      const mockIds = new Set(INITIAL_PRODUCTS.map(p => String(p.id)));
      const liveList = action.payload || [];
      const hasLiveProducts = liveList.length > 0;

      const map = new Map<string, Product>();
      (state.items || []).forEach(p => {
        if (p && p.id && !deletedIds.has(String(p.id))) {
          const isMock = mockIds.has(String(p.id));
          if (!hasLiveProducts || !isMock) {
            map.set(String(p.id), p);
          }
        }
      });
      liveList.forEach(p => {
        if (p && p.id && !deletedIds.has(String(p.id))) {
          map.set(String(p.id), p);
        }
      });
      state.items = Array.from(map.values());
      if (typeof window !== 'undefined') {
        setItem('mlx_products', JSON.stringify(state.items));
      }
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
        setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    addSubscriptionPlan(state, action: PayloadAction<SubscriptionPlan>) {
      state.subscriptionPlans.push(action.payload);
      if (typeof window !== 'undefined') {
        setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    updateSubscriptionPlan(state, action: PayloadAction<SubscriptionPlan>) {
      state.subscriptionPlans = state.subscriptionPlans.map(p => p.id === action.payload.id ? action.payload : p);
      if (typeof window !== 'undefined') {
        setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    deleteSubscriptionPlan(state, action: PayloadAction<string>) {
      state.subscriptionPlans = state.subscriptionPlans.filter(p => p.id !== action.payload);
      if (typeof window !== 'undefined') {
        setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
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
        setItem('mlx_subscription_plans', JSON.stringify(state.subscriptionPlans));
      }
    },
    setCategories(state, action: PayloadAction<Category[]>) {
      state.categories = action.payload;
      if (typeof window !== 'undefined') {
        setItem('mlx_categories', JSON.stringify(state.categories));
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
  toggleSubscriptionPlanStatus,
  setCategories
} = productsSlice.actions;

export default productsSlice.reducer;
