import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterParametreModal from './modals/AjouterParametreModal';
import ModifierParametreModal from './modals/ModifierParametreModal';
import ViewParametreModal from './modals/ViewParametreModal';
import FiltreParametre from './FiltreParametre';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import MobileSidebarOverlay from '../admin/MobileSidebarOverlay';
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionParametres = ({ user, logout }) => {
    const [parametres, setParametres] = useState([]);
    const [filteredParametres, setFilteredParametres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedParametre, setSelectedParametre] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    useEffect(() => {
        fetchParametres();
    }, []);

    useEffect(() => {
        // Réinitialiser à la première page quand les données filtrées changent
        setCurrentPage(1);
    }, [filteredParametres]);

    // Debug useEffect
    useEffect(() => {
        console.log("selectedParametre:", selectedParametre);
        console.log("showEditModal:", showEditModal);
    }, [selectedParametre, showEditModal]);

    // Dans fetchParametres
    const fetchParametres = async () => {
        try {
            let response;
            if (user?.is_superuser) {
                response = await api.get('parametres/');
            } else {
                // Pour les administrateurs, utiliser l'endpoint my_configuration
                response = await api.get('parametres/my_configuration/');
                // Convertir en tableau pour la compatibilité
                const data = Array.isArray(response.data) ? response.data : [response.data];
                setParametres(data);
                setFilteredParametres(data);
                return;
            }
            setParametres(response.data);
            setFilteredParametres(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            showErrorAlert('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filteredData) => {
        setFilteredParametres(filteredData);
    };

    // Calcul de la pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentParametres = filteredParametres.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredParametres.length / itemsPerPage);

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

    const handleDeleteParametre = async (parametreId) => {
        const parametre = parametres.find(p => p.id === parametreId);

        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer les paramètres de <strong>"${parametre?.societe_nom}"</strong>. Cette action est irréversible !`,
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
                await api.delete(`parametres/${parametreId}/`);

                const updatedParametres = parametres.filter(parametre => parametre.id !== parametreId);
                setParametres(updatedParametres);
                setFilteredParametres(updatedParametres);

                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'Les paramètres ont été supprimés avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression des paramètres');
            }
        }
    };

    const handleEditParametre = (parametre) => {
        console.log("Bouton modifier cliqué:", parametre);
        setSelectedParametre(parametre);
        setShowEditModal(true);
    };

    const handleViewParametre = (parametre) => {
        setSelectedParametre(parametre);
        setShowViewModal(true);
    };

    const handleParametreAdded = (newParametre) => {
        const updatedParametres = [...parametres, newParametre];
        setParametres(updatedParametres);
        setFilteredParametres(updatedParametres);
        setShowAddModal(false);

        MySwal.fire({
            title: 'Succès !',
            text: 'Les paramètres ont été créés avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleParametreUpdated = (updatedParametre) => {
        const updatedParametres = parametres.map(parametre =>
            parametre.id === updatedParametre.id ? updatedParametre : parametre
        );
        setParametres(updatedParametres);
        setFilteredParametres(updatedParametres);
        setShowEditModal(false);
        setSelectedParametre(null);

        MySwal.fire({
            title: 'Succès !',
            text: 'Les paramètres ont été modifiés avec succès.',
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
                                                    Gestion des paramètres
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des paramètres système</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtres - seulement pour superadmin */}
                            {user?.is_superuser && (
                                <FiltreParametre
                                    parametres={parametres}
                                    onFilterChange={handleFilterChange}
                                    user={user}
                                />
                            )}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center p-4 pb-0">
                                                <div>
                                                    <h5 className="card-title mb-0">
                                                        Liste des paramètres ({filteredParametres.length})
                                                    </h5>
                                                </div>
                                                {user?.is_superuser && (
                                                    <div>
                                                        <button
                                                            className="btn btn-primary d-inline-flex align-items-center"
                                                            onClick={() => setShowAddModal(true)}
                                                        >
                                                            <i className="ti ti-plus f-18"></i> Ajouter des paramètres
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Société</th>
                                                            <th>URL Redmine</th>
                                                            <th>Email</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentParametres.map((parametre, index) => (
                                                            <tr key={parametre.id}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-info d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-building text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{parametre.societe_nom}</h6>
                                                                            <small className="text-muted">
                                                                                ID: {parametre.societe}
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {parametre.redmine_url ? (
                                                                        <span className="badge bg-light-success">
                                                                            <i className="ti ti-check me-1"></i>
                                                                            Configuré
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge bg-light-warning">
                                                                            <i className="ti ti-x me-1"></i>
                                                                            Non configuré
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {parametre.email_host_user ? (
                                                                        <span className="badge bg-light-success">
                                                                            <i className="ti ti-check me-1"></i>
                                                                            Configuré
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge bg-light-warning">
                                                                            <i className="ti ti-x me-1"></i>
                                                                            Non configuré
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewParametre(parametre)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditParametre(parametre)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        {user?.is_superuser && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteParametre(parametre.id)}
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

                                                {filteredParametres.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-settings f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            Aucun paramètre trouvé.
                                                        </p>
                                                        {user?.is_superuser && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier paramètre
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination */}
                                            {filteredParametres.length > 0 && (
                                                <div className="d-flex justify-content-between align-items-center mt-3 p-3 border-top">
                                                    <div>
                                                        <small className="text-muted">
                                                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredParametres.length)} sur {filteredParametres.length} paramètre(s)
                                                        </small>
                                                    </div>
                                                    <nav>
                                                        <ul className="pagination mb-0">
                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToPreviousPage}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <i className="ti ti-chevron-left"></i>
                                                                </button>
                                                            </li>

                                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => paginate(page)}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                </li>
                                                            ))}

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
                        {/* Modal d'ajout réservé aux superadmins */}
                        {user?.is_superuser && (
                            <AjouterParametreModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onParametreAdded={handleParametreAdded}
                            />
                        )}

                        {/* Modal de modification accessible à tous les utilisateurs ayant la permission */}
                        <ModifierParametreModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedParametre(null);
                            }}
                            onParametreUpdated={handleParametreUpdated}
                            parametre={selectedParametre}
                        />

                        <ViewParametreModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedParametre(null);
                            }}
                            parametre={selectedParametre}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionParametres;