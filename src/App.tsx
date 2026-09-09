import { ProductDetailModal } from './components/ProductDetailModal';
import { ManageCategoriesBrandsModal } from './components/ManageCategoriesBrandsModal';
import { NetworkCreateModal } from './components/NetworkCreateModal';
import { Footer } from './components/Footer';
import { getProducts, getShops, registerUser, createSellerProduct, sendLead, getFollowedShops, unfollowShop, getNetworkInquiries, getShopFollowers } from './services/apiService';
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
  Network,
  UserCheck,
  Plus, 
  Edit, 
  Trash2, 
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
  Calendar
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from './store';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  setActiveShop, 
  setActiveUser,
  setAuthRole,
  setShowAuthModal, 
  setAuthTab 
} from './store/authSlice';
import { 
  addShop, 
  updateShop,
  addProduct, 
  editProduct, 
  setSelectedProduct, 
  setShowAddEditModal, 
  setProductToEdit,
  addLead,
  setProducts,
  setShops
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
import { CATEGORIES, CITIES, BUDGET_PRESETS, INITIAL_USERS } from './data/mockData';
import { Product, Shop, Lead, User as CustomerUser } from './types';

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

export default function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- REDUX SELECTORS ---
  const { activeShop, activeUser, authRole, showAuthModal, authTab } = useAppSelector(state => state.auth);
  const { items: products, shops, leads, selectedProduct, showAddEditModal, productToEdit } = useAppSelector(state => state.products);
  const { toasts, dashboardTab } = useAppSelector(state => state.ui);
  const filters = useAppSelector(state => state.filters);

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
        const liveShops = await getShops();
        if (liveProducts) {
          dispatch(setProducts(liveProducts));
        }
        if (liveShops && liveShops.length > 0) {
          dispatch(setShops(liveShops));
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
  const [customerEmailInput, setCustomerEmailInput] = React.useState('');
  const [loginPasswordInput, setLoginPasswordInput] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isCatBrandModalOpen, setIsCatBrandModalOpen] = React.useState(false);
  const [shopFollowers, setShopFollowers] = React.useState<Array<{ id: string; name: string; email?: string; phone?: string; followedAt: string }>>([]);
  const [shopFollowersCount, setShopFollowersCount] = React.useState<number>(0);

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
  
  const [customerRegisterForm, setCustomerRegisterForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Network inquiry modal state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = React.useState(false);

  // customer dashboard sub-navigation tab state
  const [customerTab, setCustomerTab] = React.useState<'inquiries' | 'following' | 'network' | 'profile'>('inquiries');
  const [followedShops, setFollowedShops] = React.useState<Shop[]>([]);
  const [networkInquiriesList, setNetworkInquiriesList] = React.useState<any[]>([]);

  // customer profile editor form inputs state
  const [custProfileForm, setCustProfileForm] = React.useState({
    name: '',
    email: '',
    phone: ''
  });

  // Sync profile editor fields & load customer dashboard data when logged in
  React.useEffect(() => {
    if (activeUser) {
      setCustProfileForm({
        name: activeUser.name,
        email: activeUser.email,
        phone: activeUser.phone
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
      }
      try {
        const inqs = await getNetworkInquiries();
        setNetworkInquiriesList(inqs);
      } catch (err) {
        console.warn('Failed to load network inquiries:', err);
      }
    }
    loadCustomerData();
  }, [activeUser, customerTab]);

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

  const [registerForm, setRegisterForm] = React.useState({
    name: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Kochi',
    category: 'Mobiles & Tablets'
  });

  const [productForm, setProductForm] = React.useState<{
    name: string;
    brand: string;
    category: string;
    description: string;
    price: string;
    offerPrice: string;
    stock: string;
    storage: string;
    ram: string;
    batteryHealth: string;
    condition: string;
    warranty: string;
    color: string;
    simType: string;
    network: string;
    originalBill: boolean;
    accessories: string[];
    purchasedFromAmazon: boolean;
    isAmazonRefurbished: boolean;
    images: string[];
  }>({
    name: '',
    brand: '',
    category: 'Mobiles',
    description: '',
    price: '',
    offerPrice: '',
    stock: '1',
    storage: '128GB',
    ram: '8GB',
    batteryHealth: '85% Health',
    condition: 'Grade A (Like New)',
    warranty: '3 Months Shop Warranty',
    color: 'Black',
    simType: 'Dual SIM',
    network: '5G',
    originalBill: true,
    accessories: ['Box', 'Charger', 'Cable'],
    purchasedFromAmazon: false,
    isAmazonRefurbished: false,
    images: ['', '', '', '', '', '', '']
  });

  const [profileForm, setProfileForm] = React.useState({
    name: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    category: ''
  });

  // Sync profile form when dashboard tab loads or activeShop changes
  React.useEffect(() => {
    if (activeShop) {
      setProfileForm({
        name: activeShop.name,
        ownerName: activeShop.ownerName,
        phone: activeShop.phone,
        whatsapp: activeShop.whatsapp,
        address: activeShop.address,
        city: activeShop.city,
        category: activeShop.category || 'Mobiles & Tablets'
      });
    }
  }, [activeShop, dashboardTab]);

    React.useEffect(() => {
    
  }, [selectedProduct]);

  // Sync edit product form
  React.useEffect(() => {
    if (productToEdit) {
      const existingImgs = [...(productToEdit.images || [])];
      while (existingImgs.length < 7) existingImgs.push('');
      setProductForm({
        name: productToEdit.name,
        brand: productToEdit.brand,
        category: productToEdit.category,
        description: productToEdit.description,
        price: productToEdit.price.toString(),
        offerPrice: productToEdit.offerPrice ? productToEdit.offerPrice.toString() : '',
        stock: productToEdit.stock.toString(),
        storage: productToEdit.storage || productToEdit.specs?.['Storage'] || '128GB',
        ram: productToEdit.ram || productToEdit.specs?.['RAM'] || '8GB',
        batteryHealth: productToEdit.batteryHealth || productToEdit.specs?.['Battery'] || '85% Health',
        condition: productToEdit.condition || productToEdit.specs?.['Condition'] || 'Grade A (Like New)',
        warranty: productToEdit.warranty || productToEdit.specs?.['Warranty'] || '3 Months Shop Warranty',
        color: productToEdit.color || 'Black',
        simType: productToEdit.simType || 'Dual SIM',
        network: productToEdit.network || '5G',
        originalBill: productToEdit.originalBill !== undefined ? productToEdit.originalBill : true,
        accessories: productToEdit.accessories || ['Box', 'Charger', 'Cable'],
        purchasedFromAmazon: !!productToEdit.purchasedFromAmazon,
        isAmazonRefurbished: !!productToEdit.isAmazonRefurbished,
        images: existingImgs.slice(0, 7)
      });
    } else {
      setProductForm({
        name: '',
        brand: '',
        category: 'Mobiles',
        description: '',
        price: '',
        offerPrice: '',
        stock: '1',
        storage: '128GB',
        ram: '8GB',
        batteryHealth: '85% Health',
        condition: 'Grade A (Like New)',
        warranty: '3 Months Shop Warranty',
        color: 'Black',
        simType: 'Dual SIM',
        network: '5G',
        originalBill: true,
        accessories: ['Box', 'Charger', 'Cable'],
        purchasedFromAmazon: false,
        isAmazonRefurbished: false,
        images: ['', '', '', '', '', '', '']
      });
    }
  }, [productToEdit, showAddEditModal]);

  // --- HELPERS ---
  const getSellerShop = (shopId: string): Shop => {
    return shops.find(s => s.id === shopId) || {
      id: "unknown",
      name: "Unknown Seller Shop",
      ownerName: "Dealer",
      phone: "+91 99999 99999",
      whatsapp: "919999999999",
      address: "Dealer Location",
      city: "India",
      category: "All Tech Products",
      verified: false,
      rating: 4.0,
      joinedDate: "Unknown"
    };
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
    const matchesSearchCat = filters.searchCategory === 'All Categories' || 
      product.category.toLowerCase() === filters.searchCategory.toLowerCase();

    // 3. Quick-bar category select
    const matchesQuickCat = filters.selectedCategory === 'All Categories' || 
      product.category.toLowerCase() === filters.selectedCategory.toLowerCase();

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

  // --- HANDLERS ---
  const triggerToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    dispatch(addToast({ message, type }));
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (authRole === 'seller') {
      if (!customerEmailInput) return;
      // Strip out any non-digits from input for comparison
      const enteredPhone = customerEmailInput.replace(/\D/g, '').trim();
      
      if (!enteredPhone) {
        alert("Please enter a valid phone number to sign in.");
        return;
      }

      // Find shop by comparing the numeric digits of phone or whatsapp numbers
      const shop = shops.find(s => {
        const shopPhoneClean = s.phone.replace(/\D/g, '');
        const shopWhatsappClean = s.whatsapp.replace(/\D/g, '');
        return shopPhoneClean.endsWith(enteredPhone) || shopWhatsappClean.endsWith(enteredPhone) || s.phone.includes(enteredPhone);
      });
      
      if (shop) {
        dispatch(setActiveShop(shop));
        dispatch(setActiveUser(null)); // Logout user
        dispatch(setShowAuthModal(false));
        triggerToast(`Welcome back, ${shop.name}!`, 'success');
        navigate('/seller-dashboard');
        dispatch(setDashboardTab('listings'));
        setCustomerEmailInput('');
        setLoginPasswordInput('');
      } else {
        alert(`No registered store partner found with phone number matching "${customerEmailInput}". Please check the phone number or register a new shop account.`);
      }
    } else {
      // Customer login logic
      if (!customerEmailInput) return;
      const cleanInput = customerEmailInput.toLowerCase().trim();

      // Retrieve dynamic registered users from localStorage
      let customUsers: CustomerUser[] = [];
      try {
        const savedUsers = localStorage.getItem('mlx_registered_users');
        if (savedUsers) customUsers = JSON.parse(savedUsers);
      } catch (err) {
        console.error(err);
      }

      const allUsers = [...INITIAL_USERS, ...customUsers];
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === cleanInput || u.phone.replace(/\D/g, '') === customerEmailInput.replace(/\D/g, '').trim());
      
      if (matchedUser) {
        dispatch(setActiveUser(matchedUser));
        dispatch(setActiveShop(null)); // Logout seller
        dispatch(setShowAuthModal(false));
        triggerToast(`Welcome back, ${matchedUser.name}!`, 'success');
        navigate('/customer-dashboard');
        setCustomerEmailInput('');
        setLoginPasswordInput('');
      } else {
        // Fallback demo user creation
        const demoUser: CustomerUser = {
          id: `user-${Date.now()}`,
          name: "Guest Customer",
          email: customerEmailInput.includes('@') ? customerEmailInput.trim() : `${customerEmailInput.replace(/\D/g, '') || Date.now()}@mlx.com`,
          phone: customerEmailInput.includes('@') ? "+91 90000 00000" : customerEmailInput.trim()
        };
        dispatch(setActiveUser(demoUser));
        dispatch(setActiveShop(null));
        dispatch(setShowAuthModal(false));
        triggerToast(`Signed in as ${demoUser.name} (${demoUser.email})`, 'success');
        navigate('/customer-dashboard');
        setCustomerEmailInput('');
        setLoginPasswordInput('');
      }
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (authRole === 'seller') {
      if (!registerForm.name || !registerForm.ownerName || !registerForm.phone || !registerForm.whatsapp || !registerForm.email || !registerForm.password) {
        alert("Please fill in all mandatory fields including Email and Password.");
        return;
      }
      try {
        const resData = await registerUser({
          email: registerForm.email,
          password: registerForm.password,
          name: registerForm.name,
          phone: registerForm.phone,
          role: 'seller',
          shopName: registerForm.name,
          ownerName: registerForm.ownerName,
          whatsapp: registerForm.whatsapp.replace(/\D/g, ''),
          address: registerForm.address || "Dealer Main Market",
          city: registerForm.city,
          category: registerForm.category,
        });

        if (resData.token) {
          localStorage.setItem('mlx_token', resData.token);
        }

        const newShop: Shop = resData.user?.shop || {
          id: resData.user?.id || `shop-${shops.length + 1}`,
          name: registerForm.name,
          ownerName: registerForm.ownerName,
          phone: registerForm.phone,
          whatsapp: registerForm.whatsapp.replace(/\D/g, ''),
          address: registerForm.address || "Dealer Main Market",
          city: registerForm.city,
          category: registerForm.category,
          verified: true,
          rating: 5.0,
          joinedDate: "Today"
        };

        dispatch(addShop(newShop));
        dispatch(setActiveShop(newShop));
        dispatch(setActiveUser(resData.user || null));
        dispatch(setShowAuthModal(false));
        triggerToast(`Shop "${registerForm.name}" registered in DB successfully!`, 'success');
        navigate('/seller-dashboard');
        
        // reset form
        setRegisterForm({
          name: '',
          ownerName: '',
          email: '',
          password: '',
          phone: '',
          whatsapp: '',
          address: '',
          city: 'Kochi',
          category: 'Mobiles & Tablets'
        });
      } catch (err: any) {
        alert(err.message || "Failed to register shop account in database.");
      }
    } else {
      // Customer registration logic
      if (!customerRegisterForm.name || !customerRegisterForm.email || !customerRegisterForm.phone || !customerRegisterForm.password) {
        alert("Please fill in all mandatory fields including Password.");
        return;
      }
      const newCust: CustomerUser = {
        id: `user-${Date.now()}`,
        name: customerRegisterForm.name,
        email: customerRegisterForm.email,
        phone: customerRegisterForm.phone
      };

      // Save new user profile dynamically to localStorage
      let customUsers: CustomerUser[] = [];
      try {
        const savedUsers = localStorage.getItem('mlx_registered_users');
        if (savedUsers) customUsers = JSON.parse(savedUsers);
      } catch (err) {
        console.error(err);
      }
      customUsers.push(newCust);
      localStorage.setItem('mlx_registered_users', JSON.stringify(customUsers));

      dispatch(setActiveUser(newCust));
      dispatch(setActiveShop(null));
      dispatch(setShowAuthModal(false));
      triggerToast(`Welcome to MLX Market, ${customerRegisterForm.name}!`, 'success');
      navigate('/customer-dashboard');

      setCustomerRegisterForm({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
    }
  };

  const handleProfileUpdate = (e: FormEvent) => {
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
      category: profileForm.category
    };
    
    dispatch(updateShop(updated));
    dispatch(setActiveShop(updated));
    triggerToast("Shop profile updated successfully!", "success");
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

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeShop) return;

    // Validate min 4 photos
    const validImages = productForm.images.filter(img => img.trim() !== '');
    if (validImages.length < 4) {
      alert("Please provide photos from at least 4 angles (Front side, Back side, and Side angles)!");
      return;
    }

    const specs: Record<string, string> = {
      Storage: productForm.storage,
      RAM: productForm.ram,
      Battery: productForm.batteryHealth,
      Condition: productForm.condition,
      Warranty: productForm.warranty,
      Color: productForm.color,
      SIM: productForm.simType,
      Network: productForm.network
    };

    const offerPriceNum = productForm.offerPrice ? parseFloat(productForm.offerPrice) : undefined;

    if (productToEdit) {
      const updated: Product = {
        ...productToEdit,
        name: productForm.name,
        brand: productForm.brand,
        category: productForm.category,
        description: productForm.description,
        price: parseFloat(productForm.price),
        offerPrice: offerPriceNum,
        stock: parseInt(productForm.stock),
        storage: productForm.storage,
        ram: productForm.ram,
        batteryHealth: productForm.batteryHealth,
        condition: productForm.condition,
        warranty: productForm.warranty,
        color: productForm.color,
        simType: productForm.simType,
        network: productForm.network,
        originalBill: productForm.originalBill,
        accessories: productForm.accessories,
        specs,
        images: validImages
      };
      dispatch(editProduct(updated));
      triggerToast("Listing updated successfully!", "success");
    } else {
      const token = localStorage.getItem('mlx_token');
      if (token) {
        try {
          const savedProd = await createSellerProduct({
            name: productForm.name,
            brand: productForm.brand,
            category: productForm.category,
            description: productForm.description,
            price: parseFloat(productForm.price),
            stock: parseInt(productForm.stock),
            specs,
            images: validImages
          }, token);

          const newProduct: Product = {
            id: savedProd.id || `prod-${Date.now()}`,
            name: savedProd.name || productForm.name,
            brand: savedProd.brand || productForm.brand,
            category: savedProd.category || productForm.category,
            description: savedProd.description || productForm.description,
            price: savedProd.price || parseFloat(productForm.price),
            offerPrice: offerPriceNum,
            stock: savedProd.stock || parseInt(productForm.stock),
            shopId: savedProd.shopId || activeShop.id,
            storage: productForm.storage,
            ram: productForm.ram,
            batteryHealth: productForm.batteryHealth,
            condition: productForm.condition,
            warranty: productForm.warranty,
            color: productForm.color,
            simType: productForm.simType,
            network: productForm.network,
            originalBill: productForm.originalBill,
            accessories: productForm.accessories,
            specs: savedProd.specs || specs,
            images: savedProd.images || validImages
          };
          dispatch(addProduct(newProduct));
          triggerToast("New used gadget listed in database successfully!", "success");
        } catch (err: any) {
          alert(err.message || 'Failed to list product in database');
          return;
        }
      } else {
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          name: productForm.name,
          brand: productForm.brand,
          category: productForm.category,
          description: productForm.description,
          price: parseFloat(productForm.price),
          offerPrice: offerPriceNum,
          stock: parseInt(productForm.stock),
          shopId: activeShop.id,
          storage: productForm.storage,
          ram: productForm.ram,
          batteryHealth: productForm.batteryHealth,
          condition: productForm.condition,
          warranty: productForm.warranty,
          color: productForm.color,
          simType: productForm.simType,
          network: productForm.network,
          originalBill: productForm.originalBill,
          accessories: productForm.accessories,
          specs,
          images: validImages
        };
        dispatch(addProduct(newProduct));
        triggerToast("New used gadget listed successfully!", "success");
      }
    }

    dispatch(setShowAddEditModal(false));
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
      });
    } catch (err) {
      console.warn('Lead API submission fallback:', err);
    }
  };

  const handleCallSeller = (product: Product, seller: Shop) => {
    triggerLeadCapture(product, seller, 'call');
    triggerToast(`📞 Direct Call lead logged! Connecting call with ${seller.name} (${seller.phone})...`, 'success');
    if (seller.phone) {
      window.location.href = `tel:${seller.phone}`;
    }
  };

  const handleWhatsAppSeller = (product: Product, seller: Shop) => {
    triggerLeadCapture(product, seller, 'whatsapp');
    const name = activeUser ? activeUser.name : "Customer";
    const text = `Hi ${seller.ownerName}, I saw your product "${product.name}" listed for ₹${product.price.toLocaleString('en-IN')} on MLX Market. I am interested in buying it. Is it still available? - Sent by ${name}`;
    const waUrl = `https://wa.me/${seller.whatsapp}?text=${encodeURIComponent(text)}`;
    triggerToast(`💬 Opening WhatsApp chat with ${seller.name} regarding "${product.name}"...`, 'success');
    window.open(waUrl, '_blank');
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
    } else if (tagType === 'category') {
      dispatch(setSelectedCategory(value));
    } else if (tagType === 'budget') {
      dispatch(setFilterMaxBudget(value));
    } else if (tagType === 'city') {
      dispatch(setFilterCity(value));
    }
    setIsSearchFocused(false);
    navigate('/');
  };

  return (
    <div className="app-container">
      {/* Toast Alert Popups */}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => dispatch(removeToast(toast.id))} 
          />
        ))}
      </div>

      {/* --- SITE HEADER --- */}
      <header className="site-header">
        <div className="header-container">
          <div className="logo-section" onClick={() => { navigate('/'); dispatch(clearFilters()); }}>
            <img src="/logo.png" alt="MLX Market Logo" className="logo-img" />
            <div className="logo-text">
              <span className="logo-title">MLX <span>DIRECT</span></span>
              <span className="logo-subtitle">USED GADGETS DIRECTORY</span>
            </div>
          </div>

          {/* Search bar inside header with Instagram-Style dropdown overlay */}
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
                        <button key={city} className="min-tag city" onClick={() => handleTagClick('city', city)}>{city}</button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Budgets & Categories */}
                  <div className="overlay-minimal-row">
                    <span className="min-row-lbl">Budgets:</span>
                    <div className="minimal-tags">
                      <button className="min-tag budget" onClick={() => handleTagClick('budget', 'Under ₹5,000')}>&lt; 5k</button>
                      <button className="min-tag budget" onClick={() => handleTagClick('budget', 'Under ₹10,000')}>&lt; 10k</button>
                      <button className="min-tag budget" onClick={() => handleTagClick('budget', 'Under ₹25,000')}>&lt; 25k</button>
                    </div>
                    <span className="min-row-lbl" style={{ marginLeft: '0.5rem' }}>Categories:</span>
                    <div className="minimal-tags">
                      <button className="min-tag cat" onClick={() => handleTagClick('category', 'Mobiles')}>Mobiles</button>
                      <button className="min-tag cat" onClick={() => handleTagClick('category', 'Laptops')}>Laptops</button>
                      <button className="min-tag cat" onClick={() => handleTagClick('category', 'Smart Watches')}>Watches</button>
                    </div>
                  </div>

                                    {/* Row 3: Trending Models */}
                  <div className="overlay-minimal-row" style={{ borderTop: '1px solid var(--light-border)', paddingTop: '0.5rem', marginTop: '0.25rem', width: '100%' }}>
                    <span className="min-row-lbl">Trending:</span>
                    <div className="minimal-tags">
                      <button className="min-tag model" onClick={() => handleTagClick('query', 'iPhone 13')}>iPhone 13</button>
                      <button className="min-tag model" onClick={() => handleTagClick('query', 'Samsung S22')}>Samsung S22</button>
                      <button className="min-tag model" onClick={() => handleTagClick('query', 'MacBook Air')}>MacBook Air</button>
                      <button className="min-tag model" onClick={() => handleTagClick('query', 'OnePlus')}>OnePlus</button>
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

          {/* Header Action Buttons for standard Users and Seller Shop Portal */}
          <div className="header-actions">
            <button
              className="action-btn"
              onClick={() => setIsNetworkModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '10px',
                padding: '0.45rem 0.8rem',
                cursor: 'pointer',
              }}
              title="Broadcast Local Shop Request"
            >
              <Network size={15} />
              <span className="nav-btn-text">Local Network</span>
            </button>

            {activeShop ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className={`action-btn sell-btn ${location.pathname === '/seller-dashboard' ? 'active' : ''}`} 
                  onClick={() => { navigate('/seller-dashboard'); dispatch(setDashboardTab('listings')); }}
                >
                  <Store size={16} />
                  <span className="nav-btn-text">Shop Dashboard</span>
                </button>
                <span className="user-indicator">
                  <Store size={14} />
                  <span className="user-badge-text-container">
                    <span className="user-badge-name">{activeShop.name}</span>
                    <span className="user-badge-role"> (Seller)</span>
                  </span>
                </span>
                <button className="action-btn" onClick={() => { dispatch(setActiveShop(null)); triggerToast("Seller logged out."); navigate('/'); }} title="Logout Shop">
                  <LogOut size={16} />
                </button>
              </div>
            ) : activeUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className={`action-btn sell-btn ${location.pathname === '/customer-dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/customer-dashboard')}
                >
                  <Layers size={15} />
                  <span className="nav-btn-text">My Dashboard</span>
                </button>
                <span className="user-indicator">
                  <User size={14} />
                  <span className="user-badge-text-container">
                    <span className="user-badge-name">{activeUser.name}</span>
                    <span className="user-badge-role"> (Buyer)</span>
                  </span>
                </span>
                <button className="action-btn" onClick={() => { dispatch(setActiveUser(null)); triggerToast("Logged out successfully."); navigate('/'); }} title="Logout User">
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
      {location.pathname === '/' && (
        <div className="category-bar">
          <div className="category-container">
            {CATEGORIES.map(cat => (
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
      {location.pathname === '/' && (
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
          <main className="main-content" id="marketplace-grid">
          {/* Sidebar Filters */}
          <aside className="sidebar-filters">
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
              <div className="product-grid">
                {/* Dynamically insert Center Banner in between products (after 3 items) */}
                {sortedProducts.map((product, index) => {
                  const seller = getSellerShop(product.shopId);
                  const isOutOfStock = product.stock <= 0;
                  
                  const renderCard = (
                    <article 
                      key={product.id} 
                      className="product-card"
                      onClick={() => dispatch(setSelectedProduct(product))}
                    >
                      <div className="card-img-wrapper">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="product-card-img" />
                        ) : (
                          renderCategoryIcon(product.category)
                        )}
                        <span className={`tag-stock ${isOutOfStock ? 'out' : 'in'}`}>
                          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock} units`}
                        </span>
                        {product.specs?.['Condition'] && (
                          <span className="tag-condition">{product.specs['Condition']}</span>
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
                                <MapPin size={18} />
                              </div>
                              <span className="step-card-num">Step 1</span>
                              <p className="step-card-txt">Select your city and browse used gadgets near you</p>
                            </div>
                            
                            <div className="process-step-card">
                              <div className="step-icon-wrapper">
                                <Phone size={18} />
                              </div>
                              <span className="step-card-num">Step 2</span>
                              <p className="step-card-txt">Click WhatsApp or Call to contact the store directly</p>
                            </div>
                            
                            <div className="process-step-card">
                              <div className="step-icon-wrapper">
                                <CheckCircle size={18} />
                              </div>
                              <span className="step-card-num">Step 3</span>
                              <p className="step-card-txt">Meet dealer, physically inspect the gadget, and buy</p>
                            </div>
                          </div>
                          <span className="process-footer">No hidden platform fees. No commissions. Pure peer-to-merchant deals.</span>
                        </div>
                        {renderCard}
                      </React.Fragment>
                    );
                  }

                  return renderCard;
                })}
              </div>
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
      } />
      
      <Route path="/customer-dashboard" element={
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
                className={`dash-menu-btn ${customerTab === 'network' ? 'active' : ''}`}
                onClick={() => setCustomerTab('network')}
              >
                <Network size={16} />
                <span>Network Requests</span>
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
                  
                  {leads.filter(l => activeUser && l.customerPhone === activeUser.phone).length > 0 ? (
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
                        {leads.filter(l => activeUser && l.customerPhone === activeUser.phone).map((lead) => {
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
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary-light)' }}>
                      <HelpCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p>You haven't made any inquiries yet. Click Call/WhatsApp on any used device to connect with local stores!</p>
                      <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                        Browse Used Gadgets
                      </button>
                    </div>
                  )}
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
            ) : customerTab === 'network' ? (
              /* Network Broadcast Requests Tab */
              <div className="dashboard-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="panel-title">City Network Requests</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                      Broadcast gadget requests directly to local shop networks
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setIsNetworkModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Network size={16} />
                    <span>Broadcast New Request</span>
                  </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {networkInquiriesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {networkInquiriesList.map((inq: any) => (
                        <div
                          key={inq.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--light-border)',
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{inq.gadgetNeeded}</span>
                              <span style={{ fontSize: '0.75rem', background: '#ffedd5', color: '#c2410c', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                                📍 {inq.city} Network
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>
                              Category: <strong>{inq.category}</strong> {inq.targetBudget ? `| Budget: ₹${inq.targetBudget.toLocaleString('en-IN')}` : ''}
                            </div>
                            {inq.notes && (
                              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>
                                "{inq.notes}"
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                            <div>Requested by: {inq.customerName}</div>
                            <div>{new Date(inq.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary-light)' }}>
                      <Network size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p>No active network requests found. Click "Broadcast New Request" to ask local shop owners for any device!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Customer Profile Edit */
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">My Profile Details</h3>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!custProfileForm.name || !custProfileForm.email || !custProfileForm.phone) {
                      alert("Please fill in all required fields.");
                      return;
                    }
                    if (activeUser) {
                      const updatedUser = {
                        ...activeUser,
                        name: custProfileForm.name,
                        email: custProfileForm.email,
                        phone: custProfileForm.phone
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
                      triggerToast("Profile updated successfully!", "success");
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({...custProfileForm, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      className="form-input-text" 
                      required
                      value={custProfileForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({...custProfileForm, email: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Phone Number *</label>
                    <input 
                      type="tel" 
                      className="form-input-text" 
                      required
                      value={custProfileForm.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustProfileForm({...custProfileForm, phone: e.target.value})}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, backgroundColor: 'var(--success-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <ShieldCheck size={12} />
                <span>Verified Seller Shop</span>
              </div>
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

            <div className="dashboard-menu">
              <button 
                className={`dash-menu-btn ${dashboardTab === 'listings' ? 'active' : ''}`}
                onClick={() => dispatch(setDashboardTab('listings'))}
              >
                <Layers size={16} />
                <span>Manage Product Listings</span>
              </button>
              
              {/* New Leads Report Tab */}
              <button 
                className={`dash-menu-btn ${dashboardTab === 'leads' ? 'active' : ''}`}
                onClick={() => dispatch(setDashboardTab('leads'))}
              >
                <MessageSquare size={16} />
                <span>Leads & Performance Report</span>
              </button>

              <button 
                className={`dash-menu-btn ${dashboardTab === 'followers' ? 'active' : ''}`}
                onClick={() => dispatch(setDashboardTab('followers'))}
              >
                <UserCheck size={16} />
                <span>My Store Followers ({shopFollowersCount})</span>
              </button>

              <button 
                className={`dash-menu-btn ${dashboardTab === 'profile' ? 'active' : ''}`}
                onClick={() => dispatch(setDashboardTab('profile'))}
              >
                <User size={16} />
                <span>Edit Shop Profile</span>
              </button>

              <button 
                className="dash-menu-btn"
                onClick={() => setIsCatBrandModalOpen(true)}
              >
                <Tag size={16} />
                <span>Manage Categories & Brands</span>
              </button>
              
              <button className="dash-menu-btn" onClick={() => navigate('/')} style={{ borderTop: '1px solid var(--light-border)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                <Store size={16} />
                <span>Back to Marketplace Directory</span>
              </button>
            </div>
          </aside>

          <section style={{ flex: 1 }}>
            {dashboardTab === 'listings' ? (
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">My Used Devices Inventory</h3>
                  <button className="btn-primary" onClick={handleOpenAddProduct} style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                    <Plus size={16} />
                    <span>List Used Product</span>
                  </button>
                </div>

                <div className="listings-list">
                  {products.filter(p => p.shopId === activeShop?.id).length > 0 ? (
                    products.filter(p => p.shopId === activeShop?.id).map(product => (
                      <div key={product.id} className="listing-item">
                        <div className="listing-preview-img">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="product-card-img" style={{ borderRadius: 'var(--radius-sm)' }} />
                          ) : (
                            renderCategoryIcon(product.category, "listing-preview-svg")
                          )}
                        </div>
                        <div className="listing-info">
                          <span className="listing-name">{product.name}</span>
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
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)' }}>
                      <Layers size={36} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p>You have not listed any gadgets for customers to discover yet.</p>
                      <button className="btn-primary" onClick={handleOpenAddProduct} style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                        List Your First Device
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : dashboardTab === 'leads' ? (
              /* Leads Report Panel */
              <div className="dashboard-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Customer Lead Inquiries Report</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                    Subscription Billing: <strong>Active (Per Lead Model)</strong>
                  </div>
                </div>

                <div className="leads-metric-cards">
                  <div className="metric-card">
                    <span className="metric-num">{leads.filter(l => l.shopId === activeShop?.id).length}</span>
                    <span className="metric-lbl">Total Sourced Leads</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-num">{leads.filter(l => l.shopId === activeShop?.id && l.contactType === 'whatsapp').length}</span>
                    <span className="metric-lbl">WhatsApp Inquiries</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-num">{leads.filter(l => l.shopId === activeShop?.id && l.contactType === 'call').length}</span>
                    <span className="metric-lbl">Direct Calls Logged</span>
                  </div>
                </div>

                <div className="leads-list-container" style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Inquiry Log History</h4>
                  
                  {leads.filter(l => l.shopId === activeShop?.id).length > 0 ? (
                    <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--light-bg)', textAlign: 'left', borderBottom: '1px solid var(--light-border)' }}>
                          <th style={{ padding: '0.75rem' }}>Date & Time</th>
                          <th style={{ padding: '0.75rem' }}>Product Device</th>
                          <th style={{ padding: '0.75rem' }}>Customer (Buyer)</th>
                          <th style={{ padding: '0.75rem' }}>Phone Details</th>
                          <th style={{ padding: '0.75rem' }}>Inquiry Channel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.filter(l => l.shopId === activeShop?.id).map((lead) => (
                          <tr key={lead.id} style={{ borderBottom: '1px solid var(--light-border)' }}>
                            <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Calendar size={14} style={{ color: 'var(--text-secondary-light)' }} />
                              <span>{new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{lead.productName}</td>
                            <td style={{ padding: '0.75rem' }}>{lead.customerName}</td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{lead.customerPhone}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`lead-badge ${lead.contactType}`}>
                                {lead.contactType === 'whatsapp' ? 'WhatsApp Clicks' : 'Direct Call Clicks'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)' }}>
                      <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p>No customer contacts recorded yet. Make sure your shop location and contact info are accurate to attract clicks!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : dashboardTab === 'followers' ? (
              /* My Store Followers Panel */
              <div className="dashboard-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="panel-title">My Store Followers</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                      Customers who are following <strong>{activeShop?.name}</strong> for inventory updates
                    </div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                    Total Followers: {shopFollowersCount}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  {shopFollowers.length > 0 ? (
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
                        {shopFollowers.map((follower) => (
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
              </div>
            ) : (
              <div className="dashboard-panel">
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({...profileForm, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Name *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      value={profileForm.ownerName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({...profileForm, ownerName: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direct Phone Call Number *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      value={profileForm.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({...profileForm, phone: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp Number (e.g. 919876543210) *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      value={profileForm.whatsapp}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City Location *</label>
                    <select 
                      className="form-select-box"
                      value={profileForm.city}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfileForm({...profileForm, city: e.target.value})}
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
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfileForm({...profileForm, category: e.target.value})}
                    >
                      <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                      <option value="Laptops & Accessories">Laptops & Accessories</option>
                      <option value="Smart Watches & Audio">Smart Watches & Audio</option>
                      <option value="All Tech Products">All Tech Products</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Market Business Address *</label>
                    <textarea 
                      className="form-textarea" 
                      required
                      value={profileForm.address}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProfileForm({...profileForm, address: e.target.value})}
                    ></textarea>
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
      } /></Routes>

      <Footer />

      <ManageCategoriesBrandsModal
        isOpen={isCatBrandModalOpen}
        onClose={() => setIsCatBrandModalOpen(false)}
        onToast={triggerToast}
      />

      <ProductDetailModal
        getSellerShop={getSellerShop}
        onCallSeller={handleCallSeller}
        onWhatsAppSeller={handleWhatsAppSeller}
        onToast={triggerToast}
      />

      <NetworkCreateModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onSuccessToast={(msg) => triggerToast(msg, 'success')}
        defaultCustomerName={activeUser?.name || ''}
        defaultCustomerPhone={activeUser?.phone || ''}
      />

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {showAddEditModal && (
        <div className="modal-overlay" onClick={() => dispatch(setShowAddEditModal(false))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close-btn" onClick={() => dispatch(setShowAddEditModal(false))}>
              <X size={18} />
            </button>

            <div style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.75rem' }}>
                {productToEdit ? 'Edit Used Device Details' : 'List Used Gadget for Selling'}
              </h3>

              <form onSubmit={handleProductSubmit} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* 1. Multi-Angle Image Uploads */}
                <div className="form-group full-width" style={{ gridColumn: 'span 2', background: 'var(--card-bg, #f8f9fa)', padding: '1rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    📷 Multi-Angle Photos (Required: Min 4, Max 7) *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '0.75rem' }}>
                    Please provide photo URLs for required angles: Front, Back, Left Side, and Right Side.
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {[
                      { label: '1. Front Side (Required) *', placeholder: 'https://... front side photo URL' },
                      { label: '2. Back Side (Required) *', placeholder: 'https://... back side photo URL' },
                      { label: '3. Left/Right Side (Required) *', placeholder: 'https://... side angle photo URL' },
                      { label: '4. Top/Bottom Side (Required) *', placeholder: 'https://... top/bottom photo URL' },
                      { label: '5. Additional Angle 1 (Optional)', placeholder: 'https://... extra photo URL' },
                      { label: '6. Additional Angle 2 (Optional)', placeholder: 'https://... extra photo URL' },
                      { label: '7. Additional Angle 3 (Optional)', placeholder: 'https://... extra photo URL' },
                    ].map((slot, idx) => (
                      <div key={idx} style={{ gridColumn: idx === 0 ? 'span 2' : 'span 1' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{slot.label}</label>
                        <input
                          type="url"
                          className="form-input-text"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          required={idx < 4}
                          placeholder={slot.placeholder}
                          value={productForm.images[idx] || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const updatedImgs = [...productForm.images];
                            updatedImgs[idx] = e.target.value;
                            setProductForm({ ...productForm, images: updatedImgs });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Basic Info */}
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    className="form-input-text"
                    required
                    placeholder="e.g. Apple, Samsung, OnePlus"
                    value={productForm.brand}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name / Model *</label>
                  <input
                    type="text"
                    className="form-input-text"
                    required
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={productForm.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                {/* 3. Specs & Pricing */}
                <div className="form-group">
                  <label className="form-label">Storage Capacity *</label>
                  <select
                    className="form-select-box"
                    value={productForm.storage}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, storage: e.target.value })}
                  >
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">RAM *</label>
                  <select
                    className="form-select-box"
                    value={productForm.ram}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, ram: e.target.value })}
                  >
                    <option value="4GB">4GB</option>
                    <option value="6GB">6GB</option>
                    <option value="8GB">8GB</option>
                    <option value="12GB">12GB</option>
                    <option value="16GB">16GB</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Regular Listing Price (₹) *</label>
                  <input
                    type="number"
                    className="form-input-text"
                    required
                    placeholder="Regular price in INR"
                    value={productForm.price}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discounted Offer Price (₹)</label>
                  <input
                    type="number"
                    className="form-input-text"
                    placeholder="Offer price (optional)"
                    value={productForm.offerPrice}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Battery Health / Capacity *</label>
                  <input
                    type="text"
                    className="form-input-text"
                    required
                    placeholder="e.g. 88% Health or 5000mAh"
                    value={productForm.batteryHealth}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, batteryHealth: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Device Physical Condition *</label>
                  <select
                    className="form-select-box"
                    value={productForm.condition}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, condition: e.target.value })}
                  >
                    <option value="Grade A (Like New)">Grade A (Like New)</option>
                    <option value="Grade B (Superb)">Grade B (Superb)</option>
                    <option value="Grade C (Good)">Grade C (Good)</option>
                    <option value="Fair Condition">Fair Condition</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Warranty *</label>
                  <select
                    className="form-select-box"
                    value={productForm.warranty}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, warranty: e.target.value })}
                  >
                    <option value="None">None</option>
                    <option value="7 Days Shop Warranty">7 Days Shop Warranty</option>
                    <option value="1 Month Shop Warranty">1 Month Shop Warranty</option>
                    <option value="3 Months Shop Warranty">3 Months Shop Warranty</option>
                    <option value="6 Months Shop Warranty">6 Months Shop Warranty</option>
                    <option value="1 Year Shop Warranty">1 Year Shop Warranty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Color *</label>
                  <input
                    type="text"
                    className="form-input-text"
                    required
                    placeholder="e.g. Space Black, Natural Titanium"
                    value={productForm.color}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProductForm({ ...productForm, color: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SIM Type *</label>
                  <select
                    className="form-select-box"
                    value={productForm.simType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, simType: e.target.value })}
                  >
                    <option value="Dual SIM">Dual SIM</option>
                    <option value="Single SIM + eSIM">Single SIM + eSIM</option>
                    <option value="Dual eSIM">Dual eSIM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Network *</label>
                  <select
                    className="form-select-box"
                    value={productForm.network}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductForm({ ...productForm, network: e.target.value })}
                  >
                    <option value="5G">5G</option>
                    <option value="4G">4G</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Original Bill Available?</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="originalBill"
                        checked={productForm.originalBill === true}
                        onChange={() => setProductForm({ ...productForm, originalBill: true })}
                      />
                      <span>Yes (Original Bill Included)</span>
                    </label>
                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="originalBill"
                        checked={productForm.originalBill === false}
                        onChange={() => setProductForm({ ...productForm, originalBill: false })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Included Accessories</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.4rem' }}>
                    {['Box', 'Charger', 'Cable', 'Case', 'Screen Guard'].map(acc => (
                      <label key={acc} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={productForm.accessories.includes(acc)}
                          onChange={(e) => {
                            let updatedAcc = [...productForm.accessories];
                            if (e.target.checked) updatedAcc.push(acc);
                            else updatedAcc = updatedAcc.filter(a => a !== acc);
                            setProductForm({ ...productForm, accessories: updatedAcc });
                          }}
                        />
                        <span>{acc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Detailed Device Description *</label>
                  <textarea
                    className="form-textarea"
                    required
                    rows={3}
                    placeholder="Include scuff details, warranty info, charger status..."
                    value={productForm.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProductForm({ ...productForm, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-actions-row" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    style={{
                      padding: '0.6rem 1.4rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => dispatch(setShowAddEditModal(false))}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                    {productToEdit ? 'Save Changes' : 'Submit Device Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- AUTHENTICATION MODAL (LOGIN & REGISTRATION) --- */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => dispatch(setShowAuthModal(false))}>
          <div className="modal-content auth-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => dispatch(setShowAuthModal(false))}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <h3 className="auth-title">Welcome to MLX Direct</h3>
              <p className="auth-subtitle">Verify your credentials to explore or trade verified used gadgets.</p>
            </div>

            {/* Custom Role Toggles */}
            <div className="auth-role-toggles" style={{ display: 'flex', borderBottom: '1px solid var(--light-border)', marginBottom: '1.25rem' }}>
              <button 
                type="button"
                className={`auth-role-btn ${authRole === 'customer' ? 'active' : ''}`}
                onClick={() => dispatch(setAuthRole('customer'))}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderBottom: authRole === 'customer' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  fontWeight: 600,
                  color: authRole === 'customer' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  cursor: 'pointer'
                }}
              >
                For Customers
              </button>
              <button 
                type="button"
                className={`auth-role-btn ${authRole === 'seller' ? 'active' : ''}`}
                onClick={() => dispatch(setAuthRole('seller'))}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderBottom: authRole === 'seller' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  fontWeight: 600,
                  color: authRole === 'seller' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  cursor: 'pointer'
                }}
              >
                For Shop Owners
              </button>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => dispatch(setAuthTab('login'))}
              >
                Sign In
              </button>
              <button 
                className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => dispatch(setAuthTab('register'))}
              >
                Register Account
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    {authRole === 'seller' ? 'Enter Registered Shop Phone Number *' : 'Enter Email / Phone to Sign In *'}
                  </label>
                  <input 
                    type="text" 
                    className="form-input-text" 
                    required
                    placeholder={authRole === 'seller' ? "e.g. 98765 43210 or 9812345678" : "e.g. arjun@gmail.com or enter any demo text"}
                    value={customerEmailInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerEmailInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" 
                    className="form-input-text" 
                    required
                    placeholder="••••••••"
                    value={loginPasswordInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPasswordInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary-light)', backgroundColor: 'var(--light-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <Info size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  {authRole === 'seller' ? (
                    <span>Demo shop logins: Enter any mock shop phone, e.g. <strong>9876543210</strong> (Kochi Gadgets) or <strong>9812345678</strong> (Calicut Refurb).</span>
                  ) : (
                    <span>Demo customer logins: <strong>arjun@gmail.com</strong> or <strong>priya@yahoo.com</strong>. Feel free to type anything else to auto-create a user.</span>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {authRole === 'seller' ? 'Login to Store Dashboard' : 'Customer Sign In'}
                </button>
              </form>
            ) : (
              authRole === 'seller' ? (
                /* Seller Shop Registration */
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Shop / Business Name *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. Tech World Dealers"
                      value={registerForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Name *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. Vikram Mehta"
                      value={registerForm.ownerName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, ownerName: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. store@gmail.com"
                      value={registerForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, email: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input 
                      type="password" 
                      className="form-input-text" 
                      required
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, password: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shop Mobile *</label>
                    <input 
                      type="tel" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. +91 98123 45678"
                      value={registerForm.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, phone: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp Number *</label>
                    <input 
                      type="tel" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. 919812345678"
                      value={registerForm.whatsapp}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, whatsapp: e.target.value})}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <select 
                        className="form-select-box"
                        value={registerForm.city}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegisterForm({...registerForm, city: e.target.value})}
                      >
                        {CITIES.filter(c => c !== "All Cities").map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Main Business Category</label>
                      <select 
                        className="form-select-box"
                        value={registerForm.category}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegisterForm({...registerForm, category: e.target.value})}
                      >
                        <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                        <option value="Laptops & Accessories">Laptops & Accessories</option>
                        <option value="Smart Watches & Audio">Smart Watches & Audio</option>
                        <option value="All Tech Products">All Tech Products</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shop Physical Address *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. Shop 102, Lamington Road"
                      value={registerForm.address}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm({...registerForm, address: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    Create Store Account
                  </button>
                </form>
              ) : (
                /* Customer Registration */
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. Arjun Nair"
                      value={customerRegisterForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerRegisterForm({...customerRegisterForm, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. arjun@gmail.com"
                      value={customerRegisterForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerRegisterForm({...customerRegisterForm, email: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="tel" 
                      className="form-input-text" 
                      required
                      placeholder="e.g. +91 94460 55432"
                      value={customerRegisterForm.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerRegisterForm({...customerRegisterForm, phone: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input 
                      type="password" 
                      className="form-input-text" 
                      required
                      placeholder="••••••••"
                      value={customerRegisterForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerRegisterForm({...customerRegisterForm, password: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    Create Customer Account
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
