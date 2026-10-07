import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { fetchLocationSuggestions, fetchPlaceDetails, LocationPrediction } from '../services/apiService';

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation?: (locationData: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark';
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Search shop address, city, or landmark...',
  className = 'form-input',
  disabled = false,
  required = false,
  style = {},
  theme = 'light'
}) => {
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Debounce API calls (300ms)
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchLocationSuggestions(value);
        setPredictions(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.warn('Location suggestion fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPrediction = async (prediction: LocationPrediction) => {
    setShowDropdown(false);
    onChange(prediction.description || prediction.mainText);

    if (prediction.lat && prediction.lng) {
      if (onSelectLocation) {
        onSelectLocation({
          formattedAddress: prediction.description,
          latitude: prediction.lat,
          longitude: prediction.lng,
        });
      }
      return;
    }

    setLoading(true);
    try {
      const details = await fetchPlaceDetails(prediction.placeId, prediction.description);
      if (onSelectLocation) {
        onSelectLocation({
          formattedAddress: details.formattedAddress || prediction.description,
          latitude: details.latitude,
          longitude: details.longitude,
          city: details.city,
          district: details.district,
        });
      }
    } catch (err) {
      console.warn('Could not fetch place details:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = isDark
    ? {
        paddingLeft: '38px',
        paddingRight: loading ? '38px' : value ? '32px' : '12px',
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        borderRadius: '12px',
        fontSize: '0.86rem',
        paddingTop: '0.7rem',
        paddingBottom: '0.7rem',
        outline: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
      }
    : {
        paddingLeft: '38px',
        paddingRight: loading ? '38px' : value ? '32px' : '12px',
        width: '100%',
      };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            color: '#f97316',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (predictions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={isDark ? undefined : className}
          style={inputStyle}
        />

        {loading && (
          <Loader2
            size={16}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '12px',
              color: isDark ? '#94a3b8' : '#64748b',
              zIndex: 2,
            }}
          />
        )}

        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setPredictions([]);
              setShowDropdown(false);
            }}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: isDark ? '#94a3b8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              zIndex: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: isDark
              ? '0 12px 30px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            listStyle: 'none',
            padding: '6px',
            margin: 0,
          }}
        >
          {predictions.map((pred) => (
            <li
              key={pred.placeId}
              onClick={() => handleSelectPrediction(pred)}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                style={{
                  padding: '5px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed',
                  color: '#f97316',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <MapPin size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {pred.mainText}
                </div>
                {pred.secondaryText && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: isDark ? '#94a3b8' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px',
                    }}
                  >
                    {pred.secondaryText}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
