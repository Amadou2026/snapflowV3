import React from 'react';

const ScriptsParAxe = ({ scriptsParAxe }) => {
    if (!scriptsParAxe || Object.keys(scriptsParAxe).length === 0) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="text-center py-4">
                        <i className="ti ti-file-text text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted">Aucun script organisé par axe</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-body">
                <h6 className="card-title mb-4">
                    <i className="ti ti-layout-grid me-2 text-primary"></i>
                    Scripts organisés par axe
                </h6>
                
                <div className="accordion" id="scriptsAccordion">
                    {Object.entries(scriptsParAxe).map(([axeNom, axeData], axeIndex) => (
                        <div className="accordion-item" key={axeIndex}>
                            <h2 className="accordion-header">
                                <button 
                                    className="accordion-button collapsed" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target={`#collapseAxe${axeIndex}`}
                                >
                                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                        <span>
                                            <strong>{axeNom}</strong>
                                            {axeData.description && (
                                                <small className="text-muted ms-2">
                                                    - {axeData.description}
                                                </small>
                                            )}
                                        </span>
                                        <span className="badge bg-primary rounded-pill">
                                            {Object.values(axeData.sous_axes || {}).reduce((total, sousAxe) => 
                                                total + (sousAxe.scripts?.length || 0), 0
                                            )} scripts
                                        </span>
                                    </div>
                                </button>
                            </h2>
                            <div id={`collapseAxe${axeIndex}`} className="accordion-collapse collapse" data-bs-parent="#scriptsAccordion">
                                <div className="accordion-body">
                                    {Object.entries(axeData.sous_axes || {}).map(([sousAxeNom, sousAxeData], sousAxeIndex) => (
                                        <div key={sousAxeIndex} className="mb-4">
                                            <h6 className="text-info mb-3">
                                                <i className="ti ti-folder me-2"></i>
                                                {sousAxeNom}
                                                {sousAxeData.description && (
                                                    <small className="text-muted ms-2">
                                                        - {sousAxeData.description}
                                                    </small>
                                                )}
                                                <span className="badge bg-info rounded-pill ms-2">
                                                    {sousAxeData.scripts?.length || 0} scripts
                                                </span>
                                            </h6>
                                            
                                            <div className="row g-3">
                                                {sousAxeData.scripts?.map((script, scriptIndex) => (
                                                    <div key={scriptIndex} className="col-md-6 col-lg-4">
                                                        <div className="card border">
                                                            <div className="card-body p-3">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <h6 className="card-title mb-0 text-truncate" title={script.nom}>
                                                                        {script.nom}
                                                                    </h6>
                                                                    <span className={`badge ${
                                                                        script.priorite_valeur >= 4 ? 'bg-danger' :
                                                                        script.priorite_valeur >= 3 ? 'bg-warning' :
                                                                        script.priorite_valeur >= 2 ? 'bg-info' : 'bg-secondary'
                                                                    }`}>
                                                                        {script.priorite}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <small className="text-muted">
                                                                        {script.total_executions || 0} exécutions
                                                                    </small>
                                                                    <div className="text-end">
                                                                        <small className={`fw-bold ${
                                                                            script.taux_reussite >= 80 ? 'text-success' :
                                                                            script.taux_reussite >= 60 ? 'text-warning' : 'text-danger'
                                                                        }`}>
                                                                            {script.taux_reussite}% réussite
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                
                                                                {script.fichier_url && (
                                                                    <div className="mt-2">
                                                                        <a 
                                                                            href={script.fichier_url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm btn-outline-primary w-100"
                                                                        >
                                                                            <i className="ti ti-download me-1"></i>
                                                                            Télécharger
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScriptsParAxe;