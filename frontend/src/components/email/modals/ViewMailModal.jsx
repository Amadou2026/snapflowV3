import React from 'react';

const ViewMailModal = ({ show, onClose, email }) => {
    const handleClose = () => {
        onClose();
    };

    if (!show || !email) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-eye me-2"></i>
                            Détails de l'email
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="row">
                            <div className="col-12">
                                <div className="card bg-light border-0">
                                    <div className="card-body">
                                        <div className="row align-items-center mb-4">
                                            <div className="col-auto">
                                                <div className="wid-60 hei-60 rounded-circle bg-primary d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-mail text-white f-24"></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="mb-1">{email.email}</h4>
                                                <p className="text-muted mb-0">Email de notification</p>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Adresse email</label>
                                                    <p className="form-control-plaintext">{email.email}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Société</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-light-secondary">
                                                            {email.societe_nom || 'Aucune société'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Statut</label>
                                                    <p className="form-control-plaintext">
                                                        <span className={`badge ${email.est_actif ? 'bg-light-success' : 'bg-light-danger'}`}>
                                                            {email.est_actif ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Créé par</label>
                                                    <p className="form-control-plaintext">
                                                        {email.created_by_name || 'Utilisateur'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Date de création</label>
                                                    <p className="form-control-plaintext">
                                                        {new Date(email.date_creation).toLocaleDateString('fr-FR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">ID</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-light-secondary">{email.id}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                        >
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default ViewMailModal;