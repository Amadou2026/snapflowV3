// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <nav className="navbar">
          {/* Brand Logo */}
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              <img src="/assets/img/snapflow.png" width="140" alt="SnapFlow Logo" className="logo" />
              {/* <span className="brand-text">SnapFlow</span> */}
            </Link>
          </div>

          {/* Navigation Menu */}
          <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accueil
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/features" 
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fonctionnalités
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/pricing" 
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tarifs
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/about" 
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                À propos
              </Link>
            </li>
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-outline">
                  Tableau de bord
                </Link>
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={`${user.name}`} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Se connecter
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;