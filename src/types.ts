export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  category: string;
  verified: boolean;
  rating: number;
  joinedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  shopId: string;
  productId?: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  contactType: 'call' | 'whatsapp';
  createdAt: string;
}

export interface NetworkInquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  category: string;
  gadgetNeeded: string;
  targetBudget?: number;
  notes?: string;
  createdAt: string;
  userId?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  offerPrice?: number;
  stock: number;
  shopId: string;
  specs: Record<string, string>;
  images?: string[];
  storage?: string;
  ram?: string;
  batteryHealth?: string;
  condition?: string;
  warranty?: string;
  color?: string;
  simType?: string;
  network?: string;
  originalBill?: boolean;
  accessories?: string[];
  purchasedFromAmazon?: boolean;
  isAmazonRefurbished?: boolean;
  isSoldOut?: boolean;
  deviceAge?: string;
  imeiNumber?: string;
  documents?: string[];
}

export interface SourcingToast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface ReduxState {
  auth: {
    activeShop: Shop | null;
    activeUser: User | null;
    showAuthModal: boolean;
    authTab: 'login' | 'register';
    authRole: 'customer' | 'seller';
  };
  products: {
    items: Product[];
    shops: Shop[];
    leads: Lead[];
    selectedProduct: Product | null;
    showAddEditModal: boolean;
    productToEdit: Product | null;
  };
  filters: {
    searchQuery: string;
    searchCategory: string;
    selectedCategory: string;
    filterBrand: string;
    filterMinPrice: string;
    filterMaxPrice: string;
    filterInStockOnly: boolean;
    filterCity: string;
    filterMaxBudget: string;
    sortBy: 'featured' | 'price-asc' | 'price-desc' | 'stock';
  };
  ui: {
    toasts: SourcingToast[];
    activeView: 'marketplace' | 'seller-dashboard' | 'customer-dashboard';
    dashboardTab: 'listings' | 'profile' | 'leads';
  };
}
