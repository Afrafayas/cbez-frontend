import React, { useState, useEffect, FormEvent } from 'react';
import { X, Loader2, Store, ArrowRight, User, MapPin, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setShowAuthModal, 
  setAuthTab, 
  setAuthRole, 
  setActiveUser, 
  setActiveShop 
} from '../store/authSlice';
import { addShop } from '../store/productsSlice';
import { Shop, User as CustomerUser, SubscriptionPlan } from '../types';
import { CITIES } from '../data/mockData';
import { registerUser, loginUser, getActiveSubscriptionPlans, geocodeAddress, reverseGeocodeCoords } from '../services/apiService';
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
  const { showAuthModal, authTab, authRole, activeShop, activeUser } = useAppSelector(state => state.auth);
  const { subscriptionPlans } = useAppSelector(state => state.products);

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
  }, []);

  // 1. Reset forms every time showAuthModal opens (becomes true)
  useEffect(() => {
    if (showAuthModal) {
      resetAllForms();
    }
  }, [showAuthModal, resetAllForms]);

  // 2. Reset forms whenever user or shop logs out
  useEffect(() => {
    if (!activeShop && !activeUser) {
      resetAllForms();
    }
  }, [activeShop, activeUser, resetAllForms]);

  const handleCloseModal = () => {
    resetAllForms();
    dispatch(setShowAuthModal(false));
  };

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

    try {
      setIsLocating(true);
      const res = await geocodeAddress(`${query}, ${regForm.city || ''}, ${regForm.country || 'India'}`);
      setRegForm(prev => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude,
        address: prev.address || res.formattedAddress,
      }));
      onToast(`Map location found: (${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)})`, 'success');
    } catch (err: any) {
      onToast(err.message || 'Could not find coordinates for entered address. Try refining street name.', 'info');
    } finally {
      setIsLocating(false);
    }
  };


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

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onToast('Email address and Password are required to sign in', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const resData = await loginUser({
        email: loginEmail,
        password: loginPassword,
      });

      const userObj = resData.data?.user || resData.user;
      const tokenVal = resData.data?.token || resData.token;

      const actualRole = userObj?.role || (userObj?.shop ? 'seller' : 'customer');

      // --- STRICT ROLE VALIDATION ---
      // 1. If user is in "Seller Login" tab but account is a Customer
      if (authRole === 'seller' && actualRole !== 'seller') {
        localStorage.removeItem('mlx_token');
        setIsSubmitting(false);
        onToast('This account is registered as a Customer. Please sign in via Customer Sign In.', 'info');
        dispatch(setAuthRole('customer'));
        return;
      }

      // 2. If user is in "Customer Sign In" tab but account is a Seller
      if (authRole === 'customer' && actualRole === 'seller') {
        localStorage.removeItem('mlx_token');
        setIsSubmitting(false);
        onToast('This account is registered as a Merchant Store. Please sign in via Seller Login.', 'info');
        dispatch(setAuthRole('seller'));
        return;
      }

      // Safe to persist authentication token once role is verified
      if (tokenVal) {
        localStorage.setItem('mlx_token', tokenVal);
      }

      if (actualRole === 'seller') {
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
        dispatch(setActiveShop(shop));
        dispatch(setDashboardTab('listings'));
        onToast(`Merchant Shop Signed In: ${shop.name}`, 'success');
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
        dispatch(setActiveUser(user));
        onToast(`Welcome back, ${user.name}!`, 'success');
      }
      resetAllForms();
      dispatch(setShowAuthModal(false));
    } catch (err: any) {
      onToast(err.message || 'Login failed. Please check credentials.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!regForm.email || !regForm.password) {
      onToast('Email address and Password are required', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      if (authRole === 'customer') {
        const resData = await registerUser({
          email: regForm.email,
          password: regForm.password,
          name: regForm.name,
          phone: regForm.phone,
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
          name: userObj?.name || regForm.name,
          email: userObj?.email || regForm.email,
          phone: userObj?.phone || regForm.phone,
          latitude: userObj?.latitude ?? regForm.latitude ?? null,
          longitude: userObj?.longitude ?? regForm.longitude ?? null,
        };
        dispatch(setActiveUser(user));
        onToast(`Customer account created! Welcome ${user.name}`, 'success');
      } else {
        // Enforce only Name, Shop Name, Phone, Email, Address, Password as required
        const sellerName = regForm.ownerName || regForm.name;
        if (
          !sellerName ||
          !regForm.shopName ||
          !regForm.phone ||
          !regForm.email ||
          !regForm.address ||
          !regForm.password
        ) {
          onToast('Please fill out all required fields: Name, Shop Name, Phone, Email, Address, and Password.', 'info');
          setIsSubmitting(false);
          return;
        }

        const resData = await registerUser({
          email: regForm.email,
          password: regForm.password,
          name: regForm.shopName || regForm.name || regForm.ownerName,
          phone: regForm.phone,
          role: 'seller',
          shopName: regForm.shopName,
          ownerName: regForm.ownerName,
          whatsapp: regForm.whatsapp || regForm.phone,
          address: regForm.address,
          city: regForm.city,
          category: regForm.category,
          district: regForm.district,
          country: regForm.country,
          aadhaarNumber: regForm.aadhaarNumber,
          panNumber: regForm.panNumber,
          profileImage: regForm.profileImage,
          subscriptionPlanId: regForm.subscriptionPlanId,
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
          ownerName: regForm.ownerName,
          phone: regForm.phone,
          whatsapp: regForm.whatsapp || regForm.phone,
          address: regForm.address,
          city: regForm.city,
          category: regForm.category,
          district: regForm.district,
          country: regForm.country,
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
          verified: false, // PENDING ADMIN APPROVAL
          status: 'PENDING',
          rating: 5.0,
          joinedDate: 'Today'
        };
        dispatch(addShop(newShop));
        dispatch(setActiveShop(newShop));
        dispatch(setDashboardTab('listings'));
        onToast(`Merchant Shop Registered: ${newShop.name} (Status: PENDING Admin Approval)`, 'success');
        navigate('/seller-dashboard');
      }
      resetAllForms();
      dispatch(setShowAuthModal(false));
    } catch (err: any) {
      onToast(err.message || 'Registration failed', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2rem 1.75rem',
          position: 'relative'
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
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: authRole === 'seller' ? 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: authRole === 'seller' ? '0 10px 25px rgba(255, 111, 0, 0.4)' : '0 10px 25px rgba(37, 99, 235, 0.4)'
          }}>
            {authRole === 'seller' ? <Store size={28} color="#ffffff" /> : <User size={28} color="#ffffff" />}
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            {authRole === 'seller' ? (authTab === 'login' ? 'Merchant Partner Portal' : 'Register Seller Shop') : (authTab === 'login' ? 'Customer Sign In' : 'Create Customer Account')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            {authRole === 'seller' ? 'Trusted Kerala Used Electronics Marketplace' : 'Buy verified used gadgets directly from local stores'}
          </p>
        </div>



        {/* Tab Navigation: Login / Register */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              resetAllForms();
              dispatch(setAuthTab('login'));
            }}
            style={{
              flex: 1,
              padding: '0.65rem',
              background: 'none',
              border: 'none',
              borderBottom: authTab === 'login' ? '2.5px solid #ff9e40' : '2.5px solid transparent',
              color: authTab === 'login' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              resetAllForms();
              dispatch(setAuthTab('register'));
            }}
            style={{
              flex: 1,
              padding: '0.65rem',
              background: 'none',
              border: 'none',
              borderBottom: authTab === 'register' ? '2.5px solid #ff9e40' : '2.5px solid transparent',
              color: authTab === 'register' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Register
          </button>
        </div>

        {authTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="modal-form" autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email Address / Phone *</label>
              <input
                type="text"
                className="form-input-text"
                required
                placeholder={authRole === 'seller' ? "e.g. store@gmail.com" : "e.g. rahul@gmail.com"}
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
                  <span>Processing...</span>
                </>
              ) : (
                authRole === 'customer' ? 'Customer Sign In' : 'Shop Partner Sign In'
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.83rem', color: '#94a3b8' }}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('register')); }} style={{ color: '#ff9e40', fontWeight: 700, textDecoration: 'none' }}>
                Register Here
              </a>
            </div>

            <div style={{ textAlign: 'center', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: '#94a3b8' }}>
              {authRole === 'seller' ? (
                <>
                  Looking for buyer portal?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetAllForms();
                      dispatch(setAuthRole('customer'));
                    }}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Switch to Customer Sign In →
                  </button>
                </>
              ) : (
                <>
                  Are you a store merchant?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetAllForms();
                      dispatch(setAuthRole('seller'));
                    }}
                    style={{ background: 'none', border: 'none', color: '#ff9e40', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Switch to Seller Login →
                  </button>
                </>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegSubmit} className="modal-form">
            {authRole === 'customer' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Rahul Kumar" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input-text" required placeholder="e.g. rahul@gmail.com" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input-text" required placeholder="••••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <PhoneInputWithCountry required value={regForm.phone} onChange={(val) => setRegForm({ ...regForm, phone: val })} />
                </div>

                {/* CUSTOMER LOCATION SELECTION SECTION */}
                <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px dashed #3b82f6', padding: '1rem', borderRadius: '14px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                        border: '1px solid #3b82f6',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
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
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input-text" required placeholder="••••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
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
                    {/* Option 1: Use Current Location */}
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
                        background: 'rgba(255, 158, 64, 0.15)',
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

                    {/* Option 2: Search Address Coordinates */}
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

                  {/* Display Coordinates Status */}
                  {typeof regForm.latitude === 'number' && typeof regForm.longitude === 'number' && !isNaN(regForm.latitude) && !isNaN(regForm.longitude) ? (
                    <div style={{ fontSize: '0.78rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }}>
                      📍 <strong>Selected Coordinates:</strong> Lat: {regForm.latitude.toFixed(5)}, Lng: {regForm.longitude.toFixed(5)}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.76rem', color: '#f87171', fontStyle: 'italic' }}>
                      ℹ️ Optional: GPS coordinates can be selected now or added later in your Shop Profile.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Market Business Address *</label>
                  <textarea className="form-textarea" required rows={2} placeholder="MG Road, Broadway Corner" value={regForm.address} onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}></textarea>
                </div>
                {/* Optional Fields */}
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
                marginTop: '0.75rem',
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
                  <span>Submitting Shop Registration...</span>
                </>
              ) : (
                authRole === 'customer' ? 'Register Customer Account' : 'Submit Shop Registration for Approval'
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.83rem', color: '#94a3b8' }}>
              Already registered?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('login')); }} style={{ color: '#ff9e40', fontWeight: 700, textDecoration: 'none' }}>
                Sign In
              </a>
            </div>
          </form>
        )}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}>
          {authRole === 'customer' ? (
            <div>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '0.45rem', fontWeight: 500 }}>
                Are you a Shop Owner?
              </span>
              <button
                type="button"
                onClick={() => {
                  dispatch(setAuthRole('seller'));
                  dispatch(setAuthTab('login'));
                }}
                style={{
                  background: 'rgba(255, 111, 0, 0.12)',
                  border: '1px solid rgba(255, 111, 0, 0.4)',
                  color: '#ff9e40',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(255, 111, 0, 0.12)'
                }}
              >
                <Store size={16} />
                <span>Partner Sign In / Register Here</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                dispatch(setAuthRole('customer'));
                dispatch(setAuthTab('login'));
              }}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease',
              }}
            >
              <User size={15} />
              <span>Switch back to Customer Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
