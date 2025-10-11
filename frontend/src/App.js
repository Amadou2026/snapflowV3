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
import GestionSousAxe from './components/sousaxe/GestionSousAxe';
import GestionAxe from './components/axe/GestionAxe';
import GestionScripts from './components/script/GestionScripts';
import GestionMail from './components/email/GestionMail';
import GestionParametres from './components/parametre/GestionParametres';
import GestionConfigurationTest from './components/configurationtest/GestionConfigurationTest';
import GestionResultatTest from './components/resultattest/GestionResultatTest'
import GestionExecutionTest from './components/executiontest/GestionExecutionTest';
import VueGlobale from './components/vueglobale/VueGlobale';
import PageProjet from './components/projet/PageProjet';
import TemplateSociete from './components/societe/TemplateSociete';
import DetailsSociete from './components/societe/DetailsSociete';
import 'font-awesome/css/font-awesome.min.css';
import { useContext } from 'react';

// Composant qui utilise le contexte
const AppRoutes = () => {
  const { 
    user, 
    isAuthenticated, 
    setUser, 
    setIsAuthenticated,
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
    canManageExecutionResults,
    // Fonctions pour la compatibilité
    hasAdminAccess,
    hasSuperAdminAccess
  } = useContext(AuthContext);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
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
              // Utiliser la fonction de permission spécifique
              canViewDashboard() ? (
                <VueGlobale user={user} logout={logout} />
              ) : (
                // Rediriger vers l'accueil si pas d'accès
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
              // Utiliser la fonction de permission spécifique
              canManageUsers() ? (
                <GestionUsers user={user} logout={logout} />
              ) : (
                // Rediriger vers l'accueil si pas d'accès
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
              // Utiliser la fonction de permission spécifique
              canManageSecteursActivite() ? (
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
              // Utiliser la fonction de permission spécifique
              canManageGroups() ? (
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
              // Utiliser la fonction de permission spécifique
              canManageSocietes() ? (
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
          path="/projets/:projetId"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageProjets() ? (
                <PageProjet user={user} logout={logout} />
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
              // Utiliser la fonction de permission spécifique
              canManageProjets() ? (
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
          path="/admin/core/axe/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageAxes() ? (
                <GestionAxe user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/sousaxe/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageSousAxes() ? (
                <GestionSousAxe user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/script/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageScripts() ? (
                <GestionScripts user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/emailnotification/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageEmailNotifications() ? (
                <GestionMail user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/configuration/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageConfiguration() ? (
                <GestionParametres user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/executionresult/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageExecutionResults() ? (
                <GestionResultatTest user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* <Route
          path="/societe/details"
          element={
            isAuthenticated ? (
              hasAdminAccess() ? (
                <DetailsSociete user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        /> */}

        <Route
          path="/admin/core/dashboard/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canViewDashboard() ? (
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
          path="/admin/core/executiontest/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageExecutionTests() ? (
                <GestionExecutionTest user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/configurationtest/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canManageConfigurationTests() ? (
                <GestionConfigurationTest user={user} logout={logout} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/core/vueglobale/"
          element={
            isAuthenticated ? (
              // Utiliser la fonction de permission spécifique
              canViewVueGlobale() ? (
                <VueGlobale user={user} logout={logout} />
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