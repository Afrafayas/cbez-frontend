export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  productLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopProfileCompletion {
  completionPercentage: number;
  completedFields: string[];
  missingFields: string[];
  totalFieldsCount: number;
  completedFieldsCount: number;
  isFullyCompleted: boolean;
}

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
  subscriptionPlanId?: string;
  district?: string;
  country?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  profileImage?: string;
  gstNumber?: string;
  websiteUrl?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: string;
  businessDescription?: string;
  alternatePhone?: string;
  email?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  profileCompletion?: ShopProfileCompletion;
}

export function calculateShopProfileCompletion(shop?: Partial<Shop> | null, ownerEmail?: string): ShopProfileCompletion {
  const allMandatoryLabels = [
    'Owner Name', 'Profile Image', 'Shop Name', 'Address', 'City',
    'District', 'Country', 'Email Address', 'Aadhaar Number',
    'PAN Number', 'Subscription Plan', 'Latitude', 'Longitude'
  ];

  if (!shop) {
    return {
      completionPercentage: 0,
      completedFields: [],
      missingFields: allMandatoryLabels,
      totalFieldsCount: 13,
      completedFieldsCount: 0,
      isFullyCompleted: false
    };
  }

  const emailVal = shop.email || ownerEmail;

  const mandatoryFields = [
    { key: 'ownerName', label: 'Owner Name', isCompleted: Boolean(shop.ownerName && shop.ownerName.trim()) },
    { key: 'profileImage', label: 'Profile Image', isCompleted: Boolean(shop.profileImage && shop.profileImage.trim()) },
    { key: 'name', label: 'Shop Name', isCompleted: Boolean(shop.name && shop.name.trim()) },
    { key: 'address', label: 'Address', isCompleted: Boolean(shop.address && shop.address.trim()) },
    { key: 'city', label: 'City', isCompleted: Boolean(shop.city && shop.city.trim()) },
    { key: 'district', label: 'District', isCompleted: Boolean(shop.district && shop.district.trim()) },
    { key: 'country', label: 'Country', isCompleted: Boolean(shop.country && shop.country.trim()) },
    { key: 'email', label: 'Email Address', isCompleted: Boolean(emailVal && emailVal.trim()) },
    { key: 'aadhaarNumber', label: 'Aadhaar Number', isCompleted: Boolean(shop.aadhaarNumber && shop.aadhaarNumber.trim()) },
    { key: 'panNumber', label: 'PAN Number', isCompleted: Boolean(shop.panNumber && shop.panNumber.trim()) },
    { key: 'subscriptionPlanId', label: 'Subscription Plan', isCompleted: Boolean(shop.subscriptionPlanId && shop.subscriptionPlanId.trim()) },
    { key: 'latitude', label: 'Latitude', isCompleted: shop.latitude !== null && shop.latitude !== undefined && !isNaN(Number(shop.latitude)) },
    { key: 'longitude', label: 'Longitude', isCompleted: shop.longitude !== null && shop.longitude !== undefined && !isNaN(Number(shop.longitude)) },
  ];

  const completedFields: string[] = [];
  const missingFields: string[] = [];

  for (const item of mandatoryFields) {
    if (item.isCompleted) {
      completedFields.push(item.label);
    } else {
      missingFields.push(item.label);
    }
  }

  const completedFieldsCount = completedFields.length;
  const totalFieldsCount = mandatoryFields.length;
  const completionPercentage = Math.round((completedFieldsCount / totalFieldsCount) * 100);

  return {
    completionPercentage,
    completedFields,
    missingFields,
    totalFieldsCount,
    completedFieldsCount,
    isFullyCompleted: completionPercentage === 100
  };
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
    subscriptionPlans: SubscriptionPlan[];
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
