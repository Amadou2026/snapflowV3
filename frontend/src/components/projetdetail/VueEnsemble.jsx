import React from 'react';

const VueEnsemble = ({ project }) => {
    return (
        <div className="tab-pane fade show active">
            <div className="row">
                <div className="col-md-8">
                    <h6>Description</h6>
                    <p className="text-muted">
                        {project.contrat || 'Aucune description disponible'}
                    </p>

                    <div className="row mt-4">
                        <div className="col-sm-6 col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h6>Sociétés associées</h6>
                                    <h3 className="text-primary">
                                        {project.statistiques?.societes_associees || 0}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h6>Taux de réussite</h6>
                                    <h3 className="text-success">
                                        {project.statistiques?.taux_reussite || 0}%
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h6>Configurations actives</h6>
                                    <h3 className="text-info">
                                        {project.statistiques?.configurations_actives || 0}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <h6>Informations du projet</h6>
                    <div className="list-group list-group-flush">
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="text-muted">Statut:</span>
                            <span className={`badge ${project.est_actif ? 'bg-success' : 'bg-secondary'}`}>
                                {project.est_actif ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="text-muted">Chargé de compte:</span>
                            <strong>
                                {project.charge_de_compte
                                    ? `${project.charge_de_compte.first_name} ${project.charge_de_compte.last_name}`
                                    : 'Non assigné'
                                }
                            </strong>
                        </div>
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="text-muted">URL:</span>
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                Visiter
                            </a>
                        </div>
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="text-muted">Date création:</span>
                            <small className="text-muted">
                                {new Date(project.date_creation).toLocaleDateString('fr-FR')}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VueEnsemble;