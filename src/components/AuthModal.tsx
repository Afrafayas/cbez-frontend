import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { X, Loader2, Store, ArrowRight, User, MapPin, Search, CheckCircle2, MessageCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setShowAuthModal, 
  setAuthRole, 
  setActiveUser, 
  setActiveShop 
} from '../store/authSlice';
import { addShop } from '../store/productsSlice';
import { Shop, User as CustomerUser, SubscriptionPlan } from '../types';
import { CITIES } from '../data/mockData';
import { 
  registerUser, 
  loginUser, 
  sendOtpApi, 
  verifyOtpApi, 
  getActiveSubscriptionPlans, 
  geocodeAddress, 
  reverseGeocodeCoords 
} from '../services/apiService';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';
import { useNavigate } from 'react-router-dom';
import { setDashboardTab } from '../store/uiSlice';

interface AuthModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

const INITIAL_REG_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  shopName: '',
  ownerName: '',
  whatsapp: '',
  address: '',
  city: 'Kochi',
  category: 'Mobiles & Tablets',
  district: 'Ernakulam',
  country: 'India',
  aadhaarNumber: '',
  panNumber: '',
  profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  subscriptionPlanId: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  gstNumber: '',
  websiteUrl: '',
  businessHours: '',
  businessDescription: '',
  alternatePhone: ''
};

