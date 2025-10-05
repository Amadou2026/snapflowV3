import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import FiltreVueGlobale from './FiltreVueGlobale';
import api from '../../services/api';

const VueGlobale = ({ user, logout }) => {
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        projet_id: '',
        societe_id: '',
        periodicite: ''
    });
    const [configurationsData, setConfigurationsData] = useState({
        configurations: [],
        stats: {},
        filters_applied: {}
    });
    const [loadingConfigurations, setLoadingConfigurations] = useState(false);

    // Fonction pour récupérer les configurations actives
    const fetchConfigurationsActives = async () => {
        try {
            setLoadingConfigurations(true);
            const params = {};
            if (filters.projet_id) params.projet_id = filters.projet_id;
            if (filters.societe_id) params.societe_id = filters.societe_id;
            if (filters.periodicite) params.periodicite = filters.periodicite;
            
            const response = await api.get('/stats/configurations-actives/', { params });
            setConfigurationsData(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des configurations actives:', error);
            setConfigurationsData({
                configurations: [],
                stats: {},
                filters_applied: {}
            });
        } finally {
            setLoadingConfigurations(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigurationsActives();
    }, [filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Fonction pour formater la date
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

    // Fonction pour formater le temps restant
    const formatTimeUntil = (seconds) => {
        if (!seconds || seconds < 0) return 'Non planifié';
        if (seconds < 60) {
            return `${seconds} secondes`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days} jour${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`;
        }
    };

    // Fonction pour formater le retard
    const formatDelay = (seconds) => {
        if (!seconds || seconds <= 0) return '';
        if (seconds < 60) {
            return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days} jour${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`;
        }
    };

    // Fonction pour obtenir le badge de statut
    const getStatusBadge = (config) => {
        if (config.is_overdue) {
            return <span className="badge bg-danger">En retard</span>;
        } else if (config.next_execution) {
            const seconds = config.time_until_execution_seconds;
            if (seconds && seconds <= 3600) { // Moins d'1 heure
                return <span className="badge bg-warning text-dark">Bientôt</span>;
            }
            return <span className="badge bg-success">Planifié</span>;
        } else {
            return <span className="badge bg-secondary">Inactif</span>;
        }
    };

    // Fonction pour obtenir le badge de périodicité
    const getPeriodiciteBadge = (periodicite) => {
        const colors = {
            '2min': 'bg-info',
            '2h': 'bg-primary',
            '6h': 'bg-warning text-dark',
            '1j': 'bg-success',
            '1s': 'bg-secondary',
            '1m': 'bg-dark'
        };
        return <span className={`badge ${colors[periodicite] || 'bg-secondary'}`}>{periodicite}</span>;
    };

    // Fonction pour obtenir l'icône d'urgence
    const getUrgencyIcon = (config) => {
        if (config.is_overdue) {
            return <i className="ti ti-alert-triangle text-danger me-1"></i>;
        } else if (config.time_until_execution_seconds && config.time_until_execution_seconds <= 3600) {
            return <i className="ti ti-clock text-warning me-1"></i>;
        }
        return <i className="ti ti-clock text-success me-1"></i>;
    };

    // Cartes de statistiques
    const StatsCards = () => (
        <div className="row mb-4">
            <div className="col-xl-3 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{configurationsData.stats?.total_configurations || 0}</h4>
                                <p className="text-muted mb-0">Configurations actives</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-primary bg-opacity-10">
                                    <i className="ti ti-settings text-primary font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-3 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{configurationsData.stats?.configurations_en_retard || 0}</h4>
                                <p className="text-muted mb-0">En retard</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-danger bg-opacity-10">
                                    <i className="ti ti-alert-triangle text-danger font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-3 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">{configurationsData.stats?.prochaines_executions_24h || 0}</h4>
                                <p className="text-muted mb-0">Dans 24h</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-success bg-opacity-10">
                                    <i className="ti ti-clock text-success font-24"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-3 col-md-6">
                <div className="card stats-card">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h4 className="mb-0">
                                    {Object.keys(configurationsData.stats?.repartition_periodicite || {}).length}
                                </h4>
                                <p className="text-muted mb-0">Périodicités</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="avatar-sm rounded-circle bg-info bg-opacity-10">
                                    <i className="ti ti-chart-bar text-info font-24"></i>
                                </div>
                            </div>
                        </div>
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
                                <p className="mt-3 text-muted">Chargement des configurations...</p>
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
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Vue Globale</h2>
                                                <p className="text-muted mb-0">
                                                    Surveillance des configurations de test actives
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filtres */}
                            <FiltreVueGlobale 
                                onFilterChange={handleFilterChange}
                                user={user}
                            />

                            {/* Cartes de statistiques */}
                            <StatsCards />

                            {/* Section Configurations Actives */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="ti ti-settings me-2"></i>
                                                Configurations Actives
                                            </h5>
                                            <div className="d-flex align-items-center gap-2">
                                                {configurationsData.filters_applied && (
                                                    <div className="d-flex gap-1">
                                                        {configurationsData.filters_applied.projet_id && (
                                                            <span className="badge bg-light text-dark">
                                                                Projet: {configurationsData.filters_applied.projet_id}
                                                            </span>
                                                        )}
                                                        {configurationsData.filters_applied.societe_id && (
                                                            <span className="badge bg-light text-dark">
                                                                Société: {configurationsData.filters_applied.societe_id}
                                                            </span>
                                                        )}
                                                        {configurationsData.filters_applied.periodicite && (
                                                            <span className="badge bg-light text-dark">
                                                                Périodicité: {configurationsData.filters_applied.periodicite}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="badge bg-primary">
                                                    {configurationsData.configurations?.length || 0} configuration(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {loadingConfigurations ? (
                                                <div className="text-center p-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Chargement...</span>
                                                    </div>
                                                    <p className="mt-2 text-muted">Chargement des configurations actives...</p>
                                                </div>
                                            ) : configurationsData.configurations?.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Configuration</th>
                                                                <th>Projet/Société</th>
                                                                <th>Périodicité</th>
                                                                <th>Scripts</th>
                                                                <th>Dernière exécution</th>
                                                                <th>Prochaine exécution</th>
                                                                <th>Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {configurationsData.configurations.map((config) => (
                                                                <tr key={config.id} className={config.is_overdue ? 'table-warning' : ''}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="ti ti-script text-primary me-2"></i>
                                                                            <div>
                                                                                <strong>{config.nom}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    ID: {config.id} | 
                                                                                    {config.emails_count > 0 && (
                                                                                        <span className="ms-1">
                                                                                            <i className="ti ti-mail me-1"></i>
                                                                                            {config.emails_count} email(s)
                                                                                        </span>
                                                                                    )}
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{config.projet.nom}</strong>
                                                                            <br />
                                                                            <small className="text-muted">{config.societe.nom}</small>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {getPeriodiciteBadge(config.periodicite)}
                                                                        <br />
                                                                        <small className="text-muted">{config.periodicite_display}</small>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {config.scripts.slice(0, 2).map((script, idx) => (
                                                                                <span key={idx} className="badge bg-light text-dark">
                                                                                    {script.nom}
                                                                                </span>
                                                                            ))}
                                                                            {config.scripts.length > 2 && (
                                                                                <span className="badge bg-secondary">
                                                                                    +{config.scripts.length - 2}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {config.scripts.length} script(s)
                                                                        </small>
                                                                    </td>
                                                                    <td>
                                                                        <div className="text-nowrap">
                                                                            {formatDate(config.last_execution)}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="text-nowrap">
                                                                            {config.next_execution ? (
                                                                                <div>
                                                                                    <div className="d-flex align-items-center">
                                                                                        {getUrgencyIcon(config)}
                                                                                        {formatDate(config.next_execution)}
                                                                                    </div>
                                                                                    <small className="text-muted">
                                                                                        {formatTimeUntil(config.time_until_execution_seconds)}
                                                                                    </small>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted">Non planifié</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {getStatusBadge(config)}
                                                                        {config.is_overdue && config.delay_seconds > 0 && (
                                                                            <div>
                                                                                <small className="text-danger">
                                                                                    Retard: {formatDelay(config.delay_seconds)}
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <i className="ti ti-settings text-muted mb-3" style={{ fontSize: '48px' }}></i>
                                                    <h6 className="text-muted">Aucune configuration active trouvée</h6>
                                                    <p className="text-muted mb-0">
                                                        {Object.keys(filters).some(key => filters[key]) 
                                                            ? "Aucune configuration ne correspond aux filtres appliqués."
                                                            : "Les configurations actives apparaîtront ici lorsqu'elles seront créées et activées."
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {configurationsData.configurations?.length > 0 && (
                                            <div className="card-footer">
                                                <div className="row">
                                                    <div className="col-md-4">
                                                        <small className="text-muted">
                                                            <i className="ti ti-alert-triangle text-warning me-1"></i>
                                                            {configurationsData.stats?.configurations_en_retard || 0} configuration(s) en retard
                                                        </small>
                                                    </div>
                                                    <div className="col-md-4 text-center">
                                                        <small className="text-muted">
                                                            <i className="ti ti-clock text-success me-1"></i>
                                                            {configurationsData.stats?.prochaines_executions_24h || 0} exécution(s) dans 24h
                                                        </small>
                                                    </div>
                                                    <div className="col-md-4 text-end">
                                                        <small className="text-muted">
                                                            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default VueGlobale;