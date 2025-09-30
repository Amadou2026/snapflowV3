import React from 'react';

const ViewProjetModal = ({ show, onClose, projet }) => {
    if (!show || !projet) return null;

    const formatUrl = (url) => {
        if (!url) return 'Non renseigné';
        return url.startsWith('http') ? url : `https://${url}`;
    };

    const displayUrl = (url) => {
        if (!url) return 'Non renseigné';
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return cleanUrl.length > 30 ? cleanUrl.substring(0, 30) + '...' : cleanUrl;
    };

    // Fonction pour extraire le nom complet du chargé de compte
    const getChargeCompteName = () => {
        if (!projet.charge_de_compte) return 'Non assigné';
        
        if (typeof projet.charge_de_compte === 'object') {
            return `${projet.charge_de_compte.first_name} ${projet.charge_de_compte.last_name}`;
        }
        
        return projet.charge_de_compte;
    };

    // Fonction pour obtenir l'email du chargé de compte
    const getChargeCompteEmail = () => {
        if (!projet.charge_de_compte) return '';
        
        if (typeof projet.charge_de_compte === 'object') {
            return projet.charge_de_compte.email;
        }
        
        return '';
    };

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="mb-0">Détails du Projet</h5>
                        <button type="button" className="btn-link-danger" onClick={onClose}>
                            <i className="ti ti-x f-20"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="row">
                            {/* Colonne gauche : logo et informations principales */}
                            <div className="col-lg-4">
                                <div className="card">
                                    <div className="card-body text-center position-relative">
                                        <div className="position-absolute end-0 top-0 p-3">
                                            <span className="badge bg-primary">Projet</span>
                                        </div>
                                        {projet.logo ? (
                                            <img
                                                src={projet.logo}
                                                alt={projet.nom}
                                                className="rounded-circle img-fluid wid-60 mb-3"
                                            />
                                        ) : (
                                            <div className="rounded-circle img-fluid wid-60 mb-3 bg-light d-flex align-items-center justify-content-center mx-auto">
                                                <i className="ti ti-folder text-muted f-24"></i>
                                            </div>
                                        )}
                                        <h5>{projet.nom}</h5>
                                        <p className="text-muted text-sm">
                                            {projet.id_redmine ? `ID Redmine: ${projet.id_redmine}` : 'Aucun ID Redmine'}
                                        </p>
                                        <hr className="my-3" />
                                        
                                        {/* Chargé de compte */}
                                        <div className="mb-3">
                                            <h6 className="text-muted small mb-2">Chargé de compte</h6>
                                            {projet.charge_de_compte ? (
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center wid-30 hei-30 me-2">
                                                        <i className="ti ti-user f-12"></i>
                                                    </div>
                                                    <div className="text-start">
                                                        <div className="fw-semibold">{getChargeCompteName()}</div>
                                                        {getChargeCompteEmail() && (
                                                            <div className="text-muted small">{getChargeCompteEmail()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="badge bg-light text-dark">
                                                    <i className="ti ti-user-off me-1"></i>
                                                    Non assigné
                                                </span>
                                            )}
                                        </div>

                                        <hr className="my-3" />
                                        
                                        <div className="text-start">
                                            {/* URL du projet */}
                                            {projet.url && (
                                                <div className="mb-2 d-flex align-items-center">
                                                    <i className="ti ti-link me-2 text-muted"></i>
                                                    <a 
                                                        href={formatUrl(projet.url)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary text-decoration-none"
                                                    >
                                                        {displayUrl(projet.url)}
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* ID Redmine Chargé de compte */}
                                            {projet.id_redmine_charge_de_compte && (
                                                <div className="mb-2 d-flex align-items-center">
                                                    <i className="ti ti-id me-2 text-muted"></i>
                                                    <span className="text-muted">
                                                        ID CDC Redmine: <strong>{projet.id_redmine_charge_de_compte}</strong>
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* ID Redmine Projet */}
                                            {projet.id_redmine && (
                                                <div className="mb-2 d-flex align-items-center">
                                                    <i className="ti ti-hash me-2 text-muted"></i>
                                                    <span className="text-muted">
                                                        ID Projet Redmine: <strong>{projet.id_redmine}</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section Équipe du projet */}
                                <div className="card mt-3">
                                    <div className="card-header">
                                        <h6 className="mb-0">
                                            <i className="ti ti-users me-2"></i>
                                            Équipe du projet
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {/* Chargé de compte */}
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center wid-25 hei-25 me-2">
                                                    <i className="ti ti-crown f-10"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold small">Chargé de compte</div>
                                                    <div className="text-muted smaller">
                                                        {projet.charge_de_compte ? getChargeCompteName() : 'Non assigné'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Autres membres de l'équipe */}
                                        {projet.employes && projet.employes.length > 0 ? (
                                            <div>
                                                <h6 className="text-muted small mb-2">Autres membres</h6>
                                                {projet.employes.map((employe, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-2">
                                                        <div className="rounded-circle bg-light text-muted d-flex align-items-center justify-content-center wid-25 hei-25 me-2">
                                                            <i className="ti ti-user f-10"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold small">{employe}</div>
                                                            <div className="text-muted smaller">Membre</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-2">
                                                <i className="ti ti-users-off f-16 mb-1"></i>
                                                <div className="small">Aucun autre membre</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Colonne droite : détails du projet */}
                            <div className="col-lg-8">
                                {/* Informations principales */}
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h5>Informations du projet</h5>
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item px-0 pt-0">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <p className="mb-1 text-muted">Nom du projet</p>
                                                        <h6 className="mb-0">{projet.nom}</h6>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <p className="mb-1 text-muted">ID Redmine</p>
                                                        <h6 className="mb-0">
                                                            {projet.id_redmine ? (
                                                                <span className="badge bg-secondary">{projet.id_redmine}</span>
                                                            ) : (
                                                                <span className="text-muted">Non renseigné</span>
                                                            )}
                                                        </h6>
                                                    </div>
                                                </div>
                                            </li>
                                            
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">URL du projet</p>
                                                <h6 className="mb-0">
                                                    {projet.url ? (
                                                        <a 
                                                            href={formatUrl(projet.url)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-none"
                                                        >
                                                            <i className="ti ti-external-link me-1"></i>
                                                            {displayUrl(projet.url)}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">Non renseigné</span>
                                                    )}
                                                </h6>
                                            </li>
                                            
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Chargé de compte</p>
                                                <h6 className="mb-0">
                                                    {projet.charge_de_compte ? (
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center wid-25 hei-25 me-2">
                                                                <i className="ti ti-user f-10"></i>
                                                            </div>
                                                            <div>
                                                                <div>{getChargeCompteName()}</div>
                                                                {getChargeCompteEmail() && (
                                                                    <div className="text-muted small">{getChargeCompteEmail()}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Non assigné</span>
                                                    )}
                                                </h6>
                                            </li>
                                            
                                            {projet.id_redmine_charge_de_compte && (
                                                <li className="list-group-item px-0">
                                                    <p className="mb-1 text-muted">ID Redmine Chargé de compte</p>
                                                    <h6 className="mb-0">
                                                        <span className="badge bg-light text-dark">
                                                            {projet.id_redmine_charge_de_compte}
                                                        </span>
                                                    </h6>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* Section Contrat */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5>Contrat</h5>
                                    </div>
                                    <div className="card-body">
                                        {projet.contrat ? (
                                            <div className="bg-light p-3 rounded">
                                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                    {projet.contrat}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <i className="ti ti-file-off f-24 text-muted mb-2"></i>
                                                <p className="text-muted mb-0">Aucun contrat renseigné</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProjetModal;