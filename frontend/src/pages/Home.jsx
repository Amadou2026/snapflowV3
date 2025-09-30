import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Transformez votre productivité avec 
              <span className="gradient-text"> Notre Solution</span>
            </h1>
            <p className="hero-subtitle">
              Découvrez la plateforme tout-en-un qui révolutionne votre façon de travailler. 
              Interface intuitive, sécurité maximale et performances exceptionnelles.
            </p>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Utilisateurs satisfaits</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Disponibilité</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary">
                  Commencer gratuitement
                  <span className="btn-arrow">→</span>
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Se connecter
                </Link>
              </div>
            ) : (
              <div className="hero-buttons">
                <Link to="/dashboard" className="btn btn-primary">
                  Accéder au Dashboard
                  <span className="btn-arrow">→</span>
                </Link>
              </div>
            )}
          </div>
          
          <div className="hero-visual">
            <div className="hero-image-container">
              <img 
                src="/assets/hero-dashboard.png" 
                alt="Dashboard moderne" 
                className="hero-image"
              />
              <div className="floating-card card-1">
                <div className="card-icon">📊</div>
                <span>Analytics en temps réel</span>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🚀</div>
                <span>Performance optimale</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <span>Découvrir plus</span>
          <div className="arrow-down"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Pourquoi nous choisir ?
            </h2>
            <p className="section-subtitle">
              Des fonctionnalités conçues pour booster votre productivité et sécuriser vos données
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🎨
                </div>
              </div>
              <h3>Design moderne</h3>
              <p>Une interface utilisateur intuitive et élégante qui améliore l'expérience utilisateur</p>
              <div className="feature-badge">Nouveau</div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🔒
                </div>
              </div>
              <h3>Sécurité avancée</h3>
              <p>Protection des données avec chiffrement de bout en bout et authentification multi-facteurs</p>
              <div className="feature-badge">Sécurisé</div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  ⚡
                </div>
              </div>
              <h3>Performance optimale</h3>
              <p>Chargement ultra-rapide et traitement des données en temps réel pour une efficacité maximale</p>
              <div className="feature-badge">Rapide</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  📱
                </div>
              </div>
              <h3>Multi-plateforme</h3>
              <p>Accédez à votre espace depuis n'importe quel appareil, à tout moment</p>
              <div className="feature-badge">Flexible</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🔄
                </div>
              </div>
              <h3>Synchronisation</h3>
              <p>Vos données sont synchronisées en temps réel sur tous vos appareils</p>
              <div className="feature-badge">Sync</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🛠️
                </div>
              </div>
              <h3>Support 24/7</h3>
              <p>Une équipe dédiée pour vous accompagner et répondre à vos questions</p>
              <div className="feature-badge">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Prêt à commencer ?</h2>
            <p>Rejoignez des milliers d'utilisateurs satisfaits dès aujourd'hui</p>
            {!isAuthenticated ? (
              <Link to="/register" className="btn btn-large">
                Créer un compte gratuit
                <span className="btn-arrow">→</span>
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-large">
                Explorer le dashboard
                <span className="btn-arrow">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;