export const AuthModal: React.FC<AuthModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showAuthModal, authRole, activeShop, activeUser } = useAppSelector(state => state.auth);
  const { subscriptionPlans } = useAppSelector(state => state.products);

  const modalContentRef = useRef<HTMLDivElement>(null);

  // Flow step: 'phone' (Step 1), 'otp' (Step 2), 'details' (Step 4), 'legacy' (password login fallback)
  const [authStep, setAuthStep] = useState<'phone' | 'otp' | 'details' | 'legacy'>('phone');
  
  // OTP state
  const [otpPhone, setOtpPhone] = useState('+91 ');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isExistingAccount, setIsExistingAccount] = useState<boolean | null>(null);
  const [otpHasError, setOtpHasError] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Registration & Legacy login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activePlans, setActivePlans] = useState<SubscriptionPlan[]>([]);
  const [regForm, setRegForm] = useState(INITIAL_REG_FORM);

  const resetAllForms = React.useCallback(() => {
    setLoginEmail('');
    setLoginPassword('');
    setRegForm(INITIAL_REG_FORM);
    setAuthStep('phone');
    setOtpPhone('+91 ');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpCountdown(0);
    setIsExistingAccount(null);
    setOtpHasError(false);
  }, []);

  // Reset forms every time showAuthModal opens (becomes true)
  useEffect(() => {
    if (showAuthModal) {
      resetAllForms();
    }
  }, [showAuthModal, resetAllForms]);

  // Reset forms whenever user or shop logs out
  useEffect(() => {
    if (!activeShop && !activeUser) {
      resetAllForms();
    }
  }, [activeShop, activeUser, resetAllForms]);

  // Scroll modal to top whenever authStep changes
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [authStep]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpCountdown]);

  const handleCloseModal = () => {
    resetAllForms();
    dispatch(setShowAuthModal(false));
  };

  // --- STEP 1: SEND OTP HANDLER ---
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const rawDigits = otpPhone.replace(/[^0-9]/g, '');
    
    if (!rawDigits || rawDigits.length < 9) {
      onToast('Please enter a valid mobile number', 'info');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await sendOtpApi({
        phone: otpPhone.trim(),
        role: authRole,
      });

      setIsExistingAccount(Boolean(res.isExistingUser));
      setOtpCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpHasError(false);
      setAuthStep('otp');
      onToast(res.message || 'OTP sent successfully to your WhatsApp number!', 'success');

      // Pre-fill phone into registration form in case user is new
      setRegForm(prev => ({
        ...prev,
        phone: otpPhone.trim(),
        whatsapp: otpPhone.trim()
      }));

      // Focus first OTP input box after slight delay
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      onToast(err.message || 'Failed to send WhatsApp OTP. Please try again.', 'info');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // --- STEP 2: VERIFY OTP HANDLER ---
  const handleVerifyOtp = async (e?: FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode || otpDigits.join('')).trim();
    if (code.length !== 6) {
      onToast('Please enter the full 6-digit OTP code received on WhatsApp', 'info');
      return;
    }

    const cleanDigits = otpPhone.replace(/[^0-9]/g, '');

    try {
      setIsVerifyingOtp(true);
      setOtpHasError(false);
      const res = await verifyOtpApi({
        phone: otpPhone.trim(),
        otp: code,
        role: authRole,
      });

      // Step 3: If already an existing user, navigate to home/dashboard (Seller -> /seller-dashboard, Customer -> /)
      if (!res.isNewUser && res.data?.token) {
        const tokenVal = res.data.token;
        const userObj = res.data.user;
        const actualRole = userObj?.role || (userObj?.shop ? 'seller' : authRole);

        localStorage.setItem('mlx_token', tokenVal);

        if (actualRole === 'seller' || userObj?.shop) {
          const shop: Shop = userObj?.shop || {
            id: userObj?.id || `shop-${Date.now()}`,
            name: userObj?.name || 'Seller Shop',
            ownerName: userObj?.name || 'Shop Owner',
            phone: userObj?.phone || otpPhone.trim(),
            whatsapp: userObj?.phone || otpPhone.trim(),
            address: 'Kerala Store',
            city: 'Kochi',
            category: 'Mobiles & Tablets',
            verified: Boolean(userObj?.shop?.verified),
            rating: 5.0,
            joinedDate: 'Today',
            status: userObj?.shop?.verified ? 'APPROVED' : 'PENDING'
          };
          dispatch(setActiveUser(null));
          dispatch(setAuthRole('seller'));
          dispatch(setActiveShop(shop));
          dispatch(setDashboardTab('listings'));
          onToast(`Welcome back, ${shop.name}! Store signed in.`, 'success');
          handleCloseModal();
          navigate('/seller-dashboard');
        } else {
          const user: CustomerUser = {
            id: userObj?.id || `user-${Date.now()}`,
            name: userObj?.name || 'Customer User',
            email: userObj?.email || `${cleanDigits}@cbez.in`,
            phone: userObj?.phone || otpPhone.trim(),
            latitude: userObj?.latitude ?? null,
            longitude: userObj?.longitude ?? null,
          };
          dispatch(setActiveShop(null));
          dispatch(setAuthRole('customer'));
          dispatch(setActiveUser(user));
          onToast(`Welcome back, ${user.name}!`, 'success');
          handleCloseModal();
          navigate('/');
        }
        return;
      }

      // Step 4: If NOT an existing user, transition to the original registration form
      if (res.isNewUser) {
        onToast('Phone number verified! Please complete your registration details.', 'success');
        setRegForm(prev => ({
          ...prev,
          phone: otpPhone.trim(),
          whatsapp: otpPhone.trim(),
        }));
        setAuthStep('details');
      }
    } catch (err: any) {
      setOtpHasError(true);
      onToast(err.message || 'Invalid or expired OTP. Please check and try again.', 'info');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle OTP paste (Step 2)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    setOtpHasError(false);
    const copy = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      copy[i] = pasted[i];
    }
    setOtpDigits(copy);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
    if (pasted.length === 6) {
      handleVerifyOtp(undefined, pasted);
    }
  };

  // Handle individual OTP digit input (Step 2)
  const handleOtpDigitChange = (index: number, val: string) => {
    setOtpHasError(false);
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const copy = [...otpDigits];
      copy[index] = '';
      setOtpDigits(copy);
      return;
    }

    // If pasted multiple digits
    if (cleaned.length > 1) {
      const copy = [...otpDigits];
      for (let i = 0; i < 6 && index + i < 6 && i < cleaned.length; i++) {
        copy[index + i] = cleaned[i];
      }
      setOtpDigits(copy);
      const fullPasted = copy.join('');
      const nextIndex = Math.min(index + cleaned.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      if (fullPasted.length === 6) {
        handleVerifyOtp(undefined, fullPasted);
      }
      return;
    }

    const copy = [...otpDigits];
    copy[index] = cleaned[0];
    setOtpDigits(copy);

    if (index < 5 && cleaned) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (index === 5 && cleaned) {
      const fullCode = copy.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(undefined, fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Image file handler for seller registration
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please select a valid image file (JPG, PNG, WEBP)', 'info');
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
        setRegForm(prev => ({ ...prev, profileImage: compressedDataUrl }));
        onToast('Shop Logo / Owner Photo uploaded successfully!', 'success');
      };
      tempImg.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Location handlers
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onToast('Geolocation is not supported by your browser. Please search address manually.', 'info');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setRegForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        onToast(`GPS Coordinates detected: (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'success');

        try {
          const rev = await reverseGeocodeCoords(lat, lng);
          if (rev.formattedAddress) {
            setRegForm(prev => ({
              ...prev,
              address: prev.address || rev.formattedAddress,
              city: rev.city || prev.city,
              district: rev.district || prev.district,
              country: rev.country || prev.country,
            }));
          }
        } catch {
          // Keep detected coordinates even if reverse geocode fails
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        onToast(`Geolocation permission denied or unavailable: ${error.message}. Please search address manually.`, 'info');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchLocationCoordinates = async () => {
    const query = regForm.address || regForm.city || 'Kochi Market';
    if (!query) {
      onToast('Please enter a business address or city name to search on map', 'info');
      return;
    }

    setIsLocating(true);
    try {
      const geo = await geocodeAddress(query);
      if (geo) {
        setRegForm(prev => ({
          ...prev,
          latitude: geo.latitude,
          longitude: geo.longitude,
          address: geo.formattedAddress || prev.address,
        }));
        onToast(`Coordinates found: (${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)})`, 'success');
      } else {
        onToast('Could not resolve exact coordinates for this address. Please try another query.', 'info');
      }
    } catch {
      onToast('Failed to locate coordinates. Please try again.', 'info');
    } finally {
      setIsLocating(false);
    }
  };

  // Load subscription plans for sellers
  useEffect(() => {
    async function loadPlans() {
      try {
        const fetched = await getActiveSubscriptionPlans();
        const available = fetched.length > 0 ? fetched : subscriptionPlans.filter(p => p.status === 'ACTIVE');
        setActivePlans(available);
        if (available.length > 0 && !regForm.subscriptionPlanId) {
          setRegForm(prev => ({ ...prev, subscriptionPlanId: available[0].id }));
        }
      } catch {
        const fallback = subscriptionPlans.filter(p => p.status === 'ACTIVE');
        setActivePlans(fallback);
        if (fallback.length > 0 && !regForm.subscriptionPlanId) {
          setRegForm(prev => ({ ...prev, subscriptionPlanId: fallback[0].id }));
        }
      }
    }
    if (showAuthModal && authRole === 'seller') {
      loadPlans();
    }
  }, [showAuthModal, authRole, subscriptionPlans]);

  if (!showAuthModal) return null;

  // --- STEP 4: ORIGINAL REGISTRATION SUBMIT HANDLER ---
  const handleRegSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!regForm.email) {
      onToast('Email address is required', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      if (authRole === 'customer') {
        const resData = await registerUser({
          email: regForm.email,
          password: regForm.password || 'cbez_otp_pass',
          name: regForm.name || 'Customer User',
          phone: regForm.phone || otpPhone.trim(),
          role: 'customer',
          latitude: regForm.latitude,
          longitude: regForm.longitude,
        });

        const tokenVal = resData?.token || resData?.data?.token;
        const userObj = resData?.user || resData?.data?.user;

        if (tokenVal) {
          localStorage.setItem('mlx_token', tokenVal);
        }

        const user: CustomerUser = {
          id: userObj?.id || `user-${Date.now()}`,
          name: userObj?.name || regForm.name || 'Customer User',
          email: userObj?.email || regForm.email || '',
          phone: userObj?.phone || regForm.phone || otpPhone.trim(),
          latitude: userObj?.latitude ?? regForm.latitude ?? null,
          longitude: userObj?.longitude ?? regForm.longitude ?? null,
        };
        dispatch(setActiveUser(user));
        onToast(`Customer account created! Welcome ${user.name}`, 'success');
        handleCloseModal();
        navigate('/');
      } else {
        // Seller Registration
        const sellerName = regForm.ownerName || regForm.name;
        if (!sellerName || !regForm.shopName || !regForm.address) {
          onToast('Please fill out all required fields: Name, Shop Name, and Business Address.', 'info');
          setIsSubmitting(false);
          return;
        }

        const resData = await registerUser({
          email: regForm.email,
          password: regForm.password || 'cbez_otp_pass',
          name: regForm.shopName || sellerName,
          phone: regForm.phone || otpPhone.trim(),
          role: 'seller',
          shopName: regForm.shopName,
          ownerName: sellerName,
          whatsapp: regForm.whatsapp || regForm.phone || otpPhone.trim(),
          address: regForm.address,
          city: regForm.city || 'Kochi',
          category: regForm.category || 'Mobiles & Tablets',
          district: regForm.district || 'Ernakulam',
          country: regForm.country || 'India',
          aadhaarNumber: regForm.aadhaarNumber,
          panNumber: regForm.panNumber,
          profileImage: regForm.profileImage,
          subscriptionPlanId: regForm.subscriptionPlanId || activePlans[0]?.id,
          latitude: regForm.latitude,
          longitude: regForm.longitude,
          gstNumber: regForm.gstNumber,
          websiteUrl: regForm.websiteUrl,
          businessHours: regForm.businessHours,
          businessDescription: regForm.businessDescription,
          alternatePhone: regForm.alternatePhone,
        });

        const tokenVal = resData?.token || resData?.data?.token;
        const userObj = resData?.user || resData?.data?.user;

        if (tokenVal) {
          localStorage.setItem('mlx_token', tokenVal);
        }

        const newShop: Shop = userObj?.shop || {
          id: userObj?.id || `shop-${Date.now()}`,
          name: regForm.shopName,
          ownerName: sellerName,
          phone: regForm.phone || otpPhone.trim(),
          whatsapp: regForm.whatsapp || regForm.phone || otpPhone.trim(),
          address: regForm.address,
          city: regForm.city || 'Kochi',
          category: regForm.category || 'Mobiles & Tablets',
          district: regForm.district || 'Ernakulam',
          country: regForm.country || 'India',
          aadhaarNumber: regForm.aadhaarNumber,
          panNumber: regForm.panNumber,
          profileImage: regForm.profileImage,
          subscriptionPlanId: regForm.subscriptionPlanId || activePlans[0]?.id || 'plan-free',
          latitude: regForm.latitude,
          longitude: regForm.longitude,
          gstNumber: regForm.gstNumber,
          websiteUrl: regForm.websiteUrl,
          businessHours: regForm.businessHours,
          businessDescription: regForm.businessDescription,
          alternatePhone: regForm.alternatePhone,
          verified: false,
          status: 'PENDING',
          rating: 5.0,
          joinedDate: 'Today'
        };
        dispatch(addShop(newShop));
        dispatch(setActiveShop(newShop));
        dispatch(setDashboardTab('listings'));
        onToast(`Merchant Shop Registered: ${newShop.name} (Status: PENDING Admin Approval)`, 'success');
        handleCloseModal();
        navigate('/seller-dashboard');
      }
    } catch (err: any) {
      onToast(err.message || 'Registration failed', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LEGACY EMAIL/PASSWORD LOGIN HANDLER ---
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onToast('Email address and Password are required to sign in', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanInput = loginEmail.trim();
      const isEmail = cleanInput.includes('@');
      const payload = isEmail
        ? { email: cleanInput.toLowerCase(), password: loginPassword }
        : { phone: cleanInput, email: cleanInput, password: loginPassword };

      const resData = await loginUser(payload);
      const userObj = resData.data?.user || resData.user;
      const tokenVal = resData.data?.token || resData.token;
      const actualRole = userObj?.role || (userObj?.shop ? 'seller' : 'customer');

      if (tokenVal) {
        localStorage.setItem('mlx_token', tokenVal);
      }

      if (actualRole === 'seller' || userObj?.shop) {
        const shop: Shop = userObj?.shop || {
          id: userObj?.id || `shop-${Date.now()}`,
          name: userObj?.name || 'Seller Shop',
          ownerName: userObj?.name || 'Shop Owner',
          phone: userObj?.phone || '+91 98765 43210',
          whatsapp: userObj?.phone || '919876543210',
          address: 'Kochi Market',
          city: 'Kochi',
          category: 'Mobiles & Tablets',
          verified: Boolean(userObj?.shop?.verified),
          rating: 5.0,
          joinedDate: 'Today',
          status: userObj?.shop?.verified ? 'APPROVED' : 'PENDING'
        };
        dispatch(setActiveUser(null));
        dispatch(setAuthRole('seller'));
        dispatch(setActiveShop(shop));
        dispatch(setDashboardTab('listings'));
        onToast(`Merchant Shop Signed In: ${shop.name}`, 'success');
        handleCloseModal();
        navigate('/seller-dashboard');
      } else {
        const user: CustomerUser = {
          id: userObj?.id || `user-${Date.now()}`,
          name: userObj?.name || loginEmail.split('@')[0],
          email: userObj?.email || loginEmail,
          phone: userObj?.phone || '+91 98765 00000',
          latitude: userObj?.latitude ?? null,
          longitude: userObj?.longitude ?? null,
        };
        dispatch(setActiveShop(null));
        dispatch(setAuthRole('customer'));
        dispatch(setActiveUser(user));
        onToast(`Welcome back, ${user.name}!`, 'success');
        handleCloseModal();
        navigate('/');
      }
    } catch (err: any) {
      onToast(err.message || 'Login failed. Please check credentials.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSeller = authRole === 'seller';

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div
        ref={modalContentRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: authStep === 'details' ? '540px' : '460px',
          width: '92%',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          border: '1px solid rgba(255, 111, 0, 0.25)',
          padding: '2.25rem 1.75rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          className="modal-close-btn"
          onClick={handleCloseModal}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* ========================================================= */}
        {/* STEP 1: ONLY PHONE NUMBER (Theme Matched to Website)      */}
        {/* ========================================================= */}
        {authStep === 'phone' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 10px 25px rgba(255, 111, 0, 0.4)'
              }}>
                <MessageCircle size={30} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Login
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.4rem', lineHeight: '1.4' }}>
                Enter your WhatsApp mobile number to continue
              </p>
            </div>

            {/* ONLY PHONE NUMBER ON LOGIN AND REGISTRATION DIALOG */}
            <form onSubmit={handleSendOtp} className="modal-form" autoComplete="off">
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.84rem', color: '#e2e8f0' }}>
                  <span>WhatsApp Mobile Number</span>
                  <span style={{ color: '#ff6f00' }}>*</span>
                </label>
                <PhoneInputWithCountry
                  required
                  value={otpPhone}
                  onChange={(val) => setOtpPhone(val)}
                  placeholder="98765 43210"
                />
                <div style={{ 
                  marginTop: '0.65rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: '#94a3b8',
                  background: 'rgba(255, 111, 0, 0.08)',
                  border: '1px solid rgba(255, 111, 0, 0.2)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '12px'
                }}>
                  <MessageCircle size={15} color="#ff9e40" />
                  <span>A 6-digit OTP code will be sent to this WhatsApp number.</span>
                </div>
              </div>

              {/* ACTION: SEND OTP */}
              <button
                type="submit"
                disabled={isSendingOtp}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  boxShadow: '0 6px 20px rgba(255, 111, 0, 0.4)',
                  opacity: isSendingOtp ? 0.75 : 1,
                  cursor: isSendingOtp ? 'not-allowed' : 'pointer'
                }}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="animate-spin" size={19} />
                    <span>Sending WhatsApp OTP...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    <span>Send WhatsApp OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Alternative option for existing password accounts */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setAuthStep('legacy')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.79rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Prefer email & password? Classic Sign In →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: OTP ENTERED TAB (Theme Matched to Website)       */}
        {/* ========================================================= */}
        {authStep === 'otp' && (
          <div>
            <button
              type="button"
              onClick={() => setAuthStep('phone')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>Change Number</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.85rem auto',
                boxShadow: '0 10px 25px rgba(255, 111, 0, 0.35)'
              }}>
                <MessageCircle size={28} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Verify WhatsApp OTP
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                Enter the 6-digit code sent to <strong style={{ color: '#ffffff' }}>{otpPhone}</strong>
              </p>
              {isExistingAccount !== null && (
                <span style={{ 
                  display: 'inline-block', 
                  marginTop: '0.4rem', 
                  fontSize: '0.72rem', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '10px',
                  background: isExistingAccount ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 111, 0, 0.15)',
                  color: isExistingAccount ? '#4ade80' : '#ff9e40',
                  fontWeight: 700
                }}>
                  {isExistingAccount ? 'Existing User Detected (Direct Sign In)' : 'New User (Profile Setup Next)'}
                </span>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="modal-form">
              {/* 6-DIGIT OTP INPUTS (STEP 2) */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '0.48rem', 
                  justifyContent: 'center', 
                  marginBottom: '1.25rem',
                  padding: '0.5rem 0'
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    value={digit}
                    onPaste={handleOtpPaste}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      background: otpHasError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      border: otpHasError 
                        ? '2px solid #ef4444' 
                        : digit 
                        ? '2px solid #ff9e40' 
                        : '1.5px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      outline: 'none',
                      boxShadow: digit ? '0 0 12px rgba(255, 111, 0, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>

              {otpHasError && (
                <div style={{ textAlign: 'center', color: '#f87171', fontSize: '0.78rem', marginBottom: '1rem', fontWeight: 600 }}>
                  ⚠️ Invalid or expired OTP. Please check the code received on WhatsApp.
                </div>
              )}

              {/* ACTION: VERIFY OTP */}
              <button
                type="submit"
                disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.88rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  boxShadow: '0 6px 20px rgba(255, 111, 0, 0.4)',
                  opacity: (isVerifyingOtp || otpDigits.join('').length !== 6) ? 0.6 : 1,
                  cursor: (isVerifyingOtp || otpDigits.join('').length !== 6) ? 'not-allowed' : 'pointer'
                }}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="animate-spin" size={19} />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* RESEND TIMER / BUTTON */}
              <div style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                {otpCountdown > 0 ? (
                  <span>Resend WhatsApp OTP in <strong style={{ color: '#ffffff' }}>{otpCountdown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff9e40',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <RefreshCw size={14} className={isSendingOtp ? 'animate-spin' : ''} />
                    <span>Resend OTP via WhatsApp</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: ORIGINAL REGISTRATION FORM (THE FIRST FORM)       */}
        {/* ========================================================= */}
        {authStep === 'details' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.85rem auto',
                boxShadow: '0 10px 25px rgba(255, 111, 0, 0.4)'
              }}>
                {isSeller ? <Store size={28} color="#ffffff" /> : <User size={28} color="#ffffff" />}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {isSeller ? 'Register Seller Shop' : 'Create Customer Account'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                {isSeller ? 'Trusted Kerala Used Electronics Marketplace' : 'Buy verified used gadgets directly from local stores'}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.74rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 700 }}>
                <CheckCircle2 size={13} />
                <span>Verified WhatsApp: {regForm.phone || otpPhone}</span>
              </div>
            </div>

            <form onSubmit={handleRegSubmit} className="modal-form">
              {authRole === 'customer' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input-text"
                      required
                      placeholder="e.g. Rahul Kumar"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input-text"
                      required
                      placeholder="e.g. rahul@gmail.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password (Optional)</label>
                    <input
                      type="password"
                      className="form-input-text"
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <PhoneInputWithCountry
                      required
                      value={regForm.phone}
                      onChange={(val) => setRegForm({ ...regForm, phone: val })}
                    />
                  </div>

                  {/* CUSTOMER LOCATION SELECTION SECTION */}
                  <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px dashed #ff9e40', padding: '1rem', borderRadius: '14px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#ff9e40', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={16} />
                        <span>Your Location Coordinates (Optional)</span>
                      </label>
                      {typeof regForm.latitude === 'number' && typeof regForm.longitude === 'number' && !isNaN(regForm.latitude) && !isNaN(regForm.longitude) && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                          ✓ Coordinates Set
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      Detect GPS location or search address to locate nearby verified stores and local deals:
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={handleUseCurrentLocation}
                        style={{
                          flex: 1,
                          minWidth: '150px',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '10px',
                          border: '1px solid #ff9e40',
                          background: 'rgba(255, 111, 0, 0.15)',
                          color: '#ff9e40',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: isLocating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                        <span>Use Current GPS Location</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={handleSearchLocationCoordinates}
                        style={{
                          padding: '0.55rem 0.8rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#f8fafc',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: isLocating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Search size={14} />
                        <span>Search Address / City</span>
                      </button>
                    </div>

                    {typeof regForm.latitude === 'number' && typeof regForm.longitude === 'number' && !isNaN(regForm.latitude) && !isNaN(regForm.longitude) ? (
                      <div style={{ fontSize: '0.78rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }}>
                        📍 <strong>Selected Coordinates:</strong> Lat: {regForm.latitude.toFixed(5)}, Lng: {regForm.longitude.toFixed(5)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        ℹ️ Optional: GPS coordinates can be selected now or updated anytime in your profile.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* SELLER ORIGINAL REGISTRATION FORM */}
                  <div className="form-group">
                    <label className="form-label">Shop Business Name *</label>
                    <input type="text" className="form-input-text" required placeholder="e.g. Kochi iStore Mobiles" value={regForm.shopName} onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner Name *</label>
                    <input type="text" className="form-input-text" required placeholder="e.g. Afraf Fayas" value={regForm.ownerName} onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Profile / Logo Image (Optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {regForm.profileImage ? (
                        <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #ff9e40', flexShrink: 0 }}>
                          <img src={regForm.profileImage} alt="Shop Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                          <Store size={28} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          id="logoFileInput"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoFileSelect}
                        />
                        <label
                          htmlFor="logoFileInput"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                            color: '#ffffff',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginBottom: '0.3rem'
                          }}
                        >
                          📷 {regForm.profileImage ? 'Change Photo' : 'Upload Shop Logo / Photo'}
                        </label>
                        <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: 0 }}>
                          Supports JPG, PNG, WEBP (Auto-compressed)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input-text" required placeholder="e.g. store@gmail.com" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password (Optional)</label>
                    <input type="password" className="form-input-text" placeholder="••••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Call Phone Number *</label>
                    <PhoneInputWithCountry required value={regForm.phone} onChange={(val) => setRegForm({ ...regForm, phone: val })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Number (Optional)</label>
                    <PhoneInputWithCountry value={regForm.whatsapp} onChange={(val) => setRegForm({ ...regForm, whatsapp: val })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City (Optional)</label>
                    <select className="form-select-box" value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}>
                      {CITIES.filter(c => c !== "All Cities").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">District (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="e.g. Ernakulam" value={regForm.district} onChange={(e) => setRegForm({ ...regForm, district: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="India" value={regForm.country} onChange={(e) => setRegForm({ ...regForm, country: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Card Number (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="12-digit Aadhaar Number" value={regForm.aadhaarNumber} onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Card Number (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="10-character PAN Number" value={regForm.panNumber} onChange={(e) => setRegForm({ ...regForm, panNumber: e.target.value })} />
                  </div>

                  {/* MANDATORY LOCATION SELECTION SECTION */}
                  <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px dashed #ff9e40', padding: '1rem', borderRadius: '14px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#ff9e40', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={16} />
                        <span>Shop Map Coordinates (Optional)</span>
                      </label>
                      {regForm.latitude !== undefined && regForm.longitude !== undefined && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                          ✓ Coordinates Set
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      Please select your shop location using GPS or address map search:
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={handleUseCurrentLocation}
                        style={{
                          flex: 1,
                          minWidth: '150px',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '10px',
                          border: '1px solid #ff9e40',
                          background: 'rgba(255, 111, 0, 0.15)',
                          color: '#ff9e40',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: isLocating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                        <span>Use Current GPS Location</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={handleSearchLocationCoordinates}
                        style={{
                          padding: '0.55rem 0.8rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#f8fafc',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: isLocating ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Search size={14} />
                        <span>Search Map Address</span>
                      </button>
                    </div>

                    {regForm.latitude !== undefined && regForm.longitude !== undefined && (
                      <div style={{ fontSize: '0.78rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }}>
                        📍 <strong>Shop Coordinates:</strong> Lat: {regForm.latitude.toFixed(5)}, Lng: {regForm.longitude.toFixed(5)}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Market Business Address *</label>
                    <textarea className="form-textarea" required rows={2} placeholder="MG Road, Broadway Corner" value={regForm.address} onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select-box" value={regForm.category} onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}>
                      <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                      <option value="Laptops & Computers">Laptops & Computers</option>
                      <option value="Cameras & Optics">Cameras & Optics</option>
                      <option value="Audio & Sound">Audio & Sound</option>
                      <option value="Gaming & Consoles">Gaming & Consoles</option>
                      <option value="Smart Watches & Wearables">Smart Watches & Wearables</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="e.g. 32AAAAA0000A1Z5" value={regForm.gstNumber} onChange={(e) => setRegForm({ ...regForm, gstNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website URL (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="https://yourstore.com" value={regForm.websiteUrl} onChange={(e) => setRegForm({ ...regForm, websiteUrl: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Opening Hours (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="e.g. 9:30 AM - 8:30 PM (Mon-Sat)" value={regForm.businessHours} onChange={(e) => setRegForm({ ...regForm, businessHours: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Description (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="e.g. Authorised Multi-brand mobile & laptop sales" value={regForm.businessDescription} onChange={(e) => setRegForm({ ...regForm, businessDescription: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Contact Phone (Optional)</label>
                    <input type="text" className="form-input-text" placeholder="e.g. +91 98460 00000" value={regForm.alternatePhone} onChange={(e) => setRegForm({ ...regForm, alternatePhone: e.target.value })} />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.9rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  boxShadow: '0 4px 18px rgba(255, 111, 0, 0.4)',
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={19} />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{authRole === 'customer' ? 'Register Customer Account' : 'Submit Shop Registration for Approval'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* LEGACY EMAIL & PASSWORD SIGN IN FALLBACK                  */}
        {/* ========================================================= */}
        {authStep === 'legacy' && (
          <div>
            <button
              type="button"
              onClick={() => setAuthStep('phone')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>← Back to WhatsApp OTP Sign In</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 10px 25px rgba(255, 111, 0, 0.4)'
              }}>
                {isSeller ? <Store size={28} color="#ffffff" /> : <User size={28} color="#ffffff" />}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {isSeller ? 'Merchant Email Sign In' : 'Customer Email Sign In'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                Sign in using your registered email and password
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="modal-form" autoComplete="off">
              <div className="form-group">
                <label className="form-label">Email Address / Phone *</label>
                <input
                  type="text"
                  className="form-input-text"
                  required
                  placeholder={isSeller ? "e.g. store@gmail.com" : "e.g. rahul@gmail.com"}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input-text"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.85rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  boxShadow: '0 4px 18px rgba(255, 111, 0, 0.35)',
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={19} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAuthStep('phone')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff9e40',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Switch to WhatsApp OTP Sign In →
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
