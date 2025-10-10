import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projetService } from '../services/projetService';
import HeaderAdmin from '../components/admin/HeaderAdmin';
import SidebarAdmin from '../components/admin/SidebarAdmin';
import MobileSidebarOverlay from '../components/admin/MobileSidebarOverlay';
import FooterAdmin from '../components/admin/FooterAdmin';

// Import des composants d'onglets
import VueEnsemble from '../components/projetdetail/VueEnsemble';
import Configurations from '../components/projetdetail/Configurations';
import Scripts from '../components/projetdetail/Scripts';
import Executions from '../components/projetdetail/Executions';
import Rapports from '../components/projetdetail/Rapports';

// Import des nouveaux composants de détails
import ScriptsParAxe from '../components/projetdetail/ScriptsParAxe';
import StatistiquesAvancees from '../components/projetdetail/StatistiquesAvancees';
import ExecutionsParStatut from '../components/projetdetail/ExecutionsParStatut';
import ProchainesExecutions from '../components/projetdetail/ProchainesExecutions';

const ProjetDetail = ({ user, logout }) => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadProjectDetail();
    }, [projectId]);

    const loadProjectDetail = async () => {
        try {
            setLoading(true);
            const projectData = await projetService.getProjectDetail(projectId);
            setProject(projectData);
        } catch (err) {
            setError('Erreur lors du chargement du projet');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <MobileSidebarOverlay />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement du projet...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <MobileSidebarOverlay />
                    <div className="page-wrapper">
                        <div className="pc-container">
                            <div className="pc-content">
                                <div className="alert alert-danger" role="alert">
                                    {error || 'Projet non trouvé'}
                                </div>
                                <Link to="/projets" className="btn btn-primary">
                                    Retour aux projets
                                </Link>
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
                <MobileSidebarOverlay />

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
                                                    <Link to="/projets">Projets</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    {project.nom}
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Détails du Projet</h2>
                                                <p className="text-muted mb-0">{project.nom}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">{project.nom}</h5>
                                                <div className="d-flex gap-2">
                                                    <Link to="/projets" className="btn btn-secondary btn-sm">
                                                        <i className="ti ti-arrow-left me-1"></i>
                                                        Retour
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {/* Navigation par onglets */}
                                            <ul className="nav nav-tabs mb-4" role="tablist">
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('overview')}
                                                    >
                                                        <i className="ti ti-dashboard me-2"></i>
                                                        Vue d'ensemble
                                                    </button>
                                                </li>
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'configurations' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('configurations')}
                                                    >
                                                        <i className="ti ti-settings me-2"></i>
                                                        Configurations
                                                        <span className="badge bg-primary ms-2">
                                                            {project.statistiques?.configurations_actives || 0}
                                                        </span>
                                                    </button>
                                                </li>
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'scripts' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('scripts')}
                                                    >
                                                        <i className="ti ti-file-code me-2"></i>
                                                        Scripts
                                                        <span className="badge bg-info ms-2">
                                                            {project.statistiques?.total_scripts || 0}
                                                        </span>
                                                    </button>
                                                </li>
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'executions' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('executions')}
                                                    >
                                                        <i className="ti ti-player-play me-2"></i>
                                                        Exécutions
                                                        <span className="badge bg-warning ms-2">
                                                            {project.statistiques?.total_executions || 0}
                                                        </span>
                                                    </button>
                                                </li>
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'rapports' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('rapports')}
                                                    >
                                                        <i className="ti ti-report-analytics me-2"></i>
                                                        Rapports
                                                    </button>
                                                </li>
                                                {/* Nouvel onglet Analytics */}
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('analytics')}
                                                    >
                                                        <i className="ti ti-chart-bar me-2"></i>
                                                        Analytics
                                                    </button>
                                                </li>
                                            </ul>

                                            {/* Contenu des onglets */}
                                            <div className="tab-content">
                                                {activeTab === 'overview' && (
                                                    <VueEnsemble project={project} />
                                                )}
                                                
                                                {activeTab === 'configurations' && (
                                                    <Configurations project={project} user={user} />
                                                )}
                                                
                                                {activeTab === 'scripts' && (
                                                    <Scripts project={project} />
                                                )}
                                                
                                                {activeTab === 'executions' && (
                                                    <Executions project={project} />
                                                )}
                                                
                                                {activeTab === 'rapports' && (
                                                    <Rapports project={project} />
                                                )}

                                                {/* Nouvel onglet Analytics */}
                                                {activeTab === 'analytics' && (
                                                    <div className="tab-pane fade show active">
                                                        <div className="row g-4">
                                                            {/* Scripts organisés par axe */}
                                                            <div className="col-12">
                                                                <ScriptsParAxe scriptsParAxe={project.scripts_par_axe} />
                                                            </div>
                                                            
                                                            {/* Statistiques avancées */}
                                                            <div className="col-lg-6">
                                                                <StatistiquesAvancees statistiquesAvancees={project.statistiques_avancees} />
                                                            </div>
                                                            
                                                            {/* Répartition des exécutions */}
                                                            <div className="col-lg-6">
                                                                <ExecutionsParStatut executionsParStatut={project.executions_par_statut} />
                                                            </div>
                                                            
                                                            {/* Prochaines exécutions */}
                                                            <div className="col-12">
                                                                <ProchainesExecutions prochainesExecutions={project.prochaines_executions} />
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
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default ProjetDetail;