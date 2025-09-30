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

const GestionSocietes = ({ user, logout }) => {
    const [societes, setSocietes] = useState([]);
    const [filteredSocietes, setFilteredSocietes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSociete, setSelectedSociete] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    useEffect(() => {
        fetchSocietes();
    }, []);

    const fetchSocietes = async () => {
        try {
            const response = await api.get('societe/');
            setSocietes(response.data);
            setFilteredSocietes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sociétés:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSociete = async (societeId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
            try {
                await api.delete(`societe/${societeId}/`);
                const updatedSocietes = societes.filter(societe => societe.id !== societeId);
                setSocietes(updatedSocietes);
                setFilteredSocietes(updatedSocietes);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de la société');
            }
        }
    };

    const handleEditSociete = (societe) => {
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
    };

    const handleSocieteUpdated = (updatedSociete) => {
        const updatedSocietes = societes.map(societe =>
            societe.id === updatedSociete.id ? updatedSociete : societe
        );
        setSocietes(updatedSocietes);
        setFilteredSocietes(updatedSocietes);
        setShowEditModal(false);
        setSelectedSociete(null);
    };

    const handleFilterChange = (filtered) => {
        setFilteredSocietes(filtered);
    };

    // Fonction pour formater l'URL
    const formatUrl = (url) => {
        if (!url) return 'Non renseigné';
        // Ajouter https:// si pas de protocole
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        return formattedUrl;
    };

    // Fonction pour raccourcir l'affichage de l'URL
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
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtre */}
                            <FiltreGestionSociete
                                societes={societes}
                                onFilterChange={handleFilterChange}
                            />
                            {/* End Filtre */}

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
                                                    <i className="ti ti-plus f-18"></i> Ajouter une Société
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Société</th>
                                                            <th>SIRET</th>
                                                            <th>Site Web</th>
                                                            <th>Employés</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredSocietes.map((societe, index) => (
                                                            <tr key={societe.id}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-primary d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-building text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{societe.nom}</h6>
                                                                            <p className="text-muted f-12 mb-0">
                                                                                Secteur: {societe.secteur_activite || 'Non défini'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-secondary">
                                                                        {societe.num_siret || 'Non renseigné'}
                                                                    </span>
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
                                                                        <span className="badge bg-light-info">
                                                                            {societe.employes ? societe.employes.length : 0} employé(s)
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewSociete(societe)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditSociete(societe)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteSociete(societe.id)}
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
                                                        {societes.length === 0 && (
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        <AjouterSocieteModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onSocieteAdded={handleSocieteAdded}
                        />

                        <ModifierSocieteModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedSociete(null);
                            }}
                            onSocieteUpdated={handleSocieteUpdated}
                            societe={selectedSociete}
                        />

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