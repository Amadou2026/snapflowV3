import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import FiltreVueGlobale from './FiltreVueGlobale';
import { AuthContext } from '../../context/AuthContext'; // Ajout de l'import du contexte
import api from '../../services/api';
import { toast } from 'react-toastify';

const VueGlobale = ({ user, logout }) => {
    // Ajout du contexte pour accéder aux fonctions de permission
    const { hasSuperAdminAccess } = useContext(AuthContext);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        projet_id: '',
        societe_id: '',
        periodicite: ''
    });

    // États pour les données brutes
    const [societes, setSocietes] = useState([]);
    const [projets, setProjets] = useState([]);
    const [configurations, setConfigurations] = useState([]);
    const [users, setUsers] = useState([]);
    const [scriptsProblemes, setScriptsProblemes] = useState([]);

    // État pour gérer l'expansion des sociétés
    const [expandedSocietes, setExpandedSocietes] = useState([]);

    // État pour les statistiques calculées
    const [globalStats, setGlobalStats] = useState({
        societes: 0,
        projets: 0,
        batteries: 0,
        utilisateurs: 0,
        scripts_actifs: 0,
        scripts_inactifs: 0,
        scripts_problemes: []
    });

    // Fonction pour basculer l'expansion d'une société
    const toggleSocieteExpansion = (societeId) => {
        setExpandedSocietes(prev => 
            prev.includes(societeId) 
                ? prev.filter(id => id !== societeId)
                : [...prev, societeId]
        );
    };

    // Fonction pour récupérer les scripts avec problèmes
    const fetchScriptsProblemes = async () => {
        try {
            console.log('🔍 Récupération des scripts avec problèmes...');
            
            // Appel à l'API pour détecter les problèmes
            await api.get('/stats/detecter-scripts-problemes/');
            
            // Récupération des problèmes existants
            const response = await api.get('/stats/scripts-problemes/');
            console.log('📊 Scripts avec problèmes:', response.data);
            
            setScriptsProblemes(response.data);
            setGlobalStats(prev => ({ ...prev, scripts_problemes: response.data }));
            
        } catch (error) {
            console.error('Erreur lors du chargement des scripts avec problèmes:', error);
            toast.error('Erreur lors du chargement des scripts avec problèmes');
        }
    };

    // Fonction principale pour récupérer toutes les données du dashboard
    const fetchDashboardData = async () => {
        try {
            console.log('🚀 Récupération des données du dashboard...');
            
            const [societesRes, projetsRes, configsRes, usersRes] = await Promise.all([
                api.get('societe/'),
                api.get('projets/'),
                api.get('configuration-tests/'),
                api.get('users/')
            ]);

            console.log('📊 Données récupérées:', {
                societes: societesRes.data.length,
                projets: projetsRes.data.length,
                configurations: configsRes.data.length,
                users: usersRes.data.length
            });

            // Mettre à jour les états avec les données brutes
            setSocietes(societesRes.data);
            setProjets(projetsRes.data);
            setConfigurations(configsRes.data);
            setUsers(usersRes.data);

            // Calculer les statistiques globales
            const calculatedStats = {
                societes: societesRes.data.length,
                projets: projetsRes.data.length,
                batteries: configsRes.data.length,
                utilisateurs: usersRes.data.length,
                scripts_actifs: configsRes.data.filter(c => c.is_active).length,
                scripts_inactifs: configsRes.data.filter(c => !c.is_active).length,
                scripts_problemes: [] // Sera rempli par fetchScriptsProblemes
            };

            setGlobalStats(calculatedStats);
            console.log('✅ Statistiques calculées:', calculatedStats);

            // Récupérer les scripts avec problèmes
            await fetchScriptsProblemes();

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            toast.error('Erreur lors du chargement des données du dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Fonctions de formatage
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Fonction pour obtenir le badge de type de problème
    const getProblemeBadge = (typeProbleme) => {
        const types = {
            'timeout': { class: 'bg-warning text-dark', icon: 'ti ti-clock' },
            'configuration_invalide': { class: 'bg-danger', icon: 'ti ti-alert-triangle' },
            'element_non_trouve': { class: 'bg-info', icon: 'ti ti-search-off' },
            'erreur_reseau': { class: 'bg-secondary', icon: 'ti ti-wifi-off' },
            'resource_non_disponible': { class: 'bg-dark', icon: 'ti ti-server-off' },
            'echecs_repetes': { class: 'bg-danger', icon: 'ti ti-alert-triangle' },
            'autre': { class: 'bg-light-secondary', icon: 'ti ti-help' }
        };
        
        const config = types[typeProbleme] || { class: 'bg-light-secondary', icon: 'ti ti-help' };
        
        return (
            <span className={`badge ${config.class}`}>
                <i className={`${config.icon} me-1`}></i>
                {typeProbleme.replace('_', ' ')}
            </span>
        );
    };

    // Fonction pour obtenir le badge de statut
    const getStatutBadge = (statut) => {
        const statuts = {
            'critique': { class: 'bg-danger', icon: 'ti ti-alert-triangle-filled' },
            'en_attente_resolution': { class: 'bg-warning text-dark', icon: 'ti ti-clock' },
            'surveillé': { class: 'bg-info', icon: 'ti ti-eye' },
            'résolu': { class: 'bg-success', icon: 'ti ti-check' }
        };
        
        const config = statuts[statut] || { class: 'bg-secondary', icon: 'ti ti-help' };
        
        return (
            <span className={`badge ${config.class}`}>
                <i className={`${config.icon} me-1`}></i>
                {statut.replace('_', ' ')}
            </span>
        );
    };

    // MODIFIÉ: Composant pour les cartes de statistiques globales
    // La carte des sociétés n'est affichée que pour les super-administrateurs
    const GlobalStatsCards = () => (
        <div className="row mb-4">
            {/* Carte des sociétés - visible uniquement pour les super-administrateurs */}
            {hasSuperAdminAccess() && (
                <div className="col-xl-3 col-md-6">
                    <div className="card stats-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h4 className="mb-0">{globalStats.societes}</h4>
                                    <p className="text-muted mb-0">Sociétés</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="avatar-sm rounded-circle bg-primary bg-opacity-10">
                                        <i className="ti ti-building text-primary font-24"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Carte des projets - ajustement de la classe pour s'adapter à l'affichage conditionnel */}
            <div className={hasSuperAdminAccess() ? "col-xl-3 col-md-6" : "col-xl-4 col-md-6"}>
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{globalStats.projets}</h4>
                                <p className="text-muted mb-0">Projets</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-info bg-opacity-10">
                                    <i className="ti ti-folder text-info font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Carte des batteries - ajustement de la classe pour s'adapter à l'affichage conditionnel */}
            <div className={hasSuperAdminAccess() ? "col-xl-3 col-md-6" : "col-xl-4 col-md-6"}>
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{globalStats.batteries}</h4>
                                <p className="text-muted mb-0">Batteries de test</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-success bg-opacity-10">
                                    <i className="ti ti-battery text-success font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Carte des utilisateurs - ajustement de la classe pour s'adapter à l'affichage conditionnel */}
            <div className={hasSuperAdminAccess() ? "col-xl-3 col-md-6" : "col-xl-4 col-md-6"}>
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{globalStats.utilisateurs}</h4>
                                <p className="text-muted mb-0">Utilisateurs</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-warning bg-opacity-10">
                                    <i className="ti ti-users text-warning font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Composant pour les statistiques des batteries
    const BatteriesStatsCards = () => (
        <div className="row mb-4">
            <div className="col-xl-6 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{globalStats.scripts_actifs}</h4>
                                <p className="text-muted mb-0">Batteries actives</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-success bg-opacity-10">
                                    <i className="ti ti-player-play text-success font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-6 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{globalStats.scripts_inactifs}</h4>
                                <p className="text-muted mb-0">Batteries inactives</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-secondary bg-opacity-10">
                                    <i className="ti ti-player-pause text-secondary font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // MODIFIÉ: Composant pour le tableau des sociétés avec liste des employés
    // Visible uniquement pour les super-administrateurs
    const SocietesTable = () => {
        // Si l'utilisateur n'est pas un super-admin, ne rien afficher
        if (!hasSuperAdminAccess()) {
            return null;
        }
        
        return (
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="ti ti-building me-2"></i>
                                Liste des sociétés
                            </h5>
                            <span className="badge bg-primary">
                                {societes.length} société(s)
                            </span>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Secteur d'activité</th>
                                            <th>Admin</th>
                                            <th>Nb. Projets</th>
                                            <th>Nb. Utilisateurs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {societes.map((societe) => (
                                            <React.Fragment key={societe.id}>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <i className="ti ti-building text-primary me-2"></i>
                                                            <strong>{societe.nom}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light-info">
                                                            {societe.secteur_activite || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {societe.admin ? (
                                                            <div>
                                                                <strong>{societe.admin.full_name}</strong>
                                                                <br />
                                                                <small className="text-muted">{societe.admin.email}</small>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Non défini</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light-primary">
                                                            {societe.projets?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-link-primary d-flex align-items-center"
                                                            onClick={() => toggleSocieteExpansion(societe.id)}
                                                            title={expandedSocietes.includes(societe.id) ? "Masquer les utilisateurs" : "Voir les utilisateurs"}
                                                        >
                                                            <i className={`ti ti-chevron-${expandedSocietes.includes(societe.id) ? 'up' : 'down'} me-1`}></i>
                                                            <span className="badge bg-light-success">
                                                                {societe.employes?.length || 0}
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Ligne d'expansion pour afficher les employés */}
                                                {expandedSocietes.includes(societe.id) && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0">
                                                            <div className="bg-light p-3 border-start border-4 border-primary">
                                                                <h6 className="mb-3 text-primary">
                                                                    <i className="ti ti-users me-2"></i>
                                                                    Liste des utilisateurs ({societe.employes?.length || 0})
                                                                </h6>
                                                                {societe.employes && societe.employes.length > 0 ? (
                                                                    <div className="row">
                                                                        {societe.employes.map((employe) => (
                                                                            <div key={employe.id} className="col-md-6 col-lg-4 mb-3">
                                                                                <div className="card border-0 bg-white shadow-sm">
                                                                                    <div className="card-body p-3">
                                                                                        <div className="d-flex align-items-center">
                                                                                            <div className="avatar-sm rounded-circle bg-primary bg-opacity-10 me-3">
                                                                                                <i className="ti ti-user text-primary"></i>
                                                                                            </div>
                                                                                            <div className="flex-grow-1">
                                                                                                <h6 className="mb-1">{employe.full_name}</h6>
                                                                                                <small className="text-muted d-block">{employe.email}</small>
                                                                                                <small className="text-muted">ID: {employe.id}</small>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center text-muted py-3">
                                                                        <i className="ti ti-user-off me-2"></i>
                                                                        Aucun employé trouvé pour cette société
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Composant pour le tableau des projets
    const ProjetsTable = () => (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="ti ti-folder me-2"></i>
                            Liste des projets
                        </h5>
                        <span className="badge bg-info">
                            {projets.length} projet(s)
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Charge de compte</th>
                                        <th>Sociétés</th>
                                        <th>URL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projets.map((projet) => (
                                        <tr key={projet.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {projet.logo && (
                                                        <img 
                                                            src={projet.logo} 
                                                            alt={projet.nom}
                                                            style={{ width: '30px', height: '30px', marginRight: '10px', borderRadius: '100px',  }}
                                                        />
                                                    )}
                                                    <strong>{projet.nom}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                {projet.charge_de_compte_nom ? (
                                                    <div>
                                                        <strong>{projet.charge_de_compte_nom}</strong>
                                                        <br />
                                                        <small className="text-muted">{projet.charge_de_compte_email}</small>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Non défini</span>
                                                )}
                                            </td>
                                            <td>
                                                <div>
                                                    {projet.societes?.map((societe) => (
                                                        <span key={societe.id} className="badge bg-light-primary me-1">
                                                            {societe.nom}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <a href={projet.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                                                    <i className="ti ti-external-link me-1"></i>
                                                    Voir le site
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Composant pour le tableau des batteries de test
    const ConfigurationsTable = () => (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="ti ti-battery me-2"></i>
                            Batteries de test
                        </h5>
                        <span className="badge bg-success">
                            {configurations.length} batterie(s)
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Société</th>
                                        <th>Projet</th>
                                        <th>Périodicité</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configurations.map((config) => (
                                        <tr key={config.id}>
                                            <td>
                                                <strong>{config.nom}</strong>
                                            </td>
                                            <td>
                                                <span className="badge bg-light-primary">
                                                    {config.societe?.nom || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-light-info">
                                                    {config.projet?.nom || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-light-secondary">
                                                    {config.periodicite || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${config.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                    {config.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // NOUVEAU COMPOSANT: Tableau des scripts avec problèmes
    const ScriptsProblemesTable = () => (
        <div className="row mb-4">
            <div className="col-12">
                <div className="card border-danger">
                    <div className="card-header d-flex justify-content-between align-items-center bg-light-danger">
                        <h5 className="mb-0 text-danger">
                            <i className="ti ti-alert-triangle me-2"></i>
                            Scripts présentant des problèmes d'exécution
                        </h5>
                        <span className="badge bg-danger">
                            {scriptsProblemes.length} script(s)
                        </span>
                    </div>
                    <div className="card-body">
                        {scriptsProblemes.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Script</th>
                                            <th>Projet/Société</th>
                                            <th>Type de problème</th>
                                            <th>Description</th>
                                            <th>Fréquence</th>
                                            <th>Dernière exécution</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scriptsProblemes.map((script) => (
                                            <tr key={script.id} className="border-start border-3 border-warning">
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <i className="ti ti-alert-triangle text-warning me-2"></i>
                                                        <div>
                                                            <strong>{script.nom}</strong>
                                                            <br />
                                                            <small className="text-muted">ID: {script.id}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{script.projet?.nom || 'N/A'}</strong>
                                                        <br />
                                                        <small className="text-muted">{script.societe?.nom || 'N/A'}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {getProblemeBadge(script.type_probleme)}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {script.description}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light-warning text-dark">
                                                        {script.frequence_probleme}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(script.derniere_execution)}
                                                    </small>
                                                </td>
                                                <td>
                                                    {getStatutBadge(script.statut)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <i className="ti ti-check text-success mb-3" style={{ fontSize: '48px' }}></i>
                                <h6 className="text-muted">Aucun script avec problème détecté</h6>
                                <p className="text-muted mb-0">
                                    Tous les scripts fonctionnent correctement.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-3 text-muted">Chargement des données du dashboard...</p>
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
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Accueil</Link>
                                                </li>
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Dashboard</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    Vue Globale
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h2 className="mb-0">Vue Globale</h2>
                                                    <p className="text-muted mb-0">
                                                        Vue d'ensemble de l'ensemble du système
                                                    </p>
                                                </div>
                                                {/* <button 
                                                    className="btn btn-outline-primary"
                                                    onClick={handleRefresh}
                                                    disabled={refreshing}
                                                >
                                                    <i className={`ti ti-refresh ${refreshing ? 'spin' : ''} me-1`}></i>
                                                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                                                </button> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Filtres */}
                            {/* <FiltreVueGlobale
                                onFilterChange={handleFilterChange}
                                user={user}
                            /> */}
                            
                            {/* Cartes de statistiques globales */}
                            <GlobalStatsCards />

                            {/* Cartes de statistiques des batteries */}
                            <BatteriesStatsCards />

                            {/* Tableaux des données */}
                            <SocietesTable />
                            <ProjetsTable />
                            <ConfigurationsTable />

                            {/* NOUVEAU: Tableau des scripts avec problèmes */}
                            <ScriptsProblemesTable />

                        </div>
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default VueGlobale;