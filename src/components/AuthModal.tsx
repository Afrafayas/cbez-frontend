import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, Loader2, Store, ArrowRight, User } from 'lucide-react';
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
import { registerUser, loginUser, getActiveSubscriptionPlans } from '../services/apiService';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';

interface AuthModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const { showAuthModal, authTab, authRole, shops, subscriptionPlans } = useAppSelector(state => ({
    showAuthModal: state.auth.showAuthModal,
    authTab: state.auth.authTab,
    authRole: state.auth.authRole,
    shops: state.products.shops,
    subscriptionPlans: state.products.subscriptionPlans
  }));

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePlans, setActivePlans] = useState<SubscriptionPlan[]>([]);
  
  const [regForm, setRegForm] = useState({
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
    gstNumber: '',
    websiteUrl: ''
  });

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

      if (resData.token) {
        localStorage.setItem('mlx_token', resData.token);
      }

      if (resData.user?.role === 'seller' || authRole === 'seller') {
        const shop: Shop = resData.user?.shop || shops[0] || {
          id: resData.user?.id || `shop-${Date.now()}`,
          name: resData.user?.name || 'Seller Shop',
          ownerName: resData.user?.name || 'Shop Owner',
          phone: resData.user?.phone || '+91 98765 43210',
          whatsapp: resData.user?.phone || '919876543210',
          address: 'Kochi Market',
          city: 'Kochi',
          category: 'Mobiles & Tablets',
          verified: Boolean(resData.user?.shop?.verified),
          rating: 5.0,
          joinedDate: 'Today',
          status: resData.user?.shop?.verified ? 'APPROVED' : 'PENDING'
        };
        dispatch(setActiveShop(shop));
        onToast(`Merchant Shop Signed In: ${shop.name}`, 'success');
      } else {
        const user: CustomerUser = {
          id: resData.user?.id || `user-${Date.now()}`,
          name: resData.user?.name || loginEmail.split('@')[0],
          email: resData.user?.email || loginEmail,
          phone: resData.user?.phone || '+91 98765 00000'
        };
        dispatch(setActiveUser(user));
        onToast(`Welcome back, ${user.name}!`, 'success');
      }
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
          role: 'customer'
        });

        if (resData.token) {
          localStorage.setItem('mlx_token', resData.token);
        }

        const user: CustomerUser = {
          id: resData.user?.id || `user-${Date.now()}`,
          name: resData.user?.name || regForm.name,
          email: resData.user?.email || regForm.email,
          phone: resData.user?.phone || regForm.phone
        };
        dispatch(setActiveUser(user));
        onToast(`Customer account created! Welcome ${user.name}`, 'success');
      } else {
        // Enforce all mandatory fields for Shop Registration
        if (
          !regForm.ownerName ||
          !regForm.profileImage ||
          !regForm.shopName ||
          !regForm.address ||
          !regForm.city ||
          !regForm.district ||
          !regForm.country ||
          !regForm.email ||
          !regForm.aadhaarNumber ||
          !regForm.panNumber ||
          !regForm.subscriptionPlanId
        ) {
          onToast('Please fill out all mandatory fields for shop registration (including Aadhaar, PAN, and Subscription Plan)', 'info');
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
          gstNumber: regForm.gstNumber,
          websiteUrl: regForm.websiteUrl
        });

        if (resData.token) {
          localStorage.setItem('mlx_token', resData.token);
        }

        const newShop: Shop = resData.user?.shop || {
          id: resData.user?.id || `shop-${Date.now()}`,
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
          gstNumber: regForm.gstNumber,
          websiteUrl: regForm.websiteUrl,
          verified: false, // PENDING ADMIN APPROVAL
          status: 'PENDING',
          rating: 5.0,
          joinedDate: 'Today'
        };
        dispatch(addShop(newShop));
        dispatch(setActiveShop(newShop));
        onToast(`Merchant Shop Registered: ${newShop.name} (Status: PENDING Admin Approval)`, 'success');
      }
      dispatch(setShowAuthModal(false));
    } catch (err: any) {
      onToast(err.message || 'Registration failed', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowAuthModal(false))}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          padding: '2.25rem 2rem',
          borderRadius: '24px',
          position: 'relative',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 111, 0, 0.15)',
          color: '#ffffff',
        }}
      >
        <button
          className="modal-close-btn"
          onClick={() => dispatch(setShowAuthModal(false))}
          style={{
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#94a3b8',
          }}
        >
          <X size={18} />
        </button>

        {/* Merchant Partner Header Badge (Visible only when in Seller Mode) */}
        {authRole === 'seller' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, rgba(255, 111, 0, 0.2) 0%, rgba(234, 88, 12, 0.12) 100%)',
              color: '#ff9e40',
              border: '1px solid rgba(255, 111, 0, 0.35)',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '1rem',
              boxShadow: '0 0 15px rgba(255, 111, 0, 0.15)',
            }}
          >
            <Store size={15} style={{ color: '#ff9e40' }} />
            <span>Merchant Store Partner Portal</span>
          </div>
        )}

        {/* Modal Main Header */}
        <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
            {authTab === 'login'
              ? (authRole === 'customer' ? 'Customer Sign In' : 'Shop Partner Sign In')
              : (authRole === 'customer' ? 'Create Customer Account' : 'Register Shop Partner')
            }
          </h2>
          <p style={{ fontSize: '0.83rem', color: '#94a3b8', marginTop: '0.35rem', margin: 0, lineHeight: 1.4 }}>
            {authRole === 'customer'
              ? 'Sign in to browse, buy and contact local store dealers'
              : 'Access your merchant shop dashboard and listings'
            }
          </p>
        </div>

        {/* Primary Tabs (Sign In vs Register Account) */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            marginBottom: '1.5rem',
            background: '#0f172a',
            padding: '5px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            className={`role-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => dispatch(setAuthTab('login'))}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: authTab === 'login' ? 700 : 600,
              fontSize: '0.85rem',
              background: authTab === 'login' ? 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)' : 'transparent',
              color: authTab === 'login' ? '#ffffff' : '#94a3b8',
              boxShadow: authTab === 'login' ? '0 4px 12px rgba(255, 111, 0, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`role-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => dispatch(setAuthTab('register'))}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: authTab === 'register' ? 700 : 600,
              fontSize: '0.85rem',
              background: authTab === 'register' ? 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)' : 'transparent',
              color: authTab === 'register' ? '#ffffff' : '#94a3b8',
              boxShadow: authTab === 'register' ? '0 4px 12px rgba(255, 111, 0, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Register Account
          </button>
        </div>

        {authTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label">{authRole === 'seller' ? 'Business Email *' : 'Email Address *'}</label>
              <input 
                type="email" 
                className="form-input-text" 
                required 
                placeholder={authRole === 'seller' ? "e.g. store@gmail.com" : "e.g. user@gmail.com"}
                value={loginEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
              />
            </div>
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
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Subscription Plan *</label>
                  <select 
                    className="form-select-box" 
                    required 
                    value={regForm.subscriptionPlanId} 
                    onChange={(e) => setRegForm({ ...regForm, subscriptionPlanId: e.target.value })}
                    style={{ borderColor: '#ff9e40' }}
                  >
                    {activePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — Limit: {plan.productLimit} Products ({plan.description})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shop Business Name *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Kochi iStore Mobiles" value={regForm.shopName} onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Afraf Fayas" value={regForm.ownerName} onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Profile / Logo Image URL *</label>
                  <input type="text" className="form-input-text" required placeholder="https://..." value={regForm.profileImage} onChange={(e) => setRegForm({ ...regForm, profileImage: e.target.value })} />
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
                  <label className="form-label">WhatsApp Number *</label>
                  <PhoneInputWithCountry required value={regForm.whatsapp} onChange={(val) => setRegForm({ ...regForm, whatsapp: val })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <select className="form-select-box" value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}>
                    {CITIES.filter(c => c !== "All Cities").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Ernakulam" value={regForm.district} onChange={(e) => setRegForm({ ...regForm, district: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <input type="text" className="form-input-text" required placeholder="India" value={regForm.country} onChange={(e) => setRegForm({ ...regForm, country: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Aadhaar Card Number *</label>
                  <input type="text" className="form-input-text" required placeholder="12-digit Aadhaar Number" value={regForm.aadhaarNumber} onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Card Number *</label>
                  <input type="text" className="form-input-text" required placeholder="10-character PAN Number" value={regForm.panNumber} onChange={(e) => setRegForm({ ...regForm, panNumber: e.target.value })} />
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
                  <span>Processing...</span>
                </>
              ) : (
                authRole === 'customer' ? 'Create Customer Account' : 'Submit Shop Registration'
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

        {/* Subtle Footer Switcher for Shop Owners */}
        <div
          className="auth-shop-partner-footer"
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          {authRole === 'customer' ? (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                Are you a Shop Owner?
              </span>
              <button
                type="button"
                onClick={() => {
                  dispatch(setAuthRole('seller'));
                  dispatch(setAuthTab('login'));
                }}
                style={{
                  background: 'rgba(255, 111, 0, 0.1)',
                  border: '1px solid rgba(255, 111, 0, 0.3)',
                  color: '#ff9e40',
                  fontWeight: 700,
                  fontSize: '0.83rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Store size={15} />
                <span>Sign In / Register as a Store Partner</span>
                <ArrowRight size={14} />
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
