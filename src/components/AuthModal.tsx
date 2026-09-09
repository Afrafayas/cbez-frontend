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
      alert(err.message || 'Login failed. Please check credentials.');
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
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowAuthModal(false))}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button className="modal-close-btn" onClick={() => dispatch(setShowAuthModal(false))}>
          <X size={18} />
        </button>

        <div className="auth-role-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            className={`role-tab ${authRole === 'customer' ? 'active' : ''}`}
            onClick={() => dispatch(setAuthRole('customer'))}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
          >
            Buyer / Consumer
          </button>
          <button
            className={`role-tab ${authRole === 'seller' ? 'active' : ''}`}
            onClick={() => dispatch(setAuthRole('seller'))}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
          >
            Seller Merchant
          </button>
        </div>

        <div className="modal-header">
          <h2 className="modal-title">
            {authTab === 'login' 
              ? (authRole === 'customer' ? 'Customer Sign In' : 'Merchant Shop Portal Login')
              : (authRole === 'customer' ? 'Create Customer Account' : 'Register New Merchant Shop')
            }
          </h2>
        </div>

        {authTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                className="form-input-text" 
                required 
                placeholder="e.g. store@gmail.com or user@gmail.com"
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
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {authRole === 'customer' ? 'Sign In as Consumer' : 'Sign In to Shop Dashboard'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('register')); }} style={{ color: '#2563eb', fontWeight: 600 }}>
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
                  <input type="text" className="form-input-text" required placeholder="+91 9876543210" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
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
                  <input type="text" className="form-input-text" required placeholder="+91 9876543210" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Number *</label>
                  <input type="text" className="form-input-text" required placeholder="919876543210" value={regForm.whatsapp} onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })} />
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
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Submit Registration
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
              Already registered?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch(setAuthTab('login')); }} style={{ color: '#2563eb', fontWeight: 600 }}>
                Sign In
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
