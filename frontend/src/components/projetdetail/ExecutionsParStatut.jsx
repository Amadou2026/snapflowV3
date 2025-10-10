import React from 'react';

const ExecutionsParStatut = ({ executionsParStatut }) => {
    if (!executionsParStatut || Object.keys(executionsParStatut).length === 0) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="text-center py-4">
                        <i className="ti ti-chart-pie text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted">Aucune donnée d'exécution disponible</p>
                    </div>
                </div>
            </div>
        );
    }

    const total = Object.values(executionsParStatut).reduce((sum, stat) => sum + stat.count, 0);

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'done': return 'success';
            case 'error': return 'danger';
            case 'running': return 'info';
            case 'pending': return 'warning';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'done': return 'ti-check';
            case 'error': return 'ti-x';
            case 'running': return 'ti-refresh';
            case 'pending': return 'ti-clock';
            default: return 'ti-help';
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <h6 className="card-title mb-4">
                    <i className="ti ti-chart-pie me-2 text-info"></i>
                    Répartition des exécutions par statut
                </h6>
                
                <div className="row">
                    {/* Diagramme circulaire simplifié */}
                    <div className="col-md-6">
                        <div className="d-flex flex-column align-items-center">
                            <div className="position-relative mb-3" style={{ width: '150px', height: '150px' }}>
                                {/* Cercle de fond */}
                                <div 
                                    className="position-absolute rounded-circle"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#f8f9fa',
                                        border: '2px solid #e9ecef'
                                    }}
                                ></div>
                                
                                {/* Segments du diagramme */}
                                {Object.entries(executionsParStatut).map(([statut, data], index, array) => {
                                    const percentage = data.pourcentage;
                                    const offset = array.slice(0, index).reduce((sum, [, prevData]) => 
                                        sum + prevData.pourcentage, 0
                                    );
                                    
                                    return (
                                        <div
                                            key={statut}
                                            className="position-absolute rounded-circle"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                background: `conic-gradient(
                                                    var(--bs-${getStatusColor(statut)}) 0% ${offset}%,
                                                    var(--bs-${getStatusColor(statut)}) ${offset}% ${offset + percentage}%,
                                                    transparent ${offset + percentage}% 100%
                                                )`
                                            }}
                                        ></div>
                                    );
                                })}
                            </div>
                            <small className="text-muted">Total: {total} exécutions</small>
                        </div>
                    </div>
                    
                    {/* Légende */}
                    <div className="col-md-6">
                        <div className="d-flex flex-column gap-2">
                            {Object.entries(executionsParStatut).map(([statut, data]) => (
                                <div key={statut} className="d-flex justify-content-between align-items-center p-2 border rounded">
                                    <div className="d-flex align-items-center">
                                        <i className={`ti ${getStatusIcon(statut)} text-${getStatusColor(statut)} me-2`}></i>
                                        <span>{data.label}</span>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold">{data.count}</div>
                                        <small className="text-muted">{data.pourcentage}%</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionsParStatut;