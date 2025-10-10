// src/components/Sidebar.jsx
import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/img/snapflow.png';
import { TiArrowUnsorted } from "react-icons/ti";

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, setIsAuthenticated, setUser, selectedProjectId } = useContext(AuthContext);

  // Fonction helper pour construire les URLs avec le projectId si disponible
  const buildUrl = (path) => {
    if (selectedProjectId) {
      return `${path}?projectId=${selectedProjectId}`;
    }
    return path;
  };

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActiveLink = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isActiveParent = (paths) => {
    return paths.some(path => location.pathname.startsWith(path)) ? 'active' : '';
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const hasAdminAccess = () => {
    if (!user) return false;
    if (!user.is_staff) return false;
    return user.is_superuser || user.groups?.some(g => g.toLowerCase() === "administrateur");
  };

  const hasSuperAdminAccess = () => {
    return user?.is_superuser;
  };

  return (
    <nav className="pc-sidebar">
      <div className="navbar-wrapper">
        <div className="m-header">
          <Link to="/" className="b-brand text-primary">
            <img src={logo} width="160px" className="img-fluid logo-lg" alt="logo" />
          </Link>
        </div>
        <div className="navbar-content" style={{ 
          height: 'calc(100vh - 80px)', 
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <ul className="pc-navbar">
            {/* Accueil */}
            <li className="pc-item">
              <Link to={buildUrl("/")} className={`pc-link ${isActiveLink('/')}`}>
                <span className="pc-micon">
                  <i className="ti ti-home"></i>
                </span>
                <span className="pc-mtext">Accueil</span>
              </Link>
            </li>

            {/* Tableau de bord */}
            {isAuthenticated && user?.is_staff && (
              <li className="pc-item">
                <Link to={buildUrl("/dashboard")} className={`pc-link ${isActiveLink('/dashboard')}`}>
                  <span className="pc-micon">
                    <i className="ti ti-dashboard"></i>
                  </span>
                  <span className="pc-mtext">Tableau de bord</span>
                </Link>
              </li>
            )}

            {/* Menu Administration */}
            {isAuthenticated && hasAdminAccess() && (
              <>
                <li className="pc-item pc-caption">
                  <label>Administration</label>
                  <i className="ti ti-settings"></i>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/customuser/")} className={`pc-link ${isActiveLink('/admin/core/customuser/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-users"></i>
                    </span>
                    <span className="pc-mtext">Utilisateurs</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/societe/")} className={`pc-link ${isActiveLink('/admin/core/societe/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-building"></i>
                    </span>
                    <span className="pc-mtext">Sociétés</span>
                  </Link>
                </li>

                {hasSuperAdminAccess() && (
                  <li className="pc-item">
                    <Link to={buildUrl("/admin/core/groupepersonnalise/")} className={`pc-link ${isActiveLink('/admin/core/groupepersonnalise/')}`}>
                      <span className="pc-micon">
                        <i className="ti ti-layout-grid"></i>
                      </span>
                      <span className="pc-mtext">Groupes</span>
                    </Link>
                  </li>
                )}

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/secteuractivite/")} className={`pc-link ${isActiveLink('/admin/core/secteuractivite/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-tournament"></i>
                    </span>
                    <span className="pc-mtext">Secteurs d'activité</span>
                  </Link>
                </li>
              </>
            )}

            {/* Menu Gestion de Patrimoine */}
            {isAuthenticated && hasAdminAccess() && (
              <>
                <li className="pc-item pc-caption">
                  <label>Gestion de Patrimoine</label>
                  <i className="ti ti-building"></i>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/projet/")} className={`pc-link ${isActiveLink('/admin/core/projet/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-clipboard"></i>
                    </span>
                    <span className="pc-mtext">Projets</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/axe/")} className={`pc-link ${isActiveLink('/admin/core/axe/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-sitemap"></i>
                    </span>
                    <span className="pc-mtext">Axes</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/sousaxe/")} className={`pc-link ${isActiveLink('/admin/core/sousaxe/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-social"></i>
                    </span>
                    <span className="pc-mtext">Sous-axes</span>
                  </Link>
                </li>
              </>
            )}

            {/* Menu Testing & Monitoring */}
            {isAuthenticated && user?.is_staff && (
              <>
                <li className="pc-item pc-caption">
                  <label>Testing & Monitoring</label>
                  <i className="ti ti-bug"></i>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/script/")} className={`pc-link ${isActiveLink('/admin/core/script/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-code"></i>
                    </span>
                    <span className="pc-mtext">Scripts</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/configurationtest/")} className={`pc-link ${isActiveLink('/admin/core/configurationtest/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-tool"></i>
                    </span>
                    <span className="pc-mtext">Configuration des tests</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/executiontest/")} className={`pc-link ${isActiveLink('/admin/core/executiontest/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-calendar"></i>
                    </span>
                    <span className="pc-mtext">Exécution des tests</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/executionresult/")} className={`pc-link ${isActiveLink('/admin/core/executionresult/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-chart-dots"></i>
                    </span>
                    <span className="pc-mtext">Résultats des tests</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/vueglobale/")} className={`pc-link ${isActiveLink('/admin/core/vueglobale/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-report"></i>
                    </span>
                    <span className="pc-mtext">Vue globale</span>
                  </Link>
                </li>
              </>
            )}

            {/* Menu Configuration */}
            {isAuthenticated && hasAdminAccess() && (
              <>
                <li className="pc-item pc-caption">
                  <label>Configuration</label>
                  <i className="ti ti-settings"></i>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/emailnotification/")} className={`pc-link ${isActiveLink('/admin/core/emailnotification/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-mail"></i>
                    </span>
                    <span className="pc-mtext">Notifications Email</span>
                  </Link>
                </li>

                <li className="pc-item">
                  <Link to={buildUrl("/admin/core/configuration/")} className={`pc-link ${isActiveLink('/admin/core/configuration/')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-adjustments"></i>
                    </span>
                    <span className="pc-mtext">Paramètres</span>
                  </Link>
                </li>
              </>
            )}

            {/* Profil utilisateur (visible pour tous les utilisateurs connectés) */}
            {isAuthenticated && (
              <li className="pc-item">
                <Link to="/userprofile" className={`pc-link ${isActiveLink('/userprofile')}`}>
                  <span className="pc-micon">
                    <i className="ti ti-user"></i>
                  </span>
                  <span className="pc-mtext">Mon profil</span>
                </Link>
              </li>
            )}

            {/* Déconnexion (visible pour tous les utilisateurs connectés) */}
            {isAuthenticated && (
              <li className="pc-item">
                <button 
                  className="pc-link text-danger w-100 text-start border-0 bg-transparent"
                  onClick={logout}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="pc-micon">
                    <i className="ti ti-logout"></i>
                  </span>
                  <span className="pc-mtext">Déconnexion</span>
                </button>
              </li>
            )}

            {/* Connexion (visible seulement pour les utilisateurs non connectés) */}
            {!isAuthenticated && (
              <li className="pc-item">
                <Link to="/login" className="pc-link text-primary">
                  <span className="pc-micon">
                    <i className="ti ti-login"></i>
                  </span>
                  <span className="pc-mtext">Connexion</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;