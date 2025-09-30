import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand-section">
              <img src="/assets/img/Snapflow_W.png" width="140" alt="SnapFlow Logo" className="footer-logo" />
              <p className="brand-description">
                La plateforme tout-en-un qui révolutionne votre façon de travailler. 
                Interface intuitive, sécurité maximale et performances exceptionnelles.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.016 10.016 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-links">
            {/* Product Links */}
            <div className="footer-column">
              <h4 className="footer-title">Produit</h4>
              <ul className="footer-list">
                <li><Link to="/features" className="footer-link">Fonctionnalités</Link></li>
                <li><Link to="/pricing" className="footer-link">Tarifs</Link></li>
                <li><Link to="/integrations" className="footer-link">Intégrations</Link></li>
                <li><Link to="/updates" className="footer-link">Nouveautés</Link></li>
                <li><Link to="/documentation" className="footer-link">Documentation</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="footer-column">
              <h4 className="footer-title">Entreprise</h4>
              <ul className="footer-list">
                <li><Link to="/about" className="footer-link">À propos</Link></li>
                <li><Link to="/careers" className="footer-link">Carrières</Link></li>
                <li><Link to="/blog" className="footer-link">Blog</Link></li>
                <li><Link to="/press" className="footer-link">Presse</Link></li>
                <li><Link to="/contact" className="footer-link">Contact</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="footer-column">
              <h4 className="footer-title">Ressources</h4>
              <ul className="footer-list">
                <li><Link to="/help" className="footer-link">Centre d'aide</Link></li>
                <li><Link to="/community" className="footer-link">Communauté</Link></li>
                <li><Link to="/webinars" className="footer-link">Webinaires</Link></li>
                <li><Link to="/tutorials" className="footer-link">Tutoriels</Link></li>
                <li><Link to="/api" className="footer-link">API</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="footer-column">
              <h4 className="footer-title">Légal</h4>
              <ul className="footer-list">
                <li><Link to="/privacy" className="footer-link">Confidentialité</Link></li>
                <li><Link to="/terms" className="footer-link">Conditions d'utilisation</Link></li>
                <li><Link to="/cookies" className="footer-link">Cookies</Link></li>
                <li><Link to="/security" className="footer-link">Sécurité</Link></li>
                <li><Link to="/compliance" className="footer-link">Conformité</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h4 className="newsletter-title">Restez informé</h4>
            <p className="newsletter-description">
              Recevez les dernières nouvelles, mises à jour et offres spéciales directement dans votre boîte mail.
            </p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                S'abonner
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2024 SnapFlow. Tous droits réservés.</p>
            </div>
            <div className="footer-bottom-links">
              <Link to="/privacy" className="footer-bottom-link">Confidentialité</Link>
              <Link to="/terms" className="footer-bottom-link">Conditions</Link>
              <Link to="/sitemap" className="footer-bottom-link">Plan du site</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;