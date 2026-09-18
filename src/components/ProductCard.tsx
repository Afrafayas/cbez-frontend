import React from 'react';
import { Phone, Smartphone, MapPin, ShieldCheck, Clock, Heart } from 'lucide-react';
import { Product, Shop } from '../types';
import { useAppDispatch } from '../store';
import { setSelectedProduct } from '../store/productsSlice';

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
  const isSoldOut = product.stock <= 0 || product.isSoldOut;

  return (
    <div 
      className="product-card"
      onClick={() => dispatch(setSelectedProduct(product))}
      style={{ cursor: 'pointer', opacity: isSoldOut ? 0.8 : 1, position: 'relative' }}
    >
      {/* Wishlist Heart Icon Overlay */}
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
            top: '12px',
            right: '12px',
            zIndex: 11,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isWishlisted ? '#ef4444' : '#64748b',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <Heart size={18} fill={isWishlisted ? '#ef4444' : 'transparent'} />
        </button>
      )}

      {/* Sold Out Red Badge Overlay */}
      {isSoldOut && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          background: '#dc2626',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.75rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🔴 SOLD OUT
        </div>
      )}

      <div className="product-visual">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="product-visual-img" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
            📱
          </div>
        )}
      </div>

      <div className="product-details">
        <div className="product-header">
          <span className="product-category-tag">{product.category}</span>
          <h3 className="product-title">{product.name}</h3>
        </div>

        <div className="product-specs-chips">
          {(product.storage || product.specs?.['Storage'] || product.specs?.['Storage Capacity']) && (
            <span className="chip">💾 {product.storage || product.specs?.['Storage'] || product.specs?.['Storage Capacity']}</span>
          )}
          {(product.ram || product.specs?.['RAM']) && (
            <span className="chip">⚡ {product.ram || product.specs?.['RAM']}</span>
          )}
          {(product.processor || product.specs?.['Processor'] || product.specs?.['Processor / Chipset']) && (
            <span className="chip">⚙️ {product.processor || product.specs?.['Processor'] || product.specs?.['Processor / Chipset']}</span>
          )}
          {(product.specs?.['Product Type'] || product.productType) && (
            <span className="chip">🏷️ {product.specs?.['Product Type'] || product.productType}</span>
          )}
          {(product.condition || product.specs?.['Condition']) && (
            <span className="chip">✨ {product.condition || product.specs?.['Condition']}</span>
          )}
        </div>

        <div className="product-pricing">
          <span className="product-price">
            ₹{(product.offerPrice || product.price).toLocaleString('en-IN')}
          </span>
          {product.offerPrice && product.offerPrice < product.price && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="merchant-info">
          <div className="merchant-name-row">
            <span className="merchant-name">{seller.name}</span>
            {seller.verified ? (
              <div className="merchant-badge">
                <ShieldCheck size={12} />
                <span>Verified</span>
              </div>
            ) : (
              <div className="merchant-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Clock size={12} />
                <span>Pending</span>
              </div>
            )}
          </div>
          <div className="merchant-location">
            <MapPin size={12} />
            <span>{seller.city}</span>
          </div>
        </div>

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-call"
            disabled={isSoldOut}
            onClick={() => onCallSeller(product, seller)}
            style={{ opacity: isSoldOut ? 0.5 : 1 }}
          >
            <Phone size={14} />
            <span>Call Dealer</span>
          </button>
          <button
            className="btn-whatsapp"
            disabled={isSoldOut}
            onClick={() => onWhatsAppSeller(product, seller)}
            style={{ opacity: isSoldOut ? 0.5 : 1 }}
          >
            <Smartphone size={14} />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
