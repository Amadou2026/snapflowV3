import React from 'react';

const ProchainesExecutions = ({ prochainesExecutions }) => {
    if (!prochainesExecutions || prochainesExecutions.length === 0) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="text-center py-4">
                        <i className="ti ti-clock text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted">Aucune exécution programmée</p>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card">
            <div className="card-body">
                <h6 className="card-title mb-4">
                    <i className="ti ti-clock me-2 text-warning"></i>
                    Prochaines exécutions programmées
                </h6>
                
                <div className="list-group">
                    {prochainesExecutions.map((execution, index) => (
                        <div key={index} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 className="mb-1">{execution.configuration_nom}</h6>
                                    <small className="text-muted">
                                        <i className="ti ti-building me-1"></i>
                                        {execution.societe_nom}
                                    </small>
                                </div>
                                <span className="badge bg-light-primary text-primary">
                                    {execution.scripts_count} script(s)
                                </span>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">
                                        <i className="ti ti-calendar me-1"></i>
                                        {formatDate(execution.next_execution)}
                                    </small>
                                </div>
                                <div>
                                    <small className="text-success">
                                        <i className="ti ti-clock me-1"></i>
                                        {execution.time_until_execution}
                                    </small>
                                </div>
                            </div>
                            
                            <div className="mt-2">
                                <span className="badge bg-light-info text-info">
                                    {execution.periodicite}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProchainesExecutions;