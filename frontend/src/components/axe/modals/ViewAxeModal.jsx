import React from 'react';

const ViewAxeModal = ({ show, onClose, axe }) => {
    const handleClose = () => {
        onClose();
    };

    if (!show || !axe) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-eye me-2"></i>
                            Détails de l'Axe
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
                                                <div className="wid-60 hei-60 rounded-circle bg-info d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-category text-white f-24"></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="mb-1">{axe.nom}</h4>
                                                <p className="text-muted mb-0">Axe stratégique</p>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Nom complet</label>
                                                    <p className="form-control-plaintext">{axe.nom}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Description</label>
                                                    <div className="border rounded p-3 bg-white">
                                                        {axe.description ? (
                                                            <p className="mb-0">{axe.description}</p>
                                                        ) : (
                                                            <p className="mb-0 text-muted">Aucune description fournie</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">ID</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-light-secondary">{axe.id}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                        >
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAxeModal;