import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, RotateCcw } from 'lucide-react';

interface CompactBrandSelectProps {
  value: string;
  onChange: (val: string) => void;
  brands: string[];
}

export const CompactBrandSelect: React.FC<CompactBrandSelectProps> = ({ value, onChange, brands }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isCustomMode) {
    return (
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          className="form-input-text"
          required
          autoFocus
          placeholder="Type custom brand name (e.g. Nothing, Honor, Poco)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={() => {
            setIsCustomMode(false);
            onChange('');
          }}
          style={{
            padding: '0.65rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#2563eb',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <RotateCcw size={13} />
          Choose from List
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Clickable Select Box Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-select-box"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: '#ffffff',
          userSelect: 'none',
          borderColor: isOpen ? '#2563eb' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
        }}
      >
        <span style={{ color: value ? '#0f172a' : '#64748b', fontWeight: value ? 600 : 400 }}>
          {value || '-- Select Brand from Database --'}
        </span>
        <ChevronDown size={16} style={{ color: '#64748b', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {/* Floating Dropdown Menu (Max Height 210px with smooth scroll) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            overflow: 'hidden',
            maxHeight: '210px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Quick Search Header */}
          <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search brand name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '0.3rem 0.4rem',
                fontSize: '0.8rem',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#0f172a'
              }}
            />
          </div>

          {/* Options Scroll Container */}
          <div style={{ overflowY: 'auto', maxHeight: '160px', padding: '0.2rem 0' }}>
            {filteredBrands.map((b) => {
              const isSelected = value === b;
              return (
                <div
                  key={b}
                  onClick={() => {
                    onChange(b);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#2563eb' : '#334155',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? '#dbeafe' : '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent')}
                >
                  <span>{b}</span>
                  {isSelected && <Check size={14} style={{ color: '#2563eb' }} />}
                </div>
              );
            })}

            {filteredBrands.length === 0 && (
              <div style={{ padding: '0.6rem', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                No matching brand found
              </div>
            )}

            {/* Custom Brand Option */}
            <div
              onClick={() => {
                setIsCustomMode(true);
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#2563eb',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Plus size={14} />
              <span>Type Custom Brand Name</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
