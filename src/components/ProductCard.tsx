import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Smartphone, MapPin, ShieldCheck, Clock, Heart, Store, Sparkles } from 'lucide-react';
import { Product, Shop } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedProduct } from '../store/productsSlice';
import { setAuthRole, setAuthTab, setShowAuthModal } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { logActivity } from '../services/apiService';

interface ProductCardProps {
  product: Product;
  seller: Shop;
  onCallSeller: (product: Product, seller: Shop) => void;
  onWhatsAppSeller: (product: Product, seller: Shop) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  seller,
  onCallSeller,
  onWhatsAppSeller,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { activeUser, activeShop } = useAppSelector((state) => state.auth);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSoldOut = product.stock <= 0 || product.isSoldOut;
  const effectivePrice = product.offerPrice || product.price;
  const hasDiscount = product.offerPrice && product.offerPrice < product.price;
  const condition = product.condition || product.specs?.['Condition'] || 'Verified Pre-owned';

  const handleClick = () => {
    if (!activeUser && !activeShop) {
      dispatch(setAuthRole('customer'));
      dispatch(setAuthTab('login'));
      dispatch(setShowAuthModal(true));
      dispatch(addToast({ message: 'Please log in to view full product details & seller info.', type: 'info' }));
      return;
    }

    const isSameUser = Boolean(
      activeUser?.id &&
      (seller?.ownerId || seller?.id) &&
      (String(activeUser.id).trim().toLowerCase() === String(seller.ownerId || '').trim().toLowerCase() ||
       String(activeUser.id).trim().toLowerCase() === String(seller.id).trim().toLowerCase())
    );

    logActivity({
      action: 'PRODUCT_CLICK',
      details: isSameUser
        ? `Clicked on product "${product.name}" (ID: ${product.id}, Price: ₹${effectivePrice.toLocaleString('en-IN')}) (Self view by owner)`
        : `Clicked on product "${product.name}" (ID: ${product.id}, Price: ₹${effectivePrice.toLocaleString('en-IN')}) listed by "${seller?.name || 'Shop'}"`,
      userId: activeUser?.id,
      sellerId: seller?.ownerId || seller?.id,
    });
    dispatch(setSelectedProduct(product));
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const imageSrc = !imgError && product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: isHovered ? '1px solid #fed7aa' : '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: isHovered ? '0 16px 32px -4px rgba(234, 88, 12, 0.12), 0 4px 12px rgba(0,0,0,0.04)' : '0 2px 10px rgba(0, 0, 0, 0.04)',
        transform: isHovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        position: 'relative',
        opacity: isSoldOut ? 0.82 : 1
      }}
    >
      {/* Visual Image Showcase */}
      <div
        style={{
          position: 'relative',
          height: '210px',
          width: '100%',
          backgroundColor: '#f8fafc',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {/* Wishlist Heart Overlay */}
        {onToggleWishlist && (
          <button
            type="button"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10,
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isWishlisted ? '#ef4444' : '#64748b',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <Heart size={16} fill={isWishlisted ? '#ef4444' : 'transparent'} />
          </button>
        )}

        {/* Condition / Stock Tag Overlay */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isSoldOut ? (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.68rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              🔴 SOLD OUT
            </span>
          ) : (
            <span
              style={{
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.68rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              <Sparkles size={11} color="#f59e0b" />
              <span>{condition}</span>
            </span>
          )}
        </div>

        {/* Gadget Image */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '12px',
              transition: 'transform 0.35s ease',
              transform: isHovered ? 'scale(1.06)' : 'none'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: '0.4rem'
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>📱</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{product.category}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Category & Urgency */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#ea580c',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}
          >
            {product.brand || product.category}
          </span>
          {product.stock > 0 && product.stock <= 3 && !isSoldOut && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
              ⚡ Only {product.stock} left!
            </span>
          )}
        </div>

        {/* Product Title */}
        <h4
          title={product.name}
          style={{
            fontSize: '0.98rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.35,
            margin: '0 0 0.55rem 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.65rem'
          }}
        >
          {product.name}
        </h4>

        {/* Specs Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem', minHeight: '1.6rem' }}>
          {(product.storage || product.specs?.['Storage'] || product.specs?.['Storage Capacity']) && (
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '6px' }}>
              💾 {product.storage || product.specs?.['Storage'] || product.specs?.['Storage Capacity']}
            </span>
          )}
          {(product.ram || product.specs?.['RAM']) && (
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '6px' }}>
              ⚡ {product.ram || product.specs?.['RAM']}
            </span>
          )}
          {(product.processor || product.specs?.['Processor'] || product.specs?.['Processor / Chipset']) && (
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '6px' }}>
              ⚙️ {product.processor || product.specs?.['Processor'] || product.specs?.['Processor / Chipset']}
            </span>
          )}
          {(product.specs?.['Product Type'] || product.productType) && (
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.45rem', borderRadius: '6px' }}>
              🏷️ {product.specs?.['Product Type'] || product.productType}
            </span>
          )}
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <span style={{ fontSize: '1.28rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                SAVE ₹{(product.price - product.offerPrice!).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>

        {/* Seller Info Box */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (seller?.id) {
              logActivity({
                action: 'SHOP_CLICK',
                details: `Clicked on shop "${seller.name}" (ID: ${seller.id}) from similar gadgets`,
                userId: activeUser?.id,
              });
            }
          }}
          style={{
            marginTop: 'auto',
            paddingTop: '0.65rem',
            borderTop: '1px solid #f1f5f9',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
              <Store size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {seller?.name || 'Verified Local Partner'}
              </span>
            </div>

            {seller?.verified ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={12} />
                <span>Verified</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#d97706',
                  background: '#fef3c7',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                <Clock size={12} />
                <span>Pending</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>
            <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {seller?.city || seller?.address || 'Kerala, India'}
            </span>
          </div>
        </div>

        {/* Actions Row: Call Dealer & WhatsApp */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
        >
          {isSoldOut && (
            <div style={{ fontSize: '0.68rem', textAlign: 'center', color: '#dc2626', fontWeight: 700, background: '#fef2f2', padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #fee2e2' }}>
              💬 Out of stock? Call or WhatsApp seller to enquire restock!
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onCallSeller(product, seller)}
              title={isSoldOut ? "Call dealer to ask about restock / availability" : "Call dealer directly"}
              style={{
                padding: '0.55rem 0.5rem',
                borderRadius: '10px',
                border: isSoldOut ? '1px solid #fca5a5' : '1px solid #fed7aa',
                background: isSoldOut ? '#fff5f5' : '#fff7ed',
                color: isSoldOut ? '#c53030' : '#ea580c',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isSoldOut ? '#fed7d7' : '#ffedd5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isSoldOut ? '#fff5f5' : '#fff7ed';
              }}
            >
              <Phone size={13} />
              <span>{isSoldOut ? 'Call Dealer' : 'Call Dealer'}</span>
            </button>

            <button
              type="button"
              onClick={() => onWhatsAppSeller(product, seller)}
              title={isSoldOut ? "WhatsApp dealer to inquire restock" : "Chat on WhatsApp"}
              style={{
                padding: '0.55rem 0.5rem',
                borderRadius: '10px',
                border: 'none',
                background: '#22c55e',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.28)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#16a34a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#22c55e';
              }}
            >
              <Smartphone size={13} />
              <span>{isSoldOut ? 'WhatsApp' : 'WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
