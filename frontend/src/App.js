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
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Layout>
                <Dashboard user={user} logout={logout} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/users"
          element={
            isAuthenticated && user?.is_superuser ? (
              <Layout>
                <GestionUsers user={user} logout={logout} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/userprofile"
          element={
            isAuthenticated ? (
              <Layout>
                <ProfilUtilisateur user={user} logout={logout} setUser={setUser} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
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