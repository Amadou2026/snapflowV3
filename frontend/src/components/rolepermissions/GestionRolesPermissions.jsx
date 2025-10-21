import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import api from '../../services/api';

// --- DÉBUT DES STRUCTURES DE DONNÉES POUR LA CATÉGORISATION (MISE À JOUR) ---

// Objet pour mapper les codes de permissions (sans préfixe) à des libellés lisibles
const PERMISSION_LABELS = {
    // Société
    'add_societe': 'Ajouter une société',
    'view_societe': 'Voir les sociétés',
    'change_societe': 'Modifier une société',
    'delete_societe': 'Supprimer une société',
    // Secteur d'activité
    'add_secteuractivite': 'Ajouter un secteur d\'activité',
    'view_secteuractivite': 'Voir les secteurs d\'activité',
    'change_secteuractivite': 'Modifier un secteur d\'activité',
    'delete_secteuractivite': 'Supprimer un secteur d\'activité',
    // Projet
    'add_projet': 'Ajouter un projet',
    'view_projet': 'Voir les projets',
    'change_projet': 'Modifier un projet',
    'delete_projet': 'Supprimer un projet',
    // Script
    'add_script': 'Ajouter un script',
    'view_script': 'Voir les scripts',
    'change_script': 'Modifier un script',
    'delete_script': 'Supprimer un script',
    // Exécution de test
    'add_executiontest': 'Ajouter une exécution de test',
    'view_executiontest': 'Voir les exécutions de test',
    'change_executiontest': 'Modifier une exécution de test',
    'delete_executiontest': 'Supprimer une exécution de test',
    // Résultat d'exécution
    'add_executionresult': 'Ajouter un résultat d\'exécution',
    'view_executionresult': 'Voir les résultats d\'exécution',
    'change_executionresult': 'Modifier un résultat d\'exécution',
    'delete_executionresult': 'Supprimer un résultat d\'exécution',
    // Configuration
    'add_configuration': 'Ajouter une configuration',
    'view_configuration': 'Voir les configurations',
    'change_configuration': 'Modifier une configuration',
    'delete_configuration': 'Supprimer une configuration',
    // Configuration de test
    'add_configurationtest': 'Ajouter une configuration de test',
    'can_view_configurationtest': 'Voir les configurations de test',
    'change_configurationtest': 'Modifier une configuration de test',
    'delete_configurationtest': 'Supprimer une configuration de test',
    'change_societe_configurationtest': 'Modifier la config. de test par société',
    'delete_societe_configurationtest': 'Supprimer la config. de test par société',
    'view_societe_configurationtest': 'Voir la config. de test par société',
    // Axe et Sous-Axe
    'add_axe': 'Ajouter un axe',
    'view_axe': 'Voir les axes',
    'change_axe': 'Modifier un axe',
    'delete_axe': 'Supprimer un axe',
    'add_sousaxe': 'Ajouter un sous-axe',
    'view_sousaxe': 'Voir les sous-axes',
    'change_sousaxe': 'Modifier un sous-axe',
    'delete_sousaxe': 'Supprimer un sous-axe',
    // Problème de script
    'add_problemescript': 'Ajouter un problème de script',
    'view_problemescript': 'Voir les problèmes de script',
    'change_problemescript': 'Modifier un problème de script',
    'delete_problemescript': 'Supprimer un problème de script',
    // Utilisateurs
    'add_customuser': 'Ajouter un utilisateur',
    'view_customuser': 'Voir les utilisateurs',
    'change_customuser': 'Modifier un utilisateur',
    'delete_customuser': 'Supprimer un utilisateur',
    // Groupes personnalisés
    'add_groupepersonnalise': 'Ajouter un groupe',
    'view_groupepersonnalise': 'Voir les groupes',
    'change_groupepersonnalise': 'Modifier un groupe',
    'delete_groupepersonnalise': 'Supprimer un groupe',
    // Dashboard
    'add_dashboard': 'Ajouter un dashboard',
    'view_dashboard': 'Voir les dashboards',
    'change_dashboard': 'Modifier un dashboard',
    'delete_dashboard': 'Supprimer un dashboard',
    // Vue globale
    'add_vueglobale': 'Ajouter une vue globale',
    'view_vueglobale': 'Voir les vues globales',
    'change_vueglobale': 'Modifier une vue globale',
    'delete_vueglobale': 'Supprimer une vue globale',
    // Notifications email
    'add_emailnotification': 'Ajouter une notification email',
    'view_emailnotification': 'Voir les notifications email',
    'change_emailnotification': 'Modifier une notification email',
    'delete_emailnotification': 'Supprimer une notification email',
    // Projets Redmine
    'add_redmineproject': 'Ajouter un projet Redmine',
    'view_redmineproject': 'Voir les projets Redmine',
    'change_redmineproject': 'Modifier un projet Redmine',
    'delete_redmineproject': 'Supprimer un projet Redmine',
    
    // Permissions Django par défaut
    'add_group': 'Ajouter un groupe (Django)',
    'view_group': 'Voir les groupes (Django)',
    'change_group': 'Modifier un groupe (Django)',
    'delete_group': 'Supprimer un groupe (Django)',
    'add_permission': 'Ajouter une permission (Django)',
    'view_permission': 'Voir les permissions (Django)',
    'change_permission': 'Modifier une permission (Django)',
    'delete_permission': 'Supprimer une permission (Django)',
    'add_logentry': 'Ajouter un log d\'administration',
    'view_logentry': 'Voir les logs d\'administration',
    'change_logentry': 'Modifier un log d\'administration',
    'delete_logentry': 'Supprimer un log d\'administration',
    'add_contenttype': 'Ajouter un type de contenu',
    'view_contenttype': 'Voir les types de contenu',
    'change_contenttype': 'Modifier un type de contenu',
    'delete_contenttype': 'Supprimer un type de contenu',
    'add_session': 'Ajouter une session',
    'view_session': 'Voir les sessions',
    'change_session': 'Modifier une session',
    'delete_session': 'Supprimer une session',
};

// Objet pour regrouper les permissions par catégories fonctionnelles (clés sans préfixe)
const PERMISSION_CATEGORIES = {
    'Gestion des sociétés': [
        'add_societe', 'view_societe', 'change_societe', 'delete_societe'
    ],
    'Gestion des secteurs d\'activité': [
        'add_secteuractivite', 'view_secteuractivite', 'change_secteuractivite', 'delete_secteuractivite'
    ],
    'Gestion des projets': [
        'add_projet', 'view_projet', 'change_projet', 'delete_projet',
        'add_redmineproject', 'view_redmineproject', 'change_redmineproject', 'delete_redmineproject'
    ],
    'Gestion des scripts': [
        'add_script', 'view_script', 'change_script', 'delete_script',
        'add_problemescript', 'view_problemescript', 'change_problemescript', 'delete_problemescript'
    ],
    'Gestion des exécutions': [
        'add_executiontest', 'view_executiontest', 'change_executiontest', 'delete_executiontest',
        'add_executionresult', 'view_executionresult', 'change_executionresult', 'delete_executionresult'
    ],
    'Gestion des configurations': [
        'add_configuration', 'view_configuration', 'change_configuration', 'delete_configuration',
        'add_configurationtest', 'can_view_configurationtest', 'change_configurationtest', 'delete_configurationtest',
        'change_societe_configurationtest', 'delete_societe_configurationtest', 'view_societe_configurationtest'
    ],
    'Gestion des axes et sous-axes': [
        'add_axe', 'view_axe', 'change_axe', 'delete_axe',
        'add_sousaxe', 'view_sousaxe', 'change_sousaxe', 'delete_sousaxe'
    ],
    'Gestion des utilisateurs et groupes': [
        'add_customuser', 'view_customuser', 'change_customuser', 'delete_customuser',
        'add_groupepersonnalise', 'view_groupepersonnalise', 'change_groupepersonnalise', 'delete_groupepersonnalise',
        'add_group', 'view_group', 'change_group', 'delete_group',
        'add_permission', 'view_permission', 'change_permission', 'delete_permission'
    ],
    'Tableaux de bord et Vues': [
        'add_dashboard', 'view_dashboard', 'change_dashboard', 'delete_dashboard',
        'add_vueglobale', 'view_vueglobale', 'change_vueglobale', 'delete_vueglobale'
    ],
    'Notifications': [
        'add_emailnotification', 'view_emailnotification', 'change_emailnotification', 'delete_emailnotification'
    ],
    'Administration système': [
        'add_logentry', 'view_logentry', 'change_logentry', 'delete_logentry',
        'add_contenttype', 'view_contenttype', 'change_contenttype', 'delete_contenttype',
        'add_session', 'view_session', 'change_session', 'delete_session'
    ]
};

// --- FIN DES STRUCTURES DE DONNÉES ---


