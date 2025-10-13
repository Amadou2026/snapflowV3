// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Utiliser le context global
  const { setUser, setIsAuthenticated } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('token/', formData);
      const { access: accessToken, refresh: refreshToken } = response.data;

      // Stocker les tokens
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Récupérer le profil complet depuis le backend
      const profileResponse = await api.get('user/profile/');
      const profileData = profileResponse.data;

      // Mettre à jour le context
      setUser(profileData);
      setIsAuthenticated(true);

      // --- MODIFICATION CLÉ ---
      // Rediriger TOUJOURS vers le dashboard après la connexion
      navigate('/dashboard');

    } catch (err) {
      console.error(err.response || err);
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-main">
      {/* Pre-loader */}
      <div className="loader-bg">
        <div className="loader-track">
          <div className="loader-fill"></div>
        </div>
      </div>

      <div className="auth-wrapper v3">
        <div className="auth-form">
          <div className="auth-header text-center">
            <img src="/assets/img/snapflow.png" width="120" alt="Snapflow" />
          </div>

          <div className="card my-5">
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={togglePasswordVisibility}
                      style={{ textDecoration: 'none', zIndex: 10 }}
                    >
                      <i className={`feather ${showPassword ? 'icon-eye-off' : 'icon-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="auth-footer text-center">
            <p className="m-0">
              2025 Copyright © <a href="https://www.medianet.tn/" target="_blank" rel="noreferrer">MEDIANET</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;