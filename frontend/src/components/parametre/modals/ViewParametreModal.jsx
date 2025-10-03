import React from 'react';

const ViewParametreModal = ({ show, onClose, parametre }) => {
    if (!show || !parametre) return null;

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

    const hasRedmineConfig = parametre.redmine_url && parametre.redmine_api_key;
    const hasEmailConfig = parametre.email_host_user;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header border-0 pb-0">
                        <h5 className="mb-0">
                            <i className="ti ti-settings me-2"></i>
                            Détails des Paramètres
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        <div className="row g-4">
                            {/* Colonne gauche : informations société et statut */}
                            <div className="col-lg-4">
                                <div className="card h-100">
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-building me-2"></i>
                                            Société Associée
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="text-center mb-4">
                                            <div className="avatar avatar-xl bg-info rounded-nocircle mb-3 mx-auto">
                                                <i className="ti ti-building text-white f-24"></i>
                                            </div>
                                            <h4 className="fw-bold">{parametre.societe_nom}</h4>
                                            <p className="text-muted">Configuration système</p>
                                        </div>

                                        {/* Statuts de configuration */}
                                        <div className="mb-4">
                                            <h6 className="text-muted mb-3">
                                                <i className="ti ti-checklist me-1"></i>
                                                État des Configurations
                                            </h6>
                                            <div className="row text-center">
                                                <div className="col-6">
                                                    <div className="border-end">
                                                        <div className={`avatar avatar-sm rounded-nocircle mb-2 mx-auto ${hasRedmineConfig ? 'bg-success' : 'bg-warning'}`}>
                                                            <i className="ti ti-ticket text-white"></i>
                                                        </div>
                                                        <h6 className="fw-bold mb-1">
                                                            {hasRedmineConfig ? '✓' : '✗'}
                                                        </h6>
                                                        <small className="text-muted">Redmine</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div>
                                                        <div className={`avatar avatar-sm rounded-nocircle mb-2 mx-auto ${hasEmailConfig ? 'bg-success' : 'bg-warning'}`}>
                                                            <i className="ti ti-mail text-white"></i>
                                                        </div>
                                                        <h6 className="fw-bold mb-1">
                                                            {hasEmailConfig ? '✓' : '✗'}
                                                        </h6>
                                                        <small className="text-muted">Email</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="mb-3">
                                            <h6 className="text-muted mb-2">
                                                <i className="ti ti-calendar me-1"></i>
                                                Historique
                                            </h6>
                                            <div className="row text-center">
                                                <div className="col-12 mb-2">
                                                    <div className="border-bottom pb-2">
                                                        <h6 className="text-muted mb-1">
                                                            <i className="ti ti-calendar-plus me-1"></i>
                                                            Créée le
                                                        </h6>
                                                        <small className="fw-semibold">
                                                            {formatDate(parametre.date_creation)}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <div>
                                                        <h6 className="text-muted mb-1">
                                                            <i className="ti ti-calendar-up me-1"></i>
                                                            Modifiée le
                                                        </h6>
                                                        <small className="fw-semibold">
                                                            {formatDate(parametre.date_modification)}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ID Configuration */}
                                        <div className="text-center">
                                            <label className="form-label text-muted mb-1">ID Configuration</label>
                                            <p className="mb-0">
                                                <span className="badge bg-secondary">#{parametre.id}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colonne centrale : Configuration Redmine */}
                            <div className="col-lg-4">
                                <div className="card h-100">
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-brand-redmine me-2"></i>
                                            Configuration Redmine
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {hasRedmineConfig ? (
                                            <div className="text-center text-success mb-4">
                                                <i className="ti ti-circle-check f-32 mb-3 d-block"></i>
                                                <h6 className="fw-bold">Redmine Configuré</h6>
                                            </div>
                                        ) : (
                                            <div className="text-center text-warning mb-4">
                                                <i className="ti ti-circle-x f-32 mb-3 d-block"></i>
                                                <h6 className="fw-bold">Redmine Non Configuré</h6>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="form-label fw-semibold text-muted mb-2">
                                                <i className="ti ti-link me-1"></i>
                                                URL Redmine
                                            </label>
                                            <div className="p-3 bg-light rounded">
                                                {parametre.redmine_url ? (
                                                    <div>
                                                        <p className="mb-1 fw-semibold text-truncate">
                                                            {parametre.redmine_url}
                                                        </p>
                                                        <a 
                                                            href={parametre.redmine_url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="btn btn-sm btn-outline-primary mt-2"
                                                        >
                                                            <i className="ti ti-external-link me-1"></i>
                                                            Visiter
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0 text-muted">
                                                        <i className="ti ti-link-off me-1"></i>
                                                        Aucune URL configurée
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-muted mb-2">
                                                <i className="ti ti-key me-1"></i>
                                                Clé API
                                            </label>
                                            <div className="p-3 bg-light rounded">
                                                {parametre.redmine_api_key ? (
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <span className="badge bg-success">
                                                            <i className="ti ti-check me-1"></i>
                                                            Configurée
                                                        </span>
                                                        <small className="text-muted">
                                                            {parametre.redmine_api_key.substring(0, 8)}...
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0 text-muted">
                                                        <i className="ti ti-key-off me-1"></i>
                                                        Aucune clé configurée
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colonne droite : Configuration Email */}
                            <div className="col-lg-4">
                                <div className="card h-100">
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-mail me-2"></i>
                                            Configuration Email
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {hasEmailConfig ? (
                                            <div className="text-center text-success mb-4">
                                                <i className="ti ti-circle-check f-32 mb-3 d-block"></i>
                                                <h6 className="fw-bold">Email Configuré</h6>
                                            </div>
                                        ) : (
                                            <div className="text-center text-warning mb-4">
                                                <i className="ti ti-circle-x f-32 mb-3 d-block"></i>
                                                <h6 className="fw-bold">Email Non Configuré</h6>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="form-label fw-semibold text-muted mb-2">
                                                <i className="ti ti-at me-1"></i>
                                                Email d'envoi
                                            </label>
                                            <div className="p-3 bg-light rounded">
                                                {parametre.email_host_user ? (
                                                    <div>
                                                        <p className="mb-1 fw-semibold">
                                                            {parametre.email_host_user}
                                                        </p>
                                                        <a 
                                                            href={`mailto:${parametre.email_host_user}`}
                                                            className="btn btn-sm btn-outline-primary mt-2"
                                                        >
                                                            <i className="ti ti-send me-1"></i>
                                                            Envoyer un email
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0 text-muted">
                                                        <i className="ti ti-at-off me-1"></i>
                                                        Aucun email configuré
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-muted mb-2">
                                                <i className="ti ti-lock me-1"></i>
                                                Mot de passe
                                            </label>
                                            <div className="p-3 bg-light rounded">
                                                {parametre.email_host_password ? (
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <span className="badge bg-success">
                                                            <i className="ti ti-check me-1"></i>
                                                            Configuré
                                                        </span>
                                                        <small className="text-muted">
                                                            ●●●●●●●●
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0 text-muted">
                                                        <i className="ti ti-lock-off me-1"></i>
                                                        Aucun mot de passe configuré
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Résumé en bas */}
                        {/* <div className="row mt-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header bg-transparent">
                                        <h6 className="mb-0">
                                            <i className="ti ti-summary me-2"></i>
                                            Résumé de Configuration
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-3">
                                                <div className="text-center">
                                                    <div className={`avatar avatar-lg rounded-circle mb-2 mx-auto ${hasRedmineConfig ? 'bg-success' : 'bg-light'}`}>
                                                        <i className={`ti ti-brand-redmine ${hasRedmineConfig ? 'text-white' : 'text-muted'} f-20`}></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-1">
                                                        {hasRedmineConfig ? 'Complet' : 'Incomplet'}
                                                    </h6>
                                                    <small className="text-muted">Redmine</small>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center">
                                                    <div className={`avatar avatar-lg rounded-circle mb-2 mx-auto ${hasEmailConfig ? 'bg-success' : 'bg-light'}`}>
                                                        <i className={`ti ti-mail ${hasEmailConfig ? 'text-white' : 'text-muted'} f-20`}></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-1">
                                                        {hasEmailConfig ? 'Complet' : 'Incomplet'}
                                                    </h6>
                                                    <small className="text-muted">Email</small>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center">
                                                    <div className="avatar avatar-lg rounded-circle bg-info mb-2 mx-auto">
                                                        <i className="ti ti-building text-white f-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-1">{parametre.societe_nom}</h6>
                                                    <small className="text-muted">Société</small>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center">
                                                    <div className="avatar avatar-lg rounded-circle bg-secondary mb-2 mx-auto">
                                                        <i className="ti ti-id text-white f-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-1">#{parametre.id}</h6>
                                                    <small className="text-muted">ID Config</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> */}
                    </div>

                    {/* <div className="modal-footer border-0">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default ViewParametreModal;