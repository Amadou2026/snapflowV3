// src/components/HeaderAdmin.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HeaderAdmin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Si l'utilisateur n'est pas encore chargé, afficher un header minimal
  if (!user) {
    return (
      <header className="header">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">
              <img src="/assets/logo.png" alt="Logo" className="logo" />
            </Link>
          </div>
          <ul className="nav-menu">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/login">Connexion</Link></li>
          </ul>
        </nav>
      </header>
    );
  }
  
};

export default HeaderAdmin;
