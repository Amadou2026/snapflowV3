import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <link rel="stylesheet" href="/assets/css/style.css" />
          <h1>Bienvenue sur notre application</h1>
          <p>Découvrez toutes nos fonctionnalités exceptionnelles</p>
          
          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary">
                Se connecter
              </Link>
              <Link to="/register" className="btn btn-secondary">
                S'inscrire
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link to="/dashboard" className="btn btn-primary">
                Accéder au Dashboard
              </Link>
            </div>
          )}
        </div>
        
        <div className="hero-image">
          <img src="/assets/hero-image.png" alt="Hero" />
        </div>
      </section>

      <section className="features-section">
        <h2>Nos fonctionnalités</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src="/assets/feature1.png" alt="Feature 1" />
            <h3>Interface moderne</h3>
            <p>Une expérience utilisateur exceptionnelle</p>
          </div>
          
          <div className="feature-card">
            <img src="/assets/feature2.png" alt="Feature 2" />
            <h3>Sécurisé</h3>
            <p>Vos données sont protégées</p>
          </div>
          
          <div className="feature-card">
            <img src="/assets/feature3.png" alt="Feature 3" />
            <h3>Performant</h3>
            <p>Rapidité et efficacité garanties</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;