import React from 'react';

const Executions = ({ project }) => {
    // Fonctions utilitaires
    const calculerDuree = (startedAt, endedAt) => {
        if (!startedAt || !endedAt) return '-';
        
        try {
            const start = new Date(startedAt);
            const end = new Date(endedAt);
            const dureeMs = end - start;
            
            if (dureeMs < 0) return '-';
            
            const heures = Math.floor(dureeMs / (1000 * 60 * 60));
            const minutes = Math.floor((dureeMs % (1000 * 60 * 60)) / (1000 * 60));
            const secondes = Math.floor((dureeMs % (1000 * 60)) / 1000);
            
            if (heures > 0) return `${heures}h ${minutes}m ${secondes}s`;
            if (minutes > 0) return `${minutes}m ${secondes}s`;
            return `${secondes}s`;
        } catch {
            return '-';
        }
    };

    const getStatutText = (statut) => {
        switch (statut) {
            case 'done': return 'Concluant';
            case 'error': return 'Non concluant';
            case 'running': return 'En cours';
            case 'pending': return 'En attente';
            case 'non_executed': return 'Non exécuté';
            default: return statut;
        }
    };

    const getStatutClass = (statut) => {
        switch (statut) {
            case 'done': return 'bg-success';
            case 'error': return 'bg-danger';
            case 'running': return 'bg-warning';
            case 'pending': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    return (
        <div className="tab-pane fade show active">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0">Historique des Exécutions</h6>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm">
                        <i className="ti ti-filter me-1"></i>
                        Filtrer
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                        <i className="ti ti-download me-1"></i>
                        Exporter
                    </button>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="row mb-4">
                <div className="col-sm-6 col-md-3">
                    <div className="card bg-light-primary">
                        <div className="card-body text-center">
                            <i className="ti ti-player-play text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                            <h5 className="text-primary">{project.statistiques?.total_executions || 0}</h5>
                            <small className="text-muted">Total exécutions</small>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-md-3">
                    <div className="card bg-light-success">
                        <div className="card-body text-center">
                            <i className="ti ti-circle-check text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                            <h5 className="text-success">{project.statistiques?.executions_reussies || 0}</h5>
                            <small className="text-muted">Réussies</small>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-md-3">
                    <div className="card bg-light-danger">
                        <div className="card-body text-center">
                            <i className="ti ti-circle-x text-danger mb-2" style={{ fontSize: '1.5rem' }}></i>
                            <h5 className="text-danger">{project.statistiques?.executions_echecs || 0}</h5>
                            <small className="text-muted">Échecs</small>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-md-3">
                    <div className="card bg-light-info">
                        <div className="card-body text-center">
                            <i className="ti ti-chart-line text-info mb-2" style={{ fontSize: '1.5rem' }}></i>
                            <h5 className="text-info">{project.statistiques?.taux_reussite || 0}%</h5>
                            <small className="text-muted">Taux de réussite</small>
                        </div>
                    </div>
                </div>
            </div>

            {project.dernieres_executions && project.dernieres_executions.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead className="table-light">
                            <tr>
                                <th>Configuration</th>
                                <th>Statut</th>
                                <th>Début</th>
                                <th>Fin</th>
                                <th>Durée</th>
                                <th>Ticket Redmine</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.dernieres_executions.map((execution) => {
                                const dureeAffichee = execution.duree || 
                                    (execution.started_at && execution.ended_at ? 
                                        calculerDuree(execution.started_at, execution.ended_at) : 
                                        '-'
                                    );

                                return (
                                    <tr key={execution.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <i className="ti ti-settings text-primary me-2"></i>
                                                <div>
                                                    <strong>{execution.configuration_nom}</strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatutClass(execution.statut)}`}>
                                                {getStatutText(execution.statut)}
                                            </span>
                                        </td>
                                        <td>
                                            {execution.started_at ? (
                                                <div>
                                                    <div className="fw-medium">
                                                        {new Date(execution.started_at).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <small className="text-muted">
                                                        {new Date(execution.started_at).toLocaleTimeString('fr-FR')}
                                                    </small>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {execution.ended_at ? (
                                                <div>
                                                    <div className="fw-medium">
                                                        {new Date(execution.ended_at).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <small className="text-muted">
                                                        {new Date(execution.ended_at).toLocaleTimeString('fr-FR')}
                                                    </small>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="fw-medium text-primary">
                                                {dureeAffichee}
                                            </span>
                                        </td>
                                        <td>
                                            {execution.ticket_redmine_id ? (
                                                <a
                                                    href={`https://maintenance.medianet.tn/issues/${execution.ticket_redmine_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-danger"
                                                >
                                                    <i className="ti ti-external-link me-1"></i>
                                                    #{execution.ticket_redmine_id}
                                                </a>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Voir les détails"
                                                >
                                                    <i className="ti ti-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    title="Voir les logs"
                                                >
                                                    <i className="ti ti-file-text"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    title="Télécharger rapport"
                                                >
                                                    <i className="ti ti-download"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-5">
                    <i className="ti ti-player-play-off text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted">Aucune exécution trouvée pour ce projet</p>
                    <button className="btn btn-primary mt-2">
                        <i className="ti ti-player-play me-1"></i>
                        Lancer une exécution
                    </button>
                </div>
            )}
        </div>
    );
};

export default Executions;