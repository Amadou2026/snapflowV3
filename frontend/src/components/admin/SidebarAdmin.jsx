// src/components/SidebarAdmin.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import logo from '../../assets/img/snapflow.png';
import { TiArrowUnsorted } from "react-icons/ti";

const SidebarAdmin = () => {
  const [openMenus, setOpenMenus] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Utiliser une référence pour suivre si le rafraîchissement a déjà été effectué
  const hasRefreshedRef = useRef(false);
  const lastCriticalRouteRef = useRef(null);

  // On récupère toutes les données et fonctions nécessaires depuis le contexte
  const {
    user,
    isAuthenticated,
    setIsAuthenticated,
    setUser,
    selectedProjectId,
    loading, // État de chargement général
    permissionsLoaded, // Nouvel état pour savoir si les permissions sont chargées
    refreshPermissions, // Fonction pour rafraîchir les permissions
    // Utiliser les fonctions de permission depuis le contexte
    canViewDashboard,
    canViewVueGlobale,
    canManageSocietes,
    canManageSecteursActivite,
    canManageProjets,
    canManageConfiguration,
    canManageEmailNotifications,
    canManageUsers,
    canManageGroups,
    canManageAxes,
    canManageSousAxes,
    canManageScripts,
    canManageConfigurationTests,
    canManageExecutionTests,
    canManageExecutionResults
  } = useContext(AuthContext);

  // Effet pour rafraîchir les permissions lors du montage du composant
  useEffect(() => {
    // Si l'utilisateur est authentifié mais que les permissions ne sont pas encore chargées
    // et que nous n'avons pas déjà rafraîchi
    if (isAuthenticated && !permissionsLoaded && !loading && !hasRefreshedRef.current) {
      //console.log("SidebarAdmin: Rafraîchissement initial des permissions...");
      hasRefreshedRef.current = true;
      setRefreshing(true);
      refreshPermissions().finally(() => {
        setRefreshing(false);
      });
    }
  }, [isAuthenticated, permissionsLoaded, loading]); // Retirer refreshPermissions des dépendances

  // Effet pour détecter les changements de route et rafraîchir si nécessaire
  useEffect(() => {
    // Rafraîchir les permissions lors de certaines routes critiques
    const criticalRoutes = ['/admin/core/customuser/', '/admin/core/groupepersonnalise/'];
    const isCriticalRoute = criticalRoutes.some(route => location.pathname.startsWith(route));
    
    // Vérifier si nous sommes sur une route critique différente de la dernière
    const currentCriticalRoute = criticalRoutes.find(route => location.pathname.startsWith(route));
    const isDifferentRoute = currentCriticalRoute !== lastCriticalRouteRef.current;

    // Ajouter une condition pour éviter les rafraîchissements multiples
    if (isCriticalRoute && isAuthenticated && !refreshing && isDifferentRoute) {
      //console.log("SidebarAdmin: Route critique détectée, rafraîchissement des permissions...");
      lastCriticalRouteRef.current = currentCriticalRoute;
      setRefreshing(true);
      refreshPermissions().finally(() => {
        setRefreshing(false);
      });
    }
  }, [location.pathname, isAuthenticated, refreshing]); // Retirer refreshPermissions des dépendances

  // Réinitialiser la référence lorsque l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) {
      hasRefreshedRef.current = false;
      lastCriticalRouteRef.current = null;
    }
  }, [isAuthenticated]);

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

  // NOUVELLE FONCTION UNIFIÉE pour vérifier si un lien est actif
  const isLinkActive = (path) => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentProjectId = searchParams.get('projectId');

    // Vérifie si le chemin correspond exactement
    if (currentPath === path) {
      return 'active';
    }

    // Vérifie si le chemin actuel est une route imbriquée (ex: /admin/core/configurationtest/5/)
    if (currentPath.startsWith(path + '/')) {
      return 'active';
    }

    // Si on a un projectId dans l'URL, on le compare
    if (selectedProjectId && currentProjectId) {
      return currentPath === path && currentProjectId === selectedProjectId ? 'active' : '';
    }

    return '';
  };

  // Vérifie si un parent est actif (pour les routes imbriquées)
  const isActiveParent = (paths) => {
    const currentPath = location.pathname;
    return paths.some(path => currentPath.startsWith(path)) ? 'active' : '';
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // --- AMÉLIORATION : Afficher un squelette de chargement pendant que le contexte charge ---
  if (loading || refreshing) {
    return (
      <nav className="pc-sidebar">
        <div className="navbar-wrapper">
          <div className="m-header">
            <Link to="/" className="b-brand text-primary">
              <img src={logo} width="160px" className="img-fluid logo-lg" alt="logo" />
            </Link>
          </div>
          <div className="navbar-content">
            <ul className="pc-navbar">
              {/* Afficher des squelettes pour les menus pendant le chargement */}
              <li className="pc-item pc-caption">
                <label>{refreshing ? "Mise à jour des permissions..." : "Chargement..."}</label>
              </li>
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="pc-item">
                  <div className="pc-link">
                    <span className="pc-micon placeholder-glow">
                      <i className="placeholder"></i>
                    </span>
                    <span className="pc-mtext placeholder-glow">
                      <span className="placeholder col-8"></span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

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
            {/* Accueil & Vision globale */}
            <li className="pc-item pc-caption">
              <label>Accueil & Vision globale</label>
              <i className="ti ti-home"></i>
            </li>

            {/* Accueil */}
            <li className="pc-item">
              <Link to={buildUrl("/")} className={`pc-link ${isLinkActive('/')}`}>
                <span className="pc-micon">
                  <i className="ti ti-home"></i>
                </span>
                <span className="pc-mtext">Accueil</span>
              </Link>
            </li>

            {/* Tableau de bord */}
            {isAuthenticated && canViewDashboard() && (
              <li className="pc-item">
                <Link to={buildUrl("/dashboard")} className={`pc-link ${isLinkActive('/dashboard')}`}>
                  <span className="pc-micon">
                    <i className="ti ti-dashboard"></i>
                  </span>
                  <span className="pc-mtext">Tableau de bord</span>
                </Link>
              </li>
            )}

            {/* Vue globale */}
            {isAuthenticated && canViewVueGlobale() && (
              <li className="pc-item">
                <Link
                  to={buildUrl("/admin/core/vueglobale/")}
                  className={`pc-link ${isLinkActive('/admin/core/vueglobale')}`}
                >
                  <span className="pc-micon">
                    <i className="ti ti-report"></i>
                  </span>
                  <span className="pc-mtext">Vue globale</span>
                </Link>
              </li>
            )}

            {/* Gestion de patrimoine & référentiels */}
            {isAuthenticated && (canManageSocietes() || canManageSecteursActivite() || canManageProjets() || canManageConfiguration() || canManageEmailNotifications()) && (
              <>
                <li className="pc-item pc-caption">
                  <label>Gestion de patrimoine & référentiels</label>
                  <i className="ti ti-building"></i>
                </li>

                {canManageSocietes() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/societe/")}
                      className={`pc-link ${isLinkActive('/admin/core/societe')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-building"></i>
                      </span>
                      <span className="pc-mtext">Gestion Sociétés</span>
                    </Link>
                  </li>
                )}

                {canManageSecteursActivite() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/secteuractivite/")}
                      className={`pc-link ${isLinkActive('/admin/core/secteuractivite')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-tournament"></i>
                      </span>
                      <span className="pc-mtext">Gestion Secteurs d'activité</span>
                    </Link>
                  </li>
                )}

                {canManageProjets() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/projet/")}
                      className={`pc-link ${isLinkActive('/admin/core/projet')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-clipboard"></i>
                      </span>
                      <span className="pc-mtext">Gestion des Projets</span>
                    </Link>
                  </li>
                )}

                {canManageConfiguration() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/configuration/")}
                      className={`pc-link ${isLinkActive('/admin/core/configuration')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-adjustments"></i>
                      </span>
                      <span className="pc-mtext">Paramètres Projets</span>
                    </Link>
                  </li>
                )}

                {canManageEmailNotifications() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/emailnotification/")}
                      className={`pc-link ${isLinkActive('/admin/core/emailnotification')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-mail"></i>
                      </span>
                      <span className="pc-mtext">Notifications Email</span>
                    </Link>
                  </li>
                )}
              </>
            )}

            {/* Gestion des Ressources Humaines */}
            {isAuthenticated && (canManageUsers() || canManageGroups()) && (
              <>
                <li className="pc-item pc-caption">
                  <label>Gestion des Ressources Humaines</label>
                  <i className="ti ti-users"></i>
                </li>

                {canManageUsers() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/customuser/")}
                      className={`pc-link ${isLinkActive('/admin/core/customuser')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-users"></i>
                      </span>
                      <span className="pc-mtext">Gestion des Utilisateurs</span>
                    </Link>
                  </li>
                )}

                {canManageGroups() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/groupepersonnalise/")}
                      className={`pc-link ${isLinkActive('/admin/core/groupepersonnalise')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-layout-grid"></i>
                      </span>
                      <span className="pc-mtext">Gestion des Groupes</span>
                    </Link>
                  </li>
                )}
              </>
            )}

            {/* Gestion des Axes */}
            {isAuthenticated && (canManageAxes() || canManageSousAxes()) && (
              <>
                <li className="pc-item pc-caption">
                  <label>Gestion des Axes</label>
                  <i className="ti ti-sitemap"></i>
                </li>

                {canManageAxes() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/axe/")}
                      className={`pc-link ${isLinkActive('/admin/core/axe')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-sitemap"></i>
                      </span>
                      <span className="pc-mtext">Axes de Test</span>
                    </Link>
                  </li>
                )}

                {canManageSousAxes() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/sousaxe/")}
                      className={`pc-link ${isLinkActive('/admin/core/sousaxe')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-social"></i>
                      </span>
                      <span className="pc-mtext">Sous-axes de test</span>
                    </Link>
                  </li>
                )}
              </>
            )}

            {/* Cycle de test & monitoring */}
            {isAuthenticated && (canManageScripts() || canManageConfigurationTests() || canManageExecutionTests() || canManageExecutionResults()) && (
              <>
                <li className="pc-item pc-caption">
                  <label>Cycle de test & monitoring</label>
                  <i className="ti ti-bug"></i>
                </li>

                {canManageScripts() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/script/")}
                      className={`pc-link ${isLinkActive('/admin/core/script')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-code"></i>
                      </span>
                      <span className="pc-mtext">Scripts</span>
                    </Link>
                  </li>
                )}

                {canManageConfigurationTests() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/configurationtest/")}
                      className={`pc-link ${isLinkActive('/admin/core/configurationtest')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-tool"></i>
                      </span>
                      <span className="pc-mtext">Configuration des tests</span>
                    </Link>
                  </li>
                )}

                {canManageExecutionTests() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/executiontest/")}
                      className={`pc-link ${isLinkActive('/admin/core/executiontest')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-calendar"></i>
                      </span>
                      <span className="pc-mtext">Exécution des tests</span>
                    </Link>
                  </li>
                )}

                {canManageExecutionResults() && (
                  <li className="pc-item">
                    <Link
                      to={buildUrl("/admin/core/executionresult/")}
                      className={`pc-link ${isLinkActive('/admin/core/executionresult')}`}
                    >
                      <span className="pc-micon">
                        <i className="ti ti-chart-dots"></i>
                      </span>
                      <span className="pc-mtext">Résultats des tests</span>
                    </Link>
                  </li>
                )}
              </>
            )}

            {/* Configuration & Personnalisation */}
            {isAuthenticated && (
              <>
                <li className="pc-item pc-caption">
                  <label>Configuration & Personnalisation</label>
                  <i className="ti ti-user"></i>
                </li>

                <li className="pc-item">
                  <Link to="/userprofile" className={`pc-link ${isLinkActive('/userprofile')}`}>
                    <span className="pc-micon">
                      <i className="ti ti-user"></i>
                    </span>
                    <span className="pc-mtext">Mon profil</span>
                  </Link>
                </li>
              </>
            )}

            {/* Déconnexion (visible pour tous les utilisateurs connectés) */}
            {isAuthenticated && (
              <li className="pc-item isactivecolor">
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
                <Link to="/login" className={`pc-link text-primary ${isLinkActive('/login')}`}>
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

export default React.memo(SidebarAdmin);