import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalTestsNonExecute = ({ show, onClose }) => {
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
            const response = await api.get('stats/nombre-test-non-execute/');
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
                            <i className="ti ti-ban me-2 text-warning"></i>
                            Tests Non Exécutés
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
                                <div className="col-md-4">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Total Non Exécutés</h6>
                                            <div className="display-3 text-warning fw-bold">{data.total_non_executes || 0}</div>
                                            <p className="text-muted">Tests en attente</p>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Répartition</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>En retard</span>
                                                    <span className="badge bg-danger">{data.en_retard || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Planifiés</span>
                                                    <span className="badge bg-warning">{data.planifies || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>En pause</span>
                                                    <span className="badge bg-secondary">{data.en_pause || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails des Tests Non Exécutés</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Dernière Exécution</th>
                                                            <th>Statut</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(data.details || []).slice(0, 10).map((test, index) => (
                                                            <tr key={index} className={test.en_retard ? 'table-danger' : 'table-warning'}>
                                                                <td>
                                                                    <i className="ti ti-settings me-2 text-info"></i>
                                                                    {test.configuration_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">{test.projet_nom}</span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {test.derniere_execution || 'Jamais'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        test.en_retard ? 'bg-danger' : 'bg-warning'
                                                                    }`}>
                                                                        {test.en_retard ? 'En retard' : 'Planifié'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <button className="btn btn-sm btn-outline-primary">
                                                                        <i className="ti ti-player-play"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <div className="alert alert-warning">
                                                <i className="ti ti-alert-triangle me-2"></i>
                                                <strong>Recommandations</strong>
                                                <ul className="mt-2 mb-0">
                                                    <li>Vérifier les configurations planifiées</li>
                                                    <li>Contrôler les ressources système</li>
                                                    <li>Examiner les logs de planification</li>
                                                </ul>
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
                        <button type="button" className="btn btn-warning">
                            <i className="ti ti-refresh me-1"></i>
                            Forcer l'Exécution
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTestsNonExecute;