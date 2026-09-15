import React, { useState, ChangeEvent, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setShowAuthModal, 
  setAuthTab, 
  setAuthRole, 
  setActiveUser, 
  setActiveShop 
} from '../store/authSlice';
import { addShop } from '../store/productsSlice';
import { Shop, User as CustomerUser } from '../types';
import { CITIES } from '../data/mockData';
import { registerUser, loginUser } from '../services/apiService';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';

interface AuthModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const { showAuthModal, authTab, authRole, shops } = useAppSelector(state => ({
    showAuthModal: state.auth.showAuthModal,
    authTab: state.auth.authTab,
    authRole: state.auth.authRole,
    shops: state.products.shops
  }));

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
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
    category: 'Mobiles & Tablets'
  });

  if (!showAuthModal) return null;

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onToast('Email address and Password are required to sign in', 'info');
      return;
    }

    try {
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
          joinedDate: 'Today'
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
    }
  };

  const handleRegSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!regForm.email || !regForm.password) {
      onToast('Email address and Password are required', 'info');
      return;
    }

    try {
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
        const resData = await registerUser({
          email: regForm.email,
          password: regForm.password,
          name: regForm.shopName || regForm.name || regForm.ownerName,
          phone: regForm.phone,
          role: 'seller',
          shopName: regForm.shopName || regForm.name,
          ownerName: regForm.ownerName || regForm.name,
          whatsapp: regForm.whatsapp || regForm.phone,
          address: regForm.address,
          city: regForm.city,
          category: regForm.category,
        });

        if (resData.token) {
          localStorage.setItem('mlx_token', resData.token);
        }

        const newShop: Shop = resData.user?.shop || {
          id: resData.user?.id || `shop-${Date.now()}`,
          name: regForm.shopName || regForm.name,
          ownerName: regForm.ownerName || regForm.name,
          phone: regForm.phone,
          whatsapp: regForm.whatsapp || regForm.phone,
          address: regForm.address,
          city: regForm.city,
          category: regForm.category,
          verified: true,
          rating: 5.0,
          joinedDate: 'Today'
        };
        dispatch(addShop(newShop));
        dispatch(setActiveShop(newShop));
        onToast(`Merchant Shop Registered: ${newShop.name}`, 'success');
      }
      dispatch(setShowAuthModal(false));
    } catch (err: any) {
      onToast(err.message || 'Registration failed', 'info');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowAuthModal(false))}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button className="modal-close-btn" onClick={() => dispatch(setShowAuthModal(false))}>
          <X size={18} />
        </button>

        {/* Merchant Partner Header Badge (Visible only when in Seller Mode) */}
        {authRole === 'seller' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              color: '#c2410c',
              border: '1px solid #fed7aa',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '0.85rem',
            }}
          >
            <span>🏪 Merchant Store Partner Portal</span>
          </div>
        )}

        {/* Modal Main Header */}
        <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
          <h2 className="modal-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {authTab === 'login'
              ? (authRole === 'customer' ? 'Customer Sign In' : 'Shop Partner Sign In')
              : (authRole === 'customer' ? 'Create Customer Account' : 'Register Shop Partner')
            }
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
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
            marginBottom: '1.25rem',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
          }}
        >
          <button
            type="button"
            className={`role-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => dispatch(setAuthTab('login'))}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: authTab === 'login' ? 700 : 600,
              fontSize: '0.85rem',
              background: authTab === 'login' ? '#ffffff' : 'transparent',
              color: authTab === 'login' ? '#0f172a' : '#64748b',
              boxShadow: authTab === 'login' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s Ease',
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
              padding: '0.5rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: authTab === 'register' ? 700 : 600,
              fontSize: '0.85rem',
              background: authTab === 'register' ? '#ffffff' : 'transparent',
              color: authTab === 'register' ? '#0f172a' : '#64748b',
              boxShadow: authTab === 'register' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s Ease',
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
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem', justifyContent: 'center' }}>
              {authRole === 'customer' ? 'Customer Sign In' : 'Access Shop Dashboard'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.83rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('register')); }} style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
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
                  <label className="form-label">Shop Business Name *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Kochi iStore Mobiles" value={regForm.shopName} onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <input type="text" className="form-input-text" required placeholder="e.g. Afraf Fayas" value={regForm.ownerName} onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })} />
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
                  <label className="form-label">Market Business Address *</label>
                  <textarea className="form-textarea" required rows={2} placeholder="MG Road, Broadway Corner" value={regForm.address} onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}></textarea>
                </div>
              </>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem', justifyContent: 'center' }}>
              {authRole === 'customer' ? 'Create Customer Account' : 'Submit Shop Registration'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.83rem', color: '#64748b' }}>
              Already registered?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('login')); }} style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
                Sign In
              </a>
            </div>
          </form>
        )}

        {/* Subtle Footer Switcher for Shop Owners */}
        <div
          className="auth-shop-partner-footer"
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}
        >
          {authRole === 'customer' ? (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Are you a Shop Owner?
              </span>
              <button
                type="button"
                onClick={() => {
                  dispatch(setAuthRole('seller'));
                  dispatch(setAuthTab('login'));
                }}
                style={{
                  background: '#fff7ed',
                  border: '1px solid #ffedd5',
                  color: '#ea580c',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s Ease',
                }}
              >
                <span>🏪 Sign In / Register as a Store Partner →</span>
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s Ease',
              }}
            >
              <span>← Switch back to Customer Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
