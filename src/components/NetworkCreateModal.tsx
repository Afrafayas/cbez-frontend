import React, { useState, FormEvent } from 'react';
import { X, Network, Send, ShieldCheck } from 'lucide-react';
import { createNetworkInquiry } from '../services/apiService';
import { CITIES, CATEGORIES } from '../data/mockData';

interface NetworkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  defaultCustomerName?: string;
  defaultCustomerPhone?: string;
}

export const NetworkCreateModal: React.FC<NetworkCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  defaultCustomerName = '',
  defaultCustomerPhone = '',
}) => {
  const [form, setForm] = useState({
    customerName: defaultCustomerName,
    customerPhone: defaultCustomerPhone,
    city: 'Kochi',
    category: 'Mobiles & Tablets',
    gadgetNeeded: '',
    targetBudget: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.gadgetNeeded || !form.city) {
      alert('Please fill in your Name, Phone Number, City, and Gadget details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNetworkInquiry({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        city: form.city,
        category: form.category,
        gadgetNeeded: form.gadgetNeeded,
        targetBudget: form.targetBudget ? Number(form.targetBudget) : undefined,
        notes: form.notes,
      });

      onSuccessToast(`🎯 Network Request Broadcasted! Verified local shops in ${form.city} will contact you shortly.`);
      onClose();
      setForm({
        customerName: defaultCustomerName,
        customerPhone: defaultCustomerPhone,
        city: 'Kochi',
        category: 'Mobiles & Tablets',
        gadgetNeeded: '',
        targetBudget: '',
        notes: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to broadcast network request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: '20px', padding: '1.75rem' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            <Network size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Broadcast Local Network Request
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
              Connect directly with verified local merchant shop networks in your city.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Your Full Name *</label>
              <input
                type="text"
                className="form-input-text"
                required
                placeholder="e.g. Mohammed Fayas"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input-text"
                required
                placeholder="+91 9744123456"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select City Network *</label>
              <select
                className="form-select-box"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                  <option key={c} value={c}>
                    📍 {c} Shops
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category *</label>
              <select
                className="form-select-box"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">What Gadget/Device are you looking for? *</label>
            <input
              type="text"
              className="form-input-text"
              required
              placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium (Sealed Unit)"
              value={form.gadgetNeeded}
              onChange={(e) => setForm({ ...form, gadgetNeeded: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Target Maximum Budget (₹)</label>
            <input
              type="number"
              className="form-input-text"
              placeholder="e.g. 130000"
              value={form.targetBudget}
              onChange={(e) => setForm({ ...form, targetBudget: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Additional Sourcing Notes (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Looking for Indian unit with original bill & Apple warranty"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            ></textarea>
          </div>

          <div
            style={{
              background: '#eff6ff',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#1d4ed8',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={18} />
            <span>Broadcasts to all verified local merchant stores in your selected city network.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '12px',
              marginTop: '0.25rem',
            }}
          >
            <Send size={16} />
            <span>{isSubmitting ? 'Broadcasting Request...' : 'Broadcast Local Network Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
