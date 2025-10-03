import React, { useState, useContext, useEffect } from 'react';
import avatar2 from '../../assets/img/user/avatar-2.jpg';
import { AuthContext } from '../../context/AuthContext';
import { useSidebar } from '../../hooks/useSidebar'; // Import du hook

const HeaderAdmin = ({ user }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Utilisation du hook useSidebar
  const {
    isSidebarHidden,
    isMobileSidebarActive,
    toggleSidebar,
    toggleMobileSidebar
  } = useSidebar();

  const toggleMessageDropdown = () => {
    setShowMessageDropdown(!showMessageDropdown);
    setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowMessageDropdown(false);
  };

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown')) {
        setShowMessageDropdown(false);
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fermer la sidebar mobile quand on redimensionne la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        // Le hook gère déjà cet état, mais on peut forcer la fermeture si nécessaire
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        {/* Mobile Media Block start */}
        <div className="me-auto pc-mob-drp">
          <ul className="list-unstyled">
            {/* Bouton DESKTOP - Cache la sidebar */}
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
            
            {/* Bouton MOBILE - Ouvre la sidebar en overlay */}
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
            
            {/* Recherche mobile */}
            <li className="dropdown pc-h-item d-inline-flex d-md-none">
              <a
                className="pc-head-link dropdown-toggle arrow-none m-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded="false"
              >
                <i className="ti ti-search"></i>
              </a>
              <div className="dropdown-menu pc-h-dropdown drp-search">
                <div className="px-3">
                  <div className="form-group mb-0 d-flex align-items-center">
                    <i className="feather feather-search"></i>
                    <input
                      type="search"
                      className="form-control border-0 shadow-none"
                      placeholder="Search here. . ."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </li>
            
            {/* Recherche desktop */}
            <li className="pc-h-item d-none d-md-inline-flex">
              <div className="header-search">
                <i className="feather feather-search icon-search"></i>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search here. . ."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </li>
          </ul>
        </div>
        {/* Mobile Media Block end */}

        <div className="ms-auto">
          <ul className="list-unstyled">
            {/* Messages Dropdown */}
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
              {showMessageDropdown && (
                <div className="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown show">
                  <div className="dropdown-header d-flex align-items-center justify-content-between">
                    <h5 className="m-0">Message</h5>
                    <a
                      href="#!"
                      className="pc-head-link bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMessageDropdown(false);
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
                    <div className="list-group list-group-flush w-100">
                      <a className="list-group-item list-group-item-action">
                        <div className="d-flex">
                          <div className="flex-shrink-0">
                            <img src={avatar2} alt="user-image" className="user-avtar" />
                          </div>
                          <div className="flex-grow-1 ms-1">
                            <span className="float-end text-muted">3:00 AM</span>
                            <p className="text-body mb-1">It's <b>Cristina danny's</b> birthday today.</p>
                            <span className="text-muted">2 min ago</span>
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="text-center py-2">
                    <a href="#!" className="link-primary">View all</a>
                  </div>
                </div>
              )}
            </li>

            {/* User Profile Dropdown */}
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
                <img src={avatar2} alt="user-image" className="user-avtar" />
                <span>{user?.first_name} {user?.last_name}</span>
              </a>
              {showProfileDropdown && (
                <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown show">
                  <div className="dropdown-header">
                    <div className="d-flex mb-1">
                      <div className="flex-shrink-0">
                        <img src={avatar2} alt="user-image" className="user-avtar wid-35" />
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
                        <i className="ti ti-user"></i> Profile
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
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-wallet"></i>
                        <span>Billing</span>
                      </a>
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
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-messages"></i>
                        <span>Feedback</span>
                      </a>
                      <a href="#!" className="dropdown-item">
                        <i className="ti ti-list"></i>
                        <span>History</span>
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