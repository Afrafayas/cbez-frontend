import React, { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setShowAddEditModal, addProduct, editProduct } from '../store/productsSlice';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockData';
import { createSellerProduct, getBrands } from '../services/apiService';
import { CompactBrandSelect } from './CompactBrandSelect';

interface AddEditProductModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const { showAddEditModal, productToEdit, items: products, subscriptionPlans } = useAppSelector(state => state.products);
  const activeShop = useAppSelector(state => state.auth.activeShop);

  const [formImages, setFormImages] = useState<string[]>(['', '', '', '']);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDbBrands() {
      try {
        const fetched = await getBrands();
        if (fetched && Array.isArray(fetched) && fetched.length > 0) {
          setDbBrands(fetched.map(b => b.name));
        }
      } catch (err) {
        console.warn('Failed to load DB brands in modal:', err);
      }
    }
    fetchDbBrands();
  }, []);

  const availableBrandsList = Array.from(
    new Set([
      'Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Motorola', 'Asus', 'Lenovo', 'HP', 'Dell', 'Acer', 'Sony', 'Nothing',
      ...dbBrands
    ])
  ).filter(Boolean).sort();

  const assignedPlan = subscriptionPlans.find(p => p.id === activeShop?.subscriptionPlanId);
  const currentPlan = assignedPlan || {
    id: 'plan-free',
    name: 'Free Plan',
    description: 'Basic Starter Plan',
    productLimit: 10,
    status: 'ACTIVE' as const
  };

  const shopProductsCount = activeShop ? products.filter(p => p.shopId === activeShop.id).length : 0;
  const remainingSlots = assignedPlan ? Math.max(0, assignedPlan.productLimit - shopProductsCount) : 0;
  const isLimitReached = assignedPlan ? shopProductsCount >= assignedPlan.productLimit : false;
  const isShopPending = Boolean(activeShop && !activeShop.verified);

  const [productForm, setProductForm] = useState({
    name: '',
    brand: 'Apple',
    category: 'Mobiles',
    description: '',
    price: '',
    offerPrice: '',
    stock: '1',
    storage: '256GB',
    ram: '8GB',
    batteryHealth: '95%',
    condition: 'Grade A (Like New)',
    warranty: '3 Months Shop Warranty',
    deviceAge: '6 Months Old',
    imeiNumber: '',
    documents: ['Tax Invoice Bill', 'Warranty Card', 'Brand Box', 'Charger & Cable'],
    color: 'Natural Titanium',
    simType: 'Dual SIM',
    network: '5G',
    originalBill: true,
    accessories: ['Box', 'Charger', 'Cable'],
    purchasedFromAmazon: false,
    isAmazonRefurbished: false
  });

  useEffect(() => {
    if (productToEdit) {
      setProductForm({
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || 'Mobiles',
        description: productToEdit.description || '',
        price: productToEdit.price ? String(productToEdit.price) : '',
        offerPrice: productToEdit.offerPrice ? String(productToEdit.offerPrice) : '',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '1',
        storage: productToEdit.storage || '256GB',
        ram: productToEdit.ram || '8GB',
        batteryHealth: productToEdit.batteryHealth || '95%',
        condition: productToEdit.condition || 'Grade A (Like New)',
        warranty: productToEdit.warranty || '3 Months Shop Warranty',
        deviceAge: productToEdit.deviceAge || '6 Months Old',
        imeiNumber: productToEdit.imeiNumber || '',
        documents: productToEdit.documents || (productToEdit.accessories || ['Box', 'Charger', 'Cable']),
        color: productToEdit.color || 'Natural Titanium',
        simType: productToEdit.simType || 'Dual SIM',
        network: productToEdit.network || '5G',
        originalBill: productToEdit.originalBill !== undefined ? productToEdit.originalBill : true,
        accessories: productToEdit.accessories || ['Box', 'Charger', 'Cable'],
        purchasedFromAmazon: productToEdit.purchasedFromAmazon || false,
        isAmazonRefurbished: productToEdit.isAmazonRefurbished || false
      });
      if (productToEdit.images && productToEdit.images.length > 0) {
        const padded = [...productToEdit.images];
        while (padded.length < 4) padded.push('');
        setFormImages(padded);
      } else {
        setFormImages(['', '', '', '']);
      }
    } else {
      setFormImages(['', '', '', '']);
      setProductForm({
        name: '',
        brand: 'Apple',
        category: 'Mobiles',
        description: '',
        price: '',
        offerPrice: '',
        stock: '1',
        storage: '256GB',
        ram: '8GB',
        batteryHealth: '95%',
        condition: 'Grade A (Like New)',
        warranty: '3 Months Shop Warranty',
        deviceAge: '6 Months Old',
        imeiNumber: '',
        documents: ['Tax Invoice Bill', 'Warranty Card', 'Brand Box', 'Charger & Cable'],
        color: 'Natural Titanium',
        simType: 'Dual SIM',
        network: '5G',
        originalBill: true,
        accessories: ['Box', 'Charger', 'Cable'],
        purchasedFromAmazon: false,
        isAmazonRefurbished: false
      });
    }
  }, [productToEdit, showAddEditModal]);

  if (!showAddEditModal) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Step 1 — Shop Approval Check
    if (activeShop && !activeShop.verified) {
      onToast('Your shop registration is currently PENDING Admin approval. Only approved shops can add products.', 'info');
      return;
    }

    // Step 2 — Subscription Plan Check
    if (!productToEdit && !assignedPlan) {
      onToast('Please select a subscription plan before adding products.', 'info');
      return;
    }

    // Step 3, 4 & 5 — Get Product Limit, Count Products & Compare Count With Limit
    if (!productToEdit && assignedPlan) {
      const productLimit = assignedPlan.productLimit;
      if (shopProductsCount >= productLimit) {
        onToast(
          `Product limit reached! Your ${assignedPlan.name} allows a maximum of ${productLimit} products. (Current: ${shopProductsCount}/${productLimit}). Please upgrade your subscription plan to list more products.`,
          'info'
        );
        return;
      }
    }

    const validImgs = formImages.map(img => img ? img.trim() : '').filter(Boolean);

    if (validImgs.length < 4) {
      onToast('Please upload at least 4 photo angles (Front, Back, Left Side, and Right Side photos are required)', 'info');
      return;
    }

    const shopId = activeShop ? activeShop.id : 'shop-101';

    const productPayload: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: productForm.name,
      brand: productForm.brand,
      category: productForm.category,
      description: productForm.description,
      price: Number(productForm.price),
      offerPrice: productForm.offerPrice ? Number(productForm.offerPrice) : Number(productForm.price),
      stock: Number(productForm.stock),
      shopId,
      storage: productForm.storage,
      ram: productForm.ram,
      batteryHealth: productForm.batteryHealth,
      condition: productForm.condition,
      warranty: productForm.warranty,
      color: productForm.color,
      simType: productForm.simType,
      network: productForm.network,
      originalBill: productForm.originalBill,
      deviceAge: productForm.deviceAge,
      imeiNumber: productForm.imeiNumber,
      documents: productForm.documents,
      accessories: productForm.accessories,
      purchasedFromAmazon: productForm.purchasedFromAmazon,
      isAmazonRefurbished: productForm.isAmazonRefurbished,
      isSoldOut: Number(productForm.stock) <= 0,
      images: validImgs,
      specs: {
        Storage: productForm.storage,
        RAM: productForm.ram,
        Condition: productForm.condition,
        Warranty: productForm.warranty
      }
    };

    if (productToEdit) {
      dispatch(editProduct(productPayload));
      onToast(`Product "${productPayload.name}" updated successfully!`, 'success');
      dispatch(setShowAddEditModal(false));
    } else {
      const token = localStorage.getItem('mlx_token');
      if (token) {
        setIsSubmitting(true);
        createSellerProduct({
          name: productPayload.name,
          brand: productPayload.brand,
          category: productPayload.category,
          description: productPayload.description,
          price: productPayload.price,
          stock: productPayload.stock,
          specs: productPayload.specs,
          images: productPayload.images
        }, token)
          .then((savedProd) => {
            const finalProduct: Product = {
              ...productPayload,
              id: savedProd.id || productPayload.id,
              name: savedProd.name || productPayload.name,
              brand: savedProd.brand || productPayload.brand,
              price: savedProd.price || productPayload.price,
              stock: savedProd.stock !== undefined ? savedProd.stock : productPayload.stock
            };
            dispatch(addProduct(finalProduct));
            onToast(`New product "${finalProduct.name}" listed live!`, 'success');
            dispatch(setShowAddEditModal(false));
          })
          .catch((err) => {
            onToast(err.message || 'Failed to list product in backend database. Please try again.', 'info');
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      } else {
        dispatch(addProduct(productPayload));
        onToast(`New product "${productPayload.name}" listed live!`, 'success');
        dispatch(setShowAddEditModal(false));
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowAddEditModal(false))}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" onClick={() => dispatch(setShowAddEditModal(false))}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">
            {productToEdit ? 'Edit Product Listing' : 'List New Used Gadget'}
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Store Partner Listing Portal • Multi-Angle Photos & Device Specifications
          </span>

          {/* Subscription Usage Header Banner */}
          {activeShop && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background: isShopPending
                  ? '#fef2f2'
                  : (isLimitReached ? '#fff1f2' : '#f0fdf4'),
                color: isShopPending
                  ? '#991b1b'
                  : (isLimitReached ? '#be123c' : '#166534'),
                border: isShopPending
                  ? '1px solid #fecaca'
                  : (isLimitReached ? '1px solid #fecdd3' : '1px solid #bbf7d0')
              }}
            >
              <div>
                <strong>Current Plan:</strong> {currentPlan.name} &bull; <strong>Product Limit:</strong> {currentPlan.productLimit} &bull; <strong>Products Used:</strong> {shopProductsCount} &bull; <strong>Remaining Slots:</strong> {remainingSlots}
              </div>
              {isShopPending && (
                <div style={{ fontWeight: 700, color: '#dc2626' }}>
                  ⚠️ Shop Status: PENDING Admin Approval
                </div>
              )}
              {!isShopPending && isLimitReached && !productToEdit && (
                <div style={{ fontWeight: 700, color: '#e11d48' }}>
                  🚫 Limit Reached! Upgrade plan to add more.
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form grid-form">
          {/* Multi-Angle Photo Inputs (File Upload Only) */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                📷 Multi-Angle Product Photos (Upload Min 4, Max 7 Images) *
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                Select image files directly from device storage
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {formImages.map((img, idx) => {
                const labels = [
                  '1. Front Side Photo *',
                  '2. Back Side Photo *',
                  '3. Left Side Photo *',
                  '4. Right Side Photo *',
                  '5. Top / Bottom Angle',
                  '6. Additional Angle 6',
                  '7. Additional Angle 7'
                ];
                const isRequired = idx < 4;
                const hasImage = Boolean(img && img.trim());

                const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!file.type.startsWith('image/')) {
                    onToast('Please select a valid image file (JPG, PNG, WEBP, etc.)', 'info');
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (!result) return;

                    // Compress high-res camera photos using HTML5 Canvas
                    const tempImg = new Image();
                    tempImg.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_DIM = 1200;
                      let w = tempImg.width;
                      let h = tempImg.height;

                      if (w > h) {
                        if (w > MAX_DIM) {
                          h = Math.round((h * MAX_DIM) / w);
                          w = MAX_DIM;
                        }
                      } else {
                        if (h > MAX_DIM) {
                          w = Math.round((w * MAX_DIM) / h);
                          h = MAX_DIM;
                        }
                      }

                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      ctx?.drawImage(tempImg, 0, 0, w, h);

                      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                      const updated = [...formImages];
                      updated[idx] = compressedBase64;
                      setFormImages(updated);
                    };
                    tempImg.src = result;
                  };
                  reader.readAsDataURL(file);
                };

                return (
                  <div
                    key={idx}
                    style={{
                      border: hasImage ? '1.5px solid #10b981' : isRequired ? '1.5px dashed #cbd5e1' : '1px dashed #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.6rem',
                      background: hasImage ? '#f0fdf4' : '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isRequired ? '#0f172a' : '#475569' }}>
                        {labels[idx] || `Photo ${idx + 1}`}
                      </span>
                      {hasImage && (
                        <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          ✓ Loaded
                        </span>
                      )}
                    </div>

                    {hasImage ? (
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <img
                          src={img}
                          alt={labels[idx]}
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1'
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                          <label
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#2563eb',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              textAlign: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            Change File
                            <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formImages];
                              updated[idx] = '';
                              setFormImages(updated);
                            }}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: '#dc2626',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            padding: '0.9rem 0.4rem',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb' }}>
                            📁 Choose File
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            Select image (PNG, JPG, WEBP)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            required={isRequired && !hasImage}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {formImages.length < 7 && (
              <button
                type="button"
                style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setFormImages([...formImages, ''])}
              >
                + Add Another Photo Angle Slot
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Brand *</label>
            <CompactBrandSelect
              value={productForm.brand}
              onChange={(val) => setProductForm({ ...productForm, brand: val })}
              brands={availableBrandsList}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Name / Title *</label>
            <input type="text" className="form-input-text" required placeholder="iPhone 15 Pro Max 256GB" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select-box" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== "All Categories").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Storage Capacity *</label>
            <input type="text" className="form-input-text" required placeholder="128GB, 256GB, 512GB" value={productForm.storage} onChange={(e) => setProductForm({ ...productForm, storage: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">RAM Capacity *</label>
            <input type="text" className="form-input-text" required placeholder="8GB, 12GB, 16GB" value={productForm.ram} onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Battery Health (%) *</label>
            <input type="text" className="form-input-text" required placeholder="95% Health, Brand New" value={productForm.batteryHealth} onChange={(e) => setProductForm({ ...productForm, batteryHealth: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Physical Condition *</label>
            <select className="form-select-box" value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}>
              <option value="Grade A (Like New)">Grade A (Like New - Scratchless)</option>
              <option value="Grade B (Excellent)">Grade B (Minor Scuffs)</option>
              <option value="Grade C (Good)">Grade C (Fairly Used)</option>
              <option value="Refurbished">Refurbished Certified</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Regular Price (₹) *</label>
            <input type="number" className="form-input-text" required placeholder="134900" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Discount Offer Price (₹)</label>
            <input type="number" className="form-input-text" placeholder="129900" value={productForm.offerPrice} onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Stock Quantity *</label>
            <input type="number" className="form-input-text" required value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Device Age / Purchase Date *</label>
            <input type="text" className="form-input-text" required placeholder="e.g. 6 Months Old, Purchased Jan 2024" value={productForm.deviceAge} onChange={(e) => setProductForm({ ...productForm, deviceAge: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>IMEI / Serial Number</span>
              <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>🔒 Hidden (Backend Only)</span>
            </label>
            <input type="text" className="form-input-text" placeholder="e.g. 356789123456789 (Seller verification reference)" value={productForm.imeiNumber} onChange={(e) => setProductForm({ ...productForm, imeiNumber: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Shop Warranty Period *</label>
            <select className="form-select-box" value={productForm.warranty} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}>
              <option value="None">None</option>
              <option value="7 Days Shop Warranty">7 Days Shop Warranty</option>
              <option value="1 Month Shop Warranty">1 Month Shop Warranty</option>
              <option value="3 Months Shop Warranty">3 Months Shop Warranty</option>
              <option value="6 Months Shop Warranty">6 Months Shop Warranty</option>
              <option value="1 Year Shop Warranty">1 Year Shop Warranty</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Color *</label>
            <input type="text" className="form-input-text" required placeholder="Natural Titanium" value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Included Accessories & Documents Checklist</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              {[
                'Tax Invoice Bill',
                'Warranty Card / Document',
                'Original Brand Box',
                'Fast Charger & Cable',
                'Protective Silicone Case',
                'Tempered Glass Guard'
              ].map(item => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', background: '#f8f9fa', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(productForm.documents || productForm.accessories).includes(item)}
                    onChange={(e) => {
                      let updated = [...(productForm.documents || productForm.accessories)];
                      if (e.target.checked) updated.push(item);
                      else updated = updated.filter(a => a !== item);
                      setProductForm({ ...productForm, documents: updated, accessories: updated });
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Detailed Device Description *</label>
            <textarea className="form-textarea" required rows={3} placeholder="Include physical scuff details, warranty info, battery backup..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}></textarea>
          </div>

          <div className="form-actions-row" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => dispatch(setShowAddEditModal(false))}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.6rem 1.4rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Saving Product...' : (productToEdit ? 'Save Changes' : 'Submit Device Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
