import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderPlus, Tag, ChevronLeft, ShieldCheck, Image as ImageIcon, Upload } from 'lucide-react';
import { Category, Brand, SubscriptionPlan, Banner, Shop } from '../types';
import { 
  getCategories, 
  createCategory, 
  deleteCategory, 
  getBrands, 
  createBrand, 
  deleteBrand,
  getSubscriptionPlans,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllBanners,
  getActiveBanners,
  createBanner,
  toggleBannerStatus,
  deleteBannerApi,
  getShops,
  uploadBannerImageApi,
  formatImageUrl
} from '../services/apiService';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  addSubscriptionPlan, 
  deleteSubscriptionPlan as deletePlanInStore,
  toggleSubscriptionPlanStatus,
  setSubscriptionPlans 
} from '../store/productsSlice';
import { getAuthToken } from '../utils/authStorage';

interface ManageCategoriesBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const ManageCategoriesBrandsModal: React.FC<ManageCategoriesBrandsModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const dispatch = useAppDispatch();
  const storePlans = useAppSelector(state => state.products.subscriptionPlans);
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'subscriptions' | 'banners'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(storePlans);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [shopsList, setShopsList] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');

  // New Brand Form State
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');

  // New Subscription Plan Form State
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planLimit, setPlanLimit] = useState('10');

  // New Banner Form State
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDetails, setBannerDetails] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerType, setBannerType] = useState<'banner' | 'ads'>('banner');
  const [bannerShopId, setBannerShopId] = useState('');
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState(false);

  const token = getAuthToken() || '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, brs, loadedPlans, loadedBanners, loadedShops] = await Promise.all([
        getCategories().catch(() => []),
        getBrands().catch(() => []),
        getSubscriptionPlans().catch(() => storePlans),
        getAllBanners(token).catch(() => getActiveBanners().catch(() => [])),
        getShops().catch(() => [])
      ]);
      setCategories(cats);
      setBrands(brs);
      setBanners(loadedBanners);
      setShopsList(loadedShops);
      const finalPlans = loadedPlans.length > 0 ? loadedPlans : storePlans;
      setPlans(finalPlans);
      dispatch(setSubscriptionPlans(finalPlans));
    } catch (err) {
      console.warn('Failed to load categories/brands/plans/banners:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    setPlans(storePlans);
  }, [storePlans]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      onToast('Category name is required', 'info');
      return;
    }

    try {
      await createCategory(
        {
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
          image: catImage.trim() || undefined,
        },
        token
      );
      onToast(`Category "${catName}" created successfully!`, 'success');
      setCatName('');
      setCatSlug('');
      setCatImage('');
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to create category', 'warning');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id, token);
      onToast(`Category "${name}" deleted`, 'info');
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to delete category', 'warning');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      onToast('Brand name is required', 'info');
      return;
    }

    try {
      await createBrand(
        {
          name: brandName.trim(),
          logo: brandLogo.trim() || undefined,
        },
        token
      );
      onToast(`Brand "${brandName}" created successfully!`, 'success');
      setBrandName('');
      setBrandLogo('');
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to create brand', 'warning');
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      await deleteBrand(id, token);
      onToast(`Brand "${name}" deleted`, 'info');
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to delete brand', 'warning');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planLimit) {
      onToast('Plan name and product limit are required', 'info');
      return;
    }

    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: planName.trim(),
      description: planDesc.trim() || 'Custom Subscription Plan',
      productLimit: Number(planLimit),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    try {
      dispatch(addSubscriptionPlan(newPlan));
      await createSubscriptionPlan(newPlan, token).catch(() => null);
      onToast(`Subscription Plan "${newPlan.name}" (Limit: ${newPlan.productLimit}) created!`, 'success');
      setPlanName('');
      setPlanDesc('');
      setPlanLimit('10');
    } catch (err: any) {
      onToast(err.message || 'Plan created in local store', 'info');
    }
  };

  const handleTogglePlan = async (id: string, name: string) => {
    dispatch(toggleSubscriptionPlanStatus(id));
    onToast(`Plan "${name}" status updated`, 'info');
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete subscription plan "${name}"?`)) return;
    dispatch(deletePlanInStore(id));
    await deleteSubscriptionPlan(id, token).catch(() => null);
    onToast(`Plan "${name}" deleted`, 'info');
  };


  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) {
      onToast('Banner title is required', 'info');
      return;
    }
    if (!bannerImage.trim()) {
      onToast('Banner image URL or file is required', 'info');
      return;
    }
    if (bannerType === 'ads' && !bannerShopId.trim()) {
      onToast('Please select a shop for Ads type banner', 'info');
      return;
    }

    try {
      setLoading(true);
      await createBanner(
        {
          title: bannerTitle.trim(),
          details: bannerDetails.trim() || undefined,
          image: bannerImage.trim(),
          type: bannerType,
          shopId: bannerType === 'ads' ? bannerShopId.trim() : undefined,
          isActive: bannerIsActive
        },
        token
      );
      onToast('Banner created successfully!', 'success');
      setBannerTitle('');
      setBannerDetails('');
      setBannerImage('');
      setBannerShopId('');
      setBannerIsActive(true);
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Failed to create banner', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentActive: boolean) => {
    try {
      await toggleBannerStatus(bannerId, !currentActive, token);
      setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, isActive: !currentActive } : b));
      onToast(`Banner ${!currentActive ? 'activated' : 'deactivated'} successfully`, 'info');
    } catch (err: any) {
      onToast(err.message || 'Failed to toggle banner status', 'warning');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBannerApi(bannerId, token);
      setBanners(prev => prev.filter(b => b.id !== bannerId));
      onToast('Banner deleted successfully', 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to delete banner', 'warning');
    }
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please select a valid image file (JPG, PNG, WEBP)', 'info');
      return;
    }

    setIsUploadingBannerImg(true);
    try {
      if (token) {
        const uploadedUrl = await uploadBannerImageApi(file, token).catch(() => '');
        if (uploadedUrl) {
          setBannerImage(uploadedUrl);
          onToast('Banner image uploaded to server!', 'success');
          return;
        }
      }
      // Fallback base64 resize
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let w = tempImg.width;
          let h = tempImg.height;
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(tempImg, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setBannerImage(compressed);
          onToast('Banner image processed!', 'success');
        };
        tempImg.src = result;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('Upload banner image error:', err);
      onToast(err.message || 'Failed to upload image file', 'warning');
    } finally {
      setIsUploadingBannerImg(false);
    }
  };

  return (

    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '640px',
          padding: '2rem',
          borderRadius: '20px',
          position: 'relative',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          style={{ top: '1.25rem', right: '1.25rem' }}
        >
          <X size={18} />
        </button>

        <div className="modal-header" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '0.75rem',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <h2 className="modal-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Manage Categories & Brands
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem', margin: 0 }}>
            Add and manage dynamic categories and brands via API
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: '#f1f5f9',
            padding: '5px',
            borderRadius: '12px',
          }}
        >
          <button
            type="button"
            className={`role-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: activeTab === 'categories' ? 700 : 600,
              fontSize: '0.9rem',
              background: activeTab === 'categories' ? '#ffffff' : 'transparent',
              color: activeTab === 'categories' ? '#ea580c' : '#64748b',
              boxShadow: activeTab === 'categories' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <FolderPlus size={16} />
            Categories ({categories.length})
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === 'brands' ? 'active' : ''}`}
            onClick={() => setActiveTab('brands')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: activeTab === 'brands' ? 700 : 600,
              fontSize: '0.9rem',
              background: activeTab === 'brands' ? '#ffffff' : 'transparent',
              color: activeTab === 'brands' ? '#ea580c' : '#64748b',
              boxShadow: activeTab === 'brands' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Tag size={16} />
            Brands ({brands.length})
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: activeTab === 'subscriptions' ? 700 : 600,
              fontSize: '0.9rem',
              background: activeTab === 'subscriptions' ? '#ffffff' : 'transparent',
              color: activeTab === 'subscriptions' ? '#ea580c' : '#64748b',
              boxShadow: activeTab === 'subscriptions' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={16} />
            Plans ({plans.length})
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: activeTab === 'banners' ? 700 : 600,
              fontSize: '0.9rem',
              background: activeTab === 'banners' ? '#ffffff' : 'transparent',
              color: activeTab === 'banners' ? '#ea580c' : '#64748b',
              boxShadow: activeTab === 'banners' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ImageIcon size={16} />
            Banners ({banners.length})
          </button>
        </div>


        {activeTab === 'categories' ? (
          <div>
            {/* Create Category Form */}
            <form
              onSubmit={handleCreateCategory}
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                ➕ Create New Category (POST /api/categories)
              </h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input-text"
                  required
                  placeholder="e.g. Smart Home Devices"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Slug (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. smart-home-devices (auto-generated if empty)"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Image URL (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="https://..."
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} /> Create Category
              </button>
            </form>

            {/* List Existing Categories */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              Existing Categories in DB ({categories.length})
            </h4>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No categories found in database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {categories.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{c.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Slug: {c.slug}</span>
                    </div>
                    {token && (
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        title="Delete Category"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'brands' ? (
          <div>
            {/* Create Brand Form */}
            <form
              onSubmit={handleCreateBrand}
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                ➕ Create New Brand (POST /api/brands)
              </h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brand Name *</label>
                <input
                  type="text"
                  className="form-input-text"
                  required
                  placeholder="e.g. Sony Electronics"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Logo URL (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="https://..."
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} /> Create Brand
              </button>
            </form>

            {/* List Existing Brands */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              Existing Brands in DB ({brands.length})
            </h4>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading brands...</p>
            ) : brands.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No brands found in database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {brands.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {b.logo && (
                        <img
                          src={b.logo}
                          alt={b.name}
                          style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      )}
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{b.name}</strong>
                    </div>
                    {token && (
                      <button
                        onClick={() => handleDeleteBrand(b.id, b.name)}
                        title="Delete Brand"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'subscriptions' ? (
          <div>

            {/* Create Subscription Plan Form */}
            <form
              onSubmit={handleCreatePlan}
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                ➕ Create Subscription Plan (POST /api/subscriptions/plans)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="form-input-text"
                    required
                    placeholder="e.g. Enterprise Plan"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Product Limit (Max Listings) *</label>
                  <input
                    type="number"
                    className="form-input-text"
                    required
                    min={1}
                    placeholder="e.g. 100"
                    value={planLimit}
                    onChange={(e) => setPlanLimit(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. Unlimited scale for multi-store chains"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} /> Create Subscription Plan
              </button>
            </form>

            {/* List Existing Subscription Plans */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              Configured Subscription Plans ({plans.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {plans.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    background: p.status === 'ACTIVE' ? '#ffffff' : '#f8fafc',
                    border: `1px solid ${p.status === 'ACTIVE' ? '#e2e8f0' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    opacity: p.status === 'ACTIVE' ? 1 : 0.65
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{p.name}</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                          color: p.status === 'ACTIVE' ? '#15803d' : '#64748b',
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                      {p.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Max Limit</span>
                      <strong style={{ fontSize: '1.1rem', color: '#ea580c' }}>{p.productLimit} Products</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlan(p.id, p.name)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(p.id, p.name)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        borderRadius: '6px'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Banners Tab Content */
          <div>
            {/* Create Banner Form */}
            <form
              onSubmit={handleCreateBanner}
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} style={{ color: '#ea580c' }} />
                Add New Banner / Ad Showcase
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Banner Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival Mega Sale on iPhones"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Banner Type
                  </label>
                  <select
                    value={bannerType}
                    onChange={(e) => setBannerType(e.target.value as 'banner' | 'ads')}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      background: '#fff'
                    }}
                  >
                    <option value="banner">Platform Banner (General Offer)</option>
                    <option value="ads">Sponsored Store Ad (Linked to Shop)</option>
                  </select>
                </div>

                {bannerType === 'ads' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Select Linked Shop *
                    </label>
                    <select
                      value={bannerShopId}
                      onChange={(e) => setBannerShopId(e.target.value)}
                      required={bannerType === 'ads'}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        background: '#fff'
                      }}
                    >
                      <option value="">-- Choose Shop --</option>
                      {shopsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Details / Description Subtext
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 40% off on Grade A devices with store warranty"
                    value={bannerDetails}
                    onChange={(e) => setBannerDetails(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Banner Image (Upload Image File or paste URL) *
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      required
                      placeholder="Image URL or pick file..."
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem'
                      }}
                    />
                    <label
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        background: '#ea580c',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Upload size={14} />
                      {isUploadingBannerImg ? 'Uploading...' : 'Browse File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {bannerImage && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={formatImageUrl(bannerImage)}
                        alt="Preview"
                        style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/iphone_17_pro_1.png"; }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Image Preview Loaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bannerIsActive}
                    onChange={(e) => setBannerIsActive(e.target.checked)}
                  />
                  <span>Active immediately on main hero slider</span>
                </label>
                <button
                  type="submit"
                  disabled={loading || isUploadingBannerImg}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: '#ea580c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Saving...' : 'Publish Banner'}
                </button>
              </div>
            </form>

            {/* Banners List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {banners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  No banners created yet. Add your first promotional banner or store ad above!
                </div>
              ) : (
                banners.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.9rem 1rem',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                      <img
                        src={formatImageUrl(b.image)}
                        alt={b.title}
                        style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/iphone_17_pro_1.png"; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{b.title}</strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              background: b.type === 'ads' ? '#eff6ff' : '#fff7ed',
                              color: b.type === 'ads' ? '#2563eb' : '#ea580c',
                              border: b.type === 'ads' ? '1px solid #bfdbfe' : '1px solid #ffedd5'
                            }}
                          >
                            {b.type === 'ads' ? `Ad (${b.shop?.name || 'Shop'})` : 'Platform Banner'}
                          </span>
                        </div>
                        {b.details && (
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(b.id, b.isActive)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: b.isActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          background: b.isActive ? '#f0fdf4' : '#f8fafc',
                          color: b.isActive ? '#16a34a' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {b.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '6px'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

