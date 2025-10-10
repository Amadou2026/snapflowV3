import React from 'react';

const Scripts = ({ project }) => {
    // Fonction pour obtenir la classe de priorité
    const getPriorityClass = (priorite) => {
        switch (priorite) {
            case 5: return 'bg-danger';
            case 4: return 'bg-warning';
            case 3: return 'bg-info';
            case 2: return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    // Fonction pour obtenir le texte de priorité
    const getPriorityText = (priorite) => {
        switch (priorite) {
            case 5: return 'Immédiate';
            case 4: return 'Urgente';
            case 3: return 'Haute';
            case 2: return 'Normale';
            case 1: return 'Basse';
            default: return 'Normale';
        }
    };

    return (
        <div className="tab-pane fade show active">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Scripts du projet ({project.statistiques?.total_scripts || 0})</h6>
                <button className="btn btn-primary btn-sm">
                    <i className="ti ti-plus me-1"></i>
                    Ajouter un script
                </button>
            </div>

            {project.scripts && project.scripts.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead className="table-light">
                            <tr>
                                <th>Nom</th>
                                <th>Axe</th>
                                <th>Sous-axe</th>
                                <th>Priorité</th>
                                <th>Fichier</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.scripts.map((script) => (
                                <tr key={script.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <i className="ti ti-file-code text-primary me-2"></i>
                                            <div>
                                                <strong>{script.nom}</strong>
                                                {script.description && (
                                                    <small className="d-block text-muted">
                                                        {script.description}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-light-primary">
                                            {script.axe_nom || script.axe?.nom || 'Non classé'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-light-secondary">
                                            {script.sous_axe_nom || script.sous_axe?.nom || 'Non classé'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getPriorityClass(script.priorite)}`}>
                                            {script.priorite_nom || getPriorityText(script.priorite)}
                                        </span>
                                    </td>
                                    <td>
                                        {script.fichier ? (
                                            <a
                                                href={script.fichier}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                <i className="ti ti-download me-1"></i>
                                                Télécharger
                                            </a>
                                        ) : (
                                            <span className="text-muted">Aucun fichier</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                title="Éditer le script"
                                            >
                                                <i className="ti ti-edit"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                title="Exécuter le script"
                                            >
                                                <i className="ti ti-player-play"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                title="Voir les logs"
                                            >
                                                <i className="ti ti-file-text"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-5">
                    <i className="ti ti-file-off text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted">Aucun script trouvé pour ce projet</p>
                    <button className="btn btn-primary mt-2">
                        <i className="ti ti-plus me-1"></i>
                        Ajouter le premier script
                    </button>
                </div>
            )}
        </div>
    );
};

export default Scripts;