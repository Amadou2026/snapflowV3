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
    const [filteredSecteurs, setFilteredSecteurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSecteur, setSelectedSecteur] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSecteurs();
    }, []);

    // Charger les secteurs
    const fetchSecteurs = async () => {
        try {
            const response = await api.get('secteurs/');
            setSecteurs(response.data);
            setFilteredSecteurs(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            toast.error('Erreur lors du chargement des secteurs');
        } finally {
            setLoading(false);
        }
    };

    // Supprimer un secteur
    const handleDeleteSecteur = async (secteurId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) {
            try {
                await api.delete(`secteurs/${secteurId}/`);
                toast.success('Secteur supprimé avec succès');
                const updatedSecteurs = secteurs.filter(secteur => secteur.id !== secteurId);
                setSecteurs(updatedSecteurs);
                setFilteredSecteurs(updatedSecteurs);
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

    // Filtrer les secteurs
    useEffect(() => {
        const filtered = secteurs.filter(secteur =>
            secteur.nom.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSecteurs(filtered);
    }, [searchTerm, secteurs]);

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

                            {/* Barre de recherche */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="ti ti-search"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Rechercher un secteur..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Barre de recherche */}

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
                                                    <i className="ti ti-plus f-18"></i> Ajouter un Secteur
                                                </button>
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
                                                        {filteredSecteurs.map((secteur, index) => (
                                                            <tr key={secteur.id}>
                                                                <td>{index + 1}</td>
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
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewSecteur(secteur)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditSecteur(secteur)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteSecteur(secteur.id)}
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
                                                        {secteurs.length === 0 && (
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        <AjouterSecteurModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onSecteurAdded={handleSecteurAdded}
                        />

                        <ModifierSecteurModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedSecteur(null);
                            }}
                            onSecteurUpdated={handleSecteurUpdated}
                            secteur={selectedSecteur}
                        />

                        <ViewSecteurModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedSecteur(null);
                            }}
                            secteur={selectedSecteur}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionSecteur;