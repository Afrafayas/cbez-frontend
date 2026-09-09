import React, { useState, ChangeEvent } from 'react';
import { Search, MapPin, Store, User, LogOut, LogIn, Smartphone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setSearchQuery, 
  setFilterCity, 
  setSelectedCategory, 
  setFilterMaxBudget 
} from '../store/filtersSlice';
import { setAuthRole, setAuthTab, setShowAuthModal, setActiveShop, setActiveUser } from '../store/authSlice';
import { setDashboardTab } from '../store/uiSlice';
import { CITIES } from '../data/mockData';
import { Product } from '../types';

interface NavbarProps {
  filteredProducts: Product[];
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ filteredProducts, onToast }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { searchQuery } = useAppSelector(state => state.filters);
  const { activeShop, activeUser } = useAppSelector(state => state.auth);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleTagClick = (type: string, val: string) => {
    if (type === 'city') dispatch(setFilterCity(val));
    if (type === 'category') dispatch(setSelectedCategory(val));
    if (type === 'budget') {
      const num = parseInt(val.replace(/[^0-9]/g, ''));
      if (num) dispatch(setFilterMaxBudget(String(num)));
    }
    if (type === 'query') dispatch(setSearchQuery(val));
    setIsSearchFocused(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo Branding */}
        <div className="brand-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="MLX Direct Logo" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          <div className="brand-text-container">
            <div className="brand-title">MLX <span>DIRECT</span></div>
            <div className="brand-subtitle">Used Gadgets Portal</div>
          </div>
        </div>

        {/* Real-time Multi-word Search Bar */}
        <div className="search-bar-wrapper">
          <div className="header-search-box">
            <Search className="search-box-icon" size={16} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search used iPhones, OnePlus, budget..."
              value={searchQuery}
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

          {/* Autocomplete Dropdown Overlay Panel */}
          {isSearchFocused && (
            <>
              <div className="search-overlay-backdrop" onClick={() => setIsSearchFocused(false)}></div>
              <div className="search-explore-overlay minimal-search-overlay">
                {/* City Tags Row */}
                <div className="overlay-minimal-row">
                  <button 
                    type="button"
                    className="detect-location-btn" 
                    onClick={() => {
                      dispatch(setFilterCity('Kochi'));
                      onToast("📍 Geolocation active: Selected Kochi as nearest city!", "success");
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

                {/* Budgets & Categories */}
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

                {/* Trending Models */}
                <div className="overlay-minimal-row" style={{ borderTop: '1px solid var(--light-border)', paddingTop: '0.5rem', marginTop: '0.25rem', width: '100%' }}>
                  <span className="min-row-lbl">Trending:</span>
                  <div className="minimal-tags">
                    <button className="min-tag model" onClick={() => handleTagClick('query', 'iPhone 13')}>iPhone 13</button>
                    <button className="min-tag model" onClick={() => handleTagClick('query', 'Samsung S22')}>Samsung S22</button>
                    <button className="min-tag model" onClick={() => handleTagClick('query', 'MacBook Air')}>MacBook Air</button>
                    <button className="min-tag model" onClick={() => handleTagClick('query', 'OnePlus')}>OnePlus</button>
                  </div>
                </div>

                {/* Real-Time Autocomplete Suggestions */}
                {searchQuery.trim() !== '' && (
                  <div className="search-autocomplete-section" style={{ borderTop: '1px solid var(--light-border)', paddingTop: '0.6rem', marginTop: '0.4rem', width: '100%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>
                      Matching Products ({filteredProducts.length})
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '0.4rem 0' }}>
                        No matching products found for "{searchQuery}"
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

        {/* User & Seller Actions */}
        <div className="header-actions">
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
              <button className="action-btn" onClick={() => { dispatch(setActiveShop(null)); onToast("Seller logged out."); navigate('/'); }} title="Logout Shop">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="action-btn sell-btn" 
                onClick={() => {
                  dispatch(setAuthRole('seller'));
                  dispatch(setAuthTab('login'));
                  dispatch(setShowAuthModal(true));
                }}
              >
                <Store size={16} />
                <span className="nav-btn-text">Seller Login</span>
              </button>

              {activeUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="user-indicator">
                    <User size={14} />
                    <span className="user-badge-text-container">
                      <span className="user-badge-name">{activeUser.name}</span>
                    </span>
                  </span>
                  <button className="action-btn" onClick={() => { dispatch(setActiveUser(null)); onToast("Customer logged out."); }} title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  className="action-btn"
                  onClick={() => {
                    dispatch(setAuthRole('customer'));
                    dispatch(setAuthTab('login'));
                    dispatch(setShowAuthModal(true));
                  }}
                >
                  <LogIn size={16} />
                  <span className="nav-btn-text">Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
