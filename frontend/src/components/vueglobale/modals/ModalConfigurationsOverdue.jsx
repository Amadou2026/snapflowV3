import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalConfigurationsOverdue = ({ show, onClose }) => {
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
            const response = await api.get('stats/overdue/');
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
                            <i className="ti ti-alert-octagon me-2 text-danger"></i>
                            Configurations en Retard
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
                                            <h6 className="card-title">Configurations avec Retard d'Exécution</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Dernière Exécution</th>
                                                            <th>Retard</th>
                                                            <th>Périodicité</th>
                                                            <th>Cause Probable</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((config, index) => (
                                                            <tr key={index} className="table-danger">
                                                                <td>
                                                                    <i className="ti ti-settings me-2 text-danger"></i>
                                                                    {config.configuration_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">{config.projet_nom}</span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {config.derniere_execution || 'Jamais'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-danger">
                                                                        {config.retard}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-warning">{config.periodicite}</span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {config.cause || 'Inconnue'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button className="btn btn-outline-success" title="Exécuter maintenant">
                                                                            <i className="ti ti-player-play"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-primary" title="Analyser">
                                                                            <i className="ti ti-search"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-warning" title="Ignorer">
                                                                            <i className="ti ti-clock-off"></i>
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
                                            <h6 className="card-title">Alertes</h6>
                                            <div className="display-4 text-danger fw-bold">{data.length}</div>
                                            <p className="text-muted">Configurations en retard</p>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Types de Retard</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Retard critique ( 24h)</span>
                                                    <span className="badge bg-danger">
                                                        {data.filter(c => c.retard && c.retard.includes('j')).length}
                                                    </span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Retard moyen (2-24h)</span>
                                                    <span className="badge bg-warning">
                                                        {data.filter(c => c.retard && c.retard.includes('h') && parseInt(c.retard) >= 2).length}
                                                    </span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Retard faible ( 2h)</span>
                                                    <span className="badge bg-info">
                                                        {data.filter(c => c.retard && c.retard.includes('h') && parseInt(c.retard) < 2).length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Actions Correctives</h6>
                                            <div className="alert alert-danger">
                                                <i className="ti ti-alert-triangle me-2"></i>
                                                <strong>Actions recommandées :</strong>
                                                <ul className="mt-2 mb-0">
                                                    <li>Vérifier l'état des serveurs</li>
                                                    <li>Contrôler les ressources système</li>
                                                    <li>Examiner les logs de planification</li>
                                                    <li>Redémarrer les services si nécessaire</li>
                                                </ul>
                                            </div>
                                            <div className="d-grid gap-2">
                                                <button className="btn btn-danger">
                                                    <i className="ti ti-player-play me-2"></i>
                                                    Forcer l'Exécution des Retards Critiques
                                                </button>
                                                <button className="btn btn-warning">
                                                    <i className="ti ti-refresh me-2"></i>
                                                    Actualiser les Statuts
                                                </button>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalConfigurationsOverdue;