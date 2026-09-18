import React from 'react';
import { Heart, Trash2, Phone, Smartphone, MapPin, ShieldCheck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, Shop, User } from '../types';

interface WishlistPageProps {
  wishlistProducts: Array<Product & { shop?: Shop; wishlistedAt?: string }>;
  onRemoveWishlist: (productId: string) => void;
  onCallSeller: (product: Product, seller: Shop) => void;
  onWhatsAppSeller: (product: Product, seller: Shop) => void;
  onSelectProduct: (product: Product) => void;
  activeUser: User | null;
  onOpenLogin: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  wishlistProducts,
  onRemoveWishlist,
  onCallSeller,
  onWhatsAppSeller,
  onSelectProduct,
  activeUser,
  onOpenLogin,
}) => {
  const navigate = useNavigate();

  if (!activeUser) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Heart size={36} fill="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Please Log In to View Your Wishlist
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Sign in to save your favorite used gadgets, track price changes, and easily reach verified store partners directly.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenLogin}
              className="btn-primary"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Log In to Wishlist
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1350px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </button>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Heart size={28} style={{ color: '#ef4444', fill: '#ef4444' }} />
            My Wishlist ({wishlistProducts.length})
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>
            Your saved used devices for quick comparison and direct dealer communication
          </p>
        </div>
      </div>

      {/* Content */}
      {wishlistProducts.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <ShoppingBag size={56} style={{ color: '#94a3b8', opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            Your Wishlist is Empty
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '450px', margin: '0 auto 1.75rem' }}>
            Explore our verified used gadgets marketplace and click the heart icon on any device to save it here!
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ padding: '0.7rem 1.75rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px' }}
          >
            Explore Used Gadgets
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.25rem'
        }}>
          <style>{`
            @media (min-width: 1024px) {
              .product-grid {
                grid-template-columns: repeat(4, 1fr) !important;
              }
            }
          `}</style>
          {wishlistProducts.map((product) => {
            const isSoldOut = product.stock <= 0 || product.isSoldOut;
            const seller: Shop = product.shop || {
              id: product.shopId,
              name: 'Store Partner',
              ownerName: 'Dealer',
              phone: '',
              whatsapp: '',
              address: '',
              city: 'Kochi',
              category: product.category,
              verified: true,
              rating: 4.8,
              joinedDate: '2024-01-01'
            };

            let imageSrc: string | null = null;
            if (Array.isArray(product.images) && product.images.length > 0 && Boolean(product.images[0])) {
              imageSrc = product.images[0];
            } else if (typeof (product as any).imagesJson === 'string' && (product as any).imagesJson.trim()) {
              try {
                const parsed = JSON.parse((product as any).imagesJson);
                if (Array.isArray(parsed) && parsed.length > 0 && Boolean(parsed[0])) imageSrc = parsed[0];
              } catch (e) {
                imageSrc = null;
              }
            }

            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => onSelectProduct(product)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Remove from wishlist button */}
                <button
                  type="button"
                  title="Remove from Wishlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveWishlist(product.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 12,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}
                >
                  <Trash2 size={16} />
                </button>

                {/* Sold out overlay */}
                {isSoldOut && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 10,
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    🔴 SOLD OUT
                  </div>
                )}

                {/* Visual Image */}
                <div className="product-visual" style={{ height: '190px', position: 'relative', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="product-visual-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                      📱
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="product-details" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div className="product-header" style={{ marginBottom: '0.5rem' }}>
                    <span className="product-category-tag" style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                    <h3 className="product-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem', lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                  </div>

                  <div className="product-specs-chips" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {product.storage && <span className="chip" style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>💾 {product.storage}</span>}
                    {product.ram && <span className="chip" style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>⚡ {product.ram}</span>}
                    {product.condition && <span className="chip" style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>✨ {product.condition}</span>}
                  </div>

                  <div className="product-pricing" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span className="product-price" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{(product.offerPrice || product.price).toLocaleString('en-IN')}
                    </span>
                    {product.offerPrice && product.offerPrice < product.price && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Dealer / Shop Banner */}
                  <div className="merchant-info" style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', marginBottom: '0.75rem' }}>
                    <div className="merchant-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="merchant-name" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                        {seller.name}
                      </span>
                      {seller.verified && (
                        <div className="merchant-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                          <ShieldCheck size={12} />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="merchant-location" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      <MapPin size={12} />
                      <span>{seller.city}</span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-call"
                      disabled={isSoldOut}
                      onClick={() => onCallSeller(product, seller)}
                      style={{
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        opacity: isSoldOut ? 0.5 : 1
                      }}
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </button>
                    <button
                      className="btn-whatsapp"
                      disabled={isSoldOut}
                      onClick={() => onWhatsAppSeller(product, seller)}
                      style={{
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        opacity: isSoldOut ? 0.5 : 1
                      }}
                    >
                      <Smartphone size={13} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
