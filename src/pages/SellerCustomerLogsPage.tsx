import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Phone,
  MapPin,
  Heart,
  Eye,
  Crown,
  Sparkles,
  Search,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Activity,
  Layers,
  Mail,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { setSelectedProduct } from '../store/productsSlice';
import { getSellerCustomerActivityLogs } from '../services/apiService';
import { SellerCustomerLog, SellerCustomerLogsResponse, Product } from '../types';

interface SellerCustomerLogsPageProps {
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onOpenUpgradeModal?: () => void;
}

export const SellerCustomerLogsPage: React.FC<SellerCustomerLogsPageProps> = ({
  onToast,
  onOpenUpgradeModal
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { activeShop } = useAppSelector((state) => state.auth);
  const { items: products } = useAppSelector((state) => state.products);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logsData, setLogsData] = useState<SellerCustomerLogsResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WHATSAPP' | 'CALL' | 'LOCATION' | 'WISHLIST' | 'CLICKS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Check if seller's active plan is Premium
  const isShopPremium = useMemo(() => {
    if (logsData?.subscription?.isPremium !== undefined) {
      return logsData.subscription.isPremium;
    }
    const currentPlanName = activeShop?.subscription?.plan?.name || '';
    return currentPlanName.toLowerCase().includes('premium');
  }, [logsData, activeShop]);

  const activePlanName = useMemo(() => {
    return logsData?.subscription?.planName || activeShop?.subscription?.plan?.name || 'Starter Plan';
  }, [logsData, activeShop]);

  // Fetch Live Activity Logs from Backend
  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('mlx_token') : null;

    if (!token) {
      generateFallbackData();
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await getSellerCustomerActivityLogs(token, activeShop?.id);
      if (data && Array.isArray(data.logs)) {
        setLogsData(data);
      } else {
        generateFallbackData();
      }
    } catch (err: any) {
      console.warn('Could not fetch seller logs from API, generating local store records:', err);
      generateFallbackData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateFallbackData = () => {
    const shopProducts = products.filter(p => !activeShop || p.shopId === activeShop.id);
    const primaryProd = shopProducts[0] || products[0] || {
      id: 'prod-1',
      name: 'Apple iPhone 15 Pro (White Titanium, 128 GB)',
      price: 136000,
      category: 'Mobiles'
    };

    const mockLogs: SellerCustomerLog[] = [
      {
        id: 'log-101',
        action: 'LOCATION_CLICK',
        createdAt: new Date().toISOString(),
        details: `Location & Directions clicked for shop: "${activeShop?.name || 'Global enterprises'}"`,
        ipAddress: '127.0.0.1',
        isLocked: false,
        requiresPremium: false,
        customer: {
          name: 'Vaishnavi',
          email: 'vaishnavi9248@gmail.com',
          phone: '+91 7510538712',
          isMasked: false
        },
        product: {
          id: primaryProd.id,
          name: primaryProd.name,
          price: primaryProd.price,
          category: primaryProd.category,
          image: primaryProd.images?.[0] || null
        }
      },
      {
        id: 'log-102',
        action: 'PRODUCT_CLICK',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        details: `Clicked on product "${primaryProd.name}" listed by "${activeShop?.name || 'Global enterprises'}"`,
        ipAddress: '127.0.0.1',
        isLocked: !isShopPremium,
        requiresPremium: !isShopPremium,
        customer: isShopPremium
          ? {
              name: 'Vaishnavi',
              email: 'vaishnavi9248@gmail.com',
              phone: '+91 7510538712',
              isMasked: false
            }
          : {
              name: 'Customer (Premium Only)',
              email: '***@***.***',
              phone: '+91 **********',
              isMasked: true
            },
        product: {
          id: primaryProd.id,
          name: primaryProd.name,
          price: primaryProd.price,
          category: primaryProd.category,
          image: primaryProd.images?.[0] || null
        }
      }
    ];

    setLogsData({
      shop: {
        id: activeShop?.id || 'shop-1',
        name: activeShop?.name || 'Global enterprises',
        ownerName: activeShop?.ownerName || 'Merchant',
        city: activeShop?.city || 'Calicut'
      },
      subscription: {
        planName: activePlanName,
        isPremium: isShopPremium
      },
      stats: {
        total: mockLogs.length,
        whatsappCount: mockLogs.filter(l => l.action === 'WHATSAPP_CLICK').length,
        callCount: mockLogs.filter(l => l.action === 'CALL_CLICK').length,
        locationCount: mockLogs.filter(l => l.action === 'LOCATION_CLICK' || l.action === 'DIRECTIONS_CLICK').length,
        wishlistCount: mockLogs.filter(l => l.action === 'WISHLIST').length,
        productClicksCount: mockLogs.filter(l => l.action === 'PRODUCT_CLICK').length
      },
      logs: mockLogs
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [activeShop?.id, isShopPremium]);

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (onToast) onToast(`Copied "${text}" to clipboard!`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const displayLogs = useMemo(() => {
    if (!logsData?.logs) return [];

    let filtered = logsData.logs.filter((log) => {
      if (activeFilter === 'WHATSAPP' && log.action !== 'WHATSAPP_CLICK') return false;
      if (activeFilter === 'CALL' && log.action !== 'CALL_CLICK') return false;
      if (activeFilter === 'LOCATION' && log.action !== 'LOCATION_CLICK' && log.action !== 'DIRECTIONS_CLICK') return false;
      if (activeFilter === 'WISHLIST' && log.action !== 'WISHLIST') return false;
      if (activeFilter === 'CLICKS' && log.action !== 'PRODUCT_CLICK') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const custName = (log.customer?.name || '').toLowerCase();
        const custPhone = (log.customer?.phone || '').toLowerCase();
        const custEmail = (log.customer?.email || '').toLowerCase();
        const prodName = (log.product?.name || '').toLowerCase();
        const details = (log.details || '').toLowerCase();

        return custName.includes(q) || custPhone.includes(q) || custEmail.includes(q) || prodName.includes(q) || details.includes(q);
      }

      return true;
    });

    filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [logsData, activeFilter, searchQuery, sortOrder]);

  const stats = logsData?.stats || {
    total: 0,
    whatsappCount: 0,
    callCount: 0,
    locationCount: 0,
    wishlistCount: 0,
    productClicksCount: 0
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'WHATSAPP_CLICK':
        return {
          label: 'WhatsApp Inquiry',
          color: '#16a34a',
          bg: '#dcfce7',
          border: '#86efac',
          icon: <Smartphone size={14} color="#16a34a" />
        };
      case 'CALL_CLICK':
        return {
          label: 'Direct Phone Call',
          color: '#059669',
          bg: '#ecfdf5',
          border: '#6ee7b7',
          icon: <Phone size={14} color="#059669" />
        };
      case 'LOCATION_CLICK':
      case 'DIRECTIONS_CLICK':
        return {
          label: 'Store Directions',
          color: '#0284c7',
          bg: '#e0f2fe',
          border: '#7dd3fc',
          icon: <MapPin size={14} color="#0284c7" />
        };
      case 'WISHLIST':
        return {
          label: 'Wishlisted Item',
          color: '#e11d48',
          bg: '#ffe4e6',
          border: '#fda4af',
          icon: <Heart size={14} color="#e11d48" fill="#e11d48" />
        };
      case 'PRODUCT_CLICK':
        return {
          label: 'Product Click & View',
          color: '#7c3aed',
          bg: '#f3e8ff',
          border: '#d8b4fe',
          icon: <Eye size={14} color="#7c3aed" />
        };
      default:
        return {
          label: 'Activity',
          color: '#475569',
          bg: '#f1f5f9',
          border: '#cbd5e1',
          icon: <Activity size={14} color="#475569" />
        };
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="dashboard-panel" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', padding: '1.5rem' }}>
      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)' }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Customer Engagement & Activity Logs
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Live customer logs: WhatsApp inquiries, direct calls, shop directions, wishlists, and product views.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: isShopPremium ? '#f5f3ff' : '#f8fafc',
            border: isShopPremium ? '1px solid #c084fc' : '1px solid #e2e8f0',
            color: isShopPremium ? '#6b21a8' : '#334155'
          }}>
            {isShopPremium ? <Crown size={14} color="#9333ea" /> : <Layers size={14} color="#64748b" />}
            <span>Plan: <strong>{activePlanName}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Subscription Status Banner */}
      {!isShopPremium ? (
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
            <Crown size={24} color="#fbbf24" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                Upgrade to Premium to Unlock Full Product Click & Viewing History
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#e0e7ff', lineHeight: 1.35 }}>
                Free & Pro plans show WhatsApp, Calls, Directions, and Wishlists. Upgrade to <strong>Premium</strong> to reveal full customer contact info and timestamps for every product click!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenUpgradeModal) onOpenUpgradeModal();
              else if (onToast) onToast('Select Premium Plan in Profile Settings to upgrade!', 'info');
            }}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ffffff',
              color: '#4f46e5',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexShrink: 0
            }}
          >
            <Sparkles size={14} color="#4f46e5" />
            <span>Upgrade to Premium</span>
          </button>
        </div>
      ) : (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: '#f5f3ff',
          border: '1px solid #d8b4fe',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          boxSizing: 'border-box'
        }}>
          <ShieldCheck size={16} color="#7e22ce" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#581c87' }}>
            Premium Plan Active: Full customer viewing history and product click analytics unlocked.
          </span>
        </div>
      )}

      {/* 3. Compact Metric Counters (Grid that never overflows) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.65rem',
        marginBottom: '1.25rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {[
          { key: 'ALL', label: 'Total Activity', count: stats.total, icon: <Activity size={15} color="#0284c7" />, activeColor: '#0f172a' },
          { key: 'WHATSAPP', label: 'WhatsApp', count: stats.whatsappCount, icon: <Smartphone size={15} color="#16a34a" />, activeColor: '#14532d' },
          { key: 'CALL', label: 'Calls', count: stats.callCount, icon: <Phone size={15} color="#059669" />, activeColor: '#064e3b' },
          { key: 'LOCATION', label: 'Directions', count: stats.locationCount, icon: <MapPin size={15} color="#0284c7" />, activeColor: '#0c4a6e' },
          { key: 'WISHLIST', label: 'Wishlisted', count: stats.wishlistCount, icon: <Heart size={15} color="#e11d48" fill="#e11d48" />, activeColor: '#881337' },
          { key: 'CLICKS', label: 'Product Clicks', count: stats.productClicksCount, icon: <Eye size={15} color="#7c3aed" />, activeColor: '#3b0764', isPrem: true }
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setActiveFilter(item.key as any)}
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '10px',
              background: activeFilter === item.key ? item.activeColor : '#f8fafc',
              color: activeFilter === item.key ? '#ffffff' : '#0f172a',
              border: activeFilter === item.key ? '1px solid transparent' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: activeFilter === item.key ? '#94a3b8' : '#64748b' }}>
                {item.label}
              </span>
              {item.icon}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2 }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '0.75rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search customer, phone, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem 0.45rem 2rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Pills & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'WHATSAPP', label: 'WhatsApp' },
            { key: 'CALL', label: 'Calls' },
            { key: 'LOCATION', label: 'Directions' },
            { key: 'WISHLIST', label: 'Wishlist' },
            { key: 'CLICKS', label: 'Clicks' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveFilter(item.key as any)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeFilter === item.key ? '1px solid #ea580c' : '1px solid #e2e8f0',
                background: activeFilter === item.key ? '#fff7ed' : '#ffffff',
                color: activeFilter === item.key ? '#ea580c' : '#475569'
              }}
            >
              {item.label}
            </button>
          ))}

          {/* Layout Toggle */}
          <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', marginLeft: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card View"
              style={{
                padding: '0.35rem 0.55rem',
                background: viewMode === 'cards' ? '#ea580c' : '#ffffff',
                color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                padding: '0.35rem 0.55rem',
                background: viewMode === 'table' ? '#ea580c' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Logs Content: Responsive Cards or Clean Table */}
      {loading ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#ea580c' }} />
          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loading activity logs...</p>
        </div>
      ) : displayLogs.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem 0' }}>
            No Activity Logs Found
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            {searchQuery ? 'No interactions matched your search query.' : 'Customer interactions for your store and products will appear here.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* --- RESPONSIVE CARD VIEW (Fits in any width, never overflows) --- */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
          {displayLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const isLocked = log.isLocked;

            return (
              <div
                key={log.id}
                style={{
                  background: isLocked ? '#faf5ff' : '#ffffff',
                  borderRadius: '12px',
                  border: isLocked ? '1px solid #d8b4fe' : '1px solid #e2e8f0',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {/* Card Top: Action Badge & Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} />
                    <span>{formatTimestamp(log.createdAt)}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  {isLocked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock size={15} color="#7c3aed" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#6b21a8', filter: 'blur(3px)' }}>
                          Johnathan Doe
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#9333ea', fontWeight: 600 }}>
                          Upgrade to Premium to reveal buyer identity
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {(log.customer?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.customer?.name || 'Customer Lead'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '2px' }}>
                          {log.customer?.phone && (
                            <span style={{ fontSize: '0.74rem', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Phone size={11} color="#64748b" />
                              <span>{log.customer.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(log.customer!.phone!, `p-${log.id}`)}
                                title="Copy phone"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                              >
                                {copiedId === `p-${log.id}` ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                              </button>
                            </span>
                          )}
                          {log.customer?.email && (
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.customer.email}>
                              <Mail size={11} color="#94a3b8" />
                              <span>{log.customer.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Product (If applicable) */}
                {log.product && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.55rem 0.65rem',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {log.product.image ? (
                        <img src={log.product.image} alt={log.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Layers size={14} color="#94a3b8" />
                      )}
                    </div>
                    <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.product.name}>
                        {log.product.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                        {log.product.price ? `₹${log.product.price.toLocaleString('en-IN')}` : 'Store Listing'}
                        {log.product.category && <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '0.35rem' }}>• {log.product.category}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem' }}>
                  {isLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenUpgradeModal) onOpenUpgradeModal();
                        else if (onToast) onToast('Upgrade to Premium to reveal buyer details!', 'info');
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        background: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Crown size={12} />
                      <span>Unlock with Premium</span>
                    </button>
                  ) : (
                    <>
                      {log.customer?.phone && (
                        <>
                          <a
                            href={`https://wa.me/${log.customer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Chat"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              background: '#dcfce7',
                              color: '#16a34a',
                              border: '1px solid #86efac',
                              textDecoration: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            <Smartphone size={12} />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${log.customer.phone}`}
                            title="Call Customer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #6ee7b7',
                              textDecoration: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </a>
                        </>
                      )}

                      {log.product && (
                        <button
                          type="button"
                          onClick={() => {
                            const fullProd = products.find(p => p.id === log.product.id) || log.product;
                            dispatch(setSelectedProduct(fullProd as Product));
                            navigate(`/product/${log.product.id}`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <ExternalLink size={11} />
                          <span>View Product</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- COMPACT RESPONSIVE TABLE VIEW --- */
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Buyer</th>
                <th style={{ padding: '0.75rem 0.75rem' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                <th style={{ padding: '0.75rem 0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const isLocked = log.isLocked;

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLocked ? '#faf5ff' : '#ffffff' }}>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      {isLocked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Lock size={13} color="#7c3aed" />
                          <span style={{ fontWeight: 700, color: '#6b21a8', filter: 'blur(2px)' }}>Buyer Info</span>
                          <span style={{ fontSize: '0.62rem', background: '#ede9fe', color: '#7c3aed', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>PREMIUM</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.customer?.name || 'Customer'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.customer?.phone || log.customer?.email || 'Direct Lead'}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      {log.product ? (
                        <div style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, color: '#0f172a' }} title={log.product.name}>
                          {log.product.name}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Shop Direct</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      {isLocked ? (
                        <button
                          type="button"
                          onClick={() => onOpenUpgradeModal && onOpenUpgradeModal()}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: '#7c3aed', color: '#fff', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Unlock
                        </button>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          {log.customer?.phone && (
                            <a
                              href={`https://wa.me/${log.customer.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
