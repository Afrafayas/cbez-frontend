import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { clearFilters } from '../store/filtersSlice';
import { setShowAddEditModal, setProductToEdit } from '../store/productsSlice';
import { setAuthRole, setAuthTab, setShowAuthModal } from '../store/authSlice';

export const Footer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-info">
          <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="MLX Market Logo" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
            <span>MLX <span>DIRECT</span></span>
          </div>
          <p className="footer-desc">
            MLX Direct is India's premium B2C used gadgets directory, connecting verified local dealers with consumers directly. We collect zero commission fees on user transactions.
          </p>
        </div>

        <div className="footer-links-col">
          <span className="footer-links-title">Quick Navigation</span>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/'); dispatch(clearFilters()); }}>Consumer Marketplace</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); dispatch(setProductToEdit(null)); dispatch(setShowAddEditModal(true)); }}>List Used Gadget</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); dispatch(setAuthRole('seller')); dispatch(setAuthTab('login')); dispatch(setShowAuthModal(true)); }}>Verified Store Sign In</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} MLX Direct - Shop to Customer Used Gadget Directory.</span>
        <span>Connecting consumers with verified merchants near their city.</span>
      </div>
    </footer>
  );
};
