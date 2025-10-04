import React from 'react';

const ExecutionDetailModal = ({ show, onClose, execution }) => {
    if (!show || !execution) return null;

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Fonction pour calculer la durée
    const calculateDuration = (startedAt, endedAt) => {
        if (!startedAt || !endedAt) return 'N/A';
        
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        const duration = Math.floor((end - start) / 1000); // en secondes
        
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Fonction pour afficher le statut
    const displayStatus = (statut) => {
        const statusConfig = {
            'pending': { class: 'bg-warning', icon: 'ti ti-clock', text: 'En attente' },
            'running': { class: 'bg-info', icon: 'ti ti-refresh', text: 'En cours' },
            'done': { class: 'bg-success', icon: 'ti ti-circle-check', text: 'Concluant' },
            'error': { class: 'bg-danger', icon: 'ti ti-circle-x', text: 'Non concluant' },
            'non_executed': { class: 'bg-secondary', icon: 'ti ti-ban', text: 'Non exécuté' }
        };

        const config = statusConfig[statut] || { class: 'bg-secondary', icon: 'ti ti-help', text: statut };

        return (
            <span className={`badge ${config.class}`}>
                <i className={`${config.icon} me-1`}></i>
                {config.text}
            </span>
        );
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-info-circle me-2"></i>
                            Détails de l'exécution - {execution.configuration_nom || 'N/A'}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="row">
                            {/* Informations générales */}
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <i className="ti ti-info-circle me-2"></i>
                                            Informations générales
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Configuration:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                {execution.configuration_nom || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Projet:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                <span className="badge bg-primary">
                                                    {execution.projet_nom || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Statut:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                {displayStatus(execution.statut)}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Ticket Redmine:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                {execution.ticket_redmine_id ? (
                                                    <span className="badge bg-info">
                                                        #{execution.ticket_redmine_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">Aucun</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dates et durée */}
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <i className="ti ti-clock me-2"></i>
                                            Chronologie
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Début:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                {formatDate(execution.started_at)}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Fin:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                {formatDate(execution.ended_at)}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-4">
                                                <strong>Durée:</strong>
                                            </div>
                                            <div className="col-sm-8">
                                                <span className="badge bg-secondary">
                                                    {calculateDuration(execution.started_at, execution.ended_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rapport détaillé */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">
                                            <i className="ti ti-file-text me-2"></i>
                                            Rapport d'exécution
                                        </h6>
                                        {execution.log_fichier && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => {
                                                    // Télécharger le log
                                                    window.open(execution.log_fichier, '_blank');
                                                }}
                                            >
                                                <i className="ti ti-download me-1"></i>
                                                Télécharger le log complet
                                            </button>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        {execution.rapport ? (
                                            <pre style={{ 
                                                whiteSpace: 'pre-wrap', 
                                                fontSize: '0.875rem',
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                backgroundColor: '#f8f9fa',
                                                padding: '1rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #dee2e6'
                                            }}>
                                                {execution.rapport}
                                            </pre>
                                        ) : (
                                            <div className="text-center text-muted py-4">
                                                <i className="ti ti-file-off f-40 mb-2"></i>
                                                <p>Aucun rapport disponible</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scripts exécutés */}
                        {execution.configuration?.scripts_details && execution.configuration.scripts_details.length > 0 && (
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-script me-2"></i>
                                                Scripts exécutés
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {execution.configuration.scripts_details.map((script, index) => (
                                                    <div key={script.id} className="col-md-6 mb-2">
                                                        <div className="d-flex align-items-center p-2 border rounded">
                                                            <i className="ti ti-script me-2 text-primary"></i>
                                                            <div>
                                                                <strong>{script.nom}</strong>
                                                                {script.description && (
                                                                    <br />
                                                                )}
                                                                <small className="text-muted">
                                                                    {script.description && (
                                                                        <>{script.description.substring(0, 100)}...</>
                                                                    )}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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

export default ExecutionDetailModal;