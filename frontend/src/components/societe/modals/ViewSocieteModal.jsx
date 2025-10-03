// src/components/ViewSocieteModal.jsx
import React from 'react';

const ViewSocieteModal = ({ show, onClose, societe }) => {
    if (!show || !societe) return null;

    // Fonction pour formater les dates
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

    // Fonction pour formater l'affichage des listes
    const formatList = (items, maxItems = 3) => {
        if (!items || items.length === 0) return 'Aucun';
        if (items.length <= maxItems) return items.join(', ');
        return `${items.slice(0, maxItems).join(', ')} et ${items.length - maxItems} autre(s)`;
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header border-0 pb-0">
                        <h5 className="mb-0">
                            <i className="ti ti-building me-2"></i>
                            Détails de la Société
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        <div className="row g-4">
                            {/* Colonne gauche : informations principales */}
                            <div className="col-lg-6">
                                <div className="card h-100">
                                    <div className="card-header bg-transparent">
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
                                                    <small className="text-muted">Employés</small>
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
                                                    <div className="avatar avatar-sm bg-secondary rounded-circle me-3">
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
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-users me-2"></i>
                                            Employés ({societe.nombre_employes || (societe.employes ? societe.employes.length : 0)})
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {societe.employes && societe.employes.length > 0 ? (
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {societe.employes.map((employe, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                        <div className="avatar avatar-sm bg-primary rounded-circle me-3">
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
                                                <i className="ti ti-users-off f-24 mb-2 d-block"></i>
                                                Aucun employé assigné
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section Projets */}
                                <div className="card">
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-checklist me-2"></i>
                                            Projets ({societe.nombre_projets || (societe.projets ? societe.projets.length : 0)})
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {societe.projets && societe.projets.length > 0 ? (
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {societe.projets.map((projet, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                        <div className="avatar avatar-sm bg-success rounded-circle me-3">
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
                                                <i className="ti ti-clipboard-off f-24 mb-2 d-block"></i>
                                                Aucun projet assigné
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
                                    <div className="card-header bg-transparent">
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

                    <div className="modal-footer border-0">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSocieteModal;