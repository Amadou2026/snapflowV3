import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import AjouterSecteurModal from './modals/AjouterSecteurModal';
import ModifierSecteurModal from './modals/ModifierSecteurModal';
import ViewSecteurModal from './modals/ViewSecteurModal';
import api from '../../services/api';

const GestionSecteur = ({ user, logout }) => {
    const [secteurs, setSecteurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSecteur, setSelectedSecteur] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // États pour le filtre et la recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        fetchSecteurs();
        fetchUserPermissions();
    }, []);

    const fetchSecteurs = async () => {
        try {
            const response = await api.get('secteurs/');
            setSecteurs(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            toast.error('Erreur lors du chargement des secteurs');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            const response = await api.get('user/permissions/');
            setUserPermissions(response.data.permissions);
        } catch (error) {
            console.error('Erreur lors du chargement des permissions:', error);
            setUserPermissions([]);
        }
    };

    const hasPermission = (permission) => {
        return Array.isArray(userPermissions) && userPermissions.includes(permission);
    };

    const handleDeleteSecteur = async (secteurId) => {
        if (!hasPermission('core.delete_secteuractivite')) {
            toast.error('Vous n\'avez pas les permissions pour supprimer un secteur');
            return;
        }

        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) {
            try {
                await api.delete(`secteurs/${secteurId}/`);
                toast.success('Secteur supprimé avec succès');
                fetchSecteurs(); // Recharger les données après suppression
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                toast.error('Erreur lors de la suppression du secteur');
            }
        }
    };

    const handleEditSecteur = (secteur) => {
        setSelectedSecteur(secteur);
        setShowEditModal(true);
    };

    const handleViewSecteur = (secteur) => {
        if (!hasPermission('core.view_secteuractivite')) {
            toast.error('Vous n\'avez pas les permissions pour voir les détails d\'un secteur');
            return;
        }
        
        setSelectedSecteur(secteur);
        setShowViewModal(true);
    };

    const handleSecteurAdded = () => {
        fetchSecteurs();
        setShowAddModal(false);
    };

    const handleSecteurUpdated = () => {
        fetchSecteurs();
        setShowEditModal(false);
        setSelectedSecteur(null);
    };

    // Gestionnaires d'événements pour le filtre et la recherche
    const handleFilterChange = (e) => {
        setSelectedFilter(e.target.value);
        setCurrentPage(1); // Réinitialiser à la première page lors du filtrage
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
    };

    // Fonction pour réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedFilter('all');
        setCurrentPage(1);
    };

    // Logique de filtrage combinée
    const filteredSecteurs = secteurs.filter(secteur => {
        const matchesFilter = selectedFilter === 'all' || 
            (selectedFilter === 'withName' && secteur.nom && secteur.nom.trim() !== '');
        const matchesSearch = searchTerm === '' || 
            (secteur.nom && secteur.nom.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesFilter && matchesSearch;
    });

    // Logique de pagination basée sur la liste filtrée
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSecteurs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSecteurs.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
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
                                                    Gestion des secteurs
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des secteurs d'activité</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body px-4">
                                            {/* Filtres et recherche */}
                                            <div className="row align-items-center p-4">
                                                <div className="col-md-6 mb-3 mb-md-0">
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Rechercher un secteur..."
                                                            value={searchTerm}
                                                            onChange={handleSearchChange}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="col-md-2 mb-3 mb-md-0">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary w-100"
                                                        onClick={handleResetFilters}
                                                    >
                                                        <i className="ti ti-filter-off me-1"></i>Réinitialiser
                                                    </button>
                                                </div>
                                                <div className="col-md-4 text-end">
                                                    {hasPermission('core.add_secteuractivite') && (
                                                        <button
                                                            className="btn btn-primary d-inline-flex align-items-center"
                                                            onClick={() => setShowAddModal(true)}
                                                        >
                                                            <i className="ti ti-plus f-18"></i> Ajouter
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Secteur d'activité</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentItems.map((secteur, index) => (
                                                            <tr key={secteur.id}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-primary d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-briefcase text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{secteur.nom}</h6>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {hasPermission('core.view_secteuractivite') && (
                                                                            <button
                                                                                className="btn btn-link-secondary btn-sm p-1"
                                                                                onClick={() => handleViewSecteur(secteur)}
                                                                                title="Voir"
                                                                            >
                                                                                <i className="ti ti-eye f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.change_secteuractivite') && (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditSecteur(secteur)}
                                                                                title="Modifier"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.delete_secteuractivite') && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteSecteur(secteur.id)}
                                                                                title="Supprimer"
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

                                                {filteredSecteurs.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-briefcase f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {secteurs.length === 0 ?
                                                                'Aucun secteur trouvé.' :
                                                                'Aucun secteur ne correspond aux critères de recherche.'
                                                            }
                                                        </p>
                                                        {secteurs.length === 0 && hasPermission('core.add_secteuractivite') && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier secteur
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination */}
                                            {filteredSecteurs.length > 0 && (
                                                <div className="row mt-4">
                                                    <div className="col-sm-12">
                                                        <div className="card-body border-top pt-3">
                                                            <div className="row align-items-center">
                                                                <div className="col-md-6">
                                                                    <div className="text-center text-md-start mb-3 mb-md-0">
                                                                        <span className="text-muted">
                                                                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSecteurs.length)} sur {filteredSecteurs.length} éléments
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <nav aria-label="Page navigation">
                                                                        <ul className="pagination justify-content-center justify-content-md-end mb-0">
                                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                                <button className="page-link" onClick={handlePrevPage} tabIndex="-1">
                                                                                    <i className="ti ti-chevron-left"></i>
                                                                                    <span className="sr-only">Précédent</span>
                                                                                </button>
                                                                            </li>
                                                                            {[...Array(totalPages)].map((_, index) => {
                                                                                const pageNumber = index + 1;
                                                                                if (
                                                                                    totalPages <= 5 ||
                                                                                    pageNumber === 1 ||
                                                                                    pageNumber === totalPages ||
                                                                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                                                ) {
                                                                                    return (
                                                                                        <li key={index} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                                                                            <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                                                                                                {pageNumber}
                                                                                            </button>
                                                                                        </li>
                                                                                    );
                                                                                } else if (
                                                                                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                                                                                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                                                                                ) {
                                                                                    return (
                                                                                        <li key={index} className="page-item disabled">
                                                                                            <span className="page-link">...</span>
                                                                                        </li>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })}
                                                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                                                <button className="page-link" onClick={handleNextPage}>
                                                                                    <span className="sr-only">Suivant</span>
                                                                                    <i className="ti ti-chevron-right"></i>
                                                                                </button>
                                                                            </li>
                                                                        </ul>
                                                                    </nav>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        {hasPermission('core.add_secteuractivite') && (
                            <AjouterSecteurModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onSecteurAdded={handleSecteurAdded}
                            />
                        )}

                        {hasPermission('core.change_secteuractivite') && (
                            <ModifierSecteurModal
                                show={showEditModal}
                                onClose={() => {
                                    setShowEditModal(false);
                                    setSelectedSecteur(null);
                                }}
                                onSecteurUpdated={handleSecteurUpdated}
                                secteur={selectedSecteur}
                            />
                        )}

                        {hasPermission('core.view_secteuractivite') && (
                            <ViewSecteurModal
                                show={showViewModal}
                                onClose={() => {
                                    setShowViewModal(false);
                                    setSelectedSecteur(null);
                                }}
                                secteur={selectedSecteur}
                            />
                        )}
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionSecteur;