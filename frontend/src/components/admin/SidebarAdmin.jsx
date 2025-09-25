import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarAdmin = () => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActiveLink = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="pc-sidebar">
      <div className="navbar-wrapper">
        <div className="m-header">
          <Link to="/dashboard" className="b-brand text-primary">
            <img src="assets/img/snapflow.png" width="160px" className="img-fluid logo-lg" alt="logo" />
          </Link>
        </div>
        <div className="navbar-content">
          <ul className="pc-navbar">
            <li className="pc-item">
              <Link to="/dashboard" className={`pc-link ${isActiveLink('/dashboard')}`}>
                <span className="pc-micon"><i className="ti ti-dashboard"></i></span>
                <span className="pc-mtext">Dashboard</span>
              </Link>
            </li>

            <li className="pc-item pc-caption">
              <label>UI Components</label>
              <i className="ti ti-dashboard"></i>
            </li>
            <li className="pc-item">
              <Link to="/users" className={`pc-link ${isActiveLink('/users')}`}>
                <span className="pc-micon"><i className="ti ti-typography"></i></span>
                <span className="pc-mtext">Gestion des Utilisateurs</span>
              </Link>
            </li>
            <li className="pc-item">
              <Link to="/elements/color" className={`pc-link ${isActiveLink('/elements/color')}`}>
                <span className="pc-micon"><i className="ti ti-color-swatch"></i></span>
                <span className="pc-mtext">Color</span>
              </Link>
            </li>
            <li className="pc-item">
              <Link to="/elements/icons" className={`pc-link ${isActiveLink('/elements/icons')}`}>
                <span className="pc-micon"><i className="ti ti-plant-2"></i></span>
                <span className="pc-mtext">Icons</span>
              </Link>
            </li>

            <li className="pc-item pc-caption">
              <label>Pages</label>
              <i className="ti ti-news"></i>
            </li>
            <li className="pc-item">
              <Link to="/login" className={`pc-link ${isActiveLink('/login')}`}>
                <span className="pc-micon"><i className="ti ti-lock"></i></span>
                <span className="pc-mtext">Login</span>
              </Link>
            </li>
            <li className="pc-item">
              <Link to="/register" className={`pc-link ${isActiveLink('/register')}`}>
                <span className="pc-micon"><i className="ti ti-user-plus"></i></span>
                <span className="pc-mtext">Register</span>
              </Link>
            </li>

            <li className="pc-item pc-caption">
              <label>Other</label>
              <i className="ti ti-brand-chrome"></i>
            </li>
            <li className={`pc-item pc-hasmenu ${openMenus.menuLevels ? 'pc-trigger' : ''}`}>
              <a 
                href="#!" 
                className="pc-link"
                onClick={() => toggleMenu('menuLevels')}
              >
                <span className="pc-micon"><i className="ti ti-menu"></i></span>
                <span className="pc-mtext">Menu levels</span>
                <span className="pc-arrow"><i data-feather="chevron-right"></i></span>
              </a>
              {openMenus.menuLevels && (
                <ul className="pc-submenu">
                  <li className="pc-item">
                    <a className="pc-link" href="#!">Level 2.1</a>
                  </li>
                  <li className={`pc-item pc-hasmenu ${openMenus.level22 ? 'pc-trigger' : ''}`}>
                    <a 
                      href="#!" 
                      className="pc-link"
                      onClick={() => toggleMenu('level22')}
                    >
                      Level 2.2
                      <span className="pc-arrow"><i data-feather="chevron-right"></i></span>
                    </a>
                    {openMenus.level22 && (
                      <ul className="pc-submenu">
                        <li className="pc-item">
                          <a className="pc-link" href="#!">Level 3.1</a>
                        </li>
                        <li className="pc-item">
                          <a className="pc-link" href="#!">Level 3.2</a>
                        </li>
                        <li className={`pc-item pc-hasmenu ${openMenus.level33 ? 'pc-trigger' : ''}`}>
                          <a 
                            href="#!" 
                            className="pc-link"
                            onClick={() => toggleMenu('level33')}
                          >
                            Level 3.3
                            <span className="pc-arrow"><i data-feather="chevron-right"></i></span>
                          </a>
                          {openMenus.level33 && (
                            <ul className="pc-submenu">
                              <li className="pc-item">
                                <a className="pc-link" href="#!">Level 4.1</a>
                              </li>
                              <li className="pc-item">
                                <a className="pc-link" href="#!">Level 4.2</a>
                              </li>
                            </ul>
                          )}
                        </li>
                      </ul>
                    )}
                  </li>
                  <li className={`pc-item pc-hasmenu ${openMenus.level23 ? 'pc-trigger' : ''}`}>
                    <a 
                      href="#!" 
                      className="pc-link"
                      onClick={() => toggleMenu('level23')}
                    >
                      Level 2.3
                      <span className="pc-arrow"><i data-feather="chevron-right"></i></span>
                    </a>
                    {openMenus.level23 && (
                      <ul className="pc-submenu">
                        <li className="pc-item">
                          <a className="pc-link" href="#!">Level 3.1</a>
                        </li>
                        <li className="pc-item">
                          <a className="pc-link" href="#!">Level 3.2</a>
                        </li>
                        <li className={`pc-item pc-hasmenu ${openMenus.level33b ? 'pc-trigger' : ''}`}>
                          <a 
                            href="#!" 
                            className="pc-link"
                            onClick={() => toggleMenu('level33b')}
                          >
                            Level 3.3
                            <span className="pc-arrow"><i data-feather="chevron-right"></i></span>
                          </a>
                          {openMenus.level33b && (
                            <ul className="pc-submenu">
                              <li className="pc-item">
                                <a className="pc-link" href="#!">Level 4.1</a>
                              </li>
                              <li className="pc-item">
                                <a className="pc-link" href="#!">Level 4.2</a>
                              </li>
                            </ul>
                          )}
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>
            <li className="pc-item">
              <Link to="/sample-page" className={`pc-link ${isActiveLink('/sample-page')}`}>
                <span className="pc-micon"><i className="ti ti-brand-chrome"></i></span>
                <span className="pc-mtext">Sample page</span>
              </Link>
            </li>
          </ul>
          
        </div>
      </div>
    </nav>
  );
};

export default SidebarAdmin;