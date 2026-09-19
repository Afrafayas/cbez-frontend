import React, { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setShowAddEditModal, addProduct, editProduct } from '../store/productsSlice';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockData';
import { createSellerProduct, updateSellerProduct, getBrands, getCategories } from '../services/apiService';
import { CompactBrandSelect } from './CompactBrandSelect';

interface AddEditProductModalProps {
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ onToast }) => {
  const dispatch = useAppDispatch();
  const { showAddEditModal, productToEdit, items: products, subscriptionPlans, categories: storeCategories } = useAppSelector(state => state.products);
  const activeShop = useAppSelector(state => state.auth.activeShop);

  const [formImages, setFormImages] = useState<string[]>(['', '', '', '']);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDbData() {
      try {
        const [fetchedBrands, fetchedCats] = await Promise.all([
          getBrands().catch(() => []),
          getCategories().catch(() => [])
        ]);
        if (fetchedBrands && Array.isArray(fetchedBrands) && fetchedBrands.length > 0) {
          setDbBrands(fetchedBrands.map(b => b.name));
        }
        if (fetchedCats && Array.isArray(fetchedCats) && fetchedCats.length > 0) {
          setDbCategories(fetchedCats.map(c => c.name));
        }
      } catch (err) {
        console.warn('Failed to load DB brands/categories in modal:', err);
      }
    }
    fetchDbData();
  }, []);

  const availableCategoriesList = Array.from(
    new Set([
      ...CATEGORIES.filter(c => c !== "All Categories"),
      ...(storeCategories || []).map(c => c.name),
      ...dbCategories
    ])
  ).filter(Boolean).sort();

  const availableBrandsList = Array.from(
    new Set([
      'Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Motorola', 'Asus', 'Lenovo', 'HP', 'Dell', 'Acer', 'Sony', 'Nothing', 'Noise', 'Boat', 'Anker',
      ...dbBrands
    ])
  ).filter(Boolean).sort();

  const assignedPlan = subscriptionPlans.find(
    p => p.id === activeShop?.subscriptionPlanId || p.id === activeShop?.subscription?.planId
  ) || activeShop?.subscription?.plan;

  const currentPlan = assignedPlan || {
    id: 'plan-free',
    name: 'Free Plan',
    description: 'Basic Starter Plan',
    productLimit: 10,
    price: 0,
    status: 'ACTIVE' as const
  };

  const shopProductsCount = activeShop ? products.filter(p => p.shopId === activeShop.id).length : 0;
  const remainingSlots = Math.max(0, (currentPlan.productLimit ?? 10) - shopProductsCount);
  const isLimitReached = shopProductsCount >= (currentPlan.productLimit ?? 10);
  const isShopPending = Boolean(activeShop && (!activeShop.verified || activeShop.status === 'PENDING'));

  const [productForm, setProductForm] = useState({
    name: '',
    brand: 'Apple',
    category: 'Smartphones & Mobiles',
    description: '',
    price: '',
    offerPrice: '',
    stock: '1',

    // Mobile / Tablet / Common specs
    ram: '8GB',
    storage: '256GB',
    processor: 'Apple A17 Pro',
    displaySize: '6.7 inches',
    batteryHealth: '95%',
    batteryPercentage: '100%',
    simType: 'Dual SIM',
    network: '5G',
    camera: '48MP Triple Camera',
    os: 'iOS 17',
    imeiNumber: '',
    color: 'Natural Titanium',
    condition: 'Grade A (Like New)',
    warranty: '3 Months Shop Warranty',
    deviceAge: '6 Months Old',
    documents: ['Tax Invoice Bill', 'Warranty Card', 'Brand Box', 'Charger & Cable'],
    accessories: ['Box', 'Charger', 'Cable'],
    originalBill: true,
    purchasedFromAmazon: false,
    isAmazonRefurbished: false,

    // Laptop specs
    storageType: 'NVMe SSD',
    storageCapacity: '512GB',
    graphics: 'Integrated Intel Iris Xe',
    resolution: '1920x1080 (Full HD)',
    batteryBackup: '6 Hours',
    keyboardLayout: 'US English Backlit QWERTY',
    serialNumber: '',

    // Tablet specs
    simWifi: 'Wi-Fi + Cellular (5G)',
    imeiSerial: '',

    // Accessories & Smart Watches specs
    productType: 'Smartwatch',
    model: 'Watch Ultra 2',
    compatibility: 'iOS & Android Universal',
    includedItems: 'Charging Cable, Extra Band, Original Box',
    technicalSpecifications: 'Active Noise Cancellation, IP68 Water Resistant, Heart Rate & SpO2 Monitor'
  });

  const getCategoryGroup = (catName: string): 'mobile' | 'laptop' | 'tablet' | 'accessory' => {
    const lower = catName ? catName.toLowerCase().trim() : '';
    if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('macbook')) {
      return 'laptop';
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return 'tablet';
    }
    if (
      lower.includes('accessory') ||
      lower.includes('accessories') ||
      lower.includes('watch') ||
      lower.includes('audio') ||
      lower.includes('earbud') ||
      lower.includes('headphone') ||
      lower.includes('camera') ||
      lower.includes('photo') ||
      lower.includes('gaming') ||
      lower.includes('console') ||
      lower.includes('gear') ||
      lower.includes('wearable')
    ) {
      return 'accessory';
    }
    return 'mobile';
  };

  const currentCategoryGroup = getCategoryGroup(productForm.category);

  useEffect(() => {
    if (productToEdit) {
      const sp = productToEdit.specs || {};
      setProductForm({
        name: productToEdit.name || '',
        brand: productToEdit.brand || 'Apple',
        category: productToEdit.category || 'Smartphones & Mobiles',
        description: productToEdit.description || '',
        price: productToEdit.price ? String(productToEdit.price) : '',
        offerPrice: productToEdit.offerPrice ? String(productToEdit.offerPrice) : '',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '1',

        // Mobile / Tablet specs
        ram: sp['RAM'] || productToEdit.ram || '8GB',
        storage: sp['Storage'] || productToEdit.storage || '256GB',
        processor: sp['Processor / Chipset'] || sp['Processor'] || productToEdit.processor || 'Apple A17 Pro',
        displaySize: sp['Display Size'] || sp['Display size'] || productToEdit.displaySize || '6.7 inches',
        batteryHealth: sp['Battery Health'] || productToEdit.batteryHealth || '95%',
        batteryPercentage: sp['Battery Percentage'] || sp['Battery percentage'] || productToEdit.batteryPercentage || '100%',
        simType: sp['SIM Type'] || sp['SIM type'] || productToEdit.simType || 'Dual SIM',
        network: sp['Network (5G/4G)'] || sp['5G / 4G'] || productToEdit.network || '5G',
        camera: sp['Camera'] || productToEdit.camera || '48MP Triple Camera',
        os: sp['Operating System'] || sp['OS'] || productToEdit.os || 'iOS 17',
        imeiNumber: sp['IMEI'] || productToEdit.imeiNumber || '',
        color: sp['Color'] || productToEdit.color || 'Natural Titanium',
        condition: sp['Condition'] || productToEdit.condition || 'Grade A (Like New)',
        warranty: sp['Warranty'] || productToEdit.warranty || '3 Months Shop Warranty',

        deviceAge: productToEdit.deviceAge || '6 Months Old',
        documents: productToEdit.documents || (productToEdit.accessories || ['Box', 'Charger', 'Cable']),
        accessories: productToEdit.accessories || ['Box', 'Charger', 'Cable'],
        originalBill: productToEdit.originalBill !== undefined ? productToEdit.originalBill : true,
        purchasedFromAmazon: productToEdit.purchasedFromAmazon || false,
        isAmazonRefurbished: productToEdit.isAmazonRefurbished || false,

        // Laptop specs
        storageType: sp['Storage Type'] || sp['Storage type – SSD/HDD'] || productToEdit.storageType || 'NVMe SSD',
        storageCapacity: sp['Storage Capacity'] || productToEdit.storageCapacity || '512GB',
        graphics: sp['Graphics / GPU'] || sp['Graphics/GPU'] || productToEdit.graphics || 'Integrated Intel Iris Xe',
        resolution: sp['Resolution'] || productToEdit.resolution || '1920x1080 (Full HD)',
        batteryBackup: sp['Battery Backup'] || sp['Battery backup'] || productToEdit.batteryBackup || '6 Hours',
        keyboardLayout: sp['Keyboard Layout'] || sp['Keyboard layout'] || productToEdit.keyboardLayout || 'US English Backlit QWERTY',
        serialNumber: sp['Serial Number'] || sp['Serial number'] || productToEdit.serialNumber || '',

        // Tablet specs
        simWifi: sp['SIM / Wi-Fi'] || productToEdit.simWifi || 'Wi-Fi + Cellular (5G)',
        imeiSerial: sp['IMEI / Serial Number'] || productToEdit.imeiSerial || '',

        // Accessories & Smart Watches specs
        productType: sp['Product Type'] || sp['Product type'] || productToEdit.productType || 'Smartwatch',
        model: sp['Model'] || productToEdit.model || '',
        compatibility: sp['Compatibility'] || productToEdit.compatibility || 'iOS & Android Universal',
        includedItems: sp['Included Items'] || sp['Included items'] || productToEdit.includedItems || 'Charging Cable, Box',
        technicalSpecifications: sp['Technical Specifications'] || sp['Technical specifications'] || productToEdit.technicalSpecifications || ''
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
        category: 'Smartphones & Mobiles',
        description: '',
        price: '',
        offerPrice: '',
        stock: '1',

        ram: '8GB',
        storage: '256GB',
        processor: 'Apple A17 Pro',
        displaySize: '6.7 inches',
        batteryHealth: '95%',
        batteryPercentage: '100%',
        simType: 'Dual SIM',
        network: '5G',
        camera: '48MP Triple Camera',
        os: 'iOS 17',
        imeiNumber: '',
        color: 'Natural Titanium',
        condition: 'Grade A (Like New)',
        warranty: '3 Months Shop Warranty',
        deviceAge: '6 Months Old',
        documents: ['Tax Invoice Bill', 'Warranty Card', 'Brand Box', 'Charger & Cable'],
        accessories: ['Box', 'Charger', 'Cable'],
        originalBill: true,
        purchasedFromAmazon: false,
        isAmazonRefurbished: false,

        storageType: 'NVMe SSD',
        storageCapacity: '512GB',
        graphics: 'Integrated Intel Iris Xe',
        resolution: '1920x1080 (Full HD)',
        batteryBackup: '6 Hours',
        keyboardLayout: 'US English Backlit QWERTY',
        serialNumber: '',

        simWifi: 'Wi-Fi + Cellular (5G)',
        imeiSerial: '',

        productType: 'Smartwatch',
        model: 'Watch Ultra 2',
        compatibility: 'iOS & Android Universal',
        includedItems: 'Charging Cable, Extra Band, Original Box',
        technicalSpecifications: 'Active Noise Cancellation, IP68 Water Resistant, Heart Rate & SpO2 Monitor'
      });
    }
  }, [productToEdit, showAddEditModal]);

  if (!showAddEditModal) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Shop Approval Check
    if (activeShop && !activeShop.verified) {
      onToast('Your shop registration is currently PENDING Admin approval. Only approved shops can add products.', 'info');
      return;
    }

    // Subscription Plan Check
    if (!productToEdit && !currentPlan) {
      onToast('Please select a subscription plan before adding products.', 'info');
      return;
    }

    // Product Limit Check
    if (!productToEdit && currentPlan) {
      const productLimit = currentPlan.productLimit;
      if (shopProductsCount >= productLimit) {
        onToast(
          `Product limit reached! Your ${currentPlan.name} allows a maximum of ${productLimit} products. (Current: ${shopProductsCount}/${productLimit}). Please upgrade your subscription plan to list more products.`,
          'info'
        );
        return;
      }
    }

    const validImgs = formImages.map(img => (img ? img.trim() : '')).filter(Boolean);

    if (validImgs.length < 4) {
      onToast('Please upload at least 4 photo angles (Front, Back, Left Side, and Right Side photos are required)', 'info');
      return;
    }

    const shopId = activeShop ? activeShop.id : 'shop-101';

    // Construct category specific specs object
    let categorySpecs: Record<string, string> = {};

    if (currentCategoryGroup === 'mobile') {
      categorySpecs = {
        'RAM': productForm.ram,
        'Storage': productForm.storage,
        'Processor / Chipset': productForm.processor,
        'Display Size': productForm.displaySize,
        'Battery Health': productForm.batteryHealth,
        'Battery Percentage': productForm.batteryPercentage,
        'SIM Type': productForm.simType,
        'Network (5G/4G)': productForm.network,
        'Camera': productForm.camera,
        'Operating System': productForm.os,
        'IMEI': productForm.imeiNumber,
        'Color': productForm.color,
        'Condition': productForm.condition,
        'Warranty': productForm.warranty
      };
    } else if (currentCategoryGroup === 'laptop') {
      categorySpecs = {
        'Processor': productForm.processor,
        'RAM': productForm.ram,
        'Storage Type': productForm.storageType,
        'Storage Capacity': productForm.storageCapacity,
        'Graphics / GPU': productForm.graphics,
        'Display Size': productForm.displaySize,
        'Resolution': productForm.resolution,
        'Battery Health': productForm.batteryHealth,
        'Battery Backup': productForm.batteryBackup,
        'Operating System': productForm.os,
        'Keyboard Layout': productForm.keyboardLayout,
        'Serial Number': productForm.serialNumber,
        'Color': productForm.color,
        'Condition': productForm.condition,
        'Warranty': productForm.warranty
      };
    } else if (currentCategoryGroup === 'tablet') {
      categorySpecs = {
        'RAM': productForm.ram,
        'Storage': productForm.storage,
        'Processor': productForm.processor,
        'Display Size': productForm.displaySize,
        'SIM / Wi-Fi': productForm.simWifi,
        'Battery Health': productForm.batteryHealth,
        'OS': productForm.os,
        'Camera': productForm.camera,
        'Color': productForm.color,
        'IMEI / Serial Number': productForm.imeiSerial,
        'Condition': productForm.condition,
        'Warranty': productForm.warranty
      };
    } else if (currentCategoryGroup === 'accessory') {
      categorySpecs = {
        'Product Type': productForm.productType,
        'Brand': productForm.brand,
        'Model': productForm.model,
        'Compatibility': productForm.compatibility,
        'Condition': productForm.condition,
        'Warranty': productForm.warranty,
        'Included Items': productForm.includedItems,
        'Technical Specifications': productForm.technicalSpecifications
      };
    }

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

      // Category specs mapping
      processor: productForm.processor,
      displaySize: productForm.displaySize,
      batteryPercentage: productForm.batteryPercentage,
      camera: productForm.camera,
      os: productForm.os,
      simWifi: productForm.simWifi,
      imeiSerial: productForm.imeiSerial,
      storageType: productForm.storageType,
      storageCapacity: productForm.storageCapacity,
      graphics: productForm.graphics,
      resolution: productForm.resolution,
      batteryBackup: productForm.batteryBackup,
      keyboardLayout: productForm.keyboardLayout,
      serialNumber: productForm.serialNumber,
      productType: productForm.productType,
      model: productForm.model,
      compatibility: productForm.compatibility,
      includedItems: productForm.includedItems,
      technicalSpecifications: productForm.technicalSpecifications,

      specs: categorySpecs
    };

    const token = localStorage.getItem('mlx_token');

    if (productToEdit) {
      if (token) {
        setIsSubmitting(true);
        updateSellerProduct(productToEdit.id, {
          name: productPayload.name,
          brand: productPayload.brand,
          category: productPayload.category,
          description: productPayload.description,
          price: productPayload.price,
          stock: productPayload.stock,
          specs: productPayload.specs,
          images: productPayload.images
        }, token)
          .then((updatedRes) => {
            const savedProd = updatedRes.data?.product || updatedRes;
            const finalProduct: Product = {
              ...productPayload,
              id: savedProd.id || productPayload.id,
              name: savedProd.name || productPayload.name,
              price: savedProd.price || productPayload.price
            };
            dispatch(editProduct(finalProduct));
            onToast(`Product "${finalProduct.name}" updated successfully!`, 'success');
            dispatch(setShowAddEditModal(false));
          })
          .catch(() => {
            dispatch(editProduct(productPayload));
            onToast(`Product "${productPayload.name}" updated in local session.`, 'success');
            dispatch(setShowAddEditModal(false));
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      } else {
        dispatch(editProduct(productPayload));
        onToast(`Product "${productPayload.name}" updated successfully!`, 'success');
        dispatch(setShowAddEditModal(false));
      }
    } else {
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
          .then((savedRes) => {
            const savedProd = savedRes.data?.product || savedRes;
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

  if (!showAddEditModal) return null;

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowAddEditModal(false))}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.25rem 2.5rem',
          boxSizing: 'border-box',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        <button
          className="modal-close-btn"
          onClick={() => dispatch(setShowAddEditModal(false))}
          style={{ top: '1.25rem', right: '1.25rem' }}
        >
          <X size={18} />
        </button>

        <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="modal-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, paddingRight: '2rem' }}>
            {productToEdit ? 'Edit Product Listing' : 'List New Used Gadget'}
          </h2>
          <span style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            Store Partner Listing Portal &bull; Dynamic Category Specifications &amp; Multi-Angle Photos
          </span>

          {/* Subscription Usage Header Banner */}
          {activeShop && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.75rem 1rem',
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
                  : isLimitReached
                  ? '#fff1f2'
                  : '#f0fdf4',
                color: isShopPending
                  ? '#991b1b'
                  : isLimitReached
                  ? '#be123c'
                  : '#166534',
                border: isShopPending
                  ? '1px solid #fecaca'
                  : isLimitReached
                  ? '1px solid #fecdd3'
                  : '1px solid #bbf7d0'
              }}
            >
              <div>
                <strong>Current Plan:</strong> {currentPlan.name} (Price: ₹{currentPlan.price ?? 0}) &bull; <strong>Product Limit:</strong> {currentPlan.productLimit} &bull; <strong>Products Used:</strong> {shopProductsCount} &bull; <strong>Remaining Slots:</strong> {remainingSlots}
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

        <form onSubmit={handleSubmit} className="modal-form grid-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Multi-Angle Photo Inputs (File Upload Only) */}
          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: 0 }}>
                📷 Multi-Angle Product Photos (Upload Min 4, Max 7 Images) *
              </label>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                Select image files directly from device storage
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
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

                    const tempImg = new Image();
                    tempImg.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_DIM = 960;
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

                      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
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

          {/* Top Common Product Fields */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Category *</label>
            <select
              className="form-select-box"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            >
              {availableCategoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Brand *</label>
            <CompactBrandSelect
              value={productForm.brand}
              onChange={(val) => setProductForm({ ...productForm, brand: val })}
              brands={availableBrandsList}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Product Name / Title *</label>
            <input
              type="text"
              className="form-input-text"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
              placeholder={
                currentCategoryGroup === 'laptop'
                  ? "e.g. MacBook Air M2 13-inch (2023)"
                  : currentCategoryGroup === 'tablet'
                  ? "e.g. iPad Pro 11-inch M2 Wi-Fi"
                  : currentCategoryGroup === 'accessory'
                  ? "e.g. Apple Watch Ultra 2 (49mm Titanium)"
                  : "e.g. iPhone 15 Pro Max 256GB Natural Titanium"
              }
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
          </div>

          {/* Pricing & Stock */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Regular Price (₹) *</label>
            <input
              type="number"
              className="form-input-text"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
              placeholder="134900"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Discount Offer Price (₹)</label>
            <input
              type="number"
              className="form-input-text"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              placeholder="129900"
              value={productForm.offerPrice}
              onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Stock Quantity *</label>
            <input
              type="number"
              className="form-input-text"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
            />
          </div>

          {/* DYNAMIC TECHNICAL DETAILS SECTION HEADER */}
          <div
            style={{
              gridColumn: 'span 2',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
              padding: '0.65rem 1rem',
              background: '#eff6ff',
              borderLeft: '4px solid #2563eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e40af' }}>
              📋 Technical Specifications ({productForm.category})
            </span>
            <span style={{ fontSize: '0.74rem', color: '#3b82f6', fontWeight: 600 }}>
              Tailored fields for selected category
            </span>
          </div>

          {/* CATEGORY GROUP 1: MOBILE / SMART PHONES */}
          {currentCategoryGroup === 'mobile' && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>RAM *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 8GB, 12GB, 16GB"
                  value={productForm.ram}
                  onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Storage *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 128GB, 256GB, 512GB"
                  value={productForm.storage}
                  onChange={(e) => setProductForm({ ...productForm, storage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Processor / Chipset *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Apple A17 Pro, Snapdragon 8 Gen 3"
                  value={productForm.processor}
                  onChange={(e) => setProductForm({ ...productForm, processor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Display Size *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 6.7 inches Super Retina XDR"
                  value={productForm.displaySize}
                  onChange={(e) => setProductForm({ ...productForm, displaySize: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Battery Health (%) *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 95% Health, 100% Brand New"
                  value={productForm.batteryHealth}
                  onChange={(e) => setProductForm({ ...productForm, batteryHealth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Battery Percentage *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. 100%, 98%"
                  value={productForm.batteryPercentage}
                  onChange={(e) => setProductForm({ ...productForm, batteryPercentage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>SIM Type *</label>
                <select
                  className="form-select-box"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
                  value={productForm.simType}
                  onChange={(e) => setProductForm({ ...productForm, simType: e.target.value })}
                >
                  <option value="Dual SIM (Nano + eSIM)">Dual SIM (Nano + eSIM)</option>
                  <option value="Dual SIM (Physical)">Dual SIM (Physical SIMs)</option>
                  <option value="Single SIM">Single SIM</option>
                  <option value="eSIM Only">eSIM Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>5G / 4G *</label>
                <select
                  className="form-select-box"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
                  value={productForm.network}
                  onChange={(e) => setProductForm({ ...productForm, network: e.target.value })}
                >
                  <option value="5G Network Supported">5G Network Supported</option>
                  <option value="4G VoLTE">4G VoLTE</option>
                  <option value="3G / 2G Only">3G / 2G Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Camera Specs *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 48MP + 12MP + 12MP Triple Lens, 12MP Front"
                  value={productForm.camera}
                  onChange={(e) => setProductForm({ ...productForm, camera: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Operating System *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. iOS 17, Android 14, OxygenOS 14"
                  value={productForm.os}
                  onChange={(e) => setProductForm({ ...productForm, os: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span>IMEI Number</span>
                  <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>🔒 Hidden (Backend Only)</span>
                </label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. 356789123456789 (Seller verification reference)"
                  value={productForm.imeiNumber}
                  onChange={(e) => setProductForm({ ...productForm, imeiNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Color *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Natural Titanium, Phantom Black, Deep Purple"
                  value={productForm.color}
                  onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                />
              </div>
            </>
          )}

          {/* CATEGORY GROUP 2: LAPTOP */}
          {currentCategoryGroup === 'laptop' && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Processor *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Intel Core i7-13700H, Apple M3 Pro, AMD Ryzen 7"
                  value={productForm.processor}
                  onChange={(e) => setProductForm({ ...productForm, processor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>RAM *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 16GB DDR5 5600MHz, 8GB Unified"
                  value={productForm.ram}
                  onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Storage Type – SSD/HDD *</label>
                <select
                  className="form-select-box"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
                  value={productForm.storageType}
                  onChange={(e) => setProductForm({ ...productForm, storageType: e.target.value })}
                >
                  <option value="NVMe M.2 SSD">NVMe M.2 High-Speed SSD</option>
                  <option value="SATA SSD">SATA SSD</option>
                  <option value="HDD Mechanical Hard Drive">HDD Mechanical Hard Drive</option>
                  <option value="SSD + HDD Dual Drive">SSD + HDD Dual Storage Drive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Storage Capacity *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 512GB, 1TB SSD, 2TB"
                  value={productForm.storageCapacity}
                  onChange={(e) => setProductForm({ ...productForm, storageCapacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Graphics / GPU *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. NVIDIA GeForce RTX 4060 8GB, Intel Iris Xe, Apple 14-core GPU"
                  value={productForm.graphics}
                  onChange={(e) => setProductForm({ ...productForm, graphics: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Display Size *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 15.6 inches, 14 inches, 16 inches"
                  value={productForm.displaySize}
                  onChange={(e) => setProductForm({ ...productForm, displaySize: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Resolution *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 1920x1080 (Full HD), 2560x1600 (Retina), 4K OLED"
                  value={productForm.resolution}
                  onChange={(e) => setProductForm({ ...productForm, resolution: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Battery Health *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 92% Health, Normal (Cycle Count: 140)"
                  value={productForm.batteryHealth}
                  onChange={(e) => setProductForm({ ...productForm, batteryHealth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Battery Backup *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 5-6 Hours Backup, 8+ Hours"
                  value={productForm.batteryBackup}
                  onChange={(e) => setProductForm({ ...productForm, batteryBackup: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Operating System *</label>
                <select
                  className="form-select-box"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
                  value={productForm.os}
                  onChange={(e) => setProductForm({ ...productForm, os: e.target.value })}
                >
                  <option value="Windows 11 Home">Windows 11 Home</option>
                  <option value="Windows 11 Pro">Windows 11 Pro</option>
                  <option value="macOS Sonoma">macOS Sonoma</option>
                  <option value="Linux / Ubuntu">Linux / Ubuntu</option>
                  <option value="ChromeOS">ChromeOS</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Keyboard Layout *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. US English Backlit QWERTY, RGB Mechanical"
                  value={productForm.keyboardLayout}
                  onChange={(e) => setProductForm({ ...productForm, keyboardLayout: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span>Serial Number</span>
                  <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>🔒 Hidden (Backend Only)</span>
                </label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. C02GX0XXXXXX (Hardware verification code)"
                  value={productForm.serialNumber}
                  onChange={(e) => setProductForm({ ...productForm, serialNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Color *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Space Grey, Silver, Midnight Black"
                  value={productForm.color}
                  onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                />
              </div>
            </>
          )}

          {/* CATEGORY GROUP 3: TABLET */}
          {currentCategoryGroup === 'tablet' && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>RAM *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 8GB Unified, 6GB RAM"
                  value={productForm.ram}
                  onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Storage *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 128GB, 256GB, 512GB"
                  value={productForm.storage}
                  onChange={(e) => setProductForm({ ...productForm, storage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Processor *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Apple M2 Chip, Snapdragon 870, Apple A14"
                  value={productForm.processor}
                  onChange={(e) => setProductForm({ ...productForm, processor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Display Size *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 11 inches Liquid Retina, 12.9 inches Liquid Retina XDR"
                  value={productForm.displaySize}
                  onChange={(e) => setProductForm({ ...productForm, displaySize: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>SIM / Wi-Fi *</label>
                <select
                  className="form-select-box"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
                  value={productForm.simWifi}
                  onChange={(e) => setProductForm({ ...productForm, simWifi: e.target.value })}
                >
                  <option value="Wi-Fi Only">Wi-Fi Only</option>
                  <option value="Wi-Fi + Cellular (5G)">Wi-Fi + Cellular (5G)</option>
                  <option value="Wi-Fi + 4G LTE">Wi-Fi + 4G LTE</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Battery Health *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 94% Battery Health, Excellent Backup"
                  value={productForm.batteryHealth}
                  onChange={(e) => setProductForm({ ...productForm, batteryHealth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>OS *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. iPadOS 17, Android 13 (One UI)"
                  value={productForm.os}
                  onChange={(e) => setProductForm({ ...productForm, os: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Camera Specs *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. 12MP Rear + 12MP Ultra Wide Front with Center Stage"
                  value={productForm.camera}
                  onChange={(e) => setProductForm({ ...productForm, camera: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Color *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Space Gray, Starlight, Silver"
                  value={productForm.color}
                  onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span>IMEI / Serial Number</span>
                  <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>🔒 Hidden (Backend Only)</span>
                </label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. 356789123456789 / DMPDXXXXX"
                  value={productForm.imeiSerial}
                  onChange={(e) => setProductForm({ ...productForm, imeiSerial: e.target.value })}
                />
              </div>
            </>
          )}

          {/* CATEGORY GROUP 4: ACCESSORIES & SMART WATCHES */}
          {currentCategoryGroup === 'accessory' && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Product Type *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Smartwatch, Wireless Earbuds, Fast Wall Charger, Power Bank"
                  value={productForm.productType}
                  onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Model Name / Number *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Watch Ultra 2 (49mm Titanium), AirPods Pro 2"
                  value={productForm.model}
                  onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Device Compatibility *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Universal (Android & iOS), iPhone 12-15 Series, Apple Watch 44/45/49mm"
                  value={productForm.compatibility}
                  onChange={(e) => setProductForm({ ...productForm, compatibility: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Included Items *</label>
                <input
                  type="text"
                  className="form-input-text"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  placeholder="e.g. Magnetic Charger Cable, Extra Silicone Ear Tips, Original Packaging Box"
                  value={productForm.includedItems}
                  onChange={(e) => setProductForm({ ...productForm, includedItems: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Technical Specifications *</label>
                <textarea
                  className="form-textarea"
                  style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  required
                  rows={2}
                  placeholder="e.g. Active Noise Cancellation, IP68 Waterproof, 30 Hours Total Battery Backup, Fast Charge Support"
                  value={productForm.technicalSpecifications}
                  onChange={(e) => setProductForm({ ...productForm, technicalSpecifications: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Condition & Warranty Row */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Physical Condition *</label>
            <select
              className="form-select-box"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
              value={productForm.condition}
              onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}
            >
              <option value="Grade A (Like New)">Grade A (Like New - Scratchless)</option>
              <option value="Grade B (Excellent)">Grade B (Minor Scuffs)</option>
              <option value="Grade C (Good)">Grade C (Fairly Used)</option>
              <option value="Refurbished Certified">Refurbished Certified</option>
              <option value="Brand New Sealed">Brand New Sealed Box</option>
              <option value="Open Box">Open Box Demo Piece</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Warranty Period *</label>
            <select
              className="form-select-box"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem' }}
              value={productForm.warranty}
              onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
            >
              <option value="None">None</option>
              <option value="7 Days Shop Warranty">7 Days Shop Warranty</option>
              <option value="1 Month Shop Warranty">1 Month Shop Warranty</option>
              <option value="3 Months Shop Warranty">3 Months Shop Warranty</option>
              <option value="6 Months Shop Warranty">6 Months Shop Warranty</option>
              <option value="1 Year Shop Warranty">1 Year Shop Warranty</option>
              <option value="Brand Warranty Remaining">Brand Warranty Remaining</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Device Age / Purchase Date *</label>
            <input
              type="text"
              className="form-input-text"
              style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
              placeholder="e.g. 6 Months Old, Purchased Jan 2024"
              value={productForm.deviceAge}
              onChange={(e) => setProductForm({ ...productForm, deviceAge: e.target.value })}
            />
          </div>

          {/* Included Accessories & Documents Checklist */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Included Accessories & Documents Checklist</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              {[
                'Tax Invoice Bill',
                'Warranty Card / Document',
                'Original Brand Box',
                'Fast Charger & Cable',
                'Protective Silicone Case',
                'Tempered Glass Guard'
              ].map(item => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', background: '#f8f9fa', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
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
            <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem', display: 'block', fontSize: '0.85rem' }}>Detailed Description *</label>
            <textarea
              className="form-textarea"
              style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
              rows={3}
              placeholder="Include physical scuff details, warranty info, battery backup, included accessories..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </div>

          <div className="form-actions-row" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
              onClick={() => dispatch(setShowAddEditModal(false))}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ padding: '0.65rem 1.6rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Saving Product...' : (productToEdit ? 'Save Changes' : 'Submit Device Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
