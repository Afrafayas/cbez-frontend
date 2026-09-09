import React, { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setShowAddEditModal, addProduct, editProduct } from '../store/productsSlice';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockData';

interface AddEditProductModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const { showAddEditModal, productToEdit } = useAppSelector(state => state.products);
  const activeShop = useAppSelector(state => state.auth.activeShop);

  const [formImages, setFormImages] = useState<string[]>(['', '', '', '']);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
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
        brand: '',
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
    const validImgs = formImages.map(img => img.trim()).filter(Boolean);
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
      images: validImgs.length > 0 ? validImgs : [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'
      ],
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
    } else {
      dispatch(addProduct(productPayload));
      onToast(`New product "${productPayload.name}" listed live!`, 'success');
    }
    dispatch(setShowAddEditModal(false));
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
        </div>

        <form onSubmit={handleSubmit} className="modal-form grid-form">
          {/* Multi-Angle Photo Inputs */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">
              📷 Multi-Angle Product Photos (Upload Min 4, Max 7 Image URLs) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {formImages.map((img, idx) => {
                const labels = ['1. Front Side Photo *', '2. Back Side Photo *', '3. Left Side Photo *', '4. Right Side Photo *', '5. Top/Bottom Angle', '6. Extra Angle 6', '7. Extra Angle 7'];
                return (
                  <div key={idx}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                      {labels[idx] || `Photo ${idx + 1}`}
                    </span>
                    <input
                      type="url"
                      className="form-input-text"
                      required={idx < 4}
                      placeholder="https://images.unsplash.com/..."
                      value={img}
                      onChange={(e) => {
                        const copy = [...formImages];
                        copy[idx] = e.target.value;
                        setFormImages(copy);
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {formImages.length < 7 && (
              <button
                type="button"
                style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setFormImages([...formImages, ''])}
              >
                + Add Another Photo Angle
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Brand *</label>
            <input type="text" className="form-input-text" required placeholder="Apple, Samsung, OnePlus..." value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
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
            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
              {productToEdit ? 'Save Changes' : 'Submit Device Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
