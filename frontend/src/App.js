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
    loading, // On utilise l'état de chargement général
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

  // Si le contexte est en cours de chargement, on affiche un spinner
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
              // --- MODIFICATION 1 : Si déjà connecté, on redirige vers le dashboard ---
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* --- MODIFICATION 2 : La route /dashboard est maintenant accessible à TOUS les utilisateurs connectés --- */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard user={user} logout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Les autres routes administratives restent protégées par des permissions spécifiques */}
        <Route
          path="/admin/core/customuser/"
          element={
            isAuthenticated ? (
              canManageUsers() ? (
                <GestionUsers user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageSecteursActivite() ? (
                <GestionSecteur user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageGroups() ? (
                <GestionGroupe user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageSocietes() ? (
                <GestionSocietes user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageProjets() ? (
                <PageProjet user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageProjets() ? (
                <GestionProjets user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageAxes() ? (
                <GestionAxe user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageSousAxes() ? (
                <GestionSousAxe user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageScripts() ? (
                <GestionScripts user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageEmailNotifications() ? (
                <GestionMail user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageConfiguration() ? (
                <GestionParametres user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageExecutionResults() ? (
                <GestionResultatTest user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/core/dashboard/"
          element={
            isAuthenticated ? (
              canViewDashboard() ? (
                <Dashboard user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageExecutionTests() ? (
                <GestionExecutionTest user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canManageConfigurationTests() ? (
                <GestionConfigurationTest user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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
              canViewVueGlobale() ? (
                <VueGlobale user={user} logout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
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

        {/* --- MODIFICATION 3 : Route de fallback simplifiée --- */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
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