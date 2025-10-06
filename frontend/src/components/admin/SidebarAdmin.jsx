import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // Ajustez le chemin selon votre structure
import logo from '../../assets/img/snapflow.png'
import { TiArrowUnsorted } from "react-icons/ti";

const SidebarAdmin = () => {
  const [openMenus, setOpenMenus] = useState({});
  const [adminApps, setAdminApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  // Utiliser le contexte d'authentification
  const { user, isAuthenticated } = useContext(AuthContext);

  // Fonction pour récupérer le menu admin depuis l'API Django
  const fetchAdminMenu = async () => {
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated) {
      setError('Vous devez être connecté pour accéder au menu admin');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Token d\'authentification manquant');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin-menu/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse non-JSON reçue. Vérifiez l\'authentification.');
      }

      const data = await response.json();

      // Gérer les erreurs d'authentification/autorisation
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
          throw new Error('Vous n\'avez pas les permissions pour accéder à l\'administration.');
        }
        throw new Error(`Erreur HTTP: ${response.status} - ${data.message || 'Erreur serveur'}`);
      }

      setAdminApps(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement du menu admin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  // Charger le menu quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAdminMenu();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActiveLink = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Fonction pour obtenir l'icône appropriée selon le type d'application
  const getAppIcon = (appLabel) => {
    const iconMap = {
      'reporting_section': 'ti ti-chart-line',
      'gestion_patrimoine': 'ti ti-building',
      'testing_monitoring': 'ti ti-bug',
      'gestion_societe': 'ti ti-building-factory',
      'auth_section': 'ti ti-users'
    };
    return iconMap[appLabel] || 'ti ti-folder';
  };

  // Fonction pour obtenir l'icône appropriée selon le modèle
  const getModelIcon = (objectName, appLabel) => {
    const iconMap = {
      // Dashboard & Vue Globale
      'VueGlobale': 'ti ti-report',
      'Dashboard': 'ti ti-dashboard',
      
      // Gestion du Patrimoine
      'Configuration': 'ti ti-settings',
      'Projet': 'ti ti-clipboard',
      'EmailNotification': 'ti ti-mail',
      'Axe': 'ti ti-sitemap',
      'SousAxe': 'ti ti-social',
      
      // Testing & Monitoring
      'Script': 'ti ti-code',
      'ConfigurationTest': 'ti ti-tool',
      'ExecutionTest': 'ti ti-calendar',
      'ExecutionResult': 'ti ti-chart-dots',
      
      // Gestion Société
      'Societe': 'ti ti-building',
      'SecteurActivite': 'ti ti-tournament',
      
      // Administration & Autorisation
      'Group': 'ti ti-layout',
      'CustomUser': 'ti ti-user'
    };
    return iconMap[objectName] || 'ti ti-table';
  };

  // Fonction pour rendre les éléments du menu admin
  const renderAdminMenuItems = () => {
    // Si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) {
      return (
        <li className="pc-item">
          <div className="pc-link text-warning">
            <span className="pc-micon">
              <i className="ti ti-login"></i>
            </span>
            <span className="pc-mtext">
              <Link to="/login" className="text-decoration-none text-warning">
                Connectez-vous pour accéder au menu admin
              </Link>
            </span>
          </div>
        </li>
      );
    }

    if (loading) {
      return (
        <li className="pc-item">
          <div className="pc-link">
            <span className="pc-micon">
              <i className="ti ti-loader ti-spin"></i>
            </span>
            <span className="pc-mtext">Chargement du menu admin...</span>
          </div>
        </li>
      );
    }

    if (error) {
      return (
        <>
          <li className="pc-item">
            <div className="pc-link text-danger">
              <span className="pc-micon">
                <i className="ti ti-alert-circle"></i>
              </span>
              <span className="pc-mtext">{error}</span>
            </div>
          </li>
          <li className="pc-item">
            <button 
              className="pc-link btn btn-link text-start w-100 text-primary" 
              onClick={fetchAdminMenu}
              disabled={loading}
            >
              <span className="pc-micon">
                <i className="ti ti-refresh"></i>
              </span>
              <span className="pc-mtext">Réessayer</span>
            </button>
          </li>
        </>
      );
    }

    if (!adminApps || adminApps.length === 0) {
      return (
        <li className="pc-item">
          <div className="pc-link text-muted">
            <span className="pc-micon">
              <i className="ti ti-folder-off"></i>
            </span>
            <span className="pc-mtext">Aucun menu admin disponible</span>
          </div>
        </li>
      );
    }

    return adminApps.map((app, appIndex) => (
      <React.Fragment key={`app-${appIndex}`}>
        {/* Titre de l'application */}
        <li className="pc-item pc-caption">
          <label>{app.name}</label>
          <i className={getAppIcon(app.app_label)}></i>
        </li>

        {/* Modèles de l'application */}
        {app.models && app.models.map((model, modelIndex) => {
          return (
            <li key={`model-${appIndex}-${modelIndex}`} className="pc-item">
              <Link 
                to={model.admin_url} 
                className={`pc-link ${isActiveLink(model.admin_url)}`}
              >
                <span className="pc-micon">
                  <i className={getModelIcon(model.object_name, app.app_label)}></i>
                </span>
                <span className="pc-mtext">{model.name}</span>
                
                {model.view_only && (
                  <span className="badge bg-secondary ms-2" title="Lecture seule">
                    <i className="ti ti-eye"></i>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </React.Fragment>
    ));
  };

  return (
    <nav className="pc-sidebar">
      <div className="navbar-wrapper">
        <div className="m-header">
          <Link to="/dashboard" className="b-brand text-primary">
            <img src={logo}  width="160px" className="img-fluid logo-lg" alt="logo" />
          </Link>
        </div>
        <div className="navbar-content" style={{ 
          height: 'calc(100vh - 80px)', 
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <ul className="pc-navbar">
            {/* Menu Admin Dynamique */}
            {renderAdminMenuItems()}            
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default SidebarAdmin;