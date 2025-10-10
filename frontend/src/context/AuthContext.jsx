// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Vérifier si un token existe au chargement de l'app
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);

          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expiré');
          }

          const response = await api.get('user/profile/');
          setUser(response.data);
          setIsAuthenticated(true);
          
          // Récupérer le projet sélectionné depuis localStorage
          const savedProjectId = localStorage.getItem('selectedProjectId');
          if (savedProjectId) {
            setSelectedProjectId(parseInt(savedProjectId));
          }
        } catch (err) {
          console.error('Erreur d\'authentification', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('selectedProjectId');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Fonction pour sélectionner un projet
  const selectProject = (projectId, projectData = null) => {
    setSelectedProjectId(projectId);
    setSelectedProject(projectData);
    if (projectId) {
      localStorage.setItem('selectedProjectId', projectId.toString());
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  };

  // Loading spinner pendant la vérification
  if (loading) {
    return (
      <div className="loading-container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
      loading,
      selectedProjectId,
      selectedProject,
      selectProject
    }}>
      {children}
    </AuthContext.Provider>
  );
};