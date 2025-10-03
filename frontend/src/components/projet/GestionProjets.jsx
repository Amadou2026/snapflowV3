import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../../services/api';
import AjouterProjetModal from './modals/AjouterProjetModal';
import ModifierProjetModal from './modals/ModifierProjetModal';
import ViewProjetModal from './modals/ViewProjetModal';
import IntegrationExterne from './IntegrationExterne';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';

const MySwal = withReactContent(Swal);

const GestionProjets = ({ user, logout }) => {
    const [projets, setProjets] = useState([]);
    const [filteredProjets, setFilteredProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjet, setSelectedProjet] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isSuperAdmin = user?.is_superuser;

    useEffect(() => {
        fetchProjets();
    }, []);

    useEffect(() => {
        filterProjets();
    }, [searchTerm, projets]);

    const fetchProjets = async () => {
        try {
            const response = await api.get('projets/');
            setProjets(response.data);
            setFilteredProjets(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProjets = () => {
        if (!searchTerm) {
            setFilteredProjets(projets);
            return;
        }

        const filtered = projets.filter(projet =>
            projet.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (projet.id_redmine && projet.id_redmine.toString().includes(searchTerm))
        );
        setFilteredProjets(filtered);
    };

    const handleDeleteProjet = async (projetId) => {
        const projetToDelete = projets.find(p => p.id === projetId);
        
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `
                <div class="text-start">
                    <p>Vous êtes sur le point de supprimer le projet :</p>
                    <div class="alert alert-warning mt-2">
                        <strong>${projetToDelete.nom}</strong><br/>
                        <small class="text-muted">
                            ${projetToDelete.id_redmine ? `ID Redmine: ${projetToDelete.id_redmine}` : 'Aucun ID Redmine'}
                        </small>
                    </div>
                    <p class="text-danger mt-3">
                        <i class="ti ti-alert-triangle me-1"></i>
                        Cette action est irréversible et supprimera toutes les données associées !
                    </p>
                </div>
            `,
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
            },
            buttonsStyling: false,
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    await api.delete(`projets/${projetId}/`);
                    return true;
                } catch (error) {
                    MySwal.showValidationMessage(
                        `Erreur: ${error.response?.data?.detail || 'Erreur de suppression'}`
                    );
                    return false;
                }
            }
        });

        if (result.isConfirmed) {
            // Mettre à jour la liste des projets
            const updatedProjets = projets.filter(projet => projet.id !== projetId);
            setProjets(updatedProjets);
            setFilteredProjets(updatedProjets);
            
            // Afficher un message de succès
            MySwal.fire({
                title: 'Supprimé !',
                text: 'Le projet a été supprimé avec succès.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-success'
                },
                buttonsStyling: false
            });
        }
    };

    const handleEditProjet = (projet) => {
        setSelectedProjet(projet);
        setShowEditModal(true);
    };

    const handleViewProjet = (projet) => {
        setSelectedProjet(projet);
        setShowViewModal(true);
    };

    const handleProjetAdded = (newProjet) => {
        const updatedProjets = [...projets, newProjet];
        setProjets(updatedProjets);
        setFilteredProjets(updatedProjets);
        setShowAddModal(false);
        
        // Message de succès
        MySwal.fire({
            title: 'Succès !',
            text: 'Projet créé avec succès',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn btn-success'
            },
            buttonsStyling: false
        });
    };

    const handleProjetUpdated = (updatedProjet) => {
        const updatedProjets = projets.map(projet =>
            projet.id === updatedProjet.id ? updatedProjet : projet
        );
        setProjets(updatedProjets);
        setFilteredProjets(updatedProjets);
        setShowEditModal(false);
        setSelectedProjet(null);
        
        // Message de succès
        MySwal.fire({
            title: 'Succès !',
            text: 'Projet modifié avec succès',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn btn-success'
            },
            buttonsStyling: false
        });
    };

    // NOUVELLE FONCTION : Recharger les projets après import
    const handleProjetImported = () => {
        fetchProjets(); // Recharge la liste des projets
    };

    const formatUrl = (url) => {
        if (!url) return 'Non renseigné';
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        return formattedUrl;
    };

    const displayUrl = (url) => {
        if (!url) return 'Non renseigné';
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return cleanUrl.length > 30 ? cleanUrl.substring(0, 30) + '...' : cleanUrl;
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
                                                    Gestion des projets
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des projets</h2>
                                                {isSuperAdmin && (
                                                    <p className="text-muted mb-0">
                                                        <i className="ti ti-crown me-1 text-warning"></i>
                                                        Mode Super Administrateur - Accès complet aux intégrations externes
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AJOUT DU COMPOSANT D'INTÉGRATION EXTERNE */}
                            {isSuperAdmin && (
                                <IntegrationExterne 
                                    user={user}
                                    onProjetImported={handleProjetImported}
                                />
                            )}

                            {/* Section recherche (après l'intégration externe) */}
                            <div className="row mb-3">
                                <div className="col-sm-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row align-items-center">
                                                <div className="col-md-6">
                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            <i className="ti ti-search"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Rechercher un projet..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 text-end mt-3 mt-md-0">
                                                    <span className="text-muted me-3">
                                                        {filteredProjets.length} projet(s) trouvé(s)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="text-end p-4 pb-0">
                                                <button
                                                    className="btn btn-primary d-inline-flex align-items-center"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <i className="ti ti-plus f-18"></i> Ajouter un Projet
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Projet</th>
                                                            <th>ID Redmine</th>
                                                            <th>URL</th>
                                                            <th>Chargé de Compte</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredProjets.map((projet, index) => (
                                                            <tr key={projet.id}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            {projet.logo ? (
                                                                                <img
                                                                                    src={projet.logo}
                                                                                    alt={projet.nom}
                                                                                    className="wid-80 hei-40 rounded"
                                                                                />
                                                                            ) : (
                                                                                <div className="wid-40 hei-40 rounded bg-primary d-flex align-items-center justify-content-center">
                                                                                    <i className="ti ti-folder text-white"></i>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{projet.nom}</h6>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-secondary">
                                                                        {projet.id_redmine || 'Non renseigné'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {projet.url ? (
                                                                        <a
                                                                            href={formatUrl(projet.url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary"
                                                                            title={projet.url}
                                                                        >
                                                                            <i className="ti ti-external-link me-1"></i>
                                                                            {displayUrl(projet.url)}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-muted">Non renseigné</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {projet.charge_de_compte_nom ? (
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="ti ti-user me-1 text-muted"></i>
                                                                            <div>
                                                                                <div>{projet.charge_de_compte_nom}</div>
                                                                                {projet.charge_de_compte_email && (
                                                                                    <small className="text-muted">{projet.charge_de_compte_email}</small>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">Non assigné</span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewProjet(projet)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditProjet(projet)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteProjet(projet.id)}
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

                                                {filteredProjets.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-folder f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {projets.length === 0 ?
                                                                'Aucun projet trouvé.' :
                                                                'Aucun projet ne correspond aux critères de recherche.'
                                                            }
                                                        </p>
                                                        {projets.length === 0 && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier projet
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AjouterProjetModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onProjetAdded={handleProjetAdded}
                        />

                        <ModifierProjetModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedProjet(null);
                            }}
                            onProjetUpdated={handleProjetUpdated}
                            projet={selectedProjet}
                        />

                        <ViewProjetModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedProjet(null);
                            }}
                            projet={selectedProjet}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionProjets;