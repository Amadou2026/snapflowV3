import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterSousAxeModal from './modals/AjouterSousAxeModal';
import ModifierSousAxeModal from './modals/ModifierSousAxeModal';
import ViewSousAxeModal from './modals/ViewSousAxeModal';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionSousAxe = ({ user, logout }) => {
    const [sousAxes, setSousAxes] = useState([]);
    const [axes, setAxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSousAxe, setSelectedSousAxe] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // États pour le filtre et la recherche
    const [selectedAxeFilter, setSelectedAxeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
        fetchUserPermissions();
    }, []);

    const fetchData = async () => {
        try {
            const [sousAxesResponse, axesResponse] = await Promise.all([
                api.get('sous-axes/'),
                api.get('axes/')
            ]);
            setSousAxes(sousAxesResponse.data);
            setAxes(axesResponse.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showErrorAlert('Erreur lors du chargement des données');
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

    const handleDeleteSousAxe = async (sousAxeId) => {
        if (!hasPermission('core.delete_sousaxe')) {
            showErrorAlert('Vous n\'avez pas les permissions pour supprimer un sous-axe');
            return;
        }

        const sousAxe = sousAxes.find(sa => sa.id === sousAxeId);
        
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer le sous-axe <strong>"${sousAxe?.nom}"</strong>. Cette action est irréversible !`,
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
                await api.delete(`sous-axes/${sousAxeId}/`);
                const updatedSousAxes = sousAxes.filter(sousAxe => sousAxe.id !== sousAxeId);
                setSousAxes(updatedSousAxes);
                
                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'Le sous-axe a été supprimé avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression du sous-axe');
            }
        }
    };

    const handleEditSousAxe = (sousAxe) => {
        setSelectedSousAxe(sousAxe);
        setShowEditModal(true);
    };

    const handleViewSousAxe = (sousAxe) => {
        if (!hasPermission('core.view_sousaxe')) {
            showErrorAlert('Vous n\'avez pas les permissions pour voir les détails d\'un sous-axe');
            return;
        }
        
        setSelectedSousAxe(sousAxe);
        setShowViewModal(true);
    };

    const handleSousAxeAdded = (newSousAxe) => {
        const updatedSousAxes = [...sousAxes, newSousAxe];
        setSousAxes(updatedSousAxes);
        setShowAddModal(false);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'Le sous-axe a été créé avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleSousAxeUpdated = (updatedSousAxe) => {
        const updatedSousAxes = sousAxes.map(sousAxe =>
            sousAxe.id === updatedSousAxe.id ? updatedSousAxe : sousAxe
        );
        setSousAxes(updatedSousAxes);
        setShowEditModal(false);
        setSelectedSousAxe(null);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'Le sous-axe a été modifié avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const showErrorAlert = (message) => {
        MySwal.fire({
            title: 'Erreur !',
            text: message,
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK'
        });
    };

    const getAxeName = (axeId) => {
        const axe = axes.find(a => a.id === axeId);
        return axe ? axe.nom : 'Axe inconnu';
    };

    // Gestionnaires d'événements pour le filtre et la recherche
    const handleAxeFilterChange = (e) => {
        setSelectedAxeFilter(e.target.value);
        setCurrentPage(1); // Réinitialiser à la première page lors du filtrage
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
    };

    // Logique de filtrage combinée
    const filteredSousAxes = sousAxes.filter(sousAxe => {
        const matchesAxe = selectedAxeFilter === 'all' || sousAxe.axe === parseInt(selectedAxeFilter);
        const matchesSearch = searchTerm === '' || 
            sousAxe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sousAxe.description && sousAxe.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesAxe && matchesSearch;
    });

    // Logique de pagination basée sur la liste filtrée
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSousAxes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSousAxes.length / itemsPerPage);

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
                                                    Gestion des sous-axes de test
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des sous-axes de test</h2>
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
                                            {/* MODIFICATION : Suppression de "pb-0" pour ajouter de l'espace en bas */}
                                            <div className="row align-items-center p-4">
                                                <div className="col-md-4 mb-3 mb-md-0">
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Rechercher un sous-axe..."
                                                            value={searchTerm}
                                                            onChange={handleSearchChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 mb-3 mb-md-0">
                                                    <select
                                                        className="form-select"
                                                        value={selectedAxeFilter}
                                                        onChange={handleAxeFilterChange}
                                                    >
                                                        <option value="all">Tous les axes</option>
                                                        {axes.map(axe => (
                                                            <option key={axe.id} value={axe.id}>
                                                                {axe.nom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4 text-end">
                                                    {hasPermission('core.add_sousaxe') && (
                                                        <button
                                                            className="btn btn-primary d-inline-flex align-items-center"
                                                            onClick={() => setShowAddModal(true)}
                                                        >
                                                            <i className="ti ti-plus f-18"></i> Ajouter un Sous-Axe
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Nom</th>
                                                            <th>Axe Parent</th>
                                                            <th>Description</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentItems.map((sousAxe, index) => (
                                                            <tr key={sousAxe.id}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-warning d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-category-2 text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{sousAxe.nom}</h6>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-info">
                                                                        {getAxeName(sousAxe.axe)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <p className="mb-0 text-muted">
                                                                        {sousAxe.description && sousAxe.description.length > 80 
                                                                            ? `${sousAxe.description.substring(0, 80)}...` 
                                                                            : sousAxe.description || 'Aucune description'
                                                                        }
                                                                    </p>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {hasPermission('core.view_sousaxe') && (
                                                                            <button
                                                                                className="btn btn-link-secondary btn-sm p-1"
                                                                                onClick={() => handleViewSousAxe(sousAxe)}
                                                                                title="Voir"
                                                                            >
                                                                                <i className="ti ti-eye f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.change_sousaxe') && (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditSousAxe(sousAxe)}
                                                                                title="Modifier"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.delete_sousaxe') && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteSousAxe(sousAxe.id)}
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

                                                {filteredSousAxes.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-category-2 f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {sousAxes.length === 0 
                                                                ? "Aucun sous-axe trouvé." 
                                                                : "Aucun sous-axe ne correspond à votre recherche."
                                                            }
                                                        </p>
                                                        {hasPermission('core.add_sousaxe') && sousAxes.length === 0 && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier sous-axe
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination */}
                                            {filteredSousAxes.length > 0 && (
                                                <div className="row mt-4">
                                                    <div className="col-sm-12">
                                                        <div className="card-body border-top pt-3">
                                                            <div className="row align-items-center">
                                                                <div className="col-md-6">
                                                                    <div className="text-center text-md-start mb-3 mb-md-0">
                                                                        <span className="text-muted">
                                                                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSousAxes.length)} sur {filteredSousAxes.length} éléments
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
                        {hasPermission('core.add_sousaxe') && (
                            <AjouterSousAxeModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onSousAxeAdded={handleSousAxeAdded}
                                axes={axes}
                            />
                        )}

                        {hasPermission('core.change_sousaxe') && (
                            <ModifierSousAxeModal
                                show={showEditModal}
                                onClose={() => {
                                    setShowEditModal(false);
                                    setSelectedSousAxe(null);
                                }}
                                onSousAxeUpdated={handleSousAxeUpdated}
                                sousAxe={selectedSousAxe}
                                axes={axes}
                            />
                        )}

                        {hasPermission('core.view_sousaxe') && (
                            <ViewSousAxeModal
                                show={showViewModal}
                                onClose={() => {
                                    setShowViewModal(false);
                                    setSelectedSousAxe(null);
                                }}
                                sousAxe={selectedSousAxe}
                                axes={axes}
                            />
                        )}
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionSousAxe;