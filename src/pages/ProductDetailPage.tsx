import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Smartphone, 
  MapPin, 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  Navigation,
  ChevronRight,
  Store,
  Sparkles,
  Heart
} from 'lucide-react';
import { Product, Shop } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedProduct } from '../store/productsSlice';
import { setShowAuthModal, setAuthTab, setAuthRole } from '../store/authSlice';
import { followShop, unfollowShop, checkFollowStatus, logActivity } from '../services/apiService';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  getSellerShop: (shopId: string) => Shop;
  onCallSeller: (product: Product, seller: Shop) => void;
  onWhatsAppSeller: (product: Product, seller: Shop) => void;
  onGetDirections?: (seller: Shop) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  isWishlisted?: (productId: string) => boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  getSellerShop,
  onCallSeller,
  onWhatsAppSeller,
  onGetDirections,
  onToast,
  isWishlisted,
  onToggleWishlist,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.items);
  const { activeUser, activeShop } = useAppSelector((state) => state.auth);
  
  // Find product by URL param id or fallback to selectedProduct
  const product = products.find((p) => String(p.id) === String(id)) || 
                  useAppSelector((state) => state.products.selectedProduct);

  const [activeImgIdx, setActiveImgIdx] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);

  const isLoggedIn = Boolean(activeUser || activeShop);

  // Enforce customer/seller login requirement
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setSelectedProduct(null));
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(true));
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, dispatch, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  // Log Product Click activity
  useEffect(() => {
    if (product) {
      const sellerShop = getSellerShop(product.shopId);
      logActivity({
        action: 'PRODUCT_CLICK',
        details: `Clicked on product "${product.name}" (ID: ${product.id}, Price: ₹${(product.offerPrice || product.price).toLocaleString('en-IN')}) listed by "${sellerShop?.name || 'Shop'}"`,
        userId: activeUser?.id,
      });
    }
  }, [product?.id]);

  // Scroll to top on page mount or ID change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImgIdx(0);
    if (product) {
      dispatch(setSelectedProduct(product));
    }
  }, [id, product, dispatch]);

  // Load Follow status for shop
  useEffect(() => {
    async function loadFollowStatus() {
      if (!product) return;
      const token = localStorage.getItem('mlx_token');
      if (!token) return;
      try {
        const seller = getSellerShop(product.shopId);
        if (seller && seller.id) {
          const isFollowed = await checkFollowStatus(seller.id, token);
          setIsFollowing(isFollowed);
        }
      } catch (err) {
        setIsFollowing(false);
      }
    }
    loadFollowStatus();
  }, [product, getSellerShop]);

  if (!product) {
    return (
      <div style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Product Not Found</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          The requested gadget item could not be located or may have been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Marketplace Directory</span>
        </button>
      </div>
    );
  }

  const seller = getSellerShop(product.shopId);
  const isSoldOut = product.stock <= 0 || product.isSoldOut;

  // Related products (same category, excluding current product)
  const relatedProducts = products
    .filter((p) => p.category === product.category && String(p.id) !== String(product.id))
    .slice(0, 4);

  const isOwnShop = Boolean(
    (activeShop && seller && activeShop.id === seller.id) || 
    (activeShop && seller && activeShop.name === seller.name)
  );

  const handleFollowClick = async () => {
    if (isOwnShop) {
      if (onToast) onToast('You cannot follow your own merchant store', 'info');
      return;
    }

    const token = localStorage.getItem('mlx_token');
    if (!token) {
      if (onToast) onToast('Please sign in as consumer to follow shops', 'info');
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowShop(seller.id, token);
        setIsFollowing(false);
        if (onToast) onToast(`Unfollowed ${seller.name}`, 'info');
      } else {
        await followShop(seller.id, token);
        setIsFollowing(true);
        if (onToast) onToast(`You are now following ${seller.name}!`, 'success');
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Follow action failed', 'info');
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '1.5rem 0 3rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Breadcrumb Navigation & Back Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: '#64748b' }}>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
            <ChevronRight size={14} />
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Marketplace</Link>
            <ChevronRight size={14} />
            <span>{product.category}</span>
            <ChevronRight size={14} />
            <span style={{ color: '#0f172a', fontWeight: 700, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Marketplace</span>
          </button>
        </div>

        {/* Main Product Layout Card */}
        <div 
          style={{ 
            background: '#ffffff', 
            borderRadius: '18px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)', 
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 480px) 1fr', gap: '2.5rem', padding: '2rem' }}>
            
            {/* Left Column: Multi-Angle Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  width: '100%',
                  height: '380px',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}
              >
                {/* Sold Out Red Badge */}
                {isSoldOut && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    zIndex: 10,
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    textTransform: 'uppercase'
                  }}>
                    🔴 SOLD OUT
                  </div>
                )}

                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[activeImgIdx] || product.images[0]}
                    alt={product.name}
                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ fontSize: '4rem' }}>📱</div>
                )}
              </div>

              {/* Multi-Angle Photo Thumbnail Selector */}
              {product.images && product.images.length > 0 && (
                <div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#475569',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    📷 Multi-Angle Verified Photos ({product.images.length} views):
                  </span>
                  <div
                    style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.35rem' }}
                  >
                    {product.images.map((imgUrl, idx) => {
                      const labels = ['Front', 'Back', 'Side 1', 'Side 2', 'Angle 5', 'Angle 6', 'Angle 7'];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImgIdx(idx)}
                          style={{
                            border: activeImgIdx === idx ? '2px solid #ea580c' : '1px solid #cbd5e1',
                            borderRadius: '10px',
                            padding: '3px',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            boxShadow: activeImgIdx === idx ? '0 2px 8px rgba(234, 88, 12, 0.2)' : 'none'
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Angle ${idx + 1}`}
                            style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '6px' }}
                          />
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: activeImgIdx === idx ? '#ea580c' : '#64748b',
                              marginTop: '3px',
                            }}
                          >
                            {labels[idx] || `Angle ${idx + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Device Specifications & Seller Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#ea580c',
                      background: '#fff7ed',
                      border: '1px solid #ffedd5',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                    }}
                  >
                    {product.category}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                    Brand: <strong style={{ color: '#0f172a' }}>{product.brand}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <h1
                    style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, margin: 0 }}
                  >
                    {product.name}
                  </h1>
                  {onToggleWishlist && (
                    <button
                      type="button"
                      title={isWishlisted && isWishlisted(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      onClick={() => onToggleWishlist(product)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isWishlisted && isWishlisted(product.id) ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                        backgroundColor: isWishlisted && isWishlisted(product.id) ? '#fef2f2' : '#ffffff',
                        color: isWishlisted && isWishlisted(product.id) ? '#ef4444' : '#475569',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Heart size={18} fill={isWishlisted && isWishlisted(product.id) ? '#ef4444' : 'transparent'} />
                      <span>{isWishlisted && isWishlisted(product.id) ? 'Wishlisted' : 'Wishlist'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pricing & Offer Savings Box */}
              <div
                style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a' }}>
                    ₹{(product.offerPrice || product.price).toLocaleString('en-IN')}
                  </span>
                  {product.offerPrice && product.offerPrice < product.price && (
                    <>
                      <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#dc2626',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        Save ₹{(product.price - product.offerPrice).toLocaleString('en-IN')} (
                        {Math.round(
                          ((product.price - product.offerPrice) / product.price) * 100
                        )}
                        % OFF)
                      </span>
                    </>
                  )}
                </div>
                <div
                  style={{
                    marginTop: '0.4rem',
                    fontSize: '0.83rem',
                    fontWeight: 700,
                    color: isSoldOut ? '#dc2626' : '#16a34a',
                  }}
                >
                  {isSoldOut ? '🔴 SOLD OUT (Out of Stock)' : `🟢 In Stock (${product.stock} unit available)`}
                </div>
              </div>

              {/* Key Specs Grid */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'block',
                    marginBottom: '0.65rem',
                  }}
                >
                  📌 Device Specifications & Condition:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.83rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    💾 <strong>Storage:</strong> {product.storage || product.specs?.['Storage'] || 'N/A'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    ⚡ <strong>RAM:</strong> {product.ram || product.specs?.['RAM'] || 'N/A'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    🔋 <strong>Battery:</strong> {product.batteryHealth || product.specs?.['Battery'] || 'N/A'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    ✨ <strong>Condition:</strong> {product.condition || product.specs?.['Condition'] || 'Grade A'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    🕒 <strong>Device Age:</strong> {product.deviceAge || '6 Months Old'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    🛡️ <strong>Warranty:</strong> {product.warranty || product.specs?.['Warranty'] || 'Shop Warranty'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    🎨 <strong>Color:</strong> {product.color || 'Standard'}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    📶 <strong>Network:</strong> {product.network || '5G'} ({product.simType || 'Dual SIM'})
                  </div>
                </div>
              </div>

              {/* Included Accessories & Documents */}
              {((product.documents && product.documents.length > 0) ||
                (product.accessories && product.accessories.length > 0)) && (
                <div>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      display: 'block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    📦 Included Accessories & Documents:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(product.documents || product.accessories || []).map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#2563eb',
                          background: '#eff6ff',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                    📝 Description:
                  </span>
                  <p style={{ fontSize: '0.83rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line', margin: 0 }}>
                    {product.description}
                  </p>
                </div>
              )}

              {/* Seller Merchant Store Details & Action Buttons Card */}
              <div
                onClick={() => {
                  logActivity({
                    action: 'SHOP_CLICK',
                    details: `Clicked on shop "${seller.name}" (ID: ${seller.id}, City: ${seller.city || 'N/A'})`,
                    userId: activeUser?.id,
                  });
                }}
                style={{
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Store size={18} color="#ea580c" />
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {seller.name}
                      </span>
                      {seller.verified && (
                        <span
                          style={{
                            fontSize: '0.73rem',
                            color: '#16a34a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: '#dcfce7',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            border: '1px solid #86efac',
                          }}
                        >
                          <ShieldCheck size={13} /> Verified Merchant Store
                        </span>
                      )}
                    </div>
                    <div
                      onClick={() => onGetDirections && onGetDirections(seller)}
                      style={{
                        fontSize: '0.82rem',
                        color: onGetDirections ? '#2563eb' : '#64748b',
                        marginTop: '0.3rem',
                        cursor: onGetDirections ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title={onGetDirections ? "Click to open Google Maps directions" : undefined}
                    >
                      <MapPin size={14} style={{ flexShrink: 0 }} />
                      <span style={{ textDecoration: onGetDirections ? 'underline' : 'none' }}>
                        {seller.address}, {seller.city}
                      </span>
                    </div>
                  </div>

                  {/* Follow Store Button */}
                  {isOwnShop ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        flexShrink: 0,
                      }}
                    >
                      <Store size={15} />
                      <span>Your Store</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFollowClick}
                      disabled={isFollowLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isFollowing ? '1px solid #16a34a' : '1px solid #2563eb',
                        background: isFollowing ? '#f0fdf4' : '#2563eb',
                        color: isFollowing ? '#15803d' : '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={15} />
                          <span>Following Store</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          <span>+ Follow Shop</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Sourcing Action Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: onGetDirections ? '1fr 1fr 1fr' : '1fr 1fr',
                    gap: '0.65rem'
                  }}
                >
                  <button
                    type="button"
                    className="btn-call"
                    disabled={isSoldOut}
                    onClick={() => onCallSeller(product, seller)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.7rem 1rem',
                      borderRadius: '10px',
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                      opacity: isSoldOut ? 0.5 : 1
                    }}
                  >
                    <Phone size={16} />
                    <span>Call Dealer</span>
                  </button>

                  <button
                    type="button"
                    className="btn-whatsapp"
                    disabled={isSoldOut}
                    onClick={() => onWhatsAppSeller(product, seller)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.7rem 1rem',
                      borderRadius: '10px',
                      background: '#25d366',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                      opacity: isSoldOut ? 0.5 : 1
                    }}
                  >
                    <Smartphone size={16} />
                    <span>WhatsApp</span>
                  </button>

                  {onGetDirections && (
                    <button
                      type="button"
                      onClick={() => onGetDirections(seller)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.7rem 1rem',
                        borderRadius: '10px',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Navigation size={16} />
                      <span>Directions</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Related / Similar Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={20} color="#ea580c" />
                  <span>Similar Gadgets in {product.category}</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Explore more verified listings in the same category
                </p>
              </div>
            </div>

            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                gap: '1.25rem' 
              }}
            >
              {relatedProducts.map((relProd) => (
                <ProductCard
                  key={relProd.id}
                  product={relProd}
                  seller={getSellerShop(relProd.shopId)}
                  onCallSeller={onCallSeller}
                  onWhatsAppSeller={onWhatsAppSeller}
                  isWishlisted={isWishlisted ? isWishlisted(relProd.id) : false}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
