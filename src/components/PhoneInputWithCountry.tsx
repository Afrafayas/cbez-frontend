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
  placeholder = "98765 43210",
  required = false,
}) => {
  const parseValue = (val: string) => {
    if (!val) return { countryCode: '+91', phoneDigits: '' };
    const trimmed = val.trim();
    // Sort by code length descending to match +971 before +9 or +1
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
    <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
      <select
        value={selectedCode}
        onChange={handleCodeChange}
        className="form-select-box"
        style={{
          width: '115px',
          flexShrink: 0,
          padding: '0.75rem 0.4rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {COUNTRY_CODES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        required={required}
        placeholder={placeholder}
        value={digits}
        onChange={handleDigitsChange}
        className="form-input-text"
        style={{ flex: 1 }}
      />
    </div>
  );
};
