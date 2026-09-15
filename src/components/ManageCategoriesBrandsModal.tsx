import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderPlus, Tag, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Category, Brand, SubscriptionPlan } from '../types';
import { 
  getCategories, 
  createCategory, 
  deleteCategory, 
  getBrands, 
  createBrand, 
  deleteBrand,
  getSubscriptionPlans,
  createSubscriptionPlan,
  deleteSubscriptionPlan
} from '../services/apiService';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  addSubscriptionPlan, 
  deleteSubscriptionPlan as deletePlanInStore,
  toggleSubscriptionPlanStatus,
  setSubscriptionPlans 
} from '../store/productsSlice';

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
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'subscriptions'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(storePlans);
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

  const token = localStorage.getItem('mlx_token') || '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, brs, loadedPlans] = await Promise.all([
        getCategories().catch(() => []),
        getBrands().catch(() => []),
        getSubscriptionPlans().catch(() => storePlans)
      ]);
      setCategories(cats);
      setBrands(brs);
      const finalPlans = loadedPlans.length > 0 ? loadedPlans : storePlans;
      setPlans(finalPlans);
      dispatch(setSubscriptionPlans(finalPlans));
    } catch (err) {
      console.warn('Failed to load categories/brands/plans:', err);
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
        ) : (
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
        )}
      </div>
    </div>
  );
};
