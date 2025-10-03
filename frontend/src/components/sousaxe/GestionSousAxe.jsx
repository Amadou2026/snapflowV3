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

    useEffect(() => {
        fetchData();
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

    const handleDeleteSousAxe = async (sousAxeId) => {
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

    // Fonction pour trouver le nom de l'axe par son ID
    const getAxeName = (axeId) => {
        const axe = axes.find(a => a.id === axeId);
        return axe ? axe.nom : 'Axe inconnu';
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
                                                    Gestion des sous-axes
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des sous-axes</h2>
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
                                        <div className="card-body">
                                            <div className="text-end p-4 pb-0">
                                                <button
                                                    className="btn btn-primary d-inline-flex align-items-center"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <i className="ti ti-plus f-18"></i> Ajouter un Sous-Axe
                                                </button>
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
                                                        {sousAxes.map((sousAxe, index) => (
                                                            <tr key={sousAxe.id}>
                                                                <td>{index + 1}</td>
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
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewSousAxe(sousAxe)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditSousAxe(sousAxe)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteSousAxe(sousAxe.id)}
                                                                            title="Supprimer"
                                                                        >
                                                                            <i className="ti ti-trash f-18"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {sousAxes.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-category-2 f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            Aucun sous-axe trouvé.
                                                        </p>
                                                        <button
                                                            className="btn btn-primary btn-sm mt-2"
                                                            onClick={() => setShowAddModal(true)}
                                                        >
                                                            <i className="ti ti-plus me-1"></i>
                                                            Ajouter le premier sous-axe
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        <AjouterSousAxeModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onSousAxeAdded={handleSousAxeAdded}
                            axes={axes}
                        />

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

                        <ViewSousAxeModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedSousAxe(null);
                            }}
                            sousAxe={selectedSousAxe}
                            axes={axes}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionSousAxe;