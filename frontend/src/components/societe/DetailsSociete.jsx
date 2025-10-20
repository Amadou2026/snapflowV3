import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import { AuthContext } from '../../context/AuthContext';

const DetailsSociete = ({ user, logout }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const { societeId } = useParams();
    const navigate = useNavigate();

    const [societe, setSociete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAuthenticated && societeId) {
            fetchSocieteDetails();
        }
    }, [isAuthenticated, societeId]);

    const fetchSocieteDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/societe/${societeId}/`);
            setSociete(response.data);

            console.log('Détails société:', response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des détails de la société:', err);
            setError('Erreur lors du chargement des détails de la société');

            if (err.response?.status === 403) {
                toast.error("Vous n'avez pas les permissions pour voir cette société");
            } else if (err.response?.status === 404) {
                toast.error("Société non trouvée");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSociete = async () => {
        if (!societe) return;

        const result = window.confirm(
            `Êtes-vous sûr de vouloir supprimer la société "${societe.nom}" ? Cette action est irréversible !`
        );

        if (result) {
            try {
                await api.delete(`/societe/${societe.id}/`);
                toast.success('Société supprimée avec succès');
                navigate('/admin/core/societe/');
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                toast.error('Erreur lors de la suppression de la société');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non disponible';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Format invalide';
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
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-3 text-muted">Chargement des détails de la société...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="alert alert-danger" role="alert">
                                    <h4 className="alert-heading">Erreur</h4>
                                    <p className="mb-0">{error}</p>
                                    <button
                                        className="btn btn-outline-danger mt-3"
                                        onClick={() => navigate('/admin/core/societe/')}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Retour à la liste
                                    </button>
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
                                                    <Link to="/admin/core/societe/">Sociétés</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    {societe?.nom || 'Détails'}
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-2">
                                                    <i className="ti ti-building me-2"></i>
                                                    Détails de la Société
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/admin/core/societe/')}
                                        >
                                            <i className="ti ti-arrow-left me-1"></i>
                                            Retour
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/admin/core/societe/${societeId}/edit/`)}
                                        >
                                            <i className="ti ti-edit me-1"></i>
                                            Modifier
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={handleDeleteSociete}
                                        >
                                            <i className="ti ti-trash me-1"></i>
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contenu principal */}
                            <div className="row g-4">
                                {/* Colonne gauche : informations principales */}
                                <div className="col-lg-6">
                                    <div className="card h-100">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-info-circle me-2"></i>
                                                Informations Générales
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-4 text-center">
                                                <h4 className="fw-bold">{societe.nom}</h4>
                                                {societe.url && (
                                                    <p className="text-muted mb-3">
                                                        <a href={societe.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                            <i className="ti ti-link me-1"></i>
                                                            {societe.url}
                                                        </a>
                                                    </p>
                                                )}
                                                <div className="d-flex justify-content-center gap-2 flex-wrap">
                                                    {societe.num_siret && (
                                                        <span className="badge bg-info">SIRET: {societe.num_siret}</span>
                                                    )}
                                                    {societe.secteur_activite && (
                                                        <span className="badge bg-warning">Secteur: {societe.secteur_activite}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Statistiques */}
                                            <div className="row text-center mb-4">
                                                <div className="col-6">
                                                    <div className="border-end">
                                                        <h5 className="fw-bold text-primary mb-1">
                                                            {societe.nombre_projets || (societe.projets ? societe.projets.length : 0)}
                                                        </h5>
                                                        <small className="text-muted">Projets</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div>
                                                        <h5 className="fw-bold text-success mb-1">
                                                            {societe.nombre_employes || (societe.employes ? societe.employes.length : 0)}
                                                        </h5>
                                                        <small className="text-muted">Utilisateurs</small>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dates de création et modification */}
                                            <div className="mb-4">
                                                <div className="row text-center">
                                                    <div className="col-6">
                                                        <div className="border-end">
                                                            <h6 className="text-muted mb-1">
                                                                <i className="ti ti-calendar-plus me-1"></i>
                                                                Ajoutée le
                                                            </h6>
                                                            <small className="fw-semibold">
                                                                {formatDate(societe.date_creation)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div>
                                                            <h6 className="text-muted mb-1">
                                                                <i className="ti ti-calendar-up me-1"></i>
                                                                Modifiée le
                                                            </h6>
                                                            <small className="fw-semibold">
                                                                {formatDate(societe.date_modification)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin de la société */}
                                            {societe.admin && (
                                                <div className="mb-3">
                                                    <h6 className="text-muted mb-2">
                                                        <i className="ti ti-user-cog me-1"></i>
                                                        Administrateur
                                                    </h6>
                                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                                        <div className="avatar avatar-sm bg-secondary rounded-circle me-3 d-flex align-items-center justify-content-center">
                                                            <i className="ti ti-user text-white"></i>
                                                        </div>
                                                        <div>
                                                            <strong className="d-block">
                                                                {societe.admin.full_name || societe.admin}
                                                            </strong>
                                                            <small className="text-muted">
                                                                {societe.admin.email || ''}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Colonne droite : détails et listes */}
                                <div className="col-lg-6">
                                    {/* Section Employés */}
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-users me-2"></i>
                                                Utilisateurs ({societe.nombre_employes || (societe.employes ? societe.employes.length : 0)})
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            {societe.employes && societe.employes.length > 0 ? (
                                                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                    {societe.employes.map((employe, index) => (
                                                        <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                            <div className="avatar avatar-sm bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center">
                                                                <i className="ti ti-user text-white"></i>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <strong className="d-block">
                                                                    {employe.full_name || `${employe.first_name} ${employe.last_name}` || employe}
                                                                </strong>
                                                                <small className="text-muted">
                                                                    {employe.email || ''}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-3">
                                                    <i className="ti ti-users-off" style={{ fontSize: '2rem' }}></i>
                                                    <p className="mb-0 mt-2">Aucun employé assigné</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section Projets */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-checklist me-2"></i>
                                                Projets ({societe.nombre_projets || (societe.projets ? societe.projets.length : 0)})
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            {societe.projets && societe.projets.length > 0 ? (
                                                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                    {societe.projets.map((projet, index) => (
                                                        <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                            <div className="avatar avatar-sm bg-success rounded-circle me-3 d-flex align-items-center justify-content-center">
                                                                <i className="ti ti-clipboard-list text-white"></i>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <strong className="d-block">
                                                                    {projet.nom || projet}
                                                                </strong>
                                                                {projet.charge_de_compte_nom && (
                                                                    <small className="text-muted">
                                                                        Chargé: {projet.charge_de_compte_nom}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-3">
                                                    <i className="ti ti-clipboard-off" style={{ fontSize: '2rem' }}></i>
                                                    <p className="mb-0 mt-2">Aucun projet assigné</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informations complémentaires en bas */}
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-id me-2"></i>
                                                Informations Complémentaires
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">ID Société</label>
                                                        <p className="mb-0 fw-semibold">#{societe.id}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">SIRET</label>
                                                        <p className="mb-0 fw-semibold">{societe.num_siret || 'Non renseigné'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">Secteur d'activité</label>
                                                        <p className="mb-0 fw-semibold">{societe.secteur_activite || 'Non renseigné'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">Statut</label>
                                                        <p className="mb-0">
                                                            <span className="badge bg-success">Active</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Dates détaillées */}
                                            <div className="row mt-3">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">
                                                            <i className="ti ti-calendar-plus me-1"></i>
                                                            Date de création
                                                        </label>
                                                        <p className="mb-0 fw-semibold">
                                                            {formatDate(societe.date_creation)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted mb-1">
                                                            <i className="ti ti-calendar-up me-1"></i>
                                                            Dernière modification
                                                        </label>
                                                        <p className="mb-0 fw-semibold">
                                                            {formatDate(societe.date_modification)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {societe.url && (
                                                <div className="row">
                                                    <div className="col-12">
                                                        <div className="mb-3">
                                                            <label className="form-label text-muted mb-1">Site Web</label>
                                                            <p className="mb-0">
                                                                <a href={societe.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                                    <i className="ti ti-external-link me-1"></i>
                                                                    {societe.url}
                                                                </a>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />
        </div>
    );
};

export default DetailsSociete;