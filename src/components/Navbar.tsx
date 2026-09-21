import React, { useState, ChangeEvent } from 'react';
import { Search, MapPin, Store, User, LogOut, LogIn, Smartphone, Heart, Crosshair, Loader2, X, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setSearchQuery, 
  setFilterCity, 
  setSelectedCategory, 
  setFilterMaxBudget,
  setUserLocation
} from '../store/filtersSlice';
import { setAuthRole, setAuthTab, setShowAuthModal, setActiveShop, setActiveUser } from '../store/authSlice';
import { setDashboardTab } from '../store/uiSlice';
import { CITIES } from '../data/mockData';
import { Product } from '../types';
import { geocodeAddress, reverseGeocodeCoords, updateUser } from '../services/apiService';

interface NavbarProps {
  filteredProducts: Product[];
  onToast: (msg: string, type?: 'success' | 'info') => void;
  wishlistCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ filteredProducts, onToast, wishlistCount = 0 }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { searchQuery, userLocationName, radiusKm } = useAppSelector(state => state.filters);
  const { activeShop, activeUser } = useAppSelector(state => state.auth);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const handleWishlistClick = () => {
    if (activeUser) {
      navigate('/wishlist');
    } else {
      onToast("Please log in to access your wishlist", "info");
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(true));
    }
  };

  const applyNewLocation = async (lat: number, lng: number, locName: string) => {
    dispatch(setUserLocation({ latitude: lat, longitude: lng, locationName: locName, radiusKm: radiusKm || 100 }));
    dispatch(setFilterCity(locName));

    if (activeUser && activeUser.id) {
      try {
        const updated = await updateUser(activeUser.id, { latitude: lat, longitude: lng });
        if (updated) {
          dispatch(setActiveUser({ ...activeUser, latitude: lat, longitude: lng }));
        }
      } catch (err) {
        console.warn('Failed to update user profile location:', err);
      }
    }

    onToast(`📍 Location set to ${locName} (Within 100 KM)`, 'success');
    setShowLocationModal(false);
    navigate('/');
  };

  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      onToast('Geolocation is not supported by your browser.', 'info');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const rev = await reverseGeocodeCoords(latitude, longitude);
          const name = rev.city || rev.district || (rev.formattedAddress ? rev.formattedAddress.split(',')[0] : 'Current Location');
          await applyNewLocation(latitude, longitude, name);
        } catch (err) {
          await applyNewLocation(latitude, longitude, 'Current Location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        onToast('Unable to retrieve GPS location. Please select a city manually.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCityOrAddressSelect = async (cityName: string) => {
    setIsGeocoding(true);
    try {
      const geo = await geocodeAddress(cityName);
      await applyNewLocation(geo.latitude, geo.longitude, cityName);
    } catch (err: any) {
      onToast(err.message || 'Could not resolve location coordinates.', 'info');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    await handleCityOrAddressSelect(locationInput.trim());
    setLocationInput('');
  };

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

        {/* Location Display Widget (Immediately after Logo - Customer Users Only) */}
        {Boolean(activeUser && !activeShop) && (
        <div 
          className="navbar-location-selector"
          onClick={() => setShowLocationModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '0.35rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            transition: 'all 0.2s ease',
            marginLeft: '0.2rem',
            userSelect: 'none'
          }}
          title={`Selected Location: ${userLocationName || "None"} (Click to update)`}
        >
          <MapPin size={15} style={{ color: '#f97316', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Location</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userLocationName || 'Kochi'}
            </span>
          </div>
          <ChevronDown size={13} style={{ color: '#94a3b8', marginLeft: '0.1rem' }} />
        </div>
        )}

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
                    onClick={handleDetectGPSLocation}
                  >
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span>Near Me</span>
                  </button>
                  <div className="minimal-tags">
                    {CITIES.filter(c => c !== "All Cities").map(city => (
                      <button key={city} className="min-tag city" onClick={() => handleCityOrAddressSelect(city)}>{city}</button>
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
                    <button className="min-tag cat" onClick={() => handleTagClick('category', 'Smartphones & Mobiles')}>Smartphones</button>
                    <button className="min-tag cat" onClick={() => handleTagClick('category', 'Laptops & MacBooks')}>Laptops</button>
                    <button className="min-tag cat" onClick={() => handleTagClick('category', 'Smartwatches')}>Smartwatches</button>
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
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Wishlist Button */}
          <button
            type="button"
            className={`action-btn ${location.pathname === '/wishlist' ? 'active' : ''}`}
            onClick={handleWishlistClick}
            title="My Wishlist"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.6rem' }}
          >
            <Heart size={18} fill={wishlistCount > 0 ? '#ef4444' : 'transparent'} color={wishlistCount > 0 ? '#ef4444' : 'currentColor'} />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {wishlistCount}
              </span>
            )}
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
              <button
                className="action-btn"
                onClick={() => {
                  localStorage.removeItem('mlx_token');
                  localStorage.removeItem('mlx_active_shop');
                  localStorage.removeItem('mlx_auth_role');
                  dispatch(setActiveShop(null));
                  dispatch(setAuthRole('customer'));
                  dispatch(setAuthTab('login'));
                  dispatch(setShowAuthModal(false));
                  onToast("Seller logged out.", "info");
                  navigate('/');
                }}
                title="Logout Shop"
              >
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
                  <button 
                    className={`action-btn sell-btn ${location.pathname === '/customer-dashboard' ? 'active' : ''}`}
                    onClick={() => navigate('/customer-dashboard')}
                    title="Go to My Dashboard"
                  >
                    <User size={15} />
                    <span className="nav-btn-text" style={{ fontWeight: 600 }}>
                      {getFormattedUserName(activeUser)}
                    </span>
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => {
                      localStorage.removeItem('mlx_token');
                      localStorage.removeItem('mlx_active_user');
                      localStorage.removeItem('mlx_auth_role');
                      dispatch(setActiveUser(null));
                      dispatch(setAuthRole('customer'));
                      dispatch(setAuthTab('login'));
                      dispatch(setShowAuthModal(false));
                      onToast("Customer logged out.", "info");
                      navigate('/');
                    }}
                    title="Sign Out"
                  >
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

      {/* Location Selector Modal */}
      {showLocationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            color: '#f8fafc'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 41, 59, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Update Location</h3>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Products will filter within 100 KM of your area</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleDetectGPSLocation}
                disabled={isDetectingLocation || isGeocoding}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  cursor: isDetectingLocation || isGeocoding ? 'not-allowed' : 'pointer',
                  opacity: isDetectingLocation || isGeocoding ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {isDetectingLocation ? (
                  <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Crosshair size={18} />
                )}
                <span>{isDetectingLocation ? 'Detecting GPS Coordinates...' : 'Detect My Current Location (GPS)'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>OR SEARCH CITY / ADDRESS</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>

              {/* Address Search Form */}
              <form onSubmit={handleManualLocationSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter city or area (e.g. Kochi, Kozhikode)..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isGeocoding || !locationInput.trim()}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: (isGeocoding || !locationInput.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isGeocoding || !locationInput.trim()) ? 0.6 : 1
                  }}
                >
                  {isGeocoding ? 'Resolving...' : 'Set'}
                </button>
              </form>

              {/* Preset Kerala Cities */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.6rem' }}>Popular Cities:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {CITIES.filter(c => c !== 'All Cities').map(city => (
                    <button
                      key={city}
                      type="button"
                      disabled={isGeocoding}
                      onClick={() => handleCityOrAddressSelect(city)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '10px',
                        background: userLocationName === city ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        border: userLocationName === city ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: userLocationName === city ? '#f97316' : '#cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: isGeocoding ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
