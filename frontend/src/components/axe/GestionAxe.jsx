import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterAxeModal from './modals/AjouterAxeModal';
import ModifierAxeModal from './modals/ModifierAxeModal';
import ViewAxeModal from './modals/ViewAxeModal';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import MobileSidebarOverlay from '../admin/MobileSidebarOverlay'
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionAxe = ({ user, logout }) => {
    const [axes, setAxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAxe, setSelectedAxe] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);
    // Ajout de l'état pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // 5 éléments par page

    useEffect(() => {
        fetchAxes();
        fetchUserPermissions();
    }, []);

    const fetchAxes = async () => {
        try {
            const response = await api.get('axes/');
            setAxes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des axes:', error);
            showErrorAlert('Erreur lors du chargement des axes');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            // Utilisez le bon endpoint et extrayez le tableau de permissions
            const response = await api.get('user/permissions/');
            setUserPermissions(response.data.permissions);
        } catch (error) {
            console.error('Erreur lors du chargement des permissions:', error);
            // En cas d'erreur, assurez-vous que userPermissions est un tableau vide pour éviter d'autres erreurs
            setUserPermissions([]);
        }
    };

    const hasPermission = (permission) => {
    // Vérifie si userPermissions est bien un tableau avant d'utiliser .includes()
    return Array.isArray(userPermissions) && userPermissions.includes(permission);
};

    const handleDeleteAxe = async (axeId) => {
        // Vérifier si l'utilisateur a la permission de supprimer
        if (!hasPermission('core.delete_axe')) {
            showErrorAlert('Vous n\'avez pas les permissions pour supprimer un axe');
            return;
        }

        const axe = axes.find(a => a.id === axeId);

        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer l'axe <strong>"${axe?.nom}"</strong>. Cette action est irréversible !`,
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
                await api.delete(`axes/${axeId}/`);

                const updatedAxes = axes.filter(axe => axe.id !== axeId);
                setAxes(updatedAxes);

                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'L\'axe a été supprimé avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression de l\'axe');
            }
        }
    };

    const handleEditAxe = (axe) => {
        setSelectedAxe(axe);
        setShowEditModal(true);
    };

    const handleViewAxe = (axe) => {
        // Vérifier si l'utilisateur a la permission de voir
        if (!hasPermission('core.view_axe')) {
            showErrorAlert('Vous n\'avez pas les permissions pour voir les détails d\'un axe');
            return;
        }

        setSelectedAxe(axe);
        setShowViewModal(true);
    };

    const handleAxeAdded = (newAxe) => {
        const updatedAxes = [...axes, newAxe];
        setAxes(updatedAxes);
        setShowAddModal(false);

        MySwal.fire({
            title: 'Succès !',
            text: 'L\'axe a été créé avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleAxeUpdated = (updatedAxe) => {
        const updatedAxes = axes.map(axe =>
            axe.id === updatedAxe.id ? updatedAxe : axe
        );
        setAxes(updatedAxes);
        setShowEditModal(false);
        setSelectedAxe(null);

        MySwal.fire({
            title: 'Succès !',
            text: 'L\'axe a été modifié avec succès.',
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

    // Fonctions pour la pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = axes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(axes.length / itemsPerPage);

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
                    <MobileSidebarOverlay />
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
                                                    Gestion des axes de test
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des axes de test</h2>
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
                                        {/* MODIFICATION ICI : Ajout de la classe "px-4" pour restaurer le padding horizontal */}
                                        <div className="card-body px-4">
                                            <div className="text-end p-4 pb-0">
                                                {hasPermission('core.add_axe') && (
                                                    <button
                                                        className="btn btn-primary d-inline-flex align-items-center"
                                                        onClick={() => setShowAddModal(true)}
                                                    >
                                                        <i className="ti ti-plus f-18"></i> Ajouter un Axe
                                                    </button>
                                                )}
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Nom</th>
                                                            <th>Description</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentItems.map((axe, index) => (
                                                            <tr key={axe.id}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-info d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-category text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{axe.nom}</h6>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <p className="mb-0 text-muted">
                                                                        {axe.description && axe.description.length > 100
                                                                            ? `${axe.description.substring(0, 100)}...`
                                                                            : axe.description || 'Aucune description'
                                                                        }
                                                                    </p>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {hasPermission('core.view_axe') && (
                                                                            <button
                                                                                className="btn btn-link-secondary btn-sm p-1"
                                                                                onClick={() => handleViewAxe(axe)}
                                                                                title="Voir"
                                                                            >
                                                                                <i className="ti ti-eye f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.change_axe') && (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditAxe(axe)}
                                                                                title="Modifier"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                        )}
                                                                        {hasPermission('core.delete_axe') && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteAxe(axe.id)}
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

                                                {axes.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-category f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            Aucun axe trouvé.
                                                        </p>
                                                        {hasPermission('core.add_axe') && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier axe
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination améliorée */}
                                            {axes.length > 0 && (
                                                <div className="row mt-4">
                                                    <div className="col-sm-12">
                                                        <div className="card-body border-top pt-3">
                                                            <div className="row align-items-center">
                                                                <div className="col-md-6">
                                                                    <div className="text-center text-md-start mb-3 mb-md-0">
                                                                        <span className="text-muted">
                                                                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, axes.length)} sur {axes.length} éléments
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
                                                                                // Afficher seulement quelques numéros de page si trop de pages
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
                        {hasPermission('core.add_axe') && (
                            <AjouterAxeModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onAxeAdded={handleAxeAdded}
                            />
                        )}

                        {hasPermission('core.change_axe') && (
                            <ModifierAxeModal
                                show={showEditModal}
                                onClose={() => {
                                    setShowEditModal(false);
                                    setSelectedAxe(null);
                                }}
                                onAxeUpdated={handleAxeUpdated}
                                axe={selectedAxe}
                            />
                        )}

                        {hasPermission('core.view_axe') && (
                            <ViewAxeModal
                                show={showViewModal}
                                onClose={() => {
                                    setShowViewModal(false);
                                    setSelectedAxe(null);
                                }}
                                axe={selectedAxe}
                            />
                        )}
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionAxe;