import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import ResultatDetailModal from './modals/ResultatDetailModal';
import FiltreResultatTest from './FiltreResultatTest';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionResultatTest = ({ user, logout }) => {
    const location = useLocation();
    const [resultats, setResultats] = useState([]);
    const [filteredResultats, setFilteredResultats] = useState([]);
    const [displayedResultats, setDisplayedResultats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResultat, setSelectedResultat] = useState(null);
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

    // Mettre à jour l'affichage paginé quand les résultats filtrés changent
    useEffect(() => {
        updateDisplayedResultats();
    }, [filteredResultats, currentPage]);

    // Filtrer les résultats par projet si projectId est dans l'URL
    useEffect(() => {
        if (projectIdFromUrl && resultats.length > 0 && projets.length > 0) {
            // Trouver le nom du projet correspondant à l'ID
            const projet = projets.find(p => p.id === projectIdFromUrl);
            const projetNom = projet ? projet.nom : null;
            
            if (projetNom) {
                const filtered = resultats.filter(resultat => {
                    // Comparer avec le nom du projet
                    return resultat.projet_nom === projetNom;
                });
                setFilteredResultats(filtered);
                setCurrentPage(1); // Retour à la première page lors du filtrage
            } else {
                // Si le projet n'est pas trouvé, afficher un message vide
                setFilteredResultats([]);
            }
        } else if (!projectIdFromUrl && resultats.length > 0) {
            // Si pas de projectId dans l'URL, utiliser tous les résultats
            setFilteredResultats(resultats);
        }
    }, [resultats, projets, projectIdFromUrl]);

    const fetchData = async () => {
        try {
            // Charger les résultats et les projets en parallèle
            const [resultatsResponse, projetsResponse] = await Promise.all([
                api.get('execution-resultats/'),
                api.get('projets/')
            ]);
            
            console.log('📊 DONNÉES RÉSULTATS:', resultatsResponse.data);
            console.log('📊 DONNÉES PROJETS:', projetsResponse.data);
            
            setResultats(resultatsResponse.data);
            setProjets(projetsResponse.data);
            setFilteredResultats(resultatsResponse.data);
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
            setFilteredResultats(filteredData);
            setCurrentPage(1); // Retour à la première page lors du filtrage
        }
    };

    const updateDisplayedResultats = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredResultats.slice(indexOfFirstItem, indexOfLastItem);
        setDisplayedResultats(currentItems);
    };

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(filteredResultats.length / itemsPerPage);

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

    const handleViewResultat = (resultat) => {
        setSelectedResultat(resultat);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedResultat(null);
    };

    const handleDownloadLog = async (resultat) => {
        if (!resultat.log_fichier) {
            showErrorAlert('Aucun fichier log disponible');
            return;
        }

        try {
            // Télécharger le fichier log
            const response = await api.get(resultat.log_fichier, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `resultat_${resultat.id}_${resultat.script_nom}_log.txt`);
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
                                                    Résultats des tests
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">
                                                    Gestion des résultats de test
                                                    {projectIdFromUrl && (
                                                        <span className="badge bg-primary ms-2">
                                                            {getProjectNameFromUrl()}
                                                        </span>
                                                    )}
                                                </h2>
                                                {user.is_superuser && (
                                                    <p className="text-success mb-0">
                                                        <i className="ti ti-shield-check me-1"></i>
                                                        Mode Super Admin - Tous les résultats visibles
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
                                <FiltreResultatTest 
                                    resultats={resultats}
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
                                                            <th>Script</th>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Statut</th>
                                                            <th>Date début</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {displayedResultats.map((resultat, index) => (
                                                            <tr key={resultat.id}>
                                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                                <td>
                                                                    <h6 className="mb-0">
                                                                        <i className="ti ti-script me-1 text-info"></i>
                                                                        {resultat.script_nom || 'N/A'}
                                                                    </h6>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">
                                                                        <i className="ti ti-settings me-1"></i>
                                                                        {resultat.configuration_nom || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-success">
                                                                        <i className="ti ti-folders me-1"></i>
                                                                        {resultat.projet_nom || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {displayStatus(resultat.statut)}
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {formatDate(resultat.started_at)}
                                                                    </small>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {/* Bouton Voir détails */}
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleViewResultat(resultat)}
                                                                            title="Voir les détails"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>

                                                                        {/* Bouton Télécharger log */}
                                                                        {resultat.log_fichier && (
                                                                            <button
                                                                                className="btn btn-link-success btn-sm p-1"
                                                                                onClick={() => handleDownloadLog(resultat)}
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

                                                {filteredResultats.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-checklist f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {resultats.length === 0 ?
                                                                'Aucun résultat de test trouvé.' :
                                                                projectIdFromUrl ?
                                                                    `Aucun résultat trouvé pour le projet "${getProjectNameFromUrl()}".` :
                                                                    'Aucun résultat ne correspond aux critères de filtrage.'
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination - Affichée seulement s'il y a plus de 10 résultats */}
                                            {filteredResultats.length > itemsPerPage && (
                                                <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                                                    <div className="text-muted">
                                                        <small>
                                                            Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredResultats.length)}
                                                            à {Math.min(currentPage * itemsPerPage, filteredResultats.length)}
                                                            sur {filteredResultats.length} résultat(s)
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

                        {/* Modal Détail Résultat */}
                        <ResultatDetailModal
                            show={showDetailModal}
                            onClose={handleCloseDetailModal}
                            resultat={selectedResultat}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionResultatTest;