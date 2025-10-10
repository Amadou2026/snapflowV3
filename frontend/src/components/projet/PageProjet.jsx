import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import { AuthContext } from '../../context/AuthContext';

const PageProjet = ({ user, logout }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const { projetId } = useParams();
    const navigate = useNavigate();

    const [projet, setProjet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState('');

    useEffect(() => {
        if (isAuthenticated && projetId) {
            fetchProjetDetails();
        }
    }, [isAuthenticated, projetId]);

    const fetchProjetDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/projets/${projetId}/detail-complet/`);
            const projetData = response.data;
            
            setProjet(projetData);
            console.log('Détails complets du projet:', projetData);

        } catch (err) {
            console.error('Erreur lors du chargement des détails du projet:', err);
            setError('Erreur lors du chargement des détails du projet');

            if (err.response?.status === 403) {
                toast.error("Vous n'avez pas les permissions pour voir ce projet");
            } else if (err.response?.status === 404) {
                toast.error("Projet non trouvé");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non disponible';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Format invalide';
        }
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const parts = duration.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseInt(parts[2]);
            
            if (hours > 0) {
                return `${hours}h ${minutes}min ${seconds}s`;
            } else if (minutes > 0) {
                return `${minutes}min ${seconds}s`;
            } else {
                return `${seconds}s`;
            }
        }
        return duration;
    };

    const getStatutBadge = (statut) => {
        const statuts = {
            'done': { class: 'bg-success', icon: 'ti ti-check', label: 'Concluant' },
            'failed': { class: 'bg-danger', icon: 'ti ti-x', label: 'Échec' },
            'running': { class: 'bg-warning', icon: 'ti ti-loader', label: 'En cours' },
            'pending': { class: 'bg-info', icon: 'ti ti-clock', label: 'En attente' }
        };
        
        const config = statuts[statut] || { class: 'bg-secondary', icon: 'ti ti-help', label: statut };
        
        return (
            <span className={`badge ${config.class}`}>
                <i className={`${config.icon} me-1`}></i>
                {config.label}
            </span>
        );
    };

    const getPrioriteBadge = (priorite) => {
        const priorites = {
            1: { class: 'bg-info', label: 'Basse' },
            2: { class: 'bg-primary', label: 'Normale' },
            3: { class: 'bg-warning', label: 'Haute' },
            4: { class: 'bg-danger', label: 'Urgente' },
            5: { class: 'bg-dark', label: 'Immédiate' }
        };
        
        const config = priorites[priorite] || { class: 'bg-secondary', label: 'Inconnue' };
        
        return (
            <span className={`badge ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const viewLog = (logContent) => {
        setSelectedLog(logContent);
        setShowLogModal(true);
    };

    // NOUVEAU: Fonction pour extraire tous les scripts exécutés
    const getAllExecutedScripts = () => {
        if (!projet?.dernieres_executions) return [];
        
        const allScripts = [];
        projet.dernieres_executions.forEach(execution => {
            if (execution.scripts_executes) {
                execution.scripts_executes.forEach(script => {
                    allScripts.push({
                        ...script,
                        execution_id: execution.id,
                        execution_nom: execution.configuration_nom,
                        execution_date: execution.started_at,
                        execution_statut: execution.statut
                    });
                });
            }
        });
        
        return allScripts;
    };

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
                                <p className="mt-3 text-muted">Chargement des détails du projet...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="alert alert-danger" role="alert">
                                    <h4 className="alert-heading">Erreur</h4>
                                    <p className="mb-0">{error}</p>
                                    <button
                                        className="btn btn-outline-danger mt-3"
                                        onClick={() => navigate('/admin/core/projet/')}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Retour à la liste
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    // Extraire tous les scripts exécutés pour le nouveau bloc
    const allExecutedScripts = getAllExecutedScripts();

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
                                                    <Link to="/admin/core/projet/">Projets</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    {projet?.nom || 'Détails'}
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-2">
                                                    <i className="ti ti-folder me-2"></i>
                                                    Détails du Projet
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/admin/core/projet/')}
                                        >
                                            <i className="ti ti-arrow-left me-1"></i>
                                            Retour
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Informations générales du projet */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5 className="mb-0">
                                                <i className="ti ti-info-circle me-2"></i>
                                                Informations générales
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="d-flex align-items-center mb-3">
                                                        {projet?.logo && (
                                                            <img 
                                                                src={projet.logo} 
                                                                alt={projet.nom}
                                                                className="me-3"
                                                                style={{ width: '60px', height: '60px', borderRadius: '8px' }}
                                                            />
                                                        )}
                                                        <div>
                                                            <h4 className="mb-1">{projet?.nom}</h4>
                                                            {projet?.url && (
                                                                <p className="text-muted mb-0">
                                                                    <a href={projet.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                                        <i className="ti ti-link me-1"></i>
                                                                        {projet.url}
                                                                    </a>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {projet?.contrat && <p className="mb-0"><strong>Contrat:</strong> {projet.contrat}</p>}
                                                    {projet?.id_redmine && <p className="mb-0"><strong>ID Redmine:</strong> {projet.id_redmine}</p>}
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <h6 className="text-muted mb-2">Charge de compte</h6>
                                                        {projet?.charge_de_compte ? (
                                                            <div>
                                                                <strong>{projet.charge_de_compte.first_name} {projet.charge_de_compte.last_name}</strong>
                                                                <br />
                                                                <small className="text-muted">{projet.charge_de_compte.email}</small>
                                                                {projet.charge_de_compte.groupes && (
                                                                    <div className="mt-2">
                                                                        {projet.charge_de_compte.groupes.map((groupe) => (
                                                                            <span key={groupe.id} className="badge bg-light-primary me-1">
                                                                                {groupe.nom}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-muted">Non défini</span>}
                                                    </div>
                                                    {projet?.societes && projet.societes.length > 0 && (
                                                        <div className="mb-3">
                                                            <h6 className="text-muted mb-2">Société(s) associée(s)</h6>
                                                            {projet.societes.map((societe) => (
                                                                <span key={societe.id} className="badge bg-light-primary me-1">
                                                                    {societe.nom}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cartes de statistiques */}
                            <div className="row mb-4">
                                <div className="col-xl-3 col-md-6">
                                    <div className="card stats-card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1">
                                                    <h4 className="mb-0">{projet?.statistiques?.total_configurations || 0}</h4>
                                                    <p className="text-muted mb-0">Configurations de test</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <div className="avatar-sm rounded-circle bg-primary bg-opacity-10">
                                                        <i className="ti ti-battery text-primary font-24"></i>
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
                                                    <h4 className="mb-0">{projet?.statistiques?.configurations_actives || 0}</h4>
                                                    <p className="text-muted mb-0">Configurations actives</p>
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
                                <div className="col-xl-3 col-md-6">
                                    <div className="card stats-card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1">
                                                    <h4 className="mb-0">{projet?.statistiques?.total_scripts || 0}</h4>
                                                    <p className="text-muted mb-0">Scripts</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <div className="avatar-sm rounded-circle bg-info bg-opacity-10">
                                                        <i className="ti ti-code text-info font-24"></i>
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
                                                    <h4 className="mb-0">{projet?.statistiques?.taux_reussite || 0}%</h4>
                                                    <p className="text-muted mb-0">Taux de réussite</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <div className="avatar-sm rounded-circle bg-warning bg-opacity-10">
                                                        <i className="ti ti-chart-pie text-warning font-24"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOC: Configurations de test */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="ti ti-battery me-2"></i>
                                                Configurations de test
                                            </h5>
                                            <span className="badge bg-primary">
                                                {projet?.configurations_test?.length || 0} configuration(s)
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            {projet?.configurations_test && projet.configurations_test.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Nom</th>
                                                                <th>Société</th>
                                                                <th>Périodicité</th>
                                                                <th>Statut</th>
                                                                <th>Dernière exécution</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {projet.configurations_test.map((config) => (
                                                                <tr key={config.id}>
                                                                    <td><strong>{config.nom}</strong></td>
                                                                    <td><span className="badge bg-light-primary">{config.societe?.nom || 'N/A'}</span></td>
                                                                    <td><span className="badge bg-light-secondary">{config.periodicite || 'N/A'}</span></td>
                                                                    <td><span className={`badge ${config.is_active ? 'bg-success' : 'bg-secondary'}`}>{config.is_active ? 'Active' : 'Inactive'}</span></td>
                                                                    <td>
                                                                        {config.derniere_execution_info ? (
                                                                            <div>
                                                                                <small className="text-muted">{formatDate(config.derniere_execution_info.started_at)}</small>
                                                                                <br />
                                                                                <small className="text-muted">Durée: {formatDuration(config.derniere_execution_info.duree)}</small>
                                                                            </div>
                                                                        ) : <span className="text-muted">Jamais</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ti ti-battery-off text-muted mb-3" style={{ fontSize: '48px' }}></i>
                                                    <h6 className="text-muted">Aucune configuration de test trouvée</h6>
                                                    <p className="text-muted mb-0">Ce projet n'a pas encore de configuration de test.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOC: Scripts associés */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="ti ti-code me-2"></i>
                                                Scripts associés
                                            </h5>
                                            <span className="badge bg-success">
                                                {projet?.scripts?.length || 0} script(s)
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            {projet?.scripts_par_axe && Object.keys(projet.scripts_par_axe).length > 0 ? (
                                                <div>
                                                    {Object.entries(projet.scripts_par_axe).map(([axeNom, axeData]) => (
                                                        <div key={axeNom} className="mb-4">
                                                            <h5 className="mb-3"><i className="ti ti-folder me-2"></i>{axeNom}</h5>
                                                            {axeData.sous_axes && Object.entries(axeData.sous_axes).map(([sousAxeNom, sousAxeData]) => (
                                                                <div key={sousAxeNom} className="mb-3">
                                                                    <h6 className="mb-2 text-muted"><i className="ti ti-chevron-right me-1"></i>{sousAxeNom}</h6>
                                                                    {sousAxeData.scripts && sousAxeData.scripts.length > 0 ? (
                                                                        <div className="table-responsive">
                                                                            <table className="table table-sm table-hover">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Nom</th>
                                                                                        <th>Priorité</th>
                                                                                        <th>Exécutions</th>
                                                                                        <th>Taux de réussite</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {sousAxeData.scripts.map((script) => (
                                                                                        <tr key={script.id}>
                                                                                            <td><strong>{script.nom}</strong></td>
                                                                                            <td>{getPrioriteBadge(script.priorite_valeur)}</td>
                                                                                            <td><span className="badge bg-light-secondary">{script.total_executions || 0}</span></td>
                                                                                            <td><span className="badge bg-light-success">{script.taux_reussite || 0}%</span></td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ) : <p className="text-muted">Aucun script dans cette catégorie</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ti ti-code-off text-muted mb-3" style={{ fontSize: '48px' }}></i>
                                                    <h6 className="text-muted">Aucun script trouvé</h6>
                                                    <p className="text-muted mb-0">Ce projet n'a pas encore de script associé.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOC: Dernières exécutions */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="ti ti-player-play me-2"></i>
                                                Dernières exécutions
                                            </h5>
                                            <span className="badge bg-info">
                                                {projet?.dernieres_executions?.length || 0} exécution(s)
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            {projet?.dernieres_executions && projet.dernieres_executions.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Configuration</th>
                                                                <th>Statut</th>
                                                                <th>Date de début</th>
                                                                <th>Date de fin</th>
                                                                <th>Durée</th>
                                                                <th>Scripts exécutés</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {projet.dernieres_executions.map((execution) => (
                                                                <tr key={execution.id}>
                                                                    <td>
                                                                        <strong>{execution.configuration_nom}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{execution.societe_nom}</small>
                                                                    </td>
                                                                    <td>{getStatutBadge(execution.statut)}</td>
                                                                    <td><small className="text-muted">{formatDate(execution.started_at)}</small></td>
                                                                    <td><small className="text-muted">{formatDate(execution.ended_at)}</small></td>
                                                                    <td><span className="badge bg-light-secondary">{formatDuration(execution.duree)}</span></td>
                                                                    <td>
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {execution.scripts_executes?.map((script) => (
                                                                                <span key={script.script_id} className="badge bg-light-primary" title={script.nom}>
                                                                                    {script.statut === 'done' ? <i className="ti ti-check text-success"></i> : <i className="ti ti-x text-danger"></i>}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <button className="btn btn-sm btn-outline-info" onClick={() => viewLog(execution.rapport)}>
                                                                            <i className="ti ti-file-text"></i> Voir
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ti ti-player-skip text-muted mb-3" style={{ fontSize: '48px' }}></i>
                                                    <h6 className="text-muted">Aucune exécution de test trouvée</h6>
                                                    <p className="text-muted mb-0">Ce projet n'a pas encore d'exécution de test enregistrée.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NOUVEAU BLOC: Scripts exécutés du projet */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="ti ti-script me-2"></i>
                                                Scripts exécutés du projet
                                            </h5>
                                            <span className="badge bg-warning">
                                                {allExecutedScripts.length} script(s) exécuté(s)
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            {allExecutedScripts.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Nom du script</th>
                                                                <th>Statut</th>
                                                                <th>Configuration</th>
                                                                <th>Date d'exécution</th>
                                                                {/* <th>Commentaire</th> */}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {allExecutedScripts.map((script, index) => (
                                                                <tr key={`${script.script_id}-${index}`}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-sm rounded-circle bg-primary bg-opacity-10 me-2">
                                                                                <i className="ti ti-code text-primary"></i>
                                                                            </div>
                                                                            <strong>{script.script_nom}</strong>
                                                                        </div>
                                                                    </td>
                                                                    <td>{getStatutBadge(script.statut)}</td>
                                                                    <td>
                                                                        <span className="badge bg-light-primary">
                                                                            {script.execution_nom}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <small className="text-muted">
                                                                            {formatDate(script.execution_date)}
                                                                        </small>
                                                                    </td>
                                                                    {/* <td>
                                                                        <small className="text-muted">
                                                                            {script.commentaire || 'Aucun commentaire'}
                                                                        </small>
                                                                    </td> */}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ti ti-script-off text-muted mb-3" style={{ fontSize: '48px' }}></i>
                                                    <h6 className="text-muted">Aucun script exécuté trouvé</h6>
                                                    <p className="text-muted mb-0">Ce projet n'a pas encore de script exécuté.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOC: Statistiques détaillées */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5 className="mb-0">
                                                <i className="ti ti-chart-bar me-2"></i>
                                                Statistiques détaillées
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Statistiques générales</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="mb-3">
                                                                <div className="d-flex justify-content-between mb-1">
                                                                    <span>Configurations actives</span>
                                                                    <span>{projet?.statistiques?.configurations_actives || 0}</span>
                                                                </div>
                                                                <div className="progress" style={{ height: '8px' }}>
                                                                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${projet?.statistiques?.total_configurations > 0 ? (projet.statistiques.configurations_actives / projet.statistiques.total_configurations * 100) : 0}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="row text-center">
                                                                <div className="col-4">
                                                                    <h5 className="mb-0">{projet?.statistiques?.executions_reussies || 0}</h5>
                                                                    <small className="text-muted">Réussies</small>
                                                                </div>
                                                                <div className="col-4">
                                                                    <h5 className="mb-0">{projet?.statistiques?.executions_echecs || 0}</h5>
                                                                    <small className="text-muted">Échecs</small>
                                                                </div>
                                                                <div className="col-4">
                                                                    <h5 className="mb-0">{projet?.statistiques?.executions_en_cours || 0}</h5>
                                                                    <small className="text-muted">En cours</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Scripts par priorité</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            {projet?.scripts_statistiques?.par_priorite && (
                                                                <div>
                                                                    {Object.entries(projet.scripts_statistiques.par_priorite).map(([priorite, count]) => {
                                                                        const label = { 'basse': 'Basse', 'normale': 'Normale', 'haute': 'Haute', 'urgente': 'Urgente', 'immediate': 'Immédiate' }[priorite];
                                                                        const color = { 'basse': 'info', 'normale': 'primary', 'haute': 'warning', 'urgente': 'danger', 'immediate': 'dark' }[priorite];
                                                                        return (
                                                                            <div key={priorite} className="mb-2">
                                                                                <div className="d-flex justify-content-between mb-1">
                                                                                    <span>{label}</span>
                                                                                    <span>{count}</span>
                                                                                </div>
                                                                                <div className="progress" style={{ height: '8px' }}>
                                                                                    <div className={`progress-bar bg-${color}`} role="progressbar" style={{ width: `${projet.scripts_statistiques.total_scripts > 0 ? (count / projet.scripts_statistiques.total_scripts * 100) : 0}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-12">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Statistiques avancées</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="row text-center">
                                                                <div className="col-md-3">
                                                                    <h4 className="mb-1">{projet?.statistiques_avancees?.executions_30j || 0}</h4>
                                                                    <p className="text-muted mb-0">Exécutions (30j)</p>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <h4 className="mb-1">{projet?.statistiques_avancees?.taux_reussite_30j || 0}%</h4>
                                                                    <p className="text-muted mb-0">Taux de réussite (30j)</p>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <h4 className="mb-1">{projet?.statistiques_avancees?.duree_moyenne_execution || 0} min</h4>
                                                                    <p className="text-muted mb-0">Durée moyenne</p>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <h4 className="mb-1">{projet?.statistiques_avancees?.configurations_avec_erreurs || 0}</h4>
                                                                    <p className="text-muted mb-0">Config. avec erreurs</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />
            
            {/* Modal pour afficher les logs */}
            {showLogModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Log d'exécution</h5>
                                <button type="button" className="btn-close" onClick={() => setShowLogModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', maxHeight: '400px', overflow: 'auto' }}>
                                    {selectedLog}
                                </pre>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Fermer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageProjet;