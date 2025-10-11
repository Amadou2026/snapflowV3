import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import avatar2 from '../../assets/img/user/avatar-2.jpg';
import { AuthContext } from '../../context/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import api from '../../services/api';

const HeaderAdmin = ({ user }) => {
  const navigate = useNavigate();
  const { isAuthenticated, selectProject, selectedProjectId } = useContext(AuthContext);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showSocieteDropdown, setShowSocieteDropdown] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [userProjects, setUserProjects] = useState([]);
  const [userSocietes, setUserSocietes] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSocietes, setLoadingSocietes] = useState(false);

  const {
    isSidebarHidden,
    isMobileSidebarActive,
    toggleSidebar,
    toggleMobileSidebar
  } = useSidebar();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSocietes();
      loadUserProjects();
    }
  }, [isAuthenticated, user]);

  const loadUserSocietes = async () => {
    try {
      setLoadingSocietes(true);
      const response = await api.get('societe/');
      setUserSocietes(response.data);
    } catch (error) {
      console.error('Erreur chargement sociétés:', error);
      setUserSocietes([]);
    } finally {
      setLoadingSocietes(false);
    }
  };

  const loadUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await api.get('projets/');
      setUserProjects(response.data);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleMessageDropdown = () => {
    setShowMessageDropdown(!showMessageDropdown);
    setShowProfileDropdown(false);
    setShowProjectsDropdown(false);
    setShowSocieteDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowMessageDropdown(false);
    setShowProjectsDropdown(false);
    setShowSocieteDropdown(false);
  };

  const toggleProjectsDropdown = () => {
    setShowProjectsDropdown(!showProjectsDropdown);
    setShowMessageDropdown(false);
    setShowProfileDropdown(false);
    setShowSocieteDropdown(false);
  };

  const toggleSocieteDropdown = () => {
    setShowSocieteDropdown(!showSocieteDropdown);
    setShowMessageDropdown(false);
    setShowProfileDropdown(false);
    setShowProjectsDropdown(false);
  };

  const handleProjectClick = (project) => {
    // Stocker le projet sélectionné dans le contexte
    selectProject(project.id, project);

    // Navigation vers la page détaillée du projet
    navigate(`/projets/${project.id}`);
    setShowProjectsDropdown(false);
  };

