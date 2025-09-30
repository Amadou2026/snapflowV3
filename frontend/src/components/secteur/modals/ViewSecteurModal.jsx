import React from 'react';

const ViewSecteurModal = ({ show, onClose, secteur }) => {
    if (!show || !secteur) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Détails du secteur</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="row">
                            <div className="col-12">
                                <div className="card bg-light">
                                    <div className="card-body">
                                        <h6 className="card-title text-primary mb-3">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Informations du secteur
                                        </h6>
                                        
                                        <div className="row mb-3">
                                            <div className="col-sm-4">
                                                <strong>ID:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                <span className="badge bg-primary">#{secteur.id}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="row mb-3">
                                            <div className="col-sm-4">
                                                <strong>Nom du secteur:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                <span className="fs-6">{secteur.nom}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="row">
                                            <div className="col-sm-4">
                                                <strong>Statut:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                <span className="badge bg-success">
                                                    <i className="fas fa-check-circle me-1"></i>
                                                    Actif
                                                </span>
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
                            onClick={onClose}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSecteurModal;