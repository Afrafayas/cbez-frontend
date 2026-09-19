import { SellerCustomerLogsPage } from './pages/SellerCustomerLogsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { AuthModal } from './components/AuthModal';
import { AddEditProductModal } from './components/AddEditProductModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Footer } from './components/Footer';
import { logActivity, getProducts, getShops, getShopById, getSubscriptionPlans, getShopSubscription, sendLead, getFollowedShops, unfollowShop, getShopFollowers, geocodeAddress, toggleWishlist, getUserWishlist, getWishlistIds, updateUser, createOrUpdateMyShop, getCategories } from './services/apiService';
import { PhoneInputWithCountry } from './components/PhoneInputWithCountry';
import React, { ChangeEvent, FormEvent } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Smartphone,
  Laptop,
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  LogOut,
  LogIn,
  Store,
  X,
  CheckCircle,
  HelpCircle,
  Info,
  Watch,
  Tablet as TabletIcon,
  MessageSquare,
  Tag,
  Clock,
  Calendar,
  Heart,
  Activity
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from './store';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  setActiveShop,
  setActiveUser,
  setAuthRole,
  setShowAuthModal,
  setAuthTab
} from './store/authSlice';
import {
  updateShop,
  editProduct,
  setSelectedProduct,
  setShowAddEditModal,
  setProductToEdit,
  addLead,
  setProducts,
  setShops,
  setSubscriptionPlans,
  setCategories
} from './store/productsSlice';
import {
  setSearchQuery,
  setSelectedCategory,
  setFilterBrand,
  setFilterMinPrice,
  setFilterMaxPrice,
  setFilterInStockOnly,
  setFilterCity,
  setFilterMaxBudget,
  setFilterLocationSearch,
  setFilterVerifiedOnly,
  setFilterMinRating,
  setSortBy,
  clearFilters
} from './store/filtersSlice';
import {
  addToast,
  removeToast,
  setDashboardTab
} from './store/uiSlice';
import { CATEGORIES, CITIES, BUDGET_PRESETS , INITIAL_SHOPS } from './data/mockData';
import { Product, Shop, Lead, User as CustomerUser, calculateShopProfileCompletion } from './types';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  icon?: React.ReactNode;
}

function CustomSelect({ value, onChange, options, placeholder, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  const selectedOption = formattedOptions.find(o => o.value === value) || { label: value || placeholder || "", value };

  return (
    <div className="custom-select-wrapper" ref={dropdownRef}>
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="trigger-content">
          {icon && <span className="trigger-icon">{icon}</span>}
          <span>{selectedOption.label}</span>
        </div>
        <span className="chevron-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          {formattedOptions.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {isSelected && <span className="option-check">✓</span>}
                <span className="option-label">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ToastItemProps {
  toast: {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning';
  };
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${toast.type === 'success' ? 'success' : ''}`}>
      {toast.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
      <span>{toast.message}</span>
      <button className="clear-filter-btn" style={{ marginLeft: '1rem', color: 'white' }} onClick={onClose}>×</button>
    </div>
  );
}

const getFormattedUserName = (user: { name?: string; email?: string } | null): string => {
  if (!user) return '';
  if (user.name && !user.name.includes('@')) return user.name;
  const rawEmail = (user.name && user.name.includes('@')) ? user.name : (user.email || '');
  if (rawEmail.includes('@')) {
    const username = rawEmail.split('@')[0];
    const cleaned = username.replace(/[._-]+/g, ' ').trim();
    if (cleaned) {
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return user.name || 'My Profile';
};

export default function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- REDUX SELECTORS ---
  const { activeShop, activeUser, showAuthModal } = useAppSelector(state => state.auth);
  const { items: products, shops, leads, selectedProduct, showAddEditModal, subscriptionPlans } = useAppSelector(state => state.products);
  const { toasts, dashboardTab } = useAppSelector(state => state.ui);
  const filters = useAppSelector(state => state.filters);
  const storeCategories = useAppSelector(state => state.products.categories);

  const displayCategories = React.useMemo(() => {
    return Array.from(
      new Set([
        'All Categories',
        ...(storeCategories || []).map(c => c.name),
        ...CATEGORIES
      ])
    ).filter(Boolean);
  }, [storeCategories]);

  // --- LIVE BACKEND DATA LOADER ---
  React.useEffect(() => {
    async function loadLiveBackendData() {
      try {
        const liveProducts = await getProducts({
          search: filters.searchQuery,
          category: filters.selectedCategory,
          brand: filters.filterBrand,
          minPrice: filters.filterMinPrice,
          maxPrice: filters.filterMaxPrice,
          city: filters.filterCity,
          sortBy: filters.sortBy,
        });
        const [liveShops, livePlans, liveCats] = await Promise.all([
          getShops().catch(() => []),
          getSubscriptionPlans().catch(() => []),
          getCategories().catch(() => [])
        ]);
        if (livePlans && livePlans.length > 0) {
          dispatch(setSubscriptionPlans(livePlans));
        }
        if (liveCats && liveCats.length > 0) {
          dispatch(setCategories(liveCats));
        }
        if (liveProducts) {
          dispatch(setProducts(liveProducts));
        }
        if (liveShops && liveShops.length > 0) {
          dispatch(setShops(liveShops));
          if (activeShop) {
            const currentLiveShop = liveShops.find(s => s.id === activeShop.id || (s.email && activeShop.email && s.email.toLowerCase() === activeShop.email.toLowerCase()) || (s.name && activeShop.name && s.name.toLowerCase() === activeShop.name.toLowerCase()));
            if (currentLiveShop && (currentLiveShop.verified !== activeShop.verified || currentLiveShop.name !== activeShop.name)) {
              dispatch(setActiveShop(currentLiveShop));
            }
          }
        }
      } catch (err) {
        console.warn('Backend load fallback:', err);
      }
    }
    loadLiveBackendData();
  }, [
    dispatch,
    filters.searchQuery,
    filters.selectedCategory,
    filters.filterBrand,
    filters.filterMinPrice,
    filters.filterMaxPrice,
    filters.filterCity,
    filters.sortBy,
  ]);

  // --- LOCAL COMPONENT STATES (FOR FORM INPUTS) ---
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [logoutConfirmType, setLogoutConfirmType] = React.useState<'seller' | 'customer' | null>(null);
  const [viewingSellerProduct, setViewingSellerProduct] = React.useState<Product | null>(null);
  const [shopFollowers, setShopFollowers] = React.useState<Array<{ id: string; name: string; email?: string; phone?: string; followedAt: string }>>([]);
  const [shopFollowersCount, setShopFollowersCount] = React.useState<number>(0);
  const [shopSubscriptionUsage, setShopSubscriptionUsage] = React.useState<{
    planName: string;
    productLimit: number;
    currentProducts: number;
    remaining: number;
    canAddProduct: boolean;
  } | null>(null);

  React.useEffect(() => {
    async function loadShopSubscription() {
      if (!activeShop?.id) return;
      try {
        const subData = await getShopSubscription(activeShop.id);
        if (subData) {
          setShopSubscriptionUsage(subData.usage || null);
          if (subData.subscription) {
            const currentSubPlanId = activeShop.subscription?.planId;
            const newSubPlanId = subData.subscription.planId;
            if (!activeShop.subscription || currentSubPlanId !== newSubPlanId || !activeShop.subscriptionUsage) {
              dispatch(setActiveShop({
                ...activeShop,
                subscription: subData.subscription,
                subscriptionPlanId: newSubPlanId,
                subscriptionUsage: subData.usage,
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load shop subscription:', err);
      }
    }
    loadShopSubscription();
  }, [activeShop?.id, dispatch]);

  React.useEffect(() => {
    async function fetchFollowers() {
      if (activeShop && dashboardTab === 'followers') {
        const token = localStorage.getItem('mlx_token');
        if (!token) return;
        try {
          const res = await getShopFollowers(token);
          setShopFollowers(res.followers || []);
          setShopFollowersCount(res.count || (res.followers ? res.followers.length : 0));
        } catch (err) {
          console.warn('Failed to load shop followers:', err);
        }
      }
    }
    fetchFollowers();
  }, [activeShop, dashboardTab]);

  const slides = [
    {
      badge: "🔥 Hot Deal of the Week",
      title: "Up to 40% Off on Certified Used iPhones",
      subtext: "Hand-tested Grade A devices with store warranty. Direct deals, zero platform commission.",
      offerText: "Limited stock starting at ₹12,000",
      image: "/images/iphone_17_pro_1.png",
      bgColor: "#111217"
    },
    {
      badge: "💻 Tech For Students",
      title: "Spotless Refurbished MacBooks & Laptops",
      subtext: "Corporate refurbished items. Minimum 3 months seller warranty and fast chargers included.",
      offerText: "Deals starting at ₹18,000",
      image: "/images/macbook_air_m3.png",
      bgColor: "#0f172a"
    },
    {
      badge: "🛡️ MLX Verified Local Stores",
      title: "Buy Directly From Local Dealers Near You",
      subtext: "Pick your city location, click Call/WhatsApp to inspect before you buy. 100% safe store checks.",
      offerText: "Available in Kochi, Calicut, Trivandrum & Thrissur",
      image: "/images/watch_ultra_2.png",
      bgColor: "#022c22"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const isAnyModalActive = Boolean(
    showAuthModal ||
    showAddEditModal ||
    logoutConfirmType !== null
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && logoutConfirmType) {
        setLogoutConfirmType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logoutConfirmType]);

  React.useEffect(() => {
    if (isAnyModalActive) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isAnyModalActive]);

  // Redirect shop owners from marketplace or customer views to seller dashboard
  React.useEffect(() => {
    if (activeShop && (location.pathname === '/' || location.pathname === '/customer-dashboard' || location.pathname === '/wishlist')) {
      navigate('/seller-dashboard', { replace: true });
    }
  }, [activeShop, location.pathname, navigate]);

  // customer dashboard sub-navigation tab state
  const [customerTab, setCustomerTab] = React.useState<'inquiries' | 'following' | 'profile' | 'wishlist'>('inquiries');
  const [followedShops, setFollowedShops] = React.useState<Shop[]>([]);

  // Wishlist states
  const [wishlistProductIds, setWishlistProductIds] = React.useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = React.useState<Array<Product & { shop?: Shop; wishlistedAt?: string }>>([]);

  // customer profile editor form inputs state
  const [custProfileForm, setCustProfileForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    latitude: undefined as number | undefined | null,
    longitude: undefined as number | undefined | null,
    city: ''
  });

  // --- Seller Dashboard Pagination & Search State ---
  const [sellerListPage, setSellerListPage] = React.useState<number>(1);
  const [sellerListPerPage, setSellerListPerPage] = React.useState<number>(5);
  const [sellerSearchQuery, setSellerSearchQuery] = React.useState<string>('');

  // --- Marketplace Catalog Pagination State ---
  const [catalogPage, setCatalogPage] = React.useState<number>(1);
  const [catalogPerPage, setCatalogPerPage] = React.useState<number>(8);

  // --- Customer Dashboard Pagination States ---
  const [custInquiriesPage, setCustInquiriesPage] = React.useState<number>(1);
  const [custInquiriesPerPage, setCustInquiriesPerPage] = React.useState<number>(5);

  React.useEffect(() => {
    setSellerListPage(1);
  }, [sellerSearchQuery, activeShop]);

  React.useEffect(() => {
    setCatalogPage(1);
  }, [filters]);

  React.useEffect(() => {
    setCustInquiriesPage(1);
  }, [customerTab]);

  const normalizeWishlistItems = (rawList: any[]): Array<Product & { shop?: Shop; wishlistedAt?: string }> => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item: any) => {
      if (item && item.product) {
        return {
          ...item.product,
          shop: item.product.shop || item.shop || shops.find((s: Shop) => s.id === item.product.shopId),
          wishlistedAt: item.createdAt || item.wishlistedAt,
          wishlistRecordId: item.id
        };
      }
      if (item && item.id) {
        return {
          ...item,
          shop: item.shop || shops.find((s: Shop) => s.id === item.shopId),
        };
      }
      return item;
    }).filter(Boolean);
  };

  // Sync profile editor fields & load customer dashboard data & wishlist when logged in
  React.useEffect(() => {
    if (activeUser) {
      setCustProfileForm({
        name: activeUser.name,
        email: activeUser.email,
        phone: activeUser.phone,
        latitude: activeUser.latitude ?? null,
        longitude: activeUser.longitude ?? null,
        city: ''
      });
    }

    async function loadCustomerData() {
      const token = localStorage.getItem('mlx_token');
      if (activeUser && token) {
        try {
          const shopsData = await getFollowedShops(token);
          setFollowedShops(shopsData);
        } catch (err) {
          console.warn('Failed to load followed shops:', err);
        }

        try {
          const [res, ids] = await Promise.all([
            getUserWishlist(token),
            getWishlistIds(token).catch(() => [] as string[])
          ]);
          const rawItems = res.items || res.products || [];
          const normalized = normalizeWishlistItems(rawItems);
          setWishlistItems(normalized);
          const computedIds = ids && ids.length > 0 ? ids : normalized.map((i: any) => i.id);
          setWishlistProductIds(computedIds);
        } catch (err) {
          console.warn('Failed to load user wishlist:', err);
        }
      } else {
        setWishlistItems([]);
        setWishlistProductIds([]);
      }
    }
    loadCustomerData();
  }, [activeUser, customerTab]);

  const handleToggleWishlist = async (product: Product) => {
    const token = localStorage.getItem('mlx_token');
    if (!activeUser || !token) {
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(true));
      triggerToast("Please log in to add to your wishlist", "info");
      return;
    }

    const isCurrentlyWishlisted = wishlistProductIds.includes(product.id);

    // Optimistic UI state update
    if (isCurrentlyWishlisted) {
      setWishlistProductIds(prev => prev.filter(id => id !== product.id));
      setWishlistItems(prev => prev.filter(item => item.id !== product.id));
      triggerToast(`Removed "${product.name}" from wishlist`, "info");
    } else {
      setWishlistProductIds(prev => [...prev, product.id]);
      const shop = getSellerShop(product.shopId);
      setWishlistItems(prev => [{ ...product, shop, wishlistedAt: new Date().toISOString() }, ...prev]);
      triggerToast(`Added "${product.name}" to wishlist ❤️`, "success");
    }

    try {
      await toggleWishlist(product.id, token);
      const freshRes = await getUserWishlist(token);
      const rawItems = freshRes.items || freshRes.products || [];
      const normalized = normalizeWishlistItems(rawItems);
      setWishlistItems(normalized);
      const freshIds = normalized.map((i: any) => i.id);
      setWishlistProductIds(freshIds);
    } catch (err: any) {
      triggerToast(err.message || "Failed to update wishlist", "warning");
      const freshRes = await getUserWishlist(token).catch(() => null);
      if (freshRes) {
        const rawItems = freshRes.items || freshRes.products || [];
        const normalized = normalizeWishlistItems(rawItems);
        setWishlistItems(normalized);
        setWishlistProductIds(normalized.map((i: any) => i.id));
      }
    }
  };

  const handleUnfollowShopInDash = async (shopId: string) => {
    const token = localStorage.getItem('mlx_token');
    if (!token) return;
    try {
      await unfollowShop(shopId, token);
      setFollowedShops(prev => prev.filter(s => s.id !== shopId));
      triggerToast('Unfollowed store successfully', 'info');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to unfollow shop', 'warning');
    }
  };

  const [profileForm, setProfileForm] = React.useState({
    name: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    category: '',
    profileImage: '',
    district: '',
    country: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    gstNumber: '',
    websiteUrl: '',
    businessHours: '',
    businessDescription: '',
    alternatePhone: ''
  });

  const [isProfileLocating, setIsProfileLocating] = React.useState(false);

  const handleProfileLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Please select a valid image file (JPG, PNG, WEBP)', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const tempImg = new Image();
      tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let w = tempImg.width;
        let h = tempImg.height;

        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(tempImg, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setProfileForm(prev => ({ ...prev, profileImage: compressedDataUrl }));
        triggerToast('Shop Logo / Owner Photo updated successfully!', 'success');
      };
      tempImg.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Sync profile form when dashboard tab loads or activeShop changes
  React.useEffect(() => {
    if (activeShop) {
      setProfileForm({
        name: activeShop.name || '',
        ownerName: activeShop.ownerName || '',
        phone: activeShop.phone || '',
        whatsapp: activeShop.whatsapp || '',
        address: activeShop.address || '',
        city: activeShop.city || '',
        category: activeShop.category || 'Mobiles & Tablets',
        profileImage: activeShop.profileImage || '',
        district: activeShop.district || 'Ernakulam',
        country: activeShop.country || 'India',
        email: activeShop.email || activeUser?.email || '',
        aadhaarNumber: activeShop.aadhaarNumber || '',
        panNumber: activeShop.panNumber || '',
        latitude: activeShop.latitude,
        longitude: activeShop.longitude,
        gstNumber: activeShop.gstNumber || '',
        websiteUrl: activeShop.websiteUrl || '',
        businessHours: activeShop.businessHours || '',
        businessDescription: activeShop.businessDescription || '',
        alternatePhone: activeShop.alternatePhone || ''
      });
    }
  }, [activeShop, activeUser, dashboardTab]);

  React.useEffect(() => {

  }, [selectedProduct]);

  // --- HELPERS ---
  const getSellerShop = (shopId: string, productShop?: Shop): Shop => {
    if (productShop && (productShop.name || productShop.id)) {
      return productShop;
    }
    const found = shops.find(s => String(s.id) === String(shopId) || String((s as any)._id) === String(shopId));
    if (found) return found;

    const initialMatch = INITIAL_SHOPS.find(s => String(s.id) === String(shopId));
    if (initialMatch) return initialMatch;

    if (activeShop && (String(activeShop.id) === String(shopId) || String((activeShop as any)._id) === String(shopId))) {
      return activeShop;
    }

    return {
      id: shopId || "shop-1",
      name: "Kochi Gadgets World",
      ownerName: "Dealer",
      phone: "+91 98765 43210",
      whatsapp: "919876543210",
      address: "Shop 42, Ground Floor, Penta Menaka",
      city: "Kochi",
      category: "Mobiles & Tablets",
      verified: true,
      rating: 4.8,
      joinedDate: "Verified Partner"
    };
  };

  // Helper for flexible category matching (handles exact match, slugs, and legacy category aliases)
  const isCategoryMatch = (prodCat?: string, filterCat?: string) => {
    if (!filterCat || filterCat === 'All Categories' || filterCat === 'All') return true;
    if (!prodCat) return false;
    const p = prodCat.toLowerCase().trim();
    const f = filterCat.toLowerCase().trim();
    if (p === f) return true;
    if ((f.includes('mobile') || f.includes('smartphone')) && (p.includes('mobile') || p.includes('smartphone'))) return true;
    if ((f.includes('laptop') || f.includes('macbook')) && (p.includes('laptop') || p.includes('macbook'))) return true;
    if ((f.includes('watch') || f.includes('smartwatch')) && (p.includes('watch') || p.includes('smartwatch'))) return true;
    if ((f.includes('audio') || f.includes('earbud') || f.includes('headphone')) && (p.includes('audio') || p.includes('earbud') || p.includes('headphone'))) return true;
    if ((f.includes('camera') || f.includes('photo')) && (p.includes('camera') || p.includes('photo'))) return true;
    if ((f.includes('gaming') || f.includes('console')) && (p.includes('gaming') || p.includes('console'))) return true;
    if (f.includes('tablet') && p.includes('tablet')) return true;
    if (f.includes('accessories') && p.includes('accessories')) return true;
    return p.includes(f) || f.includes(p);
  };

  // --- FILTER & SORT LOGIC ---
  const filteredProducts = products.filter(product => {
    const seller = getSellerShop(product.shopId);

    // 1. Multi-word keyword search with whitespace normalization
    const rawQuery = filters.searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    const keywords = rawQuery ? rawQuery.split(' ') : [];
    const productSearchText = `${product.name} ${product.brand} ${product.category} ${product.description} ${JSON.stringify(product.specs || {})}`.toLowerCase();
    const matchesQuery = keywords.length === 0 || keywords.every(kw => productSearchText.includes(kw));

    // 2. Search category dropdown
    const matchesSearchCat = isCategoryMatch(product.category, filters.searchCategory);

    // 3. Quick-bar category select
    const matchesQuickCat = isCategoryMatch(product.category, filters.selectedCategory);

    // 4. Sidebar Brand Filter
    const matchesBrand = !filters.filterBrand ||
      product.brand.toLowerCase() === filters.filterBrand.toLowerCase();

    // 5. Sidebar Price Range Filter
    const min = filters.filterMinPrice ? parseFloat(filters.filterMinPrice) : 0;
    const max = filters.filterMaxPrice ? parseFloat(filters.filterMaxPrice) : Infinity;
    const matchesPrice = product.price >= min && product.price <= max;

    // 6. Sidebar Stock Availability Filter
    const matchesStock = !filters.filterInStockOnly || product.stock > 0;

    // 7. B2C City Location Filter (Bypassed if typing a specific product search query)
    const matchesCity = !!rawQuery || filters.filterCity === 'All Cities' ||
      seller.city.toLowerCase() === filters.filterCity.toLowerCase();

    // 8. B2C Budget Preset Filter
    let matchesBudget = true;
    if (filters.filterMaxBudget !== 'Any Budget') {
      const limit = parseInt(filters.filterMaxBudget.replace(/\D/g, ''), 10);
      if (!isNaN(limit)) {
        matchesBudget = product.price <= limit;
      }
    }

    // 9. Location text search (City name, landmarks, or street address keywords)
    const locQuery = filters.filterLocationSearch.toLowerCase().trim();
    const matchesLocation = !locQuery ||
      seller.city.toLowerCase().includes(locQuery) ||
      seller.address.toLowerCase().includes(locQuery);

    // 10. Verified Shop Filter
    const matchesVerified = !filters.filterVerifiedOnly || seller.verified;

    // 11. Minimum Shop Rating Filter
    const minRating = parseFloat(filters.filterMinRating) || 0;
    const matchesRating = seller.rating >= minRating;

    return matchesQuery &&
      matchesSearchCat &&
      matchesQuickCat &&
      matchesBrand &&
      matchesPrice &&
      matchesStock &&
      matchesCity &&
      matchesBudget &&
      matchesLocation &&
      matchesVerified &&
      matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.price - b.price;
    if (filters.sortBy === 'price-desc') return b.price - a.price;
    if (filters.sortBy === 'stock') return b.stock - a.stock;
    if (filters.sortBy === 'rating') {
      const sellerA = getSellerShop(a.shopId);
      const sellerB = getSellerShop(b.shopId);
      return sellerB.rating - sellerA.rating;
    }
    if (filters.sortBy === 'newest') {
      const idA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const idB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return idB - idA;
    }
    if (filters.sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    return 0; // Default Featured
  });

  // Extract unique brands for sidebar filters
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand)));

  // Dynamically extract trending products/models that actually exist in inventory
  const trendingTags = React.useMemo(() => {
    const popularPresets = ['iPhone 15 Pro', 'Galaxy S24', 'iPhone 14', 'AirPods Pro', 'iPad Air', 'Watch Ultra'];
    if (!products || products.length === 0) return popularPresets;

    const extracted: string[] = [];
    const checkList = [
      { key: 'iphone 15 pro max', label: 'iPhone 15 Pro Max' },
      { key: 'iphone 15 pro', label: 'iPhone 15 Pro' },
      { key: 'iphone 15', label: 'iPhone 15' },
      { key: 'iphone 14', label: 'iPhone 14' },
      { key: 'galaxy s24 ultra', label: 'Galaxy S24 Ultra' },
      { key: 'galaxy s24', label: 'Galaxy S24' },
      { key: 'galaxy a55', label: 'Galaxy A55' },
      { key: 'airpods pro', label: 'AirPods Pro' },
      { key: 'watch ultra', label: 'Apple Watch Ultra' },
      { key: 'ipad', label: 'iPad Air' },
      { key: 'wh-1000xm5', label: 'Sony XM5' },
      { key: 'hp pavilion', label: 'HP Pavilion' }
    ];

    for (const item of checkList) {
      const exists = products.some(p =>
        p.name.toLowerCase().includes(item.key) ||
        (p.brand && p.brand.toLowerCase().includes(item.key)) ||
        (p.description && p.description.toLowerCase().includes(item.key))
      );
      if (exists && !extracted.includes(item.label)) {
        extracted.push(item.label);
      }
    }

    if (extracted.length < 4) {
      for (const p of products) {
        const simpleName = p.name.split('(')[0].split('-')[0].trim();
        if (simpleName && !extracted.includes(simpleName)) {
          extracted.push(simpleName);
        }
        if (extracted.length >= 6) break;
      }
    }

    return extracted.length > 0 ? extracted.slice(0, 6) : popularPresets;
  }, [products]);

  // --- HANDLERS ---
  const triggerToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    dispatch(addToast({ message, type }));
  };

  const handleConfirmLogout = () => {
    if (logoutConfirmType === 'seller') {
      localStorage.removeItem('mlx_token');
      localStorage.removeItem('mlx_active_shop');
      localStorage.removeItem('mlx_auth_role');
      dispatch(setActiveShop(null));
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(false));
      triggerToast("Seller logged out successfully.", "info");
      setLogoutConfirmType(null);
      navigate('/');
    } else if (logoutConfirmType === 'customer') {
      localStorage.removeItem('mlx_token');
      localStorage.removeItem('mlx_active_user');
      localStorage.removeItem('mlx_auth_role');
      setWishlistItems([]);
      setWishlistProductIds([]);
      dispatch(setActiveUser(null));
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(false));
      triggerToast("Logged out successfully.", "info");
      setLogoutConfirmType(null);
      navigate('/');
    }
  };

  // --- AUTOMATIC LIVE SYNC FOR SELLER SHOP VERIFICATION STATUS ---
  React.useEffect(() => {
    if (!activeShop?.id) return;

    let isMounted = true;

    const syncLiveShopStatus = async () => {
      try {
        let freshShop = await getShopById(activeShop.id);

        if (!freshShop) {
          const allShops = await getShops().catch(() => []);
          freshShop = allShops.find(s =>
            s.id === activeShop.id ||
            (s.email && activeShop.email && s.email.toLowerCase() === activeShop.email.toLowerCase()) ||
            (s.name && activeShop.name && s.name.toLowerCase() === activeShop.name.toLowerCase())
          ) || null;
        }

        if (!isMounted || !freshShop) return;

        const hasVerificationChanged = activeShop.verified !== freshShop.verified;
        const hasStatusChanged = activeShop.status !== freshShop.status;
        const hasNameChanged = activeShop.name !== freshShop.name;

        if (hasVerificationChanged || hasStatusChanged || hasNameChanged) {
          const mergedShop: Shop = {
            ...activeShop,
            ...freshShop,
            subscription: freshShop.subscription || activeShop.subscription,
            subscriptionUsage: freshShop.subscriptionUsage || activeShop.subscriptionUsage,
          };

          dispatch(setActiveShop(mergedShop));
          dispatch(updateShop(mergedShop));
        }
      } catch (err) {
        console.warn("Auto sync shop status failed:", err);
      }
    };

    // Immediate check on mount or when route changes
    syncLiveShopStatus();

    // Auto-polling interval:
    // If pending verification, poll frequently (every 5 seconds) so admin approval reflects automatically without logout!
    // If already verified, check every 30 seconds to catch status/name changes.
    const pollInterval = !activeShop.verified ? 5000 : 30000;
    const timer = setInterval(() => {
      syncLiveShopStatus();
    }, pollInterval);

    // Auto-sync when window regains focus or tab becomes active
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncLiveShopStatus();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [activeShop?.id, activeShop?.verified, activeShop?.status, location.pathname, dispatch]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeShop) return;
    const updated: Shop = {
      ...activeShop,
      name: profileForm.name,
      ownerName: profileForm.ownerName,
      phone: profileForm.phone,
      whatsapp: profileForm.whatsapp,
      address: profileForm.address,
      city: profileForm.city,
      category: profileForm.category,
      profileImage: profileForm.profileImage,
      district: profileForm.district,
      country: profileForm.country,
      email: profileForm.email,
      aadhaarNumber: profileForm.aadhaarNumber,
      panNumber: profileForm.panNumber,
      latitude: profileForm.latitude,
      longitude: profileForm.longitude,
      gstNumber: profileForm.gstNumber,
      websiteUrl: profileForm.websiteUrl,
      businessHours: profileForm.businessHours,
      businessDescription: profileForm.businessDescription,
      alternatePhone: profileForm.alternatePhone,
    };

    try {
      await createOrUpdateMyShop({
        name: updated.name,
        ownerName: updated.ownerName,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        address: updated.address,
        city: updated.city,
        category: updated.category,
        profileImage: updated.profileImage,
        district: updated.district,
        country: updated.country,
        aadhaarNumber: updated.aadhaarNumber,
        panNumber: updated.panNumber,
        latitude: updated.latitude,
        longitude: updated.longitude,
        gstNumber: updated.gstNumber,
        websiteUrl: updated.websiteUrl,
        businessHours: updated.businessHours,
        businessDescription: updated.businessDescription,
        alternatePhone: updated.alternatePhone,
      });
    } catch (err: any) {
      console.warn('Backend shop sync error:', err);
    }

    dispatch(updateShop(updated));
    dispatch(setActiveShop(updated));
    triggerToast("Shop profile & location updated successfully!", "success");
  };

  const handleOpenAddProduct = () => {
    if (!activeShop) {
      dispatch(setAuthRole('seller'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(true));
      triggerToast("Please login as a seller to list products.");
      return;
    }
    dispatch(setProductToEdit(null));
    dispatch(setShowAddEditModal(true));
  };

  const handleOpenEditProduct = (product: Product) => {
    dispatch(setProductToEdit(product));
    dispatch(setShowAddEditModal(true));
  };


  const handleToggleSoldOut = (product: Product) => {
    const isCurrentlySoldOut = product.isSoldOut || product.stock <= 0;
    const nextSoldOutState = !isCurrentlySoldOut;
    const nextStock = nextSoldOutState ? 0 : (product.stock > 0 ? product.stock : 1);
    const updated: Product = {
      ...product,
      isSoldOut: nextSoldOutState,
      stock: nextStock
    };
    dispatch(editProduct(updated));
    triggerToast(
      nextSoldOutState
        ? `Marked "${product.name}" as Sold Out 🔴`
        : `Restored "${product.name}" to In Stock 🟢`,
      'info'
    );
  };

  const handleDeleteListing = (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    // Task 3: Soft delete -> Mark as Sold Out instead of removing outright
    const softDeleted: Product = {
      ...target,
      isSoldOut: true,
      stock: 0
    };
    dispatch(editProduct(softDeleted));
    triggerToast(`Listing "${target.name}" marked as Sold Out. Click "Restore" on the item to undo stock.`, 'warning');
  };

  // Capture Lead & Open Link
  const triggerLeadCapture = async (product: Product, seller: Shop, contactType: 'call' | 'whatsapp') => {
    const leadId = `lead-${Date.now()}`;
    const name = activeUser ? activeUser.name : "Anonymous Buyer";
    const phone = activeUser ? activeUser.phone : "Not Logged In";

    const newLead: Lead = {
      id: leadId,
      shopId: seller.id,
      productId: product.id,
      productName: product.name,
      customerName: name,
      customerPhone: phone,
      contactType,
      createdAt: new Date().toISOString()
    };

    dispatch(addLead(newLead));

    try {
      await sendLead({
        shopId: seller.id,
        productId: product.id,
        productName: product.name,
        customerName: name,
        customerPhone: phone,
        contactType,
        userId: activeUser?.id,
      });
    } catch (err) {
      console.warn('Lead API submission fallback:', err);
    }
  };

  const handleCallSeller = (product: Product, seller: Shop) => {
    logActivity({
      action: 'CALL_CLICK',
      details: `Call button clicked for product: "${product.name}" (Shop: "${seller.name}", Phone: ${seller.phone || 'N/A'}). Customer: ${activeUser?.name || 'Customer'} (${activeUser?.phone || activeUser?.email || 'Guest'})`,
      userId: activeUser?.id,
    });
    triggerLeadCapture(product, seller, 'call');
    triggerToast(`📞 Direct Call lead logged! Connecting call with ${seller.name} (${seller.phone})...`, 'success');
    if (seller.phone) {
      window.location.href = `tel:${seller.phone}`;
    }
  };

  const handleWhatsAppSeller = (product: Product, seller: Shop) => {
    logActivity({
      action: 'WHATSAPP_CLICK',
      details: `WhatsApp clicked for product: "${product.name}" (Shop: "${seller.name}"). Customer: ${activeUser?.name || 'Customer'} (${activeUser?.phone || activeUser?.email || 'Guest'})`,
      userId: activeUser?.id,
    });
    const rawNum = (seller.whatsapp || seller.phone || '').replace(/\D/g, '');
    if (!rawNum) {
      triggerToast(`⚠️ WhatsApp number for ${seller.name} is unavailable.`, 'warning');
      return;
    }

    triggerLeadCapture(product, seller, 'whatsapp');
    const cleanPhone = rawNum.length === 10 ? `91${rawNum}` : rawNum;
    const name = activeUser ? activeUser.name : "Customer";
    const text = `Hi ${seller.ownerName || seller.name}, I saw your product "${product.name}" listed for ₹${(product.offerPrice || product.price).toLocaleString('en-IN')} on MLX Market. I am interested in buying it. Is it still available? - Sent by ${name}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    triggerToast(`💬 Opening WhatsApp chat with ${seller.name}...`, 'success');
    window.open(waUrl, '_blank');
  };

  const handleGetDirections = (seller: Shop) => {
      logActivity({
        action: 'LOCATION_CLICK',
        details: `Location & Directions clicked for shop: "${seller.name}" (Address: ${seller.address || 'N/A'}, City: ${seller.city || 'N/A'})`,
        userId: activeUser?.id,
      });
    const locationQuery = seller.address ? `${seller.name}, ${seller.address}, ${seller.city}` : `${seller.name}, ${seller.city}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
    triggerToast(`🗺️ Opening Google Maps directions for ${seller.name}...`, 'info');
    window.open(mapsUrl, '_blank');
  };

  const renderCategoryIcon = (category: string, cssClass = "card-visual-svg") => {
    switch (category.toLowerCase()) {
      case 'mobiles':
        return <Smartphone className={cssClass} />;
      case 'laptops':
        return <Laptop className={cssClass} />;
      case 'smart watches':
        return <Watch className={cssClass} />;
      case 'tablets':
        return <TabletIcon className={cssClass} />;
      default:
        return <Layers className={cssClass} />;
    }
  };

  // Filter lists inside Instagram search overlay
  const handleTagClick = (tagType: 'query' | 'category' | 'budget' | 'city', value: string) => {
    if (tagType === 'query') {
      dispatch(setSearchQuery(value));
      // Reset conflicting filters so that trending product search displays immediately
      dispatch(setSelectedCategory('All Categories'));
      dispatch(setFilterBrand(''));
      dispatch(setFilterMinPrice(''));
      dispatch(setFilterMaxPrice(''));
      dispatch(setFilterMaxBudget('Any Budget'));
    } else if (tagType === 'category') {
      dispatch(setSelectedCategory(value));
      dispatch(setSearchQuery(''));
    } else if (tagType === 'budget') {
      dispatch(setFilterMaxBudget(value));
    } else if (tagType === 'city') {
      dispatch(setFilterCity(value));
    }
    setIsSearchFocused(false);
    navigate('/');
    setTimeout(() => {
      const grid = document.getElementById('marketplace-grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="app-container">
      {/* Toast Alert Popups */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => dispatch(removeToast(toast.id))}
            />
          ))}
        </div>
      )}

      {/* --- SITE HEADER --- */}
      <header className="site-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {location.pathname !== '/' && location.pathname !== '/seller-dashboard' && (
              <button
                type="button"
                className="header-back-btn"
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                }}
                title="Go back to previous page"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            <div className="logo-section" onClick={() => { 
              if (activeShop) {
                navigate('/seller-dashboard');
                dispatch(setDashboardTab('listings'));
              } else {
                navigate('/'); 
                dispatch(clearFilters()); 
              }
            }}>
              <img src="/logo.png" alt="MLX Market Logo" className="logo-img" />
              <div className="logo-text">
                <span className="logo-title">MLX <span>DIRECT</span></span>
                <span className="logo-subtitle">USED GADGETS DIRECTORY</span>
              </div>
            </div>
          </div>

          {/* Search bar inside header with Instagram-Style dropdown overlay (Customers only) */}
          {!activeShop ? (
            <div className="header-search-container" style={{ position: 'relative', flex: 1, maxWidth: '550px', zIndex: isSearchFocused ? 102 : 1 }}>
              <div className="header-search" style={{ position: 'relative', zIndex: isSearchFocused ? 105 : 1 }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search used iPhones, OnePlus, budget..."
                  value={filters.searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setSearchQuery(e.target.value))}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ color: '#ffffff' }}
                />
                <button className="search-btn" onClick={() => { setIsSearchFocused(false); navigate('/'); }}>
                  <Search size={16} />
                  <span>Search</span>
                </button>
              </div>

              {/* Instagram Style Search Overlay Panel */}
              {isSearchFocused && (
                <>
                  <div className="search-overlay-backdrop" onClick={() => setIsSearchFocused(false)}></div>
                  <div className="search-explore-overlay minimal-search-overlay">
                    {/* Row 1: Detect Location & Cities */}
                    <div className="overlay-minimal-row">
                      <button
                        type="button"
                        className="detect-location-btn"
                        onClick={() => {
                          dispatch(setFilterCity('Kochi'));
                          triggerToast("📍 Geolocation active: Selected Kochi as nearest city!", "success");
                          setIsSearchFocused(false);
                          navigate('/');
                        }}
                      >
                        <MapPin size={13} style={{ flexShrink: 0 }} />
                        <span>Near Me</span>
                      </button>
                      <div className="minimal-tags">
                        {CITIES.filter(c => c !== "All Cities").map(city => (
                          <button key={city} type="button" className="min-tag city" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('city', city)}>{city}</button>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: Budgets & Categories */}
                    <div className="overlay-minimal-row">
                      <span className="min-row-lbl">Budgets:</span>
                      <div className="minimal-tags">
                        <button type="button" className="min-tag budget" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('budget', 'Under ₹5,000')}>&lt; 5k</button>
                        <button type="button" className="min-tag budget" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('budget', 'Under ₹10,000')}>&lt; 10k</button>
                        <button type="button" className="min-tag budget" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('budget', 'Under ₹25,000')}>&lt; 25k</button>
                      </div>
                      <span className="min-row-lbl" style={{ marginLeft: '0.5rem' }}>Categories:</span>
                      <div className="minimal-tags">
                        <button type="button" className="min-tag cat" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('category', 'Smartphones & Mobiles')}>Smartphones</button>
                        <button type="button" className="min-tag cat" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('category', 'Laptops & MacBooks')}>Laptops</button>
                        <button type="button" className="min-tag cat" onMouseDown={(e) => e.preventDefault()} onClick={() => handleTagClick('category', 'Smartwatches')}>Watches</button>
                      </div>
                    </div>

                    {/* Row 3: Trending Models */}
                    <div className="overlay-minimal-row" style={{ borderTop: '1px solid var(--light-border)', paddingTop: '0.5rem', marginTop: '0.25rem', width: '100%' }}>
                      <span className="min-row-lbl">Trending:</span>
                      <div className="minimal-tags">
                        {trendingTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            className="min-tag model"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleTagClick('query', tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Real-Time Autocomplete Suggestions Section */}
                    {filters.searchQuery.trim() !== '' && (
                      <div className="search-autocomplete-section" style={{ borderTop: '1px solid var(--light-border)', paddingTop: '0.6rem', marginTop: '0.4rem', width: '100%' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>
                          Matching Products ({filteredProducts.length})
                        </div>
                        {filteredProducts.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '0.4rem 0' }}>
                            No matching products found for "{filters.searchQuery}"
                          </div>
                        ) : (
                          <div className="autocomplete-suggestions-list" style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {filteredProducts.slice(0, 5).map(prod => (
                              <div
                                key={prod.id}
                                className="suggestion-item"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', background: '#f8f9fa' }}
                                onClick={() => {
                                  dispatch(setSearchQuery(prod.name));
                                  setIsSearchFocused(false);
                                  navigate('/');
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <Smartphone size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{prod.name}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                                  ₹{prod.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.03) 100%)',
                border: '1px solid rgba(255, 158, 64, 0.4)',
                padding: '0.42rem 1.15rem 0.42rem 0.65rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.45)',
                  flexShrink: 0
                }}>
                  <Store size={15} color="#ffffff" strokeWidth={2.4} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap'
                  }}>
                    Seller Store Management Portal
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Header Action Buttons for standard Users and Seller Shop Portal */}
          <div className="header-actions">
            {/* Wishlist Header Action Button (Customer only) */}
            {!activeShop && (
              <button
                className={`action-btn ${location.pathname === '/wishlist' ? 'active' : ''}`}
                onClick={() => {
                  if (!activeUser) {
                    dispatch(setAuthRole('customer'));
                    dispatch(setAuthTab('login'));
                    dispatch(setShowAuthModal(true));
                    triggerToast("Please log in to access your wishlist", "info");
                  } else {
                    navigate('/wishlist');
                  }
                }}
                title="My Wishlist"
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem 0.65rem' }}
              >
                <Heart size={18} fill={wishlistProductIds.length > 0 ? '#ef4444' : 'transparent'} color={wishlistProductIds.length > 0 ? '#ef4444' : 'currentColor'} />
                {wishlistProductIds.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {wishlistProductIds.length}
                  </span>
                )}
              </button>
            )}

            {activeShop ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="user-indicator" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '24px',
                  background: 'rgba(255, 111, 0, 0.12)',
                  border: '1px solid rgba(255, 158, 64, 0.38)',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  <Store size={15} style={{ color: '#ff9e40' }} />
                  <span className="user-badge-text-container" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="user-badge-name" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{activeShop.name}</span>
                    <span className="user-badge-role" style={{ fontSize: '0.72rem', color: '#fed7aa', fontWeight: 600 }}> (Seller)</span>
                  </span>
                </span>
                <button
                  className="action-btn"
                  onClick={() => setLogoutConfirmType('seller')}
                  title="Logout Shop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : activeUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className={`action-btn sell-btn ${location.pathname === '/customer-dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/customer-dashboard')}
                  title="My Profile & Dashboard"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                >
                  <User size={15} />
                  <span className="nav-btn-text" style={{ fontWeight: 600 }}>
                    {getFormattedUserName(activeUser)}
                  </span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => setLogoutConfirmType('customer')}
                  title="Logout User"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="action-btn sell-btn" onClick={() => { dispatch(setAuthRole('customer')); dispatch(setAuthTab('login')); dispatch(setShowAuthModal(true)); }}>
                  <LogIn size={15} />
                  <span className="nav-btn-text">Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category Sub-navigation (Only on Marketplace Catalog Home) */}
      {location.pathname === '/' && !activeShop && (
        <div className="category-bar">
          <div className="category-container">
            {displayCategories.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${filters.selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  dispatch(setSelectedCategory(cat));
                  navigate('/');
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- TOP DYNAMIC SLIDER (Marketplace Main View Only) --- */}
      {location.pathname === '/' && !activeShop && (
        <section className="slider-banner-section" style={{ background: slides[currentSlide].bgColor }}>
          <div className="slider-banner-container">
            <div className="slider-content-pane">
              <span className="slider-badge">
                <ShieldCheck size={14} />
                <span>{slides[currentSlide].badge}</span>
              </span>
              <h2 className="slider-title">{slides[currentSlide].title}</h2>
              <p className="slider-subtext">{slides[currentSlide].subtext}</p>
              <div className="slider-offer-badge">
                <Tag size={14} />
                <span>{slides[currentSlide].offerText}</span>
              </div>
              <div className="slider-controls">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`slider-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="slider-image-pane">
              <div className="slider-radial-glow"></div>
              <img src={slides[currentSlide].image} alt="Promotion device" className="slider-floating-img" />
            </div>
          </div>
        </section>
      )}

      {/* --- MAIN MARKETPLACE / DASHBOARD VIEWS --- */}
      <Routes>
        <Route path="/" element={
          activeShop ? (
            <Navigate to="/seller-dashboard" replace />
          ) : (
            <main className="main-content" id="marketplace-grid">
            {/* Mobile Filter Toggle Bar (Visible on screens < 992px) */}
            <div className="mobile-filter-bar">
              <button
                className="mobile-filter-toggle-btn"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} />
                  <span>Filter Gadgets {filters.selectedCategory ? `• ${filters.selectedCategory}` : ''}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                  {isMobileFilterOpen ? 'Hide Filters ▲' : 'Show Filters ▼'}
                </span>
              </button>
            </div>

            {/* Sidebar Column & Filters */}
            <div className="sidebar-column-wrapper">
              <aside className={`sidebar-filters ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
                <div className="filter-title-bar">
                  <span className="filter-title">Filter Gadgets</span>
                  <button className="clear-filter-btn" onClick={() => dispatch(clearFilters())}>Clear All</button>
                </div>

                {/* Location Search Input */}
                <div className="filter-group">
                  <label className="filter-label">Search Location / Area</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="e.g. Kochi, MG Road, Calicut..."
                      value={filters.filterLocationSearch}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setFilterLocationSearch(e.target.value))}
                      style={{ paddingLeft: '2.2rem' }}
                    />
                    <MapPin size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary-light)' }} />
                  </div>
                </div>

                {/* Category Selector */}
                <div className="filter-group">
                  <label className="filter-label">Category</label>
                  <CustomSelect
                    value={filters.selectedCategory}
                    onChange={(val) => dispatch(setSelectedCategory(val))}
                    options={displayCategories}
                  />
                </div>

                {/* City Selector */}
                <div className="filter-group">
                  <label className="filter-label">Select City</label>
                  <CustomSelect
                    value={filters.filterCity}
                    onChange={(val) => dispatch(setFilterCity(val))}
                    options={CITIES}
                  />
                </div>

                {/* Budget Presets */}
                <div className="filter-group">
                  <label className="filter-label">Max Budget Limit</label>
                  <CustomSelect
                    value={filters.filterMaxBudget}
                    onChange={(val) => dispatch(setFilterMaxBudget(val))}
                    options={BUDGET_PRESETS}
                  />
                </div>

                {/* Brand Filter */}
                <div className="filter-group">
                  <label className="filter-label">Brand</label>
                  <CustomSelect
                    value={filters.filterBrand}
                    onChange={(val) => dispatch(setFilterBrand(val))}
                    options={[
                      { label: "All Brands", value: "" },
                      ...uniqueBrands.map(b => ({ label: b, value: b }))
                    ]}
                  />
                </div>

                {/* Custom Price Range */}
                <div className="filter-group">
                  <label className="filter-label">Price Range (₹)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      className="filter-input"
                      placeholder="Min"
                      value={filters.filterMinPrice}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setFilterMinPrice(e.target.value))}
                    />
                    <input
                      type="number"
                      className="filter-input"
                      placeholder="Max"
                      value={filters.filterMaxPrice}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setFilterMaxPrice(e.target.value))}
                    />
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="filter-group">
                  <label className="filter-label">Advanced Filters</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filters.filterVerifiedOnly}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setFilterVerifiedOnly(e.target.checked))}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
                        <span>Verified Sellers Only</span>
                      </span>
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary-light)', fontWeight: 600 }}>Minimum Store Rating</span>
                      <CustomSelect
                        value={filters.filterMinRating}
                        onChange={(val) => dispatch(setFilterMinRating(val))}
                        options={[
                          { label: "All Store Ratings", value: "0" },
                          { label: "4.0+ Stars", value: "4.0" },
                          { label: "4.5+ Stars", value: "4.5" }
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* In Stock only */}
                <div className="filter-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.filterInStockOnly}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => dispatch(setFilterInStockOnly(e.target.checked))}
                    />
                    <span>Show in-stock items only</span>
                  </label>
                </div>

                <div className="trust-sidebar-widget">
                  <Info size={16} className="widget-icon" />
                  <span><strong>No Checkout System:</strong> MLX lists verified device inventories. Dial or WhatsApp shop owners directly to buy.</span>
                </div>
              </aside>
            </div>

            {/* Products Grid Section */}
            <section className="products-section">
              <div className="catalog-header">
                <span className="catalog-count">
                  Available Devices <span>({sortedProducts.length} items found)</span>
                </span>

                <div className="catalog-sort">
                  <span>Sort by:</span>
                  <CustomSelect
                    value={filters.sortBy}
                    onChange={(val) => dispatch(setSortBy(val as any))}
                    options={[
                      { label: "Featured Listings", value: "featured" },
                      { label: "Price: Low to High", value: "price-asc" },
                      { label: "Price: High to Low", value: "price-desc" },
                      { label: "Top Rated Sellers", value: "rating" },
                      { label: "Newest Listings", value: "newest" },
                      { label: "Name: A to Z", value: "alphabetical" },
                      { label: "Stock Available", value: "stock" }
                    ]}
                  />
                </div>
              </div>

              {sortedProducts.length > 0 ? (
                <>
                  <div className="product-grid">
                    {/* Dynamically insert Center Banner in between products (after 3 items) */}
                    {(() => {
                      const totalCatalogItems = sortedProducts.length;
                      const catalogStartIndex = (catalogPage - 1) * catalogPerPage;
                      const catalogEndIndex = Math.min(catalogStartIndex + catalogPerPage, totalCatalogItems);
                      const paginatedCatalogProducts = sortedProducts.slice(catalogStartIndex, catalogEndIndex);

                      return paginatedCatalogProducts.map((product, index) => {
                        const seller = getSellerShop(product.shopId);
                        const isOutOfStock = product.stock <= 0;

                        const renderCard = (
                          <article
                            key={product.id}
                            className="product-card"
                            onClick={() => {
                              const token = typeof window !== 'undefined' ? localStorage.getItem('mlx_token') : null;
                              if (!activeUser && !activeShop && !token) {
                                dispatch(setAuthRole('customer'));
                                dispatch(setAuthTab('login'));
                                dispatch(setShowAuthModal(true));
                                return;
                              }
                              logActivity({
                                action: 'PRODUCT_CLICK',
                                details: `Clicked on product "${product.name}" (ID: ${product.id}, Price: ₹${(product.offerPrice || product.price).toLocaleString('en-IN')}) listed by "${seller?.name || 'Shop'}"`,
                                userId: activeUser?.id,
                              });
                              dispatch(setSelectedProduct(product));
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <div className="card-img-wrapper" style={{ position: 'relative' }}>
                              {/* Wishlist Overlay Button */}
                              <button
                                type="button"
                                title={wishlistProductIds.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleWishlist(product);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '12px',
                                  right: '12px',
                                  zIndex: 11,
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: wishlistProductIds.includes(product.id) ? '#ef4444' : '#64748b',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Heart size={18} fill={wishlistProductIds.includes(product.id) ? '#ef4444' : 'transparent'} />
                              </button>
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0]} alt={product.name} className="product-card-img" />
                              ) : (
                                renderCategoryIcon(product.category)
                              )}
                              <span className={`tag-stock ${isOutOfStock ? 'out' : 'in'}`}>
                                {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock} units`}
                              </span>
                              {(product.condition || product.specs?.['Condition']) && (
                                <span className="tag-condition">{product.condition || product.specs['Condition']}</span>
                              )}
                            </div>

                            <div className="card-body">
                              <span className="card-brand">{product.brand}</span>
                              <h3 className="card-name">{product.name}</h3>

                              <div className="card-dealer-info">
                                <div className="dealer-name">
                                  <Store size={14} className="verified-icon" />
                                  <span>{seller.name}</span>
                                </div>
                                <div className="dealer-location">
                                  <MapPin size={12} />
                                  <span>{seller.address}, {seller.city}</span>
                                </div>
                              </div>

                              <div className="card-footer">
                                <div>
                                  <span className="card-price-label">Consumer Selling Price</span>
                                  <div className="card-price">₹{product.price.toLocaleString('en-IN')}</div>
                                </div>

                                <button className="card-action-btn" title="View details & contact">
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            </div>
                          </article>
                        );

                        // Inject Centre banner
                        if (index === 3) {
                          return (
                            <React.Fragment key="center-banner-wrapper">
                              <div className="centre-process-banner">
                                <div className="process-guide-badge">
                                  <ShieldCheck size={14} />
                                  <span>Safe Buyer Guide</span>
                                </div>
                                <h3 className="process-headline">How to buy safely in 3 easy steps:</h3>
                                <div className="process-steps">
                                  <div className="process-step-card">
                                    <div className="step-icon-wrapper">
                                      <MapPin size={20} />
                                    </div>
                                    <div className="step-card-content">
                                      <span className="step-card-num">Step 1</span>
                                      <p className="step-card-txt">Select your city and browse used gadgets near you</p>
                                    </div>
                                  </div>

                                  <div className="process-step-card">
                                    <div className="step-icon-wrapper">
                                      <Phone size={20} />
                                    </div>
                                    <div className="step-card-content">
                                      <span className="step-card-num">Step 2</span>
                                      <p className="step-card-txt">Click WhatsApp or Call to contact the store directly</p>
                                    </div>
                                  </div>

                                  <div className="process-step-card">
                                    <div className="step-icon-wrapper">
                                      <CheckCircle size={20} />
                                    </div>
                                    <div className="step-card-content">
                                      <span className="step-card-num">Step 3</span>
                                      <p className="step-card-txt">Meet dealer, physically inspect the gadget, and buy</p>
                                    </div>
                                  </div>
                                </div>
                                <span className="process-footer">No hidden platform fees. No commissions. Pure peer-to-merchant deals.</span>
                              </div>
                              {renderCard}
                            </React.Fragment>
                          );
                        }

                        return renderCard;
                      });
                    })()}
                  </div>

                  {/* Marketplace Catalog Pagination Bar */}
                  {sortedProducts.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '2rem',
                        padding: '1.25rem 1.5rem',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Show per page:</span>
                        <select
                          value={catalogPerPage}
                          onChange={(e) => {
                            setCatalogPerPage(Number(e.target.value));
                            setCatalogPage(1);
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.82rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontWeight: 700,
                            color: '#1e293b',
                            cursor: 'pointer'
                          }}
                        >
                          <option value={8}>8 items</option>
                          <option value={12}>12 items</option>
                          <option value={24}>24 items</option>
                          <option value={48}>48 items</option>
                        </select>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                          Showing {sortedProducts.length > 0 ? (catalogPage - 1) * catalogPerPage + 1 : 0} to {Math.min(catalogPage * catalogPerPage, sortedProducts.length)} of {sortedProducts.length} items
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          disabled={catalogPage === 1}
                          onClick={() => {
                            setCatalogPage(prev => Math.max(prev - 1, 1));
                            const gridEl = document.getElementById('marketplace-grid');
                            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: '#ffffff',
                            color: catalogPage === 1 ? '#cbd5e1' : '#334155',
                            cursor: catalogPage === 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ◀ Prev
                        </button>

                        {Array.from({ length: Math.ceil(sortedProducts.length / catalogPerPage) || 1 }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              setCatalogPage(page);
                              const gridEl = document.getElementById('marketplace-grid');
                              if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                              padding: '0.45rem 0.8rem',
                              borderRadius: '8px',
                              border: catalogPage === page ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              background: catalogPage === page ? 'var(--primary)' : '#ffffff',
                              color: catalogPage === page ? '#ffffff' : '#334155',
                              cursor: 'pointer',
                              boxShadow: catalogPage === page ? '0 2px 8px rgba(255, 111, 0, 0.3)' : 'none'
                            }}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={catalogPage === Math.ceil(sortedProducts.length / catalogPerPage)}
                          onClick={() => {
                            setCatalogPage(prev => Math.min(prev + 1, Math.ceil(sortedProducts.length / catalogPerPage)));
                            const gridEl = document.getElementById('marketplace-grid');
                            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: '#ffffff',
                            color: catalogPage === Math.ceil(sortedProducts.length / catalogPerPage) ? '#cbd5e1' : '#334155',
                            cursor: catalogPage === Math.ceil(sortedProducts.length / catalogPerPage) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <HelpCircle size={48} className="empty-icon" />
                  <h3 className="empty-title">No used gadgets match these criteria</h3>
                  <p className="empty-desc">
                    Try clearing location/budget filters or searching for another device name.
                  </p>
                  <button className="btn-primary" onClick={() => dispatch(clearFilters())} style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                    Clear Filters
                  </button>
                </div>
              )}
            </section>
          </main>
          )
        } />

        <Route path="/customer-dashboard" element={
          activeShop ? (
            <Navigate to="/seller-dashboard" replace />
          ) : (
          /* --- CUSTOMER DASHBOARD VIEW --- */
          <main className="dashboard-view customer-dashboard-view">
            <aside className="dashboard-sidebar">
              <div className="dashboard-profile-hdr">
                <div className="profile-avatar">
                  {activeUser ? activeUser.name.charAt(0) : 'C'}
                </div>
                <h2 className="profile-name">{activeUser?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, backgroundColor: 'rgba(255, 111, 0, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <User size={12} />
                  <span>Verified Buyer Portal</span>
                </div>
              </div>

              <div className="profile-stats-row">
                <div className="profile-stat-box">
                  <div className="profile-stat-num">
                    {leads.filter(l => activeUser && l.customerPhone === activeUser.phone).length}
                  </div>
                  <div className="profile-stat-lbl">Inquiries Sourced</div>
                </div>
              </div>

              <div className="dashboard-menu">
                <button
                  className={`dash-menu-btn ${customerTab === 'inquiries' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('inquiries')}
                >
                  <MessageSquare size={16} />
                  <span>My Inquiries Log</span>
                </button>

                <button
                  className={`dash-menu-btn ${customerTab === 'following' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('following')}
                >
                  <UserCheck size={16} />
                  <span>Stores I Follow ({followedShops.length})</span>
                </button>

                <button
                  className={`dash-menu-btn ${customerTab === 'wishlist' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('wishlist')}
                >
                  <Heart size={16} fill={customerTab === 'wishlist' ? '#ef4444' : 'transparent'} color={customerTab === 'wishlist' ? '#ef4444' : 'currentColor'} />
                  <span>My Wishlist ({wishlistProductIds.length})</span>
                </button>

                <button
                  className={`dash-menu-btn ${customerTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setCustomerTab('profile')}
                >
                  <User size={16} />
                  <span>My Profile Details</span>
                </button>

                <button
                  className="dash-menu-btn exit-dash-btn"
                  onClick={() => navigate('/')}
                  style={{ marginTop: 'auto', backgroundColor: 'transparent', border: '1px solid var(--light-border)', color: 'var(--text-primary-light)' }}
                >
                  <ChevronLeft size={16} />
                  <span>Exit Dashboard</span>
                </button>
              </div>
            </aside>

            <section className="dashboard-content">
              {customerTab === 'inquiries' ? (
                /* Customer Inquiries Log */
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">My Inquiries Log</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                      Direct Peer-to-Merchant Connections
                    </div>
                  </div>

                  <div className="leads-list-container" style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
                      Below is the log of verified used gadgets you inquired about. You can use these details to contact store partners again.
                    </p>

                    {(() => {
                      const custLeadsAll = leads.filter(l => activeUser && l.customerPhone === activeUser.phone);
                      const totalItems = custLeadsAll.length;
                      const totalPages = Math.ceil(totalItems / custInquiriesPerPage) || 1;
                      const startIndex = (custInquiriesPage - 1) * custInquiriesPerPage;
                      const endIndex = Math.min(startIndex + custInquiriesPerPage, totalItems);
                      const paginatedLeads = custLeadsAll.slice(startIndex, endIndex);

                      if (totalItems === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary-light)' }}>
                            <HelpCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>You haven't made any inquiries yet. Click Call/WhatsApp on any used device to connect with local stores!</p>
                            <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                              Browse Used Gadgets
                            </button>
                          </div>
                        );
                      }

                      return (
                        <>
                          <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--light-bg)', textAlign: 'left', borderBottom: '1px solid var(--light-border)' }}>
                                <th style={{ padding: '0.75rem' }}>Inquiry Date</th>
                                <th style={{ padding: '0.75rem' }}>Used Device Model</th>
                                <th style={{ padding: '0.75rem' }}>Store Partner</th>
                                <th style={{ padding: '0.75rem' }}>Store Location</th>
                                <th style={{ padding: '0.75rem' }}>Contact Channel</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedLeads.map((lead) => {
                                const matchingProduct = products.find(p => p.id === lead.productId);
                                const store = shops.find(s => s.id === lead.shopId);
                                return (
                                  <tr key={lead.id} style={{ borderBottom: '1px solid var(--light-border)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Calendar size={14} style={{ color: 'var(--text-secondary-light)' }} />
                                        <span>{new Date(lead.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                      {lead.productName}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      {store ? store.name : "Local Store Partner"}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      {store ? `${store.address}, ${store.city}` : "Kerala, India"}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span className={`lead-badge ${lead.contactType}`}>
                                        {lead.contactType === 'whatsapp' ? 'WhatsApp' : 'Direct Call'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      {store && matchingProduct ? (
                                        <button
                                          className="action-btn sell-btn"
                                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                          onClick={() => {
                                            if (lead.contactType === 'whatsapp') {
                                              handleWhatsAppSeller(matchingProduct, store);
                                            } else {
                                              handleCallSeller(matchingProduct, store);
                                            }
                                          }}
                                        >
                                          <Phone size={11} />
                                          <span>Contact Again</span>
                                        </button>
                                      ) : (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Unavailable</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Customer Inquiries Pagination Controls Bar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                              <span>Rows per page:</span>
                              <select
                                value={custInquiriesPerPage}
                                onChange={(e) => {
                                  setCustInquiriesPerPage(Number(e.target.value));
                                  setCustInquiriesPage(1);
                                }}
                                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                              </select>
                              <span>Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                disabled={custInquiriesPage === 1}
                                onClick={() => setCustInquiriesPage(prev => Math.max(prev - 1, 1))}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, background: '#ffffff', color: custInquiriesPage === 1 ? '#cbd5e1' : '#334155', cursor: custInquiriesPage === 1 ? 'not-allowed' : 'pointer' }}
                              >
                                ◀ Prev
                              </button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => setCustInquiriesPage(page)}
                                  style={{ padding: '0.35rem 0.7rem', borderRadius: '8px', border: custInquiriesPage === page ? '1px solid var(--primary)' : '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, background: custInquiriesPage === page ? 'var(--primary)' : '#ffffff', color: custInquiriesPage === page ? '#ffffff' : '#334155', cursor: 'pointer' }}
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                type="button"
                                disabled={custInquiriesPage === totalPages}
                                onClick={() => setCustInquiriesPage(prev => Math.min(prev + 1, totalPages))}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, background: '#ffffff', color: custInquiriesPage === totalPages ? '#cbd5e1' : '#334155', cursor: custInquiriesPage === totalPages ? 'not-allowed' : 'pointer' }}
                              >
                                Next ▶
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : customerTab === 'following' ? (
                /* Stores I Follow Tab */
                <div className="dashboard-panel">
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="panel-title">Stores I Follow</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                        Verified merchant partners you are following
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    {followedShops.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {followedShops.map((shop) => (
                          <div
                            key={shop.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid var(--light-border)',
                              borderRadius: '12px',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{shop.name}</h4>
                                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                                  {shop.city}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                                📍 {shop.address}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0.25rem 0 0 0' }}>
                                👤 Owner: {shop.ownerName} | 🏷️ {shop.category || 'Mobiles & Electronics'}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              {shop.phone && (
                                <a
                                  href={`tel:${shop.phone}`}
                                  className="action-btn sell-btn"
                                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', justifyContent: 'center', textDecoration: 'none' }}
                                >
                                  <Phone size={13} />
                                  <span>Call Shop</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleUnfollowShopInDash(shop.id)}
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  fontSize: '0.78rem',
                                  borderRadius: '8px',
                                  border: '1px solid #fca5a5',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Unfollow
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary-light)' }}>
                        <UserCheck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>You are not following any local shops yet. Click "+ Follow Shop" on any product detail page!</p>
                        <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                          Explore Shop Catalog
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : customerTab === 'wishlist' ? (
                /* Customer Wishlist Tab */
                <div className="dashboard-panel">
                  <WishlistPage
                    wishlistProducts={wishlistItems}
                    onRemoveWishlist={(id) => {
                      const prod = products.find(p => p.id === id) || wishlistItems.find(i => i.id === id || (i as any).productId === id || (i as any).wishlistRecordId === id);
                      const targetProd = (prod as any)?.product || prod;
                      if (targetProd) {
                        handleToggleWishlist(targetProd as Product);
                      } else {
                        handleToggleWishlist({ id, name: 'Item', price: 0 } as Product);
                      }
                    }}
                    onCallSeller={handleCallSeller}
                    onWhatsAppSeller={handleWhatsAppSeller}
                    onSelectProduct={(product) => {
                      dispatch(setSelectedProduct(product));
                      navigate(`/product/${product.id}`);
                    }}
                    activeUser={activeUser}
                    onOpenLogin={() => {
                      dispatch(setAuthRole('customer'));
                      dispatch(setAuthTab('login'));
                      dispatch(setShowAuthModal(true));
                    }}
                  />
                </div>
              ) : (
                /* Customer Profile Edit */
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">My Profile Details</h3>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!custProfileForm.name || !custProfileForm.email || !custProfileForm.phone) {
                        triggerToast("Please fill in all required fields.", "info");
                        return;
                      }
                      if (activeUser) {
                        try {
                          const updatedFromBackend = await updateUser(activeUser.id, {
                            name: custProfileForm.name,
                            email: custProfileForm.email,
                            phone: custProfileForm.phone,
                            latitude: custProfileForm.latitude,
                            longitude: custProfileForm.longitude
                          });

                          const updatedUser: CustomerUser = {
                            ...activeUser,
                            name: updatedFromBackend.name || custProfileForm.name,
                            email: updatedFromBackend.email || custProfileForm.email,
                            phone: updatedFromBackend.phone || custProfileForm.phone,
                            latitude: updatedFromBackend.latitude ?? custProfileForm.latitude ?? null,
                            longitude: updatedFromBackend.longitude ?? custProfileForm.longitude ?? null,
                          };

                          // Update user list in localStorage
                          let customUsers: CustomerUser[] = [];
                          try {
                            const savedUsers = localStorage.getItem('mlx_registered_users');
                            if (savedUsers) customUsers = JSON.parse(savedUsers);
                          } catch (err) {
                            console.error(err);
                          }

                          const userIdx = customUsers.findIndex(u => u.id === activeUser.id);
                          if (userIdx !== -1) {
                            customUsers[userIdx] = updatedUser;
                          } else {
                            customUsers.push(updatedUser);
                          }
                          localStorage.setItem('mlx_registered_users', JSON.stringify(customUsers));

                          dispatch(setActiveUser(updatedUser));
                          triggerToast("Profile & location updated successfully!", "success");
                        } catch (err: any) {
                          triggerToast(err.message || "Failed to update profile", "info");
                        }
                      }
                    }}
                    className="form-grid"
                  >
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        value={custProfileForm.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({ ...custProfileForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-input-text"
                        required
                        value={custProfileForm.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({ ...custProfileForm, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        className="form-input-text"
                        required
                        value={custProfileForm.phone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({ ...custProfileForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="form-actions-row full-width" style={{ marginTop: '1rem' }}>
                      <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </main>
          )
        } />

        <Route path="/seller-activity-logs" element={
          <main className="dashboard-view" style={{ minHeight: '80vh', padding: '1rem 0' }}>
            <SellerCustomerLogsPage
              onToast={triggerToast}
              onOpenUpgradeModal={() => {
                navigate('/seller-dashboard');
                dispatch(setDashboardTab('profile'));
              }}
            />
          </main>
        } />

        <Route path="/seller-dashboard" element={
          /* --- SELLER DASHBOARD VIEW --- */
          <main className="dashboard-view">
            <aside className="dashboard-sidebar">
              <div className="dashboard-profile-hdr">
                <div className="profile-avatar">
                  {activeShop ? activeShop.name.charAt(0) : 'D'}
                </div>
                <h2 className="profile-name">{activeShop?.name}</h2>
                {activeShop?.verified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #86efac' }}>
                    <ShieldCheck size={12} />
                    <span>Verified Seller Shop</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#c2410c', fontWeight: 600, backgroundColor: '#ffedd5', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fdba74' }}>
                    <Clock size={12} />
                    <span>Pending Admin Verification</span>
                  </div>
                )}
              </div>

              <div className="profile-stats-row">
                <div className="profile-stat-box">
                  <div className="profile-stat-num">
                    {products.filter(p => p.shopId === activeShop?.id).length}
                  </div>
                  <div className="profile-stat-lbl">Active Listings</div>
                </div>
                <div className="profile-stat-box">
                  <div className="profile-stat-num">
                    {leads.filter(l => !activeShop || l.shopId === activeShop.id || l.shopId === 'shop-101' || true).length}
                  </div>
                  <div className="profile-stat-lbl">Total Leads</div>
                </div>
              </div>

              {/* Subscription Plan & Product Usage Summary Card */}
              {(() => {
                const backendSub = activeShop?.subscription;
                const backendPlan = backendSub?.plan;
                const reduxPlan = subscriptionPlans.find(p => p.id === (activeShop?.subscriptionPlanId || backendSub?.planId));
                const activePlanObj = backendPlan || reduxPlan || {
                  name: 'Free Plan',
                  productLimit: 10,
                  price: 0
                };
                const activeCount = shopSubscriptionUsage?.currentProducts ?? activeShop?.subscriptionUsage?.currentProducts ?? (activeShop ? products.filter(p => p.shopId === activeShop.id).length : 0);
                const maxLimit = shopSubscriptionUsage?.productLimit ?? activeShop?.subscriptionUsage?.productLimit ?? activePlanObj.productLimit ?? 10;
                const slotsLeft = shopSubscriptionUsage?.remaining ?? activeShop?.subscriptionUsage?.remaining ?? Math.max(0, maxLimit - activeCount);
                const isPending = Boolean(activeShop && !activeShop.verified);
                const isPremium = activePlanObj.name?.toLowerCase().includes('premium') ||
                  activePlanObj.name?.toLowerCase().includes('pro') ||
                  Boolean(activePlanObj.price && activePlanObj.price > 0);

                return (
                  <div
                    style={{
                      margin: '1rem 0',
                      padding: '0.9rem',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      borderRadius: '14px',
                      border: isPremium ? '1.5px solid rgba(255, 111, 0, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isPremium ? '0 4px 18px rgba(255, 111, 0, 0.18)' : '0 4px 14px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Subscription Plan
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        background: isPremium ? 'linear-gradient(135deg, rgba(255,111,0,0.25) 0%, rgba(234,88,12,0.2) 100%)' : 'rgba(255,111,0,0.2)',
                        color: isPremium ? '#ff9e40' : '#ff9e40',
                        padding: '0.18rem 0.55rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        border: isPremium ? '1px solid rgba(255,111,0,0.45)' : '1px solid rgba(255,111,0,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {isPremium && '👑 '}
                        {activePlanObj.name}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(15,23,42,0.6)', padding: '0.6rem', borderRadius: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Max Limit</span>
                        <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{maxLimit} Products</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Remaining</span>
                        <strong style={{ fontSize: '1rem', color: slotsLeft === 0 ? '#f43f5e' : '#10b981' }}>{slotsLeft} Slots</strong>
                      </div>
                    </div>

                    {isPending && (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem 0.85rem", borderRadius: "12px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)", border: "1px solid rgba(245, 158, 11, 0.35)", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem" }}><Clock size={15} color="#fbbf24" style={{ flexShrink: 0 }} /><span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fbbf24" }}>Pending Admin Verification</span></div>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#cbd5ea", lineHeight: "1.4" }}>Your store profile is currently being reviewed by MLX admins. Verification updates automatically here.</p>
                      </div>
                    )}

                    {!isPending && slotsLeft === 0 && (
                      <div style={{ marginTop: '0.65rem', padding: '0.4rem 0.6rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fecdd3', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                        🚫 Limit Reached! Upgrade plan to add more products.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Brief Shop Profile Completion Sidebar Widget */}
              {(() => {
                const completion = calculateShopProfileCompletion(activeShop, activeUser?.email);
                return (
                  <div
                    onClick={() => {
                      navigate('/seller-dashboard');
                      dispatch(setDashboardTab('profile'));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      margin: '0.75rem 0 1rem 0',
                      padding: '0.85rem 0.95rem',
                      background: completion.isFullyCompleted
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 111, 0, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)',
                      borderRadius: '14px',
                      border: completion.isFullyCompleted
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid rgba(255, 111, 0, 0.3)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: completion.isFullyCompleted ? '#166534' : '#9a3412', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ShieldCheck size={16} color={completion.isFullyCompleted ? '#16a34a' : '#ea580c'} />
                        <span>Profile Completion</span>
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: completion.isFullyCompleted ? '#15803d' : '#c2410c' }}>
                        {completion.completionPercentage}%
                      </span>
                    </div>

                    {/* Mini Progress Bar Track */}
                    <div style={{ width: '100%', height: '7px', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.45rem' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${completion.completionPercentage}%`,
                          background: completion.isFullyCompleted
                            ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                            : 'linear-gradient(90deg, #ff6f00 0%, #ea580c 100%)',
                          borderRadius: '10px',
                          transition: 'width 0.4s ease-in-out'
                        }}
                      />
                    </div>

                    {!completion.isFullyCompleted ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 600 }}>
                          {completion.missingFields.length} field(s) missing
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/seller-dashboard');
                            dispatch(setDashboardTab('profile'));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ea580c',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                        >
                          Complete Profile →
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textAlign: 'center', marginTop: '0.2rem' }}>
                        ✓ 100% Profile Complete
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="dashboard-menu">
                <button
                  className={`dash-menu-btn ${dashboardTab === 'listings' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/seller-dashboard');
                    dispatch(setDashboardTab('listings'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Layers size={16} />
                  <span>Manage Product Listings</span>
                </button>

                {/* Customer Activity & Leads Report Tab */}
                <button
                  className={`dash-menu-btn ${dashboardTab === 'leads' || dashboardTab === 'customer-logs' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/seller-dashboard');
                    dispatch(setDashboardTab('leads'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Activity size={16} />
                  <span>Customer Activity & Leads</span>
                </button>

                <button
                  className={`dash-menu-btn ${dashboardTab === 'followers' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/seller-dashboard');
                    dispatch(setDashboardTab('followers'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <UserCheck size={16} />
                  <span>My Store Followers ({shopFollowersCount})</span>
                </button>

                <button
                  className={`dash-menu-btn ${dashboardTab === 'profile' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/seller-dashboard');
                    dispatch(setDashboardTab('profile'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <User size={16} />
                  <span>Edit Shop Profile ({calculateShopProfileCompletion(activeShop, activeUser?.email).completionPercentage}%)</span>
                </button>
              </div>
            </aside>

            <section style={{ flex: 1 }}>
              {dashboardTab === 'listings' ? (
                <div className="dashboard-panel">
                  {/* Clean Unified Section Header */}
                  <div
                    className="panel-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <h3 className="panel-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          My Used Devices Inventory
                        </h3>
                        <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.6rem', borderRadius: '20px', fontWeight: 700 }}>
                          {products.filter(p => p.shopId === activeShop?.id).length} Active Listings
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                        Upload multi-angle photos, storage specs & warranty details to broadcast your gadget to verified local buyers in {activeShop?.city || 'your city'}.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleOpenAddProduct}
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(255, 111, 0, 0.3)',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={18} />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Seller Inventory Search & Filter Controls */}
                  {products.filter(p => p.shopId === activeShop?.id).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.25rem',
                        flexWrap: 'wrap',
                        background: '#f8fafc',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="text"
                          placeholder="Search your inventory by model, brand, category..."
                          value={sellerSearchQuery}
                          onChange={(e) => setSellerSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                            fontSize: '0.82rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            background: '#ffffff'
                          }}
                        />
                        {sellerSearchQuery && (
                          <button
                            onClick={() => setSellerSearchQuery('')}
                            style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        <span>Rows per page:</span>
                        <select
                          value={sellerListPerPage}
                          onChange={(e) => {
                            setSellerListPerPage(Number(e.target.value));
                            setSellerListPage(1);
                          }}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="listings-list">
                    {(() => {
                      const sellerAllProducts = products.filter(p => p.shopId === activeShop?.id);
                      const filteredSellerProducts = sellerAllProducts.filter(p => {
                        if (!sellerSearchQuery) return true;
                        const q = sellerSearchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                      });

                      const totalSellerItems = filteredSellerProducts.length;
                      const totalSellerPages = Math.ceil(totalSellerItems / sellerListPerPage) || 1;
                      const startIndex = (sellerListPage - 1) * sellerListPerPage;
                      const endIndex = Math.min(startIndex + sellerListPerPage, totalSellerItems);
                      const paginatedSellerProducts = filteredSellerProducts.slice(startIndex, endIndex);

                      if (sellerAllProducts.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary-light)' }}>
                            <Layers size={40} style={{ opacity: 0.3, marginBottom: '1rem', color: '#64748b' }} />
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>No Used Gadgets Listed Yet</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '360px', margin: '0 auto 1.5rem auto' }}>
                              You have not listed any devices for buyers to discover in your store directory.
                            </p>
                            <button className="btn-primary" onClick={handleOpenAddProduct} style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px' }}>
                              <Plus size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
                              <span>List Your First Device</span>
                            </button>
                          </div>
                        );
                      }

                      if (filteredSellerProducts.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No products found matching "{sellerSearchQuery}"</p>
                            <button
                              onClick={() => setSellerSearchQuery('')}
                              style={{ marginTop: '0.5rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.35rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Clear Search Filter
                            </button>
                          </div>
                        );
                      }

                      return (
                        <>
                          {paginatedSellerProducts.map(product => (
                            <div key={product.id} className="listing-item">
                              <div
                                className="listing-preview-img"
                                onClick={() => setViewingSellerProduct(product)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view full details"
                              >
                                {product.images && product.images.length > 0 ? (
                                  <img src={product.images[0]} alt={product.name} className="product-card-img" style={{ borderRadius: 'var(--radius-sm)' }} />
                                ) : (
                                  renderCategoryIcon(product.category, "listing-preview-svg")
                                )}
                              </div>
                              <div
                                className="listing-info"
                                onClick={() => setViewingSellerProduct(product)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view full details"
                              >
                                <span
                                  className="listing-name"
                                  style={{ transition: 'color 0.2s ease' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ea580c')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                                >
                                  {product.name}
                                </span>
                                <div className="listing-meta">
                                  <span>Category: <strong>{product.category}</strong></span>
                                  <span>Brand: <strong>{product.brand}</strong></span>
                                  <span>Stock: <strong>{product.stock} units</strong></span>
                                </div>
                              </div>
                              <div className="listing-price-tag">
                                ₹{product.price.toLocaleString('en-IN')}
                              </div>
                              <div className="listing-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSoldOut(product)}
                                  style={{
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: (product.stock <= 0 || product.isSoldOut) ? '1px solid #fca5a5' : '1px solid #bbf7d0',
                                    background: (product.stock <= 0 || product.isSoldOut) ? '#fef2f2' : '#f0fdf4',
                                    color: (product.stock <= 0 || product.isSoldOut) ? '#dc2626' : '#16a34a'
                                  }}
                                >
                                  {(product.stock <= 0 || product.isSoldOut) ? '🔴 Sold Out (Restore)' : '🟢 In Stock'}
                                </button>
                                <button
                                  className="btn-icon-action view"
                                  title="View product details"
                                  onClick={() => setViewingSellerProduct(product)}
                                  aria-label={`View details of ${product.name}`}
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  className="btn-icon-action edit"
                                  title="Edit details"
                                  onClick={() => handleOpenEditProduct(product)}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn-icon-action delete"
                                  title="Remove listing"
                                  onClick={() => handleDeleteListing(product.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Seller Dashboard Inventory Pagination Bar */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '1.5rem',
                              paddingTop: '1rem',
                              borderTop: '1px solid #e2e8f0',
                              gap: '1rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                              Showing {totalSellerItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalSellerItems} products
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                disabled={sellerListPage === 1}
                                onClick={() => setSellerListPage(prev => Math.max(prev - 1, 1))}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  background: '#ffffff',
                                  color: sellerListPage === 1 ? '#cbd5e1' : '#334155',
                                  cursor: sellerListPage === 1 ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                ◀ Prev
                              </button>

                              {Array.from({ length: totalSellerPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => setSellerListPage(page)}
                                  style={{
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '8px',
                                    border: sellerListPage === page ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    background: sellerListPage === page ? 'var(--primary)' : '#ffffff',
                                    color: sellerListPage === page ? '#ffffff' : '#334155',
                                    cursor: 'pointer',
                                    boxShadow: sellerListPage === page ? '0 2px 8px rgba(255, 111, 0, 0.3)' : 'none'
                                  }}
                                >
                                  {page}
                                </button>
                              ))}

                              <button
                                type="button"
                                disabled={sellerListPage === totalSellerPages}
                                onClick={() => setSellerListPage(prev => Math.min(prev + 1, totalSellerPages))}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  background: '#ffffff',
                                  color: sellerListPage === totalSellerPages ? '#cbd5e1' : '#334155',
                                  cursor: sellerListPage === totalSellerPages ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Next ▶
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (dashboardTab === 'leads' || dashboardTab === 'customer-logs') ? (
              <SellerCustomerLogsPage
                onToast={triggerToast}
                onOpenUpgradeModal={() => {
                  dispatch(setDashboardTab('profile'));
                }}
              />
            ) : dashboardTab === 'followers' ? (
              /* My Store Followers Panel */
              <div className="dashboard-panel">
                {(() => {
                  const validFollowers = shopFollowers.filter(
                    (follower) => follower.id !== activeShop?.id && follower.name !== activeShop?.name
                  );

                  return (
                    <>
                      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 className="panel-title">My Store Followers</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                            Customers who are following <strong>{activeShop?.name}</strong> for inventory updates
                          </div>
                        </div>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                          Total Followers: {validFollowers.length}
                        </div>
                      </div>

                      <div style={{ marginTop: '1.5rem' }}>
                        {validFollowers.length > 0 ? (
                          <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--light-bg)', textAlign: 'left', borderBottom: '1px solid var(--light-border)' }}>
                                <th style={{ padding: '0.75rem' }}>Followed Date</th>
                                <th style={{ padding: '0.75rem' }}>Customer Name</th>
                                <th style={{ padding: '0.75rem' }}>Contact Details</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Direct Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validFollowers.map((follower) => (
                                <tr key={follower.id} style={{ borderBottom: '1px solid var(--light-border)' }}>
                                  <td style={{ padding: '0.75rem' }}>
                                    {new Date(follower.followedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                  </td>
                                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{follower.name}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <div>{follower.phone || follower.email || 'Registered Customer'}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    {follower.phone ? (
                                      <a
                                        href={`https://wa.me/${follower.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${follower.name}, thank you for following ${activeShop?.name} on MLX Market!`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-whatsapp"
                                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', borderRadius: '6px' }}
                                      >
                                        <span>WhatsApp Customer</span>
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Subscribed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)' }}>
                            <UserCheck size={36} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No customers are following your store yet. Keep your product catalog updated and accurate to attract followers!</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="dashboard-panel">
                {/* SHOP PROFILE COMPLETION PROGRESS CARD */}
                {(() => {
                  const completion = calculateShopProfileCompletion(
                    activeShop ? {
                      ...activeShop,
                      name: profileForm.name || activeShop.name,
                      ownerName: profileForm.ownerName || activeShop.ownerName,
                      phone: profileForm.phone || activeShop.phone,
                      whatsapp: profileForm.whatsapp || activeShop.whatsapp,
                      city: profileForm.city || activeShop.city,
                      address: profileForm.address || activeShop.address,
                    } : null,
                    activeUser?.email
                  );

                  return (
                    <div
                      style={{
                        background: completion.isFullyCompleted
                          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 111, 0, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
                        border: completion.isFullyCompleted
                          ? '1px solid rgba(34, 197, 94, 0.3)'
                          : '1px solid rgba(255, 111, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '1.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: completion.isFullyCompleted ? '#166534' : '#9a3412', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} color={completion.isFullyCompleted ? '#16a34a' : '#ea580c'} />
                            <span>Profile Completion: {completion.completionPercentage}%</span>
                          </h4>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                            {completion.isFullyCompleted
                              ? '🎉 Excellent! Your shop profile is 100% complete and fully verified for buyers.'
                              : 'Complete the remaining profile details to reach 100%.'}
                          </p>
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            background: completion.isFullyCompleted ? '#dcfce7' : '#ffedd5',
                            color: completion.isFullyCompleted ? '#15803d' : '#c2410c',
                            border: completion.isFullyCompleted ? '1px solid #86efac' : '1px solid #fdba74'
                          }}
                        >
                          {completion.completedFieldsCount} / {completion.totalFieldsCount} Mandatory Fields
                        </div>
                      </div>

                        {/* PROGRESS BAR TRACK */}
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${completion.completionPercentage}%`,
                              background: completion.isFullyCompleted
                                ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                                : 'linear-gradient(90deg, #ff6f00 0%, #ea580c 100%)',
                              borderRadius: '10px',
                              transition: 'width 0.4s ease-in-out'
                            }}
                          />
                        </div>

                        {/* MISSING FIELDS LIST */}
                        {!completion.isFullyCompleted && completion.missingFields.length > 0 && (
                          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255, 111, 0, 0.2)' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', display: 'block', marginBottom: '0.4rem' }}>
                              Remaining Incomplete Fields:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {completion.missingFields.map((field) => (
                                <span
                                  key={field}
                                  style={{
                                    fontSize: '0.75rem',
                                    background: '#fff',
                                    border: '1px solid #fed7aa',
                                    color: '#9a3412',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  ⚠️ {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="panel-header">
                    <h3 className="panel-title">Edit Shop Profile</h3>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Shop Business Name *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        value={profileForm.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Owner Name *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        value={profileForm.ownerName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Direct Phone Call Number *</label>
                      <PhoneInputWithCountry
                        required
                        value={profileForm.phone}
                        onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">WhatsApp Number *</label>
                      <PhoneInputWithCountry
                        required
                        value={profileForm.whatsapp}
                        onChange={(val) => setProfileForm({ ...profileForm, whatsapp: val })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">City Location *</label>
                      <select
                        className="form-select-box"
                        value={profileForm.city}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfileForm({ ...profileForm, city: e.target.value })}
                      >
                        {CITIES.filter(c => c !== "All Cities").map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Main Business Segment</label>
                      <select
                        className="form-select-box"
                        value={profileForm.category}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfileForm({ ...profileForm, category: e.target.value })}
                      >
                        <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                        <option value="Laptops & Accessories">Laptops & Accessories</option>
                        <option value="Smart Watches & Audio">Smart Watches & Audio</option>
                        <option value="All Tech Products">All Tech Products</option>
                      </select>
                    </div>

                    <div className="form-group full-width" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>Shop Profile / Logo Image *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem' }}>
                        {profileForm.profileImage ? (
                          <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '18px', overflow: 'hidden', border: '2px solid #ff6f00', flexShrink: 0 }}>
                            <img src={profileForm.profileImage} alt="Shop Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0, border: '2px dashed #cbd5e1' }}>
                            <Store size={32} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            id="editProfileLogoInput"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleProfileLogoFileSelect}
                          />
                          <label
                            htmlFor="editProfileLogoInput"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                              color: '#ffffff',
                              padding: '0.55rem 1rem',
                              borderRadius: '10px',
                              fontSize: '0.83rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginBottom: '0.35rem',
                              boxShadow: '0 4px 12px rgba(255, 111, 0, 0.25)'
                            }}
                          >
                            📷 {profileForm.profileImage ? 'Change Logo / Photo' : 'Upload Shop Logo / Photo'}
                          </label>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                            Supports JPG, PNG, WEBP (Auto-compressed)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-input-text"
                        required
                        placeholder="e.g. store@gmail.com"
                        value={profileForm.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        placeholder="e.g. Ernakulam / Calicut"
                        value={profileForm.district}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, district: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Country *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        placeholder="India"
                        value={profileForm.country}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, country: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Aadhaar Card Number *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        placeholder="12-digit Aadhaar Number"
                        value={profileForm.aadhaarNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, aadhaarNumber: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">PAN Card Number *</label>
                      <input
                        type="text"
                        className="form-input-text"
                        required
                        placeholder="10-character PAN Number"
                        value={profileForm.panNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                      />
                    </div>

                    {/* MANDATORY LOCATION SELECTION SECTION IN EDIT PROFILE */}
                    <div className="form-group full-width" style={{ background: '#f8fafc', border: '1.5px dashed #ff9e40', padding: '1.25rem', borderRadius: '16px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 800, color: '#c2410c', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                          <MapPin size={18} />
                          <span>Shop Map Coordinates (Mandatory) *</span>
                        </label>
                        {typeof profileForm.latitude === 'number' && typeof profileForm.longitude === 'number' && !isNaN(profileForm.latitude) && !isNaN(profileForm.longitude) && (
                          <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #86efac' }}>
                            ✓ Coordinates Set ({profileForm.latitude.toFixed(4)}, {profileForm.longitude.toFixed(4)})
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
                        Detect GPS location or search address to pin exact coordinates on Google Maps:
                      </p>

                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                        <button
                          type="button"
                          disabled={isProfileLocating}
                          onClick={() => {
                            if (!navigator.geolocation) {
                              triggerToast('Geolocation is not supported by your browser.', 'info');
                              return;
                            }
                            setIsProfileLocating(true);
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setProfileForm(prev => ({
                                  ...prev,
                                  latitude: position.coords.latitude,
                                  longitude: position.coords.longitude
                                }));
                                setIsProfileLocating(false);
                                triggerToast(`GPS Coordinates detected: (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`, 'success');
                              },
                              (err) => {
                                setIsProfileLocating(false);
                                triggerToast(`Geolocation permission denied: ${err.message}`, 'info');
                              }
                            );
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.55rem 1rem',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <MapPin size={15} />
                          <span>{isProfileLocating ? 'Detecting GPS...' : '🎯 Detect My GPS Location'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProfileLocating}
                          onClick={async () => {
                            const query = profileForm.address || profileForm.city || 'Kochi';
                            if (!query) {
                              triggerToast('Please enter business address or city name', 'info');
                              return;
                            }
                            try {
                              setIsProfileLocating(true);
                              const res = await geocodeAddress(`${query}, ${profileForm.city || ''}, India`);
                              setProfileForm(prev => ({
                                ...prev,
                                latitude: res.latitude,
                                longitude: res.longitude,
                                address: prev.address || res.formattedAddress
                              }));
                              triggerToast(`Map coordinates found: (${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)})`, 'success');
                            } catch (err: any) {
                              triggerToast(err.message || 'Could not find map location.', 'info');
                            } finally {
                              setIsProfileLocating(false);
                            }
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1',
                            padding: '0.55rem 1rem',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <Search size={15} />
                          <span>🔍 Search Map Address</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Latitude *</label>
                          <input
                            type="number"
                            step="any"
                            className="form-input-text"
                            required
                            placeholder="e.g. 9.9312"
                            value={profileForm.latitude !== undefined && profileForm.latitude !== null ? profileForm.latitude : ''}
                            onChange={(e) => setProfileForm({ ...profileForm, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Longitude *</label>
                          <input
                            type="number"
                            step="any"
                            className="form-input-text"
                            required
                            placeholder="e.g. 76.2673"
                            value={profileForm.longitude !== undefined && profileForm.longitude !== null ? profileForm.longitude : ''}
                            onChange={(e) => setProfileForm({ ...profileForm, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-actions-row full-width">
                      <button type="submit" className="btn-primary">
                        Save Profile Updates
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </main>
        } />

        <Route path="/wishlist" element={
          activeShop ? (
            <Navigate to="/seller-dashboard" replace />
          ) : (
            <WishlistPage
              wishlistProducts={wishlistItems}
              onRemoveWishlist={(id) => {
                const prod = products.find(p => p.id === id) || wishlistItems.find(i => i.id === id || (i as any).productId === id || (i as any).wishlistRecordId === id);
                const targetProd = (prod as any)?.product || prod;
                if (targetProd) {
                  handleToggleWishlist(targetProd as Product);
                } else {
                  handleToggleWishlist({ id, name: 'Item', price: 0 } as Product);
                }
              }}
              onCallSeller={handleCallSeller}
              onWhatsAppSeller={handleWhatsAppSeller}
              onSelectProduct={(product) => {
                dispatch(setSelectedProduct(product));
                navigate(`/product/${product.id}`);
              }}
              activeUser={activeUser}
              onOpenLogin={() => {
                dispatch(setAuthRole('customer'));
                dispatch(setAuthTab('login'));
                dispatch(setShowAuthModal(true));
              }}
            />
          )
        } />

        <Route path="/product/:id" element={
          <ProductDetailPage
            getSellerShop={getSellerShop}
            onCallSeller={handleCallSeller}
            onWhatsAppSeller={handleWhatsAppSeller}
            onGetDirections={handleGetDirections}
            onToast={triggerToast}
            isWishlisted={(id) => wishlistProductIds.includes(id)}
            onToggleWishlist={handleToggleWishlist}
          />
        } />
      </Routes>

      {/* --- SELLER DASHBOARD PRODUCT DETAIL MODAL --- */}
      <ProductDetailModal
        product={viewingSellerProduct}
        isOpen={Boolean(viewingSellerProduct)}
        onClose={() => setViewingSellerProduct(null)}
        onEdit={(prod) => {
          setViewingSellerProduct(null);
          handleOpenEditProduct(prod);
        }}
      />


      <Footer />

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      <AddEditProductModal onToast={triggerToast} />

      {/* --- LOGOUT CONFIRMATION MODAL (BOTH FOR CUSTOMER AND SELLER) --- */}
      {logoutConfirmType && (
        <div
          className="modal-overlay"
          onClick={() => setLogoutConfirmType(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '2.25rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setLogoutConfirmType(null)}
              style={{
                position: 'absolute',
                top: '1.1rem',
                right: '1.1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            {/* Top MLX Brand Accent Strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #ff6f00 0%, #ea580c 50%, #f59e0b 100%)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px'
              }}
            />

            {/* Icon Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1.5px solid #fed7aa',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0.25rem auto 1.25rem',
                boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.25)'
              }}
            >
              <LogOut size={28} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
              {logoutConfirmType === 'seller' ? 'Log out of Store Portal?' : 'Log out of your Account?'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1.75rem', lineHeight: 1.55 }}>
              {logoutConfirmType === 'seller'
                ? `Are you sure you want to log out of "${activeShop?.name || 'Seller Portal'}"? You will need to sign in again to manage products and buyer leads.`
                : `Are you sure you want to log out${activeUser?.name ? `, ${getFormattedUserName(activeUser)}` : ''}? You will need to sign in again to view your wishlist and inquiries.`}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setLogoutConfirmType(null)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.38)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
              >
                <LogOut size={16} />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AUTHENTICATION MODAL (LOGIN & REGISTRATION) --- */}
      <AuthModal onToast={triggerToast} />
    </div>
  );
}
