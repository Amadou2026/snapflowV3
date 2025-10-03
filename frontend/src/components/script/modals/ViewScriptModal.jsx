import React from 'react';

const ViewScriptModal = ({ show, onClose, script, projets, axes, sousAxes, priorityOptions }) => {
    const handleClose = () => {
        onClose();
    };

    // Fonctions pour récupérer les noms des relations
    const getProjetName = (projetId) => {
        const projet = projets.find(p => p.id === projetId);
        return projet ? projet.nom : 'Projet inconnu';
    };

    const getAxeName = (axeId) => {
        const axe = axes.find(a => a.id === axeId);
        return axe ? axe.nom : 'Axe inconnu';
    };

    const getSousAxeName = (sousAxeId) => {
        const sousAxe = sousAxes.find(sa => sa.id === sousAxeId);
        return sousAxe ? sousAxe.nom : 'Sous-axe inconnu';
    };

    // Fonction pour télécharger le fichier
    const handleDownload = () => {
        if (script.fichier) {
            window.open(script.fichier, '_blank');
        }
    };

    if (!show || !script) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-eye me-2"></i>
                            Détails du Script
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
                                                <div className="wid-60 hei-60 rounded-circle bg-success d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-file-code text-white f-24"></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="mb-1">{script.nom}</h4>
                                                <p className="text-muted mb-0">Script d'automatisation</p>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Nom complet</label>
                                                    <p className="form-control-plaintext">{script.nom}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Priorité</label>
                                                    <p className="form-control-plaintext">
                                                        <span className={`badge ${priorityOptions[script.priorite]?.class || 'bg-light-secondary'}`}>
                                                            {priorityOptions[script.priorite]?.label || 'Inconnue'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Projet</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-primary">
                                                            {getProjetName(script.projet)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Axe</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-info">
                                                            {getAxeName(script.axe)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Sous-axe</label>
                                                    <p className="form-control-plaintext">
                                                        <span className="badge bg-warning">
                                                            {getSousAxeName(script.sous_axe)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">Fichier</label>
                                                    <div className="d-flex align-items-center gap-3">
                                                        {script.fichier ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={handleDownload}
                                                                >
                                                                    <i className="ti ti-download me-1"></i>
                                                                    Télécharger le fichier
                                                                </button>
                                                                <small className="text-muted">
                                                                    Fichier disponible
                                                                </small>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">Aucun fichier</span>
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
                                                        <span className="badge bg-light-secondary">{script.id}</span>
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

export default ViewScriptModal;