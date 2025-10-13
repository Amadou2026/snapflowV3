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
      console.log("AuthContext: Début de la vérification de l'authentification");
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          console.log("AuthContext: Token trouvé, expiration:", new Date(decoded.exp * 1000));

          if (decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expiré');
          }

          // Récupérer le profil utilisateur
          console.log("AuthContext: Récupération du profil utilisateur...");
          const profileResponse = await api.get('user/profile/');
          setUser(profileResponse.data);
          console.log("AuthContext: Profil utilisateur récupéré:", profileResponse.data);
          
          // Mettre à jour l'état d'authentification
          setIsAuthenticated(true);
          
          // Récupérer les permissions de l'utilisateur
          console.log("AuthContext: Récupération des permissions...");
          const permissionsResponse = await api.get('user/permissions/');
          const userPermissions = permissionsResponse.data.permissions || [];
          setPermissions(userPermissions);
          console.log("AuthContext: Permissions récupérées:", userPermissions);
          
          // Extraire les groupes de l'utilisateur à partir des permissions
          const groups = [];
          if (userPermissions.includes('core.add_customuser') && 
              userPermissions.includes('core.change_customuser') && 
              userPermissions.includes('core.delete_customuser')) {
            groups.push('administrateur');
          }
          if (userPermissions.includes('core.add_script') && 
              userPermissions.includes('core.change_script')) {
            groups.push('developpeur');
          }
          if (userPermissions.includes('core.add_executiontest') && 
              userPermissions.includes('core.change_executiontest')) {
            groups.push('qa');
          }
          if (userPermissions.includes('core.view_dashboard') && 
              userPermissions.includes('core.view_vueglobale')) {
            groups.push('manager');
          }
          if (userPermissions.includes('core.add_projet') && 
              userPermissions.includes('core.change_projet')) {
            groups.push('chef_projet');
          }
          setUserGroups(groups);
          console.log("AuthContext: Groupes extraits:", groups);
          
          // Récupérer le projet sélectionné depuis localStorage
          const savedProjectId = localStorage.getItem('selectedProjectId');
          if (savedProjectId) {
            setSelectedProjectId(parseInt(savedProjectId));
          }
          
          console.log("AuthContext: Utilisateur authentifié et permissions chargées avec succès");
        } catch (err) {
          console.error('AuthContext: Erreur d\'authentification', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('selectedProjectId');
          setUser(null);
          setPermissions([]);
          setUserGroups([]);
          setIsAuthenticated(false);
        } finally {
          // MARQUEUR IMPORTANT : Ne mettre loading à false qu'à la fin
          setLoading(false);
          console.log("AuthContext: Chargement terminé");
        }
      } else {
        // Pas de token, pas besoin de charger les permissions
        console.log("AuthContext: Aucun token trouvé");
        setLoading(false);
      }
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
      const userPermissions = permissionsResponse.data.permissions || [];
      setPermissions(userPermissions);
      
      // Mettre à jour les groupes
      const groups = [];
      if (userPermissions.includes('core.add_customuser') && 
          userPermissions.includes('core.change_customuser') && 
          userPermissions.includes('core.delete_customuser')) {
        groups.push('administrateur');
      }
      if (userPermissions.includes('core.add_script') && 
          userPermissions.includes('core.change_script')) {
        groups.push('developpeur');
      }
      if (userPermissions.includes('core.add_executiontest') && 
          userPermissions.includes('core.change_executiontest')) {
        groups.push('qa');
      }
      if (userPermissions.includes('core.view_dashboard') && 
          userPermissions.includes('core.view_vueglobale')) {
        groups.push('manager');
      }
      if (userPermissions.includes('core.add_projet') && 
          userPermissions.includes('core.change_projet')) {
        groups.push('chef_projet');
      }
      setUserGroups(groups);
      console.log("AuthContext: Permissions rafraîchies:", userPermissions);
    } catch (err) {
      console.error('AuthContext: Erreur lors du rafraîchissement des permissions', err);
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
    const hasAccess = hasPermission('core.view_dashboard') || hasRole('administrateur') || hasRole('qa') || hasRole('manager') || hasRole('chef_projet');
    console.log(`AuthContext: canViewDashboard() = ${hasAccess}`);
    return hasAccess;
  };

  const canViewVueGlobale = () => {
    const hasAccess = hasPermission('core.view_vueglobale') || hasRole('administrateur') || hasRole('manager');
    console.log(`AuthContext: canViewVueGlobale() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageSocietes = () => {
    const hasAccess = hasPermission('core.view_societe') || hasRole('administrateur');
    console.log(`AuthContext: canManageSocietes() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageSecteursActivite = () => {
    const hasAccess = hasPermission('core.view_secteuractivite') || hasRole('administrateur');
    console.log(`AuthContext: canManageSecteursActivite() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageProjets = () => {
    const hasAccess = hasAnyPermission(['core.view_projet', 'core.add_projet', 'core.change_projet']) || hasRole('administrateur') || hasRole('chef_projet') || hasRole('manager');
    console.log(`AuthContext: canManageProjets() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageConfiguration = () => {
    const hasAccess = hasPermission('core.view_configuration') || hasRole('administrateur');
    console.log(`AuthContext: canManageConfiguration() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageEmailNotifications = () => {
    const hasAccess = hasPermission('core.view_emailnotification') || hasRole('administrateur');
    console.log(`AuthContext: canManageEmailNotifications() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageUsers = () => {
    const hasAccess = hasPermission('core.view_customuser') || hasRole('administrateur');
    console.log(`AuthContext: canManageUsers() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageGroups = () => {
    const hasAccess = hasPermission('core.view_groupepersonnalise') || hasRole('administrateur');
    console.log(`AuthContext: canManageGroups() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageAxes = () => {
    const hasAccess = hasPermission('core.view_axe') || hasRole('administrateur');
    console.log(`AuthContext: canManageAxes() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageSousAxes = () => {
    const hasAccess = hasPermission('core.view_sousaxe') || hasRole('administrateur');
    console.log(`AuthContext: canManageSousAxes() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageScripts = () => {
    const hasAccess = hasAnyPermission(['core.view_script', 'core.add_script', 'core.change_script']) || hasRole('administrateur') || hasRole('qa') || hasRole('developpeur') || hasRole('chef_projet');
    console.log(`AuthContext: canManageScripts() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageConfigurationTests = () => {
    const hasAccess = hasAnyPermission(['core.view_configurationtest', 'core.add_configurationtest', 'core.change_configurationtest']) || hasRole('administrateur') || hasRole('qa');
    console.log(`AuthContext: canManageConfigurationTests() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageExecutionTests = () => {
    const hasAccess = hasAnyPermission(['core.view_executiontest', 'core.add_executiontest', 'core.change_executiontest']) || hasRole('administrateur') || hasRole('qa');
    console.log(`AuthContext: canManageExecutionTests() = ${hasAccess}`);
    return hasAccess;
  };

  const canManageExecutionResults = () => {
    const hasAccess = hasPermission('core.view_executionresult') || hasRole('administrateur') || hasRole('qa') || hasRole('developpeur') || hasRole('manager') || hasRole('chef_projet');
    console.log(`AuthContext: canManageExecutionResults() = ${hasAccess}`);
    return hasAccess;
  };

  // Fonctions pour vérifier l'accès admin (pour la compatibilité)
  const hasAdminAccess = () => {
    return hasRole('administrateur') || user?.is_superuser;
  };

  const hasSuperAdminAccess = () => {
    return user?.is_superuser;
  };

  // MODIFIÉ : Loading spinner pendant la vérification
  // On affiche le spinner tant que l'authentification est en cours de chargement
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