const GestionRolesPermissions = ({ user, logout }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [userPermissions, setUserPermissions] = useState([]); // Contient les codes complets 'app.codename'
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [userLoading, setUserLoading] = useState(false);

    // États pour la recherche
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUserProfile();
        fetchGroups();
        fetchPermissions();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchUserGroups(selectedUser.id);
            fetchUserPermissions(selectedUser.id);
        }
    }, [selectedUser]);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('user/profile/');
            setCurrentUserProfile(response.data);
            const allUsers = [];
            response.data.societe.forEach(societe => {
                societe.employes.forEach(employe => {
                    allUsers.push({
                        ...employe,
                        societeId: societe.id,
                        societeNom: societe.nom
                    });
                });
            });
            setUsers(allUsers);
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            toast.error('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await api.get('groupes/');
            setGroups(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des groupes:', error);
            toast.error('Erreur lors du chargement des groupes');
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('permissions/');
            setPermissions(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des permissions:', error);
            toast.error('Erreur lors du chargement des permissions');
        }
    };

    const fetchUserPermissions = async (userId) => {
        setUserLoading(true);
        try {
            const response = await api.get(`user/${userId}/permissions/`);
            setUserPermissions(response.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des permissions de l\'utilisateur:', error);
            toast.error('Erreur lors du chargement des permissions de l\'utilisateur');
            setUserPermissions([]);
        } finally {
            setUserLoading(false);
        }
    };

    const fetchUserGroups = async (userId) => {
        setUserLoading(true);
        try {
            const response = await api.get(`user/${userId}/groups/`);
            setUserGroups(response.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des groupes de l\'utilisateur:', error);
            toast.error('Erreur lors du chargement des groupes de l\'utilisateur');
            setUserGroups([]);
        } finally {
            setUserLoading(false);
        }
    };

    const handleUserSelect = (userId) => {
        const user = users.find(u => u.id === parseInt(userId));
        setSelectedUser(user);
    };

    const handleGroupToggle = (groupId) => {
        if (userGroups.includes(groupId)) {
            setUserGroups(userGroups.filter(id => id !== groupId));
        } else {
            setUserGroups([...userGroups, groupId]);
        }
    };

    // *** CORRECTION IMPORTANTE ICI ***
    // La fonction reçoit l'objet permission complet pour reconstruire le code
    const handlePermissionToggle = (permission) => {
        const fullCodename = `${permission.content_type__app_label}.${permission.codename}`;
        
        if (userPermissions.includes(fullCodename)) {
            setUserPermissions(userPermissions.filter(p => p !== fullCodename));
        } else {
            setUserPermissions([...userPermissions, fullCodename]);
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedUser) {
            toast.error('Veuillez sélectionner un utilisateur');
            return;
        }

        setSaving(true);
        try {
            await api.post(`user/${selectedUser.id}/groups/set/`, {
                groups: userGroups
            });

            await api.post(`user/${selectedUser.id}/permissions/set/`, {
                permissions: userPermissions
            });

            toast.success('Rôles et permissions mis à jour avec succès');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur lors de la mise à jour des rôles et permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // --- LOGIQUE DE FILTRAGE ET DE CATÉGORISATION CORRIGÉE ---

    // 1. Filtrer les permissions en fonction du terme de recherche (sur le code simple et le label)
    const filteredPermissions = permissions.filter(permission => {
        const label = PERMISSION_LABELS[permission.codename] || permission.codename;
        return (
            permission.codename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // 2. Créer une carte de recherche inverse pour une performance optimale (code simple -> catégorie)
    const permissionToCategoryMap = {};
    for (const category in PERMISSION_CATEGORIES) {
        PERMISSION_CATEGORIES[category].forEach(codename => {
            permissionToCategoryMap[codename] = category;
        });
    }

    // 3. Grouper les permissions filtrées par nos catégories personnalisées
    const categorizedPermissions = {};
    filteredPermissions.forEach(permission => {
        // Utiliser le codename simple pour la recherche de catégorie
        const category = permissionToCategoryMap[permission.codename] || "Autres permissions";
        
        if (!categorizedPermissions[category]) {
            categorizedPermissions[category] = [];
        }
        categorizedPermissions[category].push(permission);
    });

    // Trier les catégories par ordre alphabétique pour un affichage cohérent
    const sortedCategories = Object.keys(categorizedPermissions).sort();

    // Calculer les permissions héritées des groupes
    const getGroupPermissions = () => {
        const groupPermissions = [];
        groups.forEach(group => {
            if (userGroups.includes(group.id) && group.permissions) {
                groupPermissions.push(...group.permissions);
            }
        });
        return [...new Set(groupPermissions)];
    };

    const groupPermissions = getGroupPermissions();

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            <HeaderAdmin user={user} logout={logout} />
            <div className="main-container">
                <SidebarAdmin />
                <div className="page-wrapper">
                    <div className="pc-container">
                        <div className="pc-content">
                            {/* Breadcrumb */}
                            <div className="page-header">
                                <div className="page-block">
                                    <div className="row align-items-center">
                                        <div className="col-md-12">
                                            <ul className="breadcrumb">
                                                <li className="breadcrumb-item"><Link to="/dashboard">Accueil</Link></li>
                                                <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
                                                <li className="breadcrumb-item" aria-current="page">Gestion des rôles et permissions</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des rôles et permissions</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5 className="card-title">Sélectionner un utilisateur</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <select
                                                        className="form-select"
                                                        value={selectedUser ? selectedUser.id : ''}
                                                        onChange={(e) => handleUserSelect(e.target.value)}
                                                    >
                                                        <option value="">-- Sélectionner un utilisateur --</option>
                                                        {users.map(user => (
                                                            <option key={user.id} value={user.id}>
                                                                {user.full_name} ({user.email}) - {user.societeNom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedUser && (
                                <div className="row mt-4">
                                    <div className="col-sm-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="card-title">Gestion des rôles et permissions pour {selectedUser.full_name}</h5>
                                            </div>
                                            <div className="card-body">
                                                {userLoading ? (
                                                    <div className="text-center p-4">
                                                        <div className="spinner-border" role="status">
                                                            <span className="visually-hidden">Chargement...</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Section Rôles */}
                                                        <div className="mb-5">
                                                            <h5 className="card-title mb-3">Rôles</h5>
                                                            <div className="row">
                                                                {groups.map(group => (
                                                                    <div key={group.id} className="col-md-4 mb-3">
                                                                        <div className="form-check">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id={`group-${group.id}`}
                                                                                checked={userGroups.includes(group.id)}
                                                                                onChange={() => handleGroupToggle(group.id)}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`group-${group.id}`}>
                                                                                {group.nom} {group.role_display && `(${group.role_display})`}
                                                                            </label>
                                                                        </div>
                                                                        {group.description && (
                                                                            <small className="text-muted d-block ms-4">{group.description}</small>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Section Permissions */}
                                                        <div>
                                                            <h5 className="card-title mb-3">Permissions</h5>
                                                            
                                                            {groupPermissions.length > 0 && (
                                                                <div className="alert alert-info mb-3">
                                                                    <i className="ti ti-info-circle me-2"></i>
                                                                    Cet utilisateur hérite de {groupPermissions.length} permission(s) de ses rôles.
                                                                </div>
                                                            )}

                                                            {/* Barre de recherche */}
                                                            <div className="row mb-3">
                                                                <div className="col-md-6">
                                                                    <div className="input-group">
                                                                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            placeholder="Rechercher une permission..."
                                                                            value={searchTerm}
                                                                            onChange={handleSearchChange}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Liste des permissions catégorisées */}
                                                            {sortedCategories.map(category => (
                                                                <div key={category} className="mb-4">
                                                                    <h6 className="border-bottom pb-2 mb-3">{category}</h6>
                                                                    <div className="row">
                                                                        {categorizedPermissions[category].map(permission => {
                                                                            const fullCodename = `${permission.content_type__app_label}.${permission.codename}`;
                                                                            const isInherited = groupPermissions.includes(fullCodename);
                                                                            const isDirectlyAssigned = userPermissions.includes(fullCodename);
                                                                            const isChecked = isInherited || isDirectlyAssigned;
                                                                            const label = PERMISSION_LABELS[permission.codename] || fullCodename;
                                                                            
                                                                            return (
                                                                                <div key={permission.id} className="col-md-4 mb-2">
                                                                                    <div className="form-check">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="checkbox"
                                                                                            id={`permission-${permission.id}`}
                                                                                            checked={isChecked}
                                                                                            // *** CORRECTION IMPORTANTE ICI ***
                                                                                            // On passe l'objet permission complet à la fonction
                                                                                            onChange={() => handlePermissionToggle(permission)}
                                                                                        />
                                                                                        <label 
                                                                                            className={`form-check-label ${isInherited ? 'text-primary' : ''}`} 
                                                                                            htmlFor={`permission-${permission.id}`}
                                                                                        >
                                                                                            {label}
                                                                                            {isInherited && !isDirectlyAssigned && (
                                                                                                <span className="badge bg-light text-primary ms-2">Héritée</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="row mt-4">
                                                            <div className="col-sm-12 text-end">
                                                                <button
                                                                    className="btn btn-primary"
                                                                    onClick={handleSaveChanges}
                                                                    disabled={saving}
                                                                >
                                                                    {saving ? (
                                                                        <>
                                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                            Enregistrement...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="ti ti-device-floppy me-2"></i>
                                                                            Enregistrer les modifications
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />
        </div>
    );
};

export default GestionRolesPermissions;