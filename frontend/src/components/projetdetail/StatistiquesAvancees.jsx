import React from 'react';

const StatistiquesAvancees = ({ statistiquesAvancees }) => {
    if (!statistiquesAvancees) {
        return null;
    }

    const {
        executions_30j,
        taux_reussite_30j,
        duree_moyenne_execution,
        configurations_avec_erreurs,
        scripts_plus_utilises
    } = statistiquesAvancees;

    return (
        <div className="card">
            <div className="card-body">
                <h6 className="card-title mb-4">
                    <i className="ti ti-chart-line me-2 text-success"></i>
                    Statistiques avancées (30 derniers jours)
                </h6>
                
                <div className="row g-3">
                    {/* Exécutions des 30 derniers jours */}
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-light-primary border-0">
                            <div className="card-body text-center">
                                <i className="ti ti-player-play text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h4 className="text-primary">{executions_30j || 0}</h4>
                                <small className="text-muted">Exécutions (30j)</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Taux de réussite */}
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-light-success border-0">
                            <div className="card-body text-center">
                                <i className="ti ti-check text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h4 className="text-success">{taux_reussite_30j || 0}%</h4>
                                <small className="text-muted">Taux réussite</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Durée moyenne */}
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-light-info border-0">
                            <div className="card-body text-center">
                                <i className="ti ti-clock text-info mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h4 className="text-info">{duree_moyenne_execution || 0}m</h4>
                                <small className="text-muted">Durée moyenne</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Configurations avec erreurs */}
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-light-warning border-0">
                            <div className="card-body text-center">
                                <i className="ti ti-alert-triangle text-warning mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h4 className="text-warning">{configurations_avec_erreurs || 0}</h4>
                                <small className="text-muted">Configs avec erreurs</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Scripts les plus utilisés */}
                {scripts_plus_utilises && scripts_plus_utilises.length > 0 && (
                    <div className="mt-4">
                        <h6 className="mb-3">Scripts les plus utilisés</h6>
                        <div className="list-group">
                            {scripts_plus_utilises.map((script, index) => (
                                <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-bold">{script.nom}</span>
                                        <small className="text-muted ms-2">- {script.axe}</small>
                                    </div>
                                    <span className="badge bg-primary rounded-pill">
                                        {script.nb_configurations} configs
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatistiquesAvancees;