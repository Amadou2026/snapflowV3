import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import ExecutionDetailModal from './modals/ExecutionDetailModal';
import FiltreExecutionTest from './FiltreExecutionTest'; // Import du composant filtre
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionExecutionTest = ({ user, logout }) => {
    const location = useLocation();
    const [executions, setExecutions] = useState([]);
    const [filteredExecutions, setFilteredExecutions] = useState([]);
    const [displayedExecutions, setDisplayedExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [projectIdFromUrl, setProjectIdFromUrl] = useState(null); // ID du projet depuis l'URL
    const [projets, setProjets] = useState([]); // Liste des projets pour faire la correspondance ID/Nom

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        // Extraire le paramètre projectId de l'URL
        const searchParams = new URLSearchParams(location.search);
        const projectId = searchParams.get('projectId');
        
        if (projectId) {
            setProjectIdFromUrl(parseInt(projectId));
        } else {
            setProjectIdFromUrl(null);
        }
        
        fetchData();
    }, [location.search]);

    // Mettre à jour l'affichage paginé quand les executions filtrées changent
    useEffect(() => {
        updateDisplayedExecutions();
    }, [filteredExecutions, currentPage]);

    // Filtrer les exécutions par projet si projectId est dans l'URL
    useEffect(() => {
        if (projectIdFromUrl && executions.length > 0 && projets.length > 0) {
            // Trouver le nom du projet correspondant à l'ID
            const projet = projets.find(p => p.id === projectIdFromUrl);
            const projetNom = projet ? projet.nom : null;
            
            if (projetNom) {
                const filtered = executions.filter(execution => {
                    // Comparer avec le nom du projet
                    return execution.projet_nom === projetNom;
                });
                setFilteredExecutions(filtered);
                setCurrentPage(1); // Retour à la première page lors du filtrage
            } else {
                // Si le projet n'est pas trouvé, afficher un message vide
                setFilteredExecutions([]);
            }
        } else if (!projectIdFromUrl && executions.length > 0) {
            // Si pas de projectId dans l'URL, utiliser toutes les exécutions
            setFilteredExecutions(executions);
        }
    }, [executions, projets, projectIdFromUrl]);

    const fetchData = async () => {
        try {
            // Charger les exécutions et les projets en parallèle
            const [executionsResponse, projetsResponse] = await Promise.all([
                api.get('executions/'),
                api.get('projets/')
            ]);
            
            console.log('📊 DONNÉES EXECUTIONS:', executionsResponse.data);
            console.log('📊 DONNÉES PROJETS:', projetsResponse.data);
            
            setExecutions(executionsResponse.data);
            setProjets(projetsResponse.data);
            setFilteredExecutions(executionsResponse.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showErrorAlert('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour gérer les changements de filtre (désactivée si projectId est dans l'URL)
    const handleFilterChange = (filteredData) => {
        if (!projectIdFromUrl) {
            setFilteredExecutions(filteredData);
            setCurrentPage(1); // Retour à la première page lors du filtrage
        }
    };

    const updateDisplayedExecutions = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredExecutions.slice(indexOfFirstItem, indexOfLastItem);
        setDisplayedExecutions(currentItems);
    };

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);

    // Changer de page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Aller à la page précédente
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Aller à la page suivante
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Générer les numéros de page à afficher
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    const handleViewExecution = (execution) => {
        setSelectedExecution(execution);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedExecution(null);
    };

    const handleDownloadLog = async (execution) => {
        if (!execution.log_fichier) {
            showErrorAlert('Aucun fichier log disponible');
            return;
        }

        try {
            // Télécharger le fichier log
            const response = await api.get(execution.log_fichier, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `execution_${execution.id}_log.${execution.log_fichier.endsWith('.xlsx') ? 'xlsx' : 'txt'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            showErrorAlert('Erreur lors du téléchargement du log');
        }
    };

    // Fonction utilitaire pour les erreurs
    const showErrorAlert = (message) => {
        MySwal.fire({
            title: 'Erreur !',
            text: message,
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK'
        });
    };

    // Fonction pour afficher le statut
    const displayStatus = (statut) => {
        const statusConfig = {
            'pending': { class: 'bg-light-warning', icon: 'ti ti-clock', text: 'En attente' },
            'running': { class: 'bg-light-info', icon: 'ti ti-refresh', text: 'En cours' },
            'done': { class: 'bg-light-success', icon: 'ti ti-circle-check', text: 'Concluant' },
            'error': { class: 'bg-light-danger', icon: 'ti ti-circle-x', text: 'Non concluant' },
            'non_executed': { class: 'bg-light-secondary', icon: 'ti ti-ban', text: 'Non exécuté' }
        };

        const config = statusConfig[statut] || { class: 'bg-light-secondary', icon: 'ti ti-help', text: statut };

        return (
            <span className={`badge ${config.class}`}>
                <i className={`${config.icon} me-1`}></i>
                {config.text}
            </span>
        );
    };

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fonction pour calculer la durée
    const calculateDuration = (startedAt, endedAt) => {
        if (!startedAt || !endedAt) return 'N/A';
        
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        const duration = Math.floor((end - start) / 1000); // en secondes
        
        if (duration < 60) {
            return `${duration} secondes`;
        } else if (duration < 3600) {
            return `${Math.floor(duration / 60)} minutes`;
        } else {
            return `${Math.floor(duration / 3600)} heures`;
        }
    };

    // Obtenir le nom du projet depuis l'ID dans l'URL
    const getProjectNameFromUrl = () => {
        if (!projectIdFromUrl) return '';
        const projet = projets.find(p => p.id === projectIdFromUrl);
        return projet ? projet.nom : `Projet #${projectIdFromUrl}`;
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
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Accueil</Link>
                                                </li>
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Dashboard</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    Exécutions de test
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">
                                                    Les battéries de test exécutées
                                                    {projectIdFromUrl && (
                                                        <span className="badge bg-primary ms-2">
                                                            {getProjectNameFromUrl()}
                                                        </span>
                                                    )}
                                                </h2>
                                                {user.is_superuser && (
                                                    <p className="text-success mb-0">
                                                        <i className="ti ti-shield-check me-1"></i>
                                                        Mode Super Admin - Toutes les exécutions visibles
                                                    </p>
                                                )}
                                                {projectIdFromUrl && (
                                                    <p className="text-info mb-0">
                                                        <i className="ti ti-filter me-1"></i>
                                                        Affichage filtré pour le projet "{getProjectNameFromUrl()}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtres (masqué si projectId est dans l'URL) */}
                            {!projectIdFromUrl && (
                                <FiltreExecutionTest 
                                    executions={executions}
                                    onFilterChange={handleFilterChange}
                                    user={user}
                                    projets={projets} // Ajout des projets pour le filtre
                                />
                            )}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Statut</th>
                                                            <th>Début</th>
                                                            <th>Fin</th>
                                                            <th>Durée</th>
                                                            <th>Ticket Redmine</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {displayedExecutions.map((execution, index) => (
                                                            <tr key={execution.id}>
                                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                                <td>
                                                                    <h6 className="mb-0">{execution.configuration_nom || 'N/A'}</h6>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">
                                                                        {execution.projet_nom || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {displayStatus(execution.statut)}
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {formatDate(execution.started_at)}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {formatDate(execution.ended_at)}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {calculateDuration(execution.started_at, execution.ended_at)}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    {execution.ticket_redmine_id ? (
                                                                        <span className="badge bg-light-info">
                                                                            #{execution.ticket_redmine_id}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {/* Bouton Voir détails */}
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleViewExecution(execution)}
                                                                            title="Voir les détails"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>

                                                                        {/* Bouton Télécharger log */}
                                                                        {execution.log_fichier && (
                                                                            <button
                                                                                className="btn btn-link-success btn-sm p-1"
                                                                                onClick={() => handleDownloadLog(execution)}
                                                                                title="Télécharger le log"
                                                                            >
                                                                                <i className="ti ti-download f-18"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {filteredExecutions.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-player-play f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {executions.length === 0 ?
                                                                'Aucune exécution de test trouvée.' :
                                                                projectIdFromUrl ?
                                                                    `Aucune exécution trouvée pour le projet "${getProjectNameFromUrl()}".` :
                                                                    'Aucune exécution ne correspond aux critères de filtrage.'
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination - Affichée seulement s'il y a plus de 10 executions */}
                                            {filteredExecutions.length > itemsPerPage && (
                                                <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                                                    <div className="text-muted">
                                                        <small>
                                                            Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredExecutions.length)}
                                                            à {Math.min(currentPage * itemsPerPage, filteredExecutions.length)}
                                                            sur {filteredExecutions.length} exécution(s)
                                                        </small>
                                                    </div>

                                                    <nav aria-label="Pagination">
                                                        <ul className="pagination pagination-sm mb-0">
                                                            {/* Bouton Précédent */}
                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToPreviousPage}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <i className="ti ti-chevron-left"></i>
                                                                </button>
                                                            </li>

                                                            {/* Pages numérotées */}
                                                            {getPageNumbers().map(number => (
                                                                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => paginate(number)}
                                                                    >
                                                                        {number}
                                                                    </button>
                                                                </li>
                                                            ))}

                                                            {/* Bouton Suivant */}
                                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToNextPage}
                                                                    disabled={currentPage === totalPages}
                                                                >
                                                                    <i className="ti ti-chevron-right"></i>
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modal Détail Execution */}
                        <ExecutionDetailModal
                            show={showDetailModal}
                            onClose={handleCloseDetailModal}
                            execution={selectedExecution}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionExecutionTest;