// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GestionUsers from './components/users/GestionUsers';
import ProfilUtilisateur from './components/users/ProfilUtilisateur';
import GestionSocietes from './components/societe/GestionSocietes';
import GestionGroupe from './components/groupe/GestionGroupe';
import GestionSecteur from './components/secteur/GestionSecteur';
import GestionProjets from './components/projet/GestionProjets';
import 'font-awesome/css/font-awesome.min.css';
import { useContext } from 'react';

// Composant qui utilise le contexte
const AppRoutes = () => {
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useContext(AuthContext);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Fonction pour vérifier les permissions d'accès admin
  const hasAdminAccess = () => {
    if (!user) return false;
    
    // Si l'utilisateur n'est pas staff, il n'a pas accès aux pages admin
    if (!user.is_staff) return false;
    
    // Vérifier les permissions spécifiques
    return user.is_superuser || 
           user.groups?.some(g => g.toLowerCase() === "administrateur");
  };

  // Fonction pour vérifier l'accès super admin
  const hasSuperAdminAccess = () => {
    return user?.is_superuser;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login />
            ) : (
              // Rediriger vers l'accueil si l'utilisateur n'est pas staff
              // ou vers le dashboard s'il est staff
              user?.is_staff ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              // Rediriger les utilisateurs non-staff vers l'accueil
              user?.is_staff ? (
                <Dashboard user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/core/customuser/"
          element={
            isAuthenticated ? (
              // Vérifier si l'utilisateur a accès aux pages admin
              hasAdminAccess() ? (
                <GestionUsers user={user} logout={logout} />
              ) : (
                // Rediriger vers l'accueil si pas d'accès admin
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/admin/core/secteuractivite/"
          element={
            isAuthenticated ? (
              hasAdminAccess() ? (
                <GestionSecteur user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/core/groupepersonnalise/"
          element={
            isAuthenticated ? (
              hasSuperAdminAccess() ? (
                <GestionGroupe user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/core/societe/"
          element={
            isAuthenticated ? (
              hasSuperAdminAccess() ? (
                <GestionSocietes user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/core/projet/"
          element={
            isAuthenticated ? (
              hasAdminAccess() ? (
                <GestionProjets user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/userprofile"
          element={
            isAuthenticated ? (
              <ProfilUtilisateur user={user} logout={logout} setUser={setUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Route de fallback pour les URLs non trouvées */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? (user?.is_staff ? "/dashboard" : "/") : "/login"} replace />
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;