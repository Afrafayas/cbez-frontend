import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  Edit,
  Layers,
  ShieldCheck,
  Clock,
  FileText,
  Smartphone,
  Sparkles,
  Check
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Reset active image and failed images tracking on reopen
  React.useEffect(() => {
    setActiveImageIndex(0);
    setFailedImages(new Set());
  }, [product?.id, isOpen]);

  if (!isOpen || !product) return null;

  const rawImages = (product.images && product.images.length > 0)
    ? product.images.filter(img => Boolean(img && img.trim()))
    : [];

  // Filter out any broken/404 image URLs dynamically
  const validImages = rawImages.filter(img => !failedImages.has(img));

  const displayImages = validImages.length > 0
    ? validImages
    : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'];

  const currentActiveIdx = Math.min(activeImageIndex, Math.max(0, displayImages.length - 1));

  const handleImageError = (failedUrl: string) => {
    if (!failedUrl) return;
    setFailedImages(prev => {
      if (prev.has(failedUrl)) return prev;
      const next = new Set(prev);
      next.add(failedUrl);
      return next;
    });
  };

  const hasOffer = Boolean(product.offerPrice && product.offerPrice < product.price);
  const discountPercent = hasOffer
    ? Math.round(((product.price - (product.offerPrice || product.price)) / product.price) * 100)
    : 0;

  const isSoldOut = product.stock <= 0 || product.isSoldOut;

  // Build unified specifications list
  const rawSpecs: Record<string, string> = { ...(product.specs || {}) };

  // Fallback map for top-level fields if not already represented in rawSpecs
  const fallbackMappings: { key: string; label: string; value?: string | boolean }[] = [
    { key: 'RAM', label: 'RAM', value: product.ram },
    { key: 'Storage', label: 'Storage', value: product.storage },
    { key: 'Processor', label: 'Processor', value: product.processor },
    { key: 'Display Size', label: 'Display Size', value: product.displaySize },
    { key: 'Battery Health', label: 'Battery Health', value: product.batteryHealth },
    { key: 'Battery Percentage', label: 'Battery Percentage', value: product.batteryPercentage },
    { key: 'Camera', label: 'Camera', value: product.camera },
    { key: 'OS', label: 'Operating System', value: product.os },
    { key: 'Color', label: 'Color / Finish', value: product.color },
    { key: 'Condition', label: 'Device Condition', value: product.condition },
    { key: 'Warranty', label: 'Warranty Coverage', value: product.warranty },
    { key: 'Device Age', label: 'Device Age', value: product.deviceAge },
    { key: 'SIM Type', label: 'SIM Type', value: product.simType },
    { key: 'Network', label: 'Network', value: product.network },
    { key: 'SIM / Wi-Fi', label: 'SIM / Wi-Fi', value: product.simWifi },
    { key: 'IMEI', label: 'IMEI / Serial Number', value: product.imeiNumber || product.imeiSerial },
    { key: 'Storage Type', label: 'Storage Type', value: product.storageType },
    { key: 'Storage Capacity', label: 'Storage Capacity', value: product.storageCapacity },
    { key: 'Graphics', label: 'Graphics / GPU', value: product.graphics },
    { key: 'Resolution', label: 'Resolution', value: product.resolution },
    { key: 'Battery Backup', label: 'Battery Backup', value: product.batteryBackup },
    { key: 'Keyboard Layout', label: 'Keyboard Layout', value: product.keyboardLayout },
    { key: 'Serial Number', label: 'Serial Number', value: product.serialNumber },
    { key: 'Product Type', label: 'Product Type', value: product.productType },
    { key: 'Model', label: 'Model', value: product.model },
    { key: 'Compatibility', label: 'Compatibility', value: product.compatibility },
    { key: 'Included Items', label: 'Included Items', value: product.includedItems },
    { key: 'Technical Specifications', label: 'Additional Specs', value: product.technicalSpecifications },
  ];

  fallbackMappings.forEach(item => {
    if (item.value && !rawSpecs[item.key] && !rawSpecs[item.label]) {
      rawSpecs[item.label] = String(item.value);
    }
  });

  const specsList = Object.entries(rawSpecs).filter(([_, val]) => val && String(val).trim().length > 0);

  const accessoriesList = Array.isArray(product.accessories) && product.accessories.length > 0
    ? product.accessories
    : (Array.isArray(product.documents) && product.documents.length > 0 ? product.documents : []);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top MLX Brand Accent Line */}
        <div
          style={{
            height: '5px',
            width: '100%',
            background: 'linear-gradient(90deg, #ff6f00 0%, #ea580c 50%, #f59e0b 100%)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
                flexShrink: 0
              }}
            >
              <Smartphone size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {product.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid #ffedd5'
                  }}
                >
                  {product.brand}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {product.category}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Dealer Inventory Preview &bull; Full Device Specs &amp; Listing Information
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {/* Top Section: Photo Gallery & Pricing / Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.75rem'
            }}
          >
            {/* Gallery Column */}
            <div>
              <div
                style={{
                  width: '100%',
                  height: '270px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img
                  src={displayImages[currentActiveIdx] || displayImages[0]}
                  alt={product.name}
                  style={{
                    maxWidth: '92%',
                    maxHeight: '92%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease'
                  }}
                  onError={() => {
                    handleImageError(displayImages[currentActiveIdx] || displayImages[0]);
                  }}
                />

                {/* Stock Status Badge Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(8px)',
                    border: isSoldOut ? '1px solid #fca5a5' : '1px solid #86efac',
                    background: isSoldOut ? 'rgba(254, 242, 242, 0.95)' : 'rgba(240, 253, 244, 0.95)',
                    color: isSoldOut ? '#dc2626' : '#16a34a',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  {isSoldOut ? '🔴 Sold Out' : `🟢 In Stock (${product.stock} units)`}
                </div>
              </div>

              {/* Thumbnails Row */}
              {displayImages.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem'
                  }}
                >
                  {displayImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '10px',
                        padding: '3px',
                        border: currentActiveIdx === idx ? '2px solid #ea580c' : '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        opacity: currentActiveIdx === idx ? 1 : 0.65,
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={() => handleImageError(img)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price & Summary Column */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Price Display */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #fafafa 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1rem'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Listing Price
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{(hasOffer ? product.offerPrice! : product.price).toLocaleString('en-IN')}
                    </span>
                    {hasOffer && (
                      <>
                        <span style={{ fontSize: '1.05rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0'
                          }}
                        >
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Key Badges Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                  {product.condition && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Sparkles size={16} color="#ea580c" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Condition</div>
                        <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>{product.condition}</div>
                      </div>
                    </div>
                  )}

                  {product.warranty && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <ShieldCheck size={16} color="#16a34a" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Warranty</div>
                        <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>{product.warranty}</div>
                      </div>
                    </div>
                  )}

                  {product.deviceAge && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Clock size={16} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Device Age</div>
                        <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>{product.deviceAge}</div>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FileText size={16} color={product.originalBill ? '#16a34a' : '#94a3b8'} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Original Bill</div>
                      <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>
                        {product.originalBill ? 'Invoice Available' : 'No Bill'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Included Accessories */}
                {accessoriesList.length > 0 && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Included Accessories &amp; Items
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {accessoriesList.map((acc, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #dbeafe',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Check size={12} /> {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <FileText size={15} color="#ea580c" />
              Product Description
            </h3>
            <div
              style={{
                padding: '1rem 1.15rem',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.86rem',
                color: '#334155',
                lineHeight: 1.6,
                whiteSpace: 'pre-line'
              }}
            >
              {product.description && product.description.trim()
                ? product.description
                : 'No specific description provided by seller.'}
            </div>
          </div>

          {/* Technical Specifications Section */}
          <div>
            <h3
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={15} color="#ea580c" />
              Technical Specifications ({specsList.length})
            </h3>

            {specsList.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '14px',
                  color: '#64748b',
                  fontSize: '0.84rem'
                }}
              >
                No technical specifications entered for this product yet. Click "Edit Details" to add specs.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '0.65rem'
                }}
              >
                {specsList.map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                      {key}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid #f1f5f9',
            background: '#fafafa',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Product ID: <strong style={{ color: '#64748b' }}>{product.id}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(product)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff6f00 0%, #ea580c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
              >
                <Edit size={15} />
                <span>Edit Product Listing</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
