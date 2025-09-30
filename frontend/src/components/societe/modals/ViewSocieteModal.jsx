// src/components/ViewSocieteModal.jsx
import React from 'react';

const ViewSocieteModal = ({ show, onClose, societe }) => {
    if (!show || !societe) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header border-0 pb-0">
                        <h5 className="mb-0">Détails de la Société</h5>
                        <button type="button" className="btn-link-danger" onClick={onClose}>
                            <i className="ti ti-x f-20"></i>
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="row g-3">
                            {/* Colonne gauche : informations générales */}
                            <div className="col-lg-5">
                                <div className="card h-100">
                                    <div className="card-body text-center position-relative">
                                        <div className="position-absolute end-0 top-0 p-3">
                                            <span className="badge bg-primary">Société</span>
                                        </div>
                                        <h4 className="fw-bold">{societe.nom}</h4>
                                        <p className="text-muted text-sm mb-3">{societe.url}</p>
                                        <div className="mb-3">
                                            <span className="badge bg-info me-1">SIRET: {societe.num_siret}</span>
                                            <span className="badge bg-warning">Secteur: {societe.secteur_activite}</span>
                                        </div>
                                        <div className="card-body">
                                        <ul className="list-group list-group-flush">                                            
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Projet associé</p>
                                                <h6 className="mb-0">{societe.projet || 'Non assigné'}</h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Admin</p>
                                                <h6 className="mb-0">{societe.admin || 'Non assigné'}</h6>
                                            </li>
                                            <li className="list-group-item px-0 pb-0">
                                                <p className="mb-1 text-muted">Employés</p>
                                                <h6 className="mb-0">
                                                    {societe.employes && societe.employes.length > 0
                                                        ? societe.employes.join(', ')
                                                        : 'Aucun employé'}
                                                </h6>
                                            </li>
                                        </ul>
                                    </div>
                                    </div>
                                    
                                </div>
                            </div>

                            {/* Colonne droite : détails supplémentaires */}
                            <div className="col-lg-7">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5>Détails supplémentaires</h5>
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Nom</p>
                                                <h6 className="mb-0">{societe.nom}</h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">URL</p>
                                                <h6 className="mb-0">
                                                    <a href={societe.url} target="_blank" rel="noreferrer">
                                                        {societe.url}
                                                    </a>
                                                </h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">SIRET</p>
                                                <h6 className="mb-0">{societe.num_siret}</h6>
                                            </li>
                                            
                                        </ul>
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

export default ViewSocieteModal;