const handleSocieteClick = (societe) => {
    // Navigation vers la page de la société avec l'ID en paramètre
    navigate(`/admin/core/societe/${societe.id}/`);
    setShowSocieteDropdown(false);
};

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown')) {
        setShowMessageDropdown(false);
        setShowProfileDropdown(false);
        setShowProjectsDropdown(false);
        setShowSocieteDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          <ul className="list-unstyled">
            <li className="pc-h-item pc-sidebar-collapse">
              <a
                href="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={(e) => {
                  e.preventDefault();
                  toggleSidebar();
                }}
              >
                <i className="ti ti-menu-2"></i>
              </a>
            </li>

            <li className="pc-h-item pc-sidebar-popup">
              <a
                href="#"
                className="pc-head-link ms-0"
                id="mobile-collapse"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMobileSidebar();
                }}
              >
                <i className="ti ti-menu-2"></i>
              </a>
            </li>
          </ul>
        </div>

        <div className="ms-auto">
          <ul className="list-unstyled">
            {/* Dropdown Société */}
            {/* <li className="dropdown pc-h-item">
              <a
                className="pc-head-link dropdown-toggle arrow-none me-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded={showSocieteDropdown}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSocieteDropdown();
                }}
              >
                <span className="text-primary fw-bold">Sociétés</span>
                <span className="badge bg-primary ms-1">{userSocietes.length}</span>
              </a>
              {showSocieteDropdown && (
                <div className="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown show">
                  <div className="dropdown-header d-flex align-items-center justify-content-between">
                    <h5 className="m-0">Sociétés</h5>
                    <a
                      href="#!"
                      className="pc-head-link bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowSocieteDropdown(false);
                      }}
                    >
                      <i className="ti ti-x text-danger"></i>
                    </a>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div
                    className="dropdown-header px-0 text-wrap header-notification-scroll position-relative"
                    style={{ maxHeight: 'calc(100vh - 215px)' }}
                  >
                    {loadingSocietes ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0">Chargement des sociétés...</p>
                      </div>
                    ) : userSocietes.length === 0 ? (
                      <div className="text-center py-3">
                        <i className="ti ti-building-off text-muted" style={{ fontSize: '2rem' }}></i>
                        <p className="text-muted mt-2 mb-0">Aucune société trouvée</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush w-100">
                        {userSocietes.map((societe) => (
                          <a
                            key={societe.id}
                            className="list-group-item list-group-item-action cursor-pointer"
                            onClick={() => handleSocieteClick(societe)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0">
                                <div className="bg-light rounded p-2">
                                  <i className="ti ti-building text-primary"></i>
                                </div>
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <h6 className="mb-1 text-dark">{societe.nom}</h6>
                                <div className="d-flex align-items-center">
                                  <small className="text-muted">
                                    {societe.secteur_activite || 'N/A'}
                                  </small>
                                  {societe.admin && (
                                    <small className="text-muted ms-2">
                                      • Admin: {societe.admin.first_name} {societe.admin.last_name}
                                    </small>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <i className="ti ti-chevron-right text-muted"></i>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="text-center py-2">
                    <a href="/admin/core/societe/" className="link-primary">
                      Voir toutes les sociétés
                    </a>
                  </div>
                </div>
              )}
            </li> */}

            {/* Espace entre les dropdowns */}
            {/* <li className="pc-h-item d-none d-md-inline-flex">
              <span className="text-muted mx-3">|</span>
            </li> */}

            {/* Dropdown Projets */}
            <li className="dropdown pc-h-item">
              <a
                className="pc-head-link dropdown-toggle arrow-none me-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded={showProjectsDropdown}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProjectsDropdown();
                }}
              >
                <span className="text-success fw-bold">Projets</span>
                <span className="badge bg-success ms-1">{userProjects.length}</span>
              </a>
              {showProjectsDropdown && (
                <div className="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown show">
                  <div className="dropdown-header d-flex align-items-center justify-content-between">
                    <h5 className="m-0">Projets</h5>
                    <a
                      href="#!"
                      className="pc-head-link bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowProjectsDropdown(false);
                      }}
                    >
                      <i className="ti ti-x text-danger"></i>
                    </a>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div
                    className="dropdown-header px-0 text-wrap header-notification-scroll position-relative"
                    style={{ maxHeight: 'calc(100vh - 215px)' }}
                  >
                    {loadingProjects ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0">Chargement des projets...</p>
                      </div>
                    ) : userProjects.length === 0 ? (
                      <div className="text-center py-3">
                        <i className="ti ti-folder-off text-muted" style={{ fontSize: '2rem' }}></i>
                        <p className="text-muted mt-2 mb-0">Aucun projet trouvé</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush w-100">
                        {userProjects.map((project) => (
                          <a
                            key={project.id}
                            className={`list-group-item list-group-item-action cursor-pointer ${selectedProjectId === project.id ? 'active' : ''
                              }`}
                            onClick={() => handleProjectClick(project)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0">
                                {project.logo ? (
                                  <img
                                    src={project.logo}
                                    alt={project.nom}
                                    className=""
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      borderRadius: '100px !important'
                                    }}
                                  />
                                ) : (
                                  <div className="bg-light rounded p-2">
                                    <i className="ti ti-folder text-primary"></i>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <h6 className="mb-1 text-dark">{project.nom}</h6>
                                <div className="d-flex align-items-center">
                                  <small className="text-muted">
                                    {project.societes && project.societes.length > 0
                                      ? `${project.societes.length} société(s)`
                                      : 'Aucune société'
                                    }
                                  </small>
                                  {project.charge_de_compte_nom && (
                                    <small className="text-muted ms-2">
                                      • Chargé: {project.charge_de_compte_nom}
                                    </small>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {selectedProjectId === project.id ? (
                                  <i className="ti ti-check text-success"></i>
                                ) : (
                                  <i className="ti ti-chevron-right text-muted"></i>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="text-center py-2">
                    <a href="/admin/core/projet/" className="link-primary">
                      Voir tous les projets
                    </a>
                  </div>
                </div>
              )}
            </li>

            <li className="dropdown pc-h-item">
              <a
                className="pc-head-link dropdown-toggle arrow-none me-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded={showMessageDropdown}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMessageDropdown();
                }}
              >
                <i className="ti ti-mail"></i>
              </a>
            </li>

            <li className="dropdown pc-h-item header-user-profile">
              <a
                className="pc-head-link dropdown-toggle arrow-none me-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded={showProfileDropdown}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProfileDropdown();
                }}
              >
                {/* <img src={avatar2} alt="user-image" className="user-avtar" /> */}
                <span>{user?.first_name} {user?.last_name}</span>
              </a>
              {showProfileDropdown && (
                <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown show">
                  <div className="dropdown-header">
                    <div className="d-flex mb-1">
                      <div className="flex-shrink-0">
                        {/* <img src={avatar2} alt="user-image" className="user-avtar wid-35" /> */}
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">{user?.first_name} {user?.last_name}</h6>
                        <div className="mb-2">
                          {user?.groups && user.groups.length > 0
                            ? user.groups.map((g, idx) => (
                              <span key={idx} className="badge bg-info me-1">{g}</span>
                            ))
                            : <span className="badge bg-light text-dark">Aucun rôle</span>
                          }
                        </div>
                      </div>
                      <a
                        href="#!"
                        className="pc-head-link bg-transparent"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowProfileDropdown(false);
                          localStorage.removeItem('access_token');
                          window.location.href = '/login';
                        }}
                      >
                        <i className="ti ti-power text-danger"></i>
                      </a>
                    </div>
                  </div>

                  <ul className="nav drp-tabs nav-fill nav-tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeProfileTab === 'profile' ? 'active' : ''}`}
                        type="button"
                        role="tab"
                        onClick={() => setActiveProfileTab('profile')}
                      >
                        <i className="ti ti-user"></i> Profil
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeProfileTab === 'setting' ? 'active' : ''}`}
                        type="button"
                        role="tab"
                        onClick={() => setActiveProfileTab('setting')}
                      >
                        <i className="ti ti-settings"></i> Setting
                      </button>
                    </li>
                  </ul>

                  <div className="tab-content">
                    <div
                      className={`tab-pane fade ${activeProfileTab === 'profile' ? 'show active' : ''}`}
                      role="tabpanel"
                    >
                      <a href="/userprofile" className="dropdown-item">
                        <i className="ti ti-user"></i>
                        <span>Voir le Profile</span>
                      </a>
                      {isAuthenticated && user && (
                        <>
                          {user.is_superuser ? (
                            <a href="/admin/core/societe" className="dropdown-item">
                              <i className="ti ti-clipboard-list"></i>
                              <span>Les sociétés</span>
                            </a>
                          ) : user.groups?.some(g => g.toLowerCase() === "administrateur") ? (
                            <a href="/admin/core/societe" className="dropdown-item">
                              <i className="ti ti-clipboard-list"></i>
                              <span>Ma société</span>
                            </a>
                          ) : null}
                        </>
                      )}
                      <a
                        href="#!"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          localStorage.removeItem('access_token');
                          window.location.href = '/login';
                        }}
                      >
                        <i className="ti ti-power"></i>
                        <span>Logout</span>
                      </a>
                    </div>

                    <div
                      className={`tab-pane fade ${activeProfileTab === 'setting' ? 'show active' : ''}`}
                      role="tabpanel"
                    >
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-help"></i>
                        <span>Support</span>
                      </a>
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-user"></i>
                        <span>Account Settings</span>
                      </a>
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-lock"></i>
                        <span>Privacy Center</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;