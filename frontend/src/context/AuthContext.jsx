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
  const [permissions, setPermissions] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

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

          // Récupérer le profil utilisateur
          const profileResponse = await api.get('user/profile/');
          setUser(profileResponse.data);
          
          // Récupérer les permissions de l'utilisateur
          const permissionsResponse = await api.get('user/permissions/');
          setPermissions(permissionsResponse.data.permissions || []);
          
          // Extraire les groupes de l'utilisateur à partir des permissions
          const groups = [];
          if (permissionsResponse.data.permissions.includes('core.add_customuser') && 
              permissionsResponse.data.permissions.includes('core.change_customuser') && 
              permissionsResponse.data.permissions.includes('core.delete_customuser')) {
            groups.push('administrateur');
          }
          if (permissionsResponse.data.permissions.includes('core.add_script') && 
              permissionsResponse.data.permissions.includes('core.change_script')) {
            groups.push('developpeur');
          }
          if (permissionsResponse.data.permissions.includes('core.add_executiontest') && 
              permissionsResponse.data.permissions.includes('core.change_executiontest')) {
            groups.push('qa');
          }
          if (permissionsResponse.data.permissions.includes('core.view_dashboard') && 
              permissionsResponse.data.permissions.includes('core.view_vueglobale')) {
            groups.push('manager');
          }
          if (permissionsResponse.data.permissions.includes('core.add_projet') && 
              permissionsResponse.data.permissions.includes('core.change_projet')) {
            groups.push('chef_projet');
          }
          setUserGroups(groups);
          
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
          setPermissions([]);
          setUserGroups([]);
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

  // Fonction pour rafraîchir les permissions
  const refreshPermissions = async () => {
    try {
      const permissionsResponse = await api.get('user/permissions/');
      setPermissions(permissionsResponse.data.permissions || []);
      
      // Mettre à jour les groupes
      const groups = [];
      if (permissionsResponse.data.permissions.includes('core.add_customuser') && 
          permissionsResponse.data.permissions.includes('core.change_customuser') && 
          permissionsResponse.data.permissions.includes('core.delete_customuser')) {
        groups.push('administrateur');
      }
      if (permissionsResponse.data.permissions.includes('core.add_script') && 
          permissionsResponse.data.permissions.includes('core.change_script')) {
        groups.push('developpeur');
      }
      if (permissionsResponse.data.permissions.includes('core.add_executiontest') && 
          permissionsResponse.data.permissions.includes('core.change_executiontest')) {
        groups.push('qa');
      }
      if (permissionsResponse.data.permissions.includes('core.view_dashboard') && 
          permissionsResponse.data.permissions.includes('core.view_vueglobale')) {
        groups.push('manager');
      }
      if (permissionsResponse.data.permissions.includes('core.add_projet') && 
          permissionsResponse.data.permissions.includes('core.change_projet')) {
        groups.push('chef_projet');
      }
      setUserGroups(groups);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des permissions', err);
    }
  };

  // Fonctions pour vérifier les permissions spécifiques
  const hasPermission = (permission) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList) => {
    if (!permissions || permissions.length === 0) return false;
    return permissionsList.some(permission => permissions.includes(permission));
  };

  const hasRole = (role) => {
    if (!userGroups || userGroups.length === 0) return false;
    return userGroups.includes(role);
  };

  // Vérifications spécifiques selon les rôles prédéfinis
  const canViewDashboard = () => {
    return hasPermission('core.view_dashboard') || hasRole('administrateur') || hasRole('qa') || hasRole('manager') || hasRole('chef_projet');
  };

  const canViewVueGlobale = () => {
    return hasPermission('core.view_vueglobale') || hasRole('administrateur') || hasRole('manager');
  };

  const canManageSocietes = () => {
    return hasPermission('core.view_societe') || hasRole('administrateur');
  };

  const canManageSecteursActivite = () => {
    return hasPermission('core.view_secteuractivite') || hasRole('administrateur');
  };

  const canManageProjets = () => {
    return hasAnyPermission(['core.view_projet', 'core.add_projet', 'core.change_projet']) || hasRole('administrateur') || hasRole('chef_projet') || hasRole('manager');
  };

  const canManageConfiguration = () => {
    return hasPermission('core.view_configuration') || hasRole('administrateur');
  };

  const canManageEmailNotifications = () => {
    return hasPermission('core.view_emailnotification') || hasRole('administrateur');
  };

  const canManageUsers = () => {
    return hasPermission('core.view_customuser') || hasRole('administrateur');
  };

  const canManageGroups = () => {
    return hasPermission('core.view_groupepersonnalise') || hasRole('administrateur');
  };

  const canManageAxes = () => {
    return hasPermission('core.view_axe') || hasRole('administrateur');
  };

  const canManageSousAxes = () => {
    return hasPermission('core.view_sousaxe') || hasRole('administrateur');
  };

  const canManageScripts = () => {
    return hasAnyPermission(['core.view_script', 'core.add_script', 'core.change_script']) || hasRole('administrateur') || hasRole('qa') || hasRole('developpeur') || hasRole('chef_projet');
  };

  const canManageConfigurationTests = () => {
    return hasAnyPermission(['core.view_configurationtest', 'core.add_configurationtest', 'core.change_configurationtest']) || hasRole('administrateur') || hasRole('qa');
  };

  const canManageExecutionTests = () => {
    return hasAnyPermission(['core.view_executiontest', 'core.add_executiontest', 'core.change_executiontest']) || hasRole('administrateur') || hasRole('qa');
  };

  const canManageExecutionResults = () => {
    return hasPermission('core.view_executionresult') || hasRole('administrateur') || hasRole('qa') || hasRole('developpeur') || hasRole('manager') || hasRole('chef_projet');
  };

  // Fonctions pour vérifier l'accès admin (pour la compatibilité)
  const hasAdminAccess = () => {
    return hasRole('administrateur') || user?.is_superuser;
  };

  const hasSuperAdminAccess = () => {
    return user?.is_superuser;
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
      selectProject,
      permissions,
      userGroups,
      refreshPermissions,
      // Fonctions de permission
      hasPermission,
      hasAnyPermission,
      hasRole,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};