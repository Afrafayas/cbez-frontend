import React, { useState, useEffect } from 'react';

export const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India (+91)' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE (+971)' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia (+966)' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar (+974)' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman (+968)' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait (+965)' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain (+973)' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA/Canada (+1)' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore (+65)' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia (+60)' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia (+61)' },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  placeholder = "9778357773",
  required = false,
}) => {
  const parseValue = (val: string) => {
    if (!val) return { countryCode: '+91', phoneDigits: '' };
    const trimmed = val.trim();
    const matched = COUNTRY_CODES.slice()
      .sort((a, b) => b.code.length - a.code.length)
      .find((c) => trimmed.startsWith(c.code));
    if (matched) {
      const digits = trimmed.slice(matched.code.length).trim();
      return { countryCode: matched.code, phoneDigits: digits };
    }
    if (trimmed.startsWith('+')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1) {
        return { countryCode: parts[0], phoneDigits: parts.slice(1).join('') };
      }
      return { countryCode: parts[0], phoneDigits: '' };
    }
    return { countryCode: '+91', phoneDigits: trimmed.replace(/^\+91\s*/, '').trim() };
  };

  const initial = parseValue(value);
  const [selectedCode, setSelectedCode] = useState(initial.countryCode);
  const [digits, setDigits] = useState(initial.phoneDigits);

  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedCode(parsed.countryCode);
    setDigits(parsed.phoneDigits);
  }, [value]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCode(newCode);
    const full = digits.trim() ? `${newCode} ${digits.trim()}` : newCode;
    onChange(full);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = e.target.value.replace(/[^0-9]/g, '');
    setDigits(newDigits);
    const full = newDigits.trim() ? `${selectedCode} ${newDigits.trim()}` : selectedCode;
    onChange(full);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.35rem' }}>
      <div style={{ position: 'relative', width: '115px', flexShrink: 0 }}>
        <select
          value={selectedCode}
          onChange={handleCodeChange}
          style={{
            width: '100%',
            height: '46px',
            padding: '0 1.8rem 0 0.85rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#0f172a',
            backgroundColor: '#f1f5f9',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#ff6f00';
            e.target.style.boxShadow = '0 0 0 3px rgba(255, 111, 0, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.boxShadow = 'none';
          }}
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code} style={{ background: '#ffffff', color: '#0f172a' }}>
              {item.country} {item.code}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: '0.65rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#475569',
            fontSize: '0.7rem',
          }}
        >
          ▼
        </span>
      </div>

      <input
        type="tel"
        required={required}
        placeholder={placeholder}
        value={digits}
        onChange={handleDigitsChange}
        style={{
          flex: 1,
          height: '46px',
          padding: '0 1rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#0f172a',
          backgroundColor: '#f1f5f9',
          border: '1.5px solid #cbd5e1',
          borderRadius: '10px',
          outline: 'none',
          boxSizing: 'border-box',
          letterSpacing: '0.02em',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#ff6f00';
          e.target.style.boxShadow = '0 0 0 3px rgba(255, 111, 0, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#cbd5e1';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
};
