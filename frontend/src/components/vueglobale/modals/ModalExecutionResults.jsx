import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalExecutionResults = ({ show, onClose }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtre, setFiltre] = useState('tous');

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show, filtre]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = filtre === 'tous' ? 'stats/execution-results/' : `stats/execution-results/?statut=${filtre}`;
            const response = await api.get(url);
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const stats = {
        total: data.length,
        reussis: data.filter(d => d.statut === 'done').length,
        echecs: data.filter(d => d.statut === 'error').length,
        enCours: data.filter(d => d.statut === 'running').length,
        enAttente: data.filter(d => d.statut === 'pending').length
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-database me-2 text-secondary"></i>
                            Résultats d'Exécution Détaillés
                        </h5>
                        <div className="d-flex gap-2">
                            <select 
                                className="form-select form-select-sm"
                                value={filtre}
                                onChange={(e) => setFiltre(e.target.value)}
                            >
                                <option value="tous">Tous les statuts</option>
                                <option value="done">Réussis</option>
                                <option value="error">Échecs</option>
                                <option value="running">En cours</option>
                                <option value="pending">En attente</option>
                            </select>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
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
                                <div className="col-12 mb-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row text-center">
                                                <div className="col">
                                                    <div className="text-primary">
                                                        <div className="h4 mb-0">{stats.total}</div>
                                                        <small>Total</small>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="text-success">
                                                        <div className="h4 mb-0">{stats.reussis}</div>
                                                        <small>Réussis</small>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="text-danger">
                                                        <div className="h4 mb-0">{stats.echecs}</div>
                                                        <small>Échecs</small>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="text-info">
                                                        <div className="h4 mb-0">{stats.enCours}</div>
                                                        <small>En cours</small>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="text-warning">
                                                        <div className="h4 mb-0">{stats.enAttente}</div>
                                                        <small>En attente</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails des Exécutions</h6>
                                            <div className="table-responsive" style={{ maxHeight: '500px' }}>
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Configuration</th>
                                                            <th>Script</th>
                                                            <th>Début</th>
                                                            <th>Fin</th>
                                                            <th>Durée</th>
                                                            <th>Statut</th>
                                                            <th>Log</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((execution, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <small className="text-muted">#{execution.id}</small>
                                                                </td>
                                                                <td>
                                                                    <small>{execution.configuration_nom}</small>
                                                                </td>
                                                                <td>
                                                                    <small>{execution.script_nom}</small>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">{execution.started_at}</small>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">{execution.ended_at || '-'}</small>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">{execution.duree || '-'}</small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        execution.statut === 'done' ? 'bg-success' :
                                                                        execution.statut === 'error' ? 'bg-danger' :
                                                                        execution.statut === 'running' ? 'bg-info' : 'bg-warning'
                                                                    }`}>
                                                                        {execution.statut}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {execution.log_fichier ? (
                                                                        <button className="btn btn-sm btn-outline-primary">
                                                                            <i className="ti ti-file-text"></i>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
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
                        <button type="button" className="btn btn-primary">
                            <i className="ti ti-download me-1"></i>
                            Exporter les Données
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalExecutionResults;