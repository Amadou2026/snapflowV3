import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalScriptsPlanifies = ({ show, onClose }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('stats/scheduled/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-calendar-event me-2 text-success"></i>
                            Scripts Planifiés
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center p-4">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Planning des Exécutions</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Périodicité</th>
                                                            <th>Prochaine Exécution</th>
                                                            <th>Dernière Exécution</th>
                                                            <th>Statut</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((script, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-settings me-2 text-info"></i>
                                                                    {script.configuration_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">{script.projet_nom}</span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        script.periodicite === '1j' ? 'bg-success' :
                                                                        script.periodicite === '1s' ? 'bg-warning' :
                                                                        script.periodicite === '1m' ? 'bg-info' : 'bg-secondary'
                                                                    }`}>
                                                                        {script.periodicite}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-bold text-primary">
                                                                        {script.prochaine_execution || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {script.derniere_execution || 'Jamais'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        script.statut === 'active' ? 'bg-success' : 
                                                                        script.statut === 'inactive' ? 'bg-danger' : 'bg-warning'
                                                                    }`}>
                                                                        {script.statut || 'inconnu'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button className="btn btn-outline-primary" title="Modifier">
                                                                            <i className="ti ti-edit"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-success" title="Exécuter maintenant">
                                                                            <i className="ti ti-player-play"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-warning" title="Désactiver">
                                                                            <i className="ti ti-pause"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Résumé</h6>
                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="text-primary">
                                                        <div className="h4 mb-0">{data.length}</div>
                                                        <small>Total</small>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="text-success">
                                                        <div className="h4 mb-0">
                                                            {data.filter(s => s.statut === 'active').length}
                                                        </div>
                                                        <small>Actifs</small>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="text-warning">
                                                        <div className="h4 mb-0">
                                                            {data.filter(s => s.statut === 'inactive').length}
                                                        </div>
                                                        <small>Inactifs</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Périodicités</h6>
                                            <div className="list-group list-group-flush">
                                                {['1j', '1s', '1m', '2h', '6h'].map(periode => {
                                                    const count = data.filter(s => s.periodicite === periode).length;
                                                    return count > 0 ? (
                                                        <div key={periode} className="list-group-item d-flex justify-content-between">
                                                            <span>Périodicité {periode}</span>
                                                            <span className="badge bg-primary">{count}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Fermer
                        </button>
                        <button type="button" className="btn btn-success">
                            <i className="ti ti-plus me-1"></i>
                            Nouvelle Planification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalScriptsPlanifies;