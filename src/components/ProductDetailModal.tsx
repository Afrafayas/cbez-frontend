import React, { useState, useEffect } from 'react';
import { X, Phone, Smartphone, MapPin, ShieldCheck, UserPlus, UserCheck } from 'lucide-react';
import { Product, Shop } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedProduct } from '../store/productsSlice';
import { followShop, unfollowShop, checkFollowStatus } from '../services/apiService';

interface ProductDetailModalProps {
  getSellerShop: (shopId: string) => Shop;
  onCallSeller: (product: Product, seller: Shop) => void;
  onWhatsAppSeller: (product: Product, seller: Shop) => void;
  onToast?: (msg: string, type?: 'success' | 'info') => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  getSellerShop,
  onCallSeller,
  onWhatsAppSeller,
  onToast,
}) => {
  const dispatch = useAppDispatch();
  const selectedProduct = useAppSelector((state) => state.products.selectedProduct);
  const [activeImgIdx, setActiveImgIdx] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);

  useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedProduct]);

  useEffect(() => {
    async function loadFollowStatus() {
      if (!selectedProduct) return;
      const token = localStorage.getItem('mlx_token');
      if (!token) return;
      try {
        const isFollowed = await checkFollowStatus(selectedProduct.shopId, token);
        setIsFollowing(isFollowed);
      } catch (err) {
        setIsFollowing(false);
      }
    }
    loadFollowStatus();
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const seller = getSellerShop(selectedProduct.shopId);
  const isSoldOut = selectedProduct.stock <= 0 || selectedProduct.isSoldOut;

  const handleFollowClick = async () => {
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
    <div className="modal-overlay" onClick={() => dispatch(setSelectedProduct(null))}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button className="modal-close-btn" onClick={() => dispatch(setSelectedProduct(null))}>
          <X size={18} />
        </button>

        <div
          className="product-detail-layout"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem 1.5rem' }}
        >
          {/* Left Column: Multi-Image Gallery */}
          <div className="detail-media" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              className="main-image-display"
              style={{
                width: '100%',
                height: '320px',
                background: '#f8f9fa',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
              }}
            >
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <img
                  src={selectedProduct.images[activeImgIdx] || selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: '3rem' }}>📱</div>
              )}
            </div>

            {/* Multi-Angle Photo Thumbnail Carousel */}
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  📷 Multi-Angle View ({selectedProduct.images.length} photos):
                </span>
                <div
                  className="thumbnail-strip"
                  style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}
                >
                  {selectedProduct.images.map((imgUrl, idx) => {
                    const labels = ['Front', 'Back', 'Side 1', 'Side 2', 'Angle 5', 'Angle 6', 'Angle 7'];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImgIdx(idx)}
                        style={{
                          border: activeImgIdx === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '2px',
                          background: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Angle ${idx + 1}`}
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px' }}
                        />
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: activeImgIdx === idx ? '#2563eb' : '#64748b',
                            marginTop: '2px',
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

          {/* Right Column: Device Info & Specs */}
          <div className="detail-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                  }}
                >
                  {selectedProduct.category}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                  Brand: <strong>{selectedProduct.brand}</strong>
                </span>
              </div>
              <h2
                className="detail-title"
                style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}
              >
                {selectedProduct.name}
              </h2>
            </div>

            {/* Pricing & Discount Row */}
            <div
              style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{(selectedProduct.offerPrice || selectedProduct.price).toLocaleString('en-IN')}
                </span>
                {selectedProduct.offerPrice && selectedProduct.offerPrice < selectedProduct.price && (
                  <>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#dc2626',
                        background: '#fee2e2',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      Save ₹{(selectedProduct.price - selectedProduct.offerPrice).toLocaleString('en-IN')} (
                      {Math.round(
                        ((selectedProduct.price - selectedProduct.offerPrice) / selectedProduct.price) * 100
                      )}
                      % OFF)
                    </span>
                  </>
                )}
              </div>
              <div
                style={{
                  marginTop: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isSoldOut ? '#dc2626' : '#16a34a',
                }}
              >
                {isSoldOut ? '🔴 SOLD OUT (Out of Stock)' : `🟢 In Stock (${selectedProduct.stock} unit available)`}
              </div>
            </div>

            {/* Key Specs Bullet Grid */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                📌 Device Specifications & Condition:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  💾 <strong>Storage:</strong> {selectedProduct.storage || selectedProduct.specs?.['Storage'] || 'N/A'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  ⚡ <strong>RAM:</strong> {selectedProduct.ram || selectedProduct.specs?.['RAM'] || 'N/A'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  🔋 <strong>Battery:</strong> {selectedProduct.batteryHealth || selectedProduct.specs?.['Battery'] || 'N/A'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  ✨ <strong>Condition:</strong> {selectedProduct.condition || selectedProduct.specs?.['Condition'] || 'Grade A'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  🕒 <strong>Device Age:</strong> {selectedProduct.deviceAge || '6 Months Old'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  🛡️ <strong>Warranty:</strong> {selectedProduct.warranty || selectedProduct.specs?.['Warranty'] || 'Shop Warranty'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  🎨 <strong>Color:</strong> {selectedProduct.color || 'Standard'}
                </div>
                <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  📶 <strong>Network:</strong> {selectedProduct.network || '5G'} ({selectedProduct.simType || 'Dual SIM'})
                </div>
              </div>
            </div>

            {/* Included Accessories */}
            {((selectedProduct.documents && selectedProduct.documents.length > 0) ||
              (selectedProduct.accessories && selectedProduct.accessories.length > 0)) && (
              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  📦 Included Accessories & Documents:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(selectedProduct.documents || selectedProduct.accessories || []).map((item) => (
                    <span
                      key={item}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        background: '#eff6ff',
                        padding: '0.25rem 0.55rem',
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

            {/* Device Description */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {selectedProduct.description}
              </p>
            </div>

            {/* Seller Shop Details, Follow Button & Action Buttons */}
            <div
              className="dealer-info-card"
              style={{
                marginTop: '0.5rem',
                background: '#f8f9fa',
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="dealer-card-name" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {seller.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#2563eb',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#eff6ff',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <ShieldCheck size={13} /> Verified Merchant Store
                    </span>
                  </div>
                  <div
                    className="dealer-card-address"
                    style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}
                  >
                    <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    <span>
                      {seller.address}, {seller.city}
                    </span>
                  </div>
                </div>

                {/* Follow Shop Button */}
                <button
                  type="button"
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
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
                      <UserCheck size={14} />
                      <span>Following Store</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>+ Follow Shop</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className="sourcing-actions"
                style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}
              >
                <button
                  className="btn-call"
                  disabled={isSoldOut}
                  onClick={() => onCallSeller(selectedProduct, seller)}
                  style={{ opacity: isSoldOut ? 0.5 : 1 }}
                >
                  <Phone size={16} />
                  <span>Call Dealer Shop</span>
                </button>
                <button
                  className="btn-whatsapp"
                  disabled={isSoldOut}
                  onClick={() => onWhatsAppSeller(selectedProduct, seller)}
                  style={{ opacity: isSoldOut ? 0.5 : 1 }}
                >
                  <Smartphone size={16} />
                  <span>WhatsApp Merchant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
