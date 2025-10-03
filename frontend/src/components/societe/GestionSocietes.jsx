import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterSocieteModal from './modals/AjouterSocieteModal';
import ModifierSocieteModal from './modals/ModifierSocieteModal';
import ViewSocieteModal from './modals/ViewSocieteModal';
import FiltreGestionSociete from './FiltreGestionSociete';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionSocietes = ({ user, logout }) => {
    const [societes, setSocietes] = useState([]);
    const [filteredSocietes, setFilteredSocietes] = useState([]);
    const [displayedSocietes, setDisplayedSocietes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSociete, setSelectedSociete] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    // Vérifier si l'utilisateur est superadmin
    const isSuperAdmin = user?.is_superuser;

    // Vérifier si l'utilisateur est admin d'une société (admin_id correspond à user.id)
    const isAdminOfSociete = (societe) => {
        return societe.admin && societe.admin.id === user?.id;
    };

    // Vérifier si l'utilisateur peut modifier une société
    const canEditSociete = (societe) => {
        return isSuperAdmin || isAdminOfSociete(societe);
    };

    useEffect(() => {
        fetchSocietes();
    }, []);

    // Mettre à jour l'affichage paginé quand les sociétés filtrées changent
    useEffect(() => {
        updateDisplayedSocietes();
    }, [filteredSocietes, currentPage]);

    const fetchSocietes = async () => {
        try {
            const response = await api.get('societe/');
            setSocietes(response.data);
            setFilteredSocietes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sociétés:', error);
            showErrorAlert('Erreur lors du chargement des sociétés');
        } finally {
            setLoading(false);
        }
    };

    const updateDisplayedSocietes = () => {
        // Calculer les index de début et fin pour la pagination
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredSocietes.slice(indexOfFirstItem, indexOfLastItem);
        
        setDisplayedSocietes(currentItems);
    };

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(filteredSocietes.length / itemsPerPage);

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
        
        // Ajuster le début si on est près de la fin
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        
        return pageNumbers;
    };

    const handleDeleteSociete = async (societeId) => {
        if (!isSuperAdmin) {
            showErrorAlert('Vous n\'avez pas les permissions pour supprimer une société');
            return;
        }

        const societe = societes.find(s => s.id === societeId);
        
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer la société <strong>"${societe?.nom}"</strong>. Cette action est irréversible !`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler',
            reverseButtons: true,
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`societe/${societeId}/delete/`);
                
                const updatedSocietes = societes.filter(societe => societe.id !== societeId);
                setSocietes(updatedSocietes);
                setFilteredSocietes(updatedSocietes);
                
                // Réinitialiser à la première page si nécessaire
                if (displayedSocietes.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
                
                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'La société a été supprimée avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression de la société');
            }
        }
    };

    const handleEditSociete = (societe) => {
        if (!canEditSociete(societe)) {
            showErrorAlert('Vous n\'avez pas les permissions pour modifier cette société');
            return;
        }
        setSelectedSociete(societe);
        setShowEditModal(true);
    };

    const handleViewSociete = (societe) => {
        setSelectedSociete(societe);
        setShowViewModal(true);
    };

    const handleSocieteAdded = (newSociete) => {
        const updatedSocietes = [...societes, newSociete];
        setSocietes(updatedSocietes);
        setFilteredSocietes(updatedSocietes);
        setShowAddModal(false);
        
        // Aller à la dernière page pour voir la nouvelle société
        const newTotalPages = Math.ceil(updatedSocietes.length / itemsPerPage);
        setCurrentPage(newTotalPages);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'La société a été créée avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleSocieteUpdated = (updatedSociete) => {
        const updatedSocietes = societes.map(societe =>
            societe.id === updatedSociete.id ? updatedSociete : societe
        );
        setSocietes(updatedSocietes);
        setFilteredSocietes(updatedSocietes);
        setShowEditModal(false);
        setSelectedSociete(null);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'La société a été modifiée avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleFilterChange = (filtered) => {
        setFilteredSocietes(filtered);
        setCurrentPage(1); // Retourner à la première page après filtrage
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

    // Fonction pour formater l'URL
    const formatUrl = (url) => {
        if (!url) return 'Non renseigné';
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        return formattedUrl;
    };

    // Fonction pour raccourcir l'affichage de l'URL
    const displayUrl = (url) => {
        if (!url) return 'Non renseigné';
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return cleanUrl.length > 30 ? cleanUrl.substring(0, 30) + '...' : cleanUrl;
    };

    // Fonction pour afficher les projets
    const displayProjets = (projets) => {
        if (!projets || projets.length === 0) {
            return <span className="text-muted">Aucun projet</span>;
        }
        
        // Limiter à 2 projets pour l'affichage dans le tableau
        const projetsAffiches = projets.slice(0, 2);
        const autresProjets = projets.length - 2;
        
        return (
            <div>
                {projetsAffiches.map((projet, index) => (
                    <span key={projet.id} className="badge bg-light-primary me-1 mb-1">
                        {projet.nom}
                    </span>
                ))}
                {autresProjets > 0 && (
                    <span className="badge bg-light-secondary">
                        +{autresProjets} autre(s)
                    </span>
                )}
            </div>
        );
    };

    // Fonction pour compter les projets
    const countProjets = (projets) => {
        return projets ? projets.length : 0;
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
                                                    Gestion des sociétés
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des sociétés</h2>
                                                {isSuperAdmin && (
                                                    <p className="text-muted mb-0">
                                                        <i className="ti ti-crown me-1 text-warning"></i>
                                                        Mode Super Administrateur
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtre - Seulement pour SuperAdmin */}
                            {isSuperAdmin && (
                                <FiltreGestionSociete
                                    societes={societes}
                                    onFilterChange={handleFilterChange}
                                    user={user}
                                />
                            )}
                            {/* End Filtre */}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            {/* Bouton Ajouter - Seulement pour SuperAdmin */}
                                            {isSuperAdmin && (
                                                <div className="text-end p-4 pb-0">
                                                    <button
                                                        className="btn btn-primary d-inline-flex align-items-center"
                                                        onClick={() => setShowAddModal(true)}
                                                    >
                                                        <i className="ti ti-plus f-18"></i> Ajouter une Société
                                                    </button>
                                                </div>
                                            )}

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Société</th>
                                                            <th>SIRET</th>
                                                            <th>Secteur d'activité</th>
                                                            <th>Projets</th>
                                                            <th>Site Web</th>
                                                            <th>Employés</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {displayedSocietes.map((societe, index) => (
                                                            <tr key={societe.id}>
                                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{societe.nom}</h6>
                                                                            {societe.admin && (
                                                                                <small className="text-muted">
                                                                                    Admin: {societe.admin.full_name}
                                                                                </small>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-secondary">
                                                                        {societe.num_siret || 'Non renseigné'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {societe.secteur_activite ? (
                                                                        <span className="badge bg-light-success">
                                                                            {societe.secteur_activite}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted">Non défini</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="ti ti-folders me-1 text-muted"></i>
                                                                        <div>
                                                                            <span className="badge bg-light-info me-1">
                                                                                {countProjets(societe.projets)} projet(s)
                                                                            </span>
                                                                            {displayProjets(societe.projets)}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {societe.url ? (
                                                                        <a
                                                                            href={formatUrl(societe.url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary"
                                                                            title={societe.url}
                                                                        >
                                                                            <i className="ti ti-external-link me-1"></i>
                                                                            {displayUrl(societe.url)}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-muted">Non renseigné</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="ti ti-users me-1 text-muted"></i>
                                                                        <span className="badge bg-light-warning">
                                                                            {societe.employes ? societe.employes.length : 0} employé(s)
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {/* Bouton Voir - Accessible à tous */}
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewSociete(societe)}
                                                                            title="Voir les détails"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        
                                                                        {/* Bouton Modifier - Pour SuperAdmin ET Admin de la société */}
                                                                        {canEditSociete(societe) && (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditSociete(societe)}
                                                                                title="Modifier la société"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        
                                                                        {/* Bouton Supprimer - Seulement pour SuperAdmin */}
                                                                        {isSuperAdmin && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteSociete(societe.id)}
                                                                                title="Supprimer la société"
                                                                            >
                                                                                <i className="ti ti-trash f-18"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {filteredSocietes.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-building f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {societes.length === 0 ?
                                                                'Aucune société trouvée.' :
                                                                'Aucune société ne correspond aux critères de filtrage.'
                                                            }
                                                        </p>
                                                        {/* Bouton Ajouter - Seulement pour SuperAdmin */}
                                                        {societes.length === 0 && isSuperAdmin && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter la première société
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination - Affichée seulement s'il y a plus de 7 sociétés */}
                                            {filteredSocietes.length > itemsPerPage && (
                                                <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                                                    <div className="text-muted">
                                                        <small>
                                                            Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSocietes.length)} 
                                                            à {Math.min(currentPage * itemsPerPage, filteredSocietes.length)} 
                                                            sur {filteredSocietes.length} société(s)
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

                                                            {/* Première page */}
                                                            {currentPage > 3 && (
                                                                <>
                                                                    <li className="page-item">
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => paginate(1)}
                                                                        >
                                                                            1
                                                                        </button>
                                                                    </li>
                                                                    {currentPage > 4 && (
                                                                        <li className="page-item disabled">
                                                                            <span className="page-link">...</span>
                                                                        </li>
                                                                    )}
                                                                </>
                                                            )}

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

                                                            {/* Dernière page */}
                                                            {currentPage < totalPages - 2 && (
                                                                <>
                                                                    {currentPage < totalPages - 3 && (
                                                                        <li className="page-item disabled">
                                                                            <span className="page-link">...</span>
                                                                        </li>
                                                                    )}
                                                                    <li className="page-item">
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => paginate(totalPages)}
                                                                        >
                                                                            {totalPages}
                                                                        </button>
                                                                    </li>
                                                                </>
                                                            )}

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

                        {/* Modals */}
                        {/* Modal Ajouter - Seulement pour SuperAdmin */}
                        {isSuperAdmin && (
                            <AjouterSocieteModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onSocieteAdded={handleSocieteAdded}
                            />
                        )}

                        {/* Modal Modifier - Accessible aux SuperAdmin et Admins de société */}
                        <ModifierSocieteModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedSociete(null);
                            }}
                            onSocieteUpdated={handleSocieteUpdated}
                            societe={selectedSociete}
                        />

                        {/* Modal View - Accessible à tous */}
                        <ViewSocieteModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedSociete(null);
                            }}
                            societe={selectedSociete}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionSocietes;