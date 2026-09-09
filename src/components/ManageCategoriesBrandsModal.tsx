import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderPlus, Tag } from 'lucide-react';
import { Category, Brand } from '../types';
import { 
  getCategories, 
  createCategory, 
  deleteCategory, 
  getBrands, 
  createBrand, 
  deleteBrand 
} from '../services/apiService';

interface ManageCategoriesBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const ManageCategoriesBrandsModal: React.FC<ManageCategoriesBrandsModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');

  // New Brand Form State
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');

  const token = localStorage.getItem('mlx_token') || '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, brs] = await Promise.all([getCategories(), getBrands()]);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      console.warn('Failed to load categories/brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id, token);
      onToast(`Category "${name}" deleted`, 'info');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
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
      alert(err.message || 'Failed to create brand');
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      await deleteBrand(id, token);
      onToast(`Brand "${name}" deleted`, 'info');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <h2 className="modal-title">Manage Categories & Brands</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            Add and manage dynamic categories and brands via API
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            className={`role-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <FolderPlus size={16} />
            Categories ({categories.length})
          </button>
          <button
            className={`role-tab ${activeTab === 'brands' ? 'active' : ''}`}
            onClick={() => setActiveTab('brands')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Tag size={16} />
            Brands ({brands.length})
          </button>
        </div>

        {activeTab === 'categories' ? (
          <div>
            {/* Create Category Form */}
            <form
              onSubmit={handleCreateCategory}
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                ➕ Create New Category (POST /api/categories)
              </h4>
              <div className="form-group">
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
              <div className="form-group">
                <label className="form-label">Slug (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. smart-home-devices (auto-generated if empty)"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-input-text"
                  placeholder="https://images.unsplash.com/..."
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Plus size={16} /> Add Category
              </button>
            </form>

            {/* List Existing Categories */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Existing Categories in DB ({categories.length})
            </h4>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No categories found in database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{c.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.5rem' }}>
                        (slug: {c.slug})
                      </span>
                    </div>
                    {token && (
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Create Brand Form */}
            <form
              onSubmit={handleCreateBrand}
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                ➕ Create New Brand (POST /api/brands)
              </h4>
              <div className="form-group">
                <label className="form-label">Brand Name *</label>
                <input
                  type="text"
                  className="form-input-text"
                  required
                  placeholder="e.g. RealMe, Vivo, Google"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL (Optional)</label>
                <input
                  type="url"
                  className="form-input-text"
                  placeholder="https://logo.clearbit.com/..."
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Plus size={16} /> Add Brand
              </button>
            </form>

            {/* List Existing Brands */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Existing Brands in DB ({brands.length})
            </h4>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading brands...</p>
            ) : brands.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No brands found in database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {brands.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {b.logo && (
                        <img
                          src={b.logo}
                          alt={b.name}
                          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      )}
                      <strong style={{ fontSize: '0.9rem' }}>{b.name}</strong>
                    </div>
                    {token && (
                      <button
                        onClick={() => handleDeleteBrand(b.id, b.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
