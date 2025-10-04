import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalExecutionConcluantNonConcluant = ({ show, onClose }) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('stats/execution-resultats-concluant-nonconcluant/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const total = (data.concluants || 0) + (data.non_concluants || 0);
    const tauxConcluant = total > 0 ? ((data.concluants / total) * 100).toFixed(1) : 0;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-checklist me-2 text-primary"></i>
                            Résultats Concluants vs Non Concluants
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
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Bilan des Exécutions</h6>
                                            <div className="display-4 text-success fw-bold">{tauxConcluant}%</div>
                                            <p className="text-muted">Taux d'exécutions concluantes</p>
                                            
                                            <div className="progress mt-4" style={{ height: '30px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${tauxConcluant}%` }}
                                                >
                                                    {data.concluants || 0}
                                                </div>
                                                <div 
                                                    className="progress-bar bg-danger" 
                                                    style={{ width: `${100 - tauxConcluant}%` }}
                                                >
                                                    {data.non_concluants || 0}
                                                </div>
                                            </div>
                                            
                                            <div className="row mt-3">
                                                <div className="col-6">
                                                    <div className="text-success">
                                                        <i className="ti ti-circle-check f-24"></i>
                                                        <div className="h4 mb-0">{data.concluants || 0}</div>
                                                        <small>Concluants</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-danger">
                                                        <i className="ti ti-circle-x f-24"></i>
                                                        <div className="h4 mb-0">{data.non_concluants || 0}</div>
                                                        <small>Non Concluants</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Analyse Détailée</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Total exécutions</span>
                                                    <span className="badge bg-primary">{total}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Exécutions concluantes</span>
                                                    <span className="badge bg-success">{data.concluants || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Exécutions non concluantes</span>
                                                    <span className="badge bg-danger">{data.non_concluants || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Taux de réussite</span>
                                                    <span className={`badge ${
                                                        tauxConcluant >= 90 ? 'bg-success' : 
                                                        tauxConcluant >= 70 ? 'bg-warning' : 'bg-danger'
                                                    }`}>
                                                        {tauxConcluant}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Tendance</h6>
                                            <div className="alert alert-info">
                                                <i className="ti ti-trending-up me-2"></i>
                                                <strong>Évolution du taux de réussite</strong>
                                                <div className="mt-2">
                                                    {tauxConcluant >= 90 ? (
                                                        <span className="text-success">
                                                            Excellente performance, stabilité maintenue
                                                        </span>
                                                    ) : tauxConcluant >= 70 ? (
                                                        <span className="text-warning">
                                                            Performance correcte, marge d'amélioration
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger">
                                                            Attention nécessaire, analyse requise
                                                        </span>
                                                    )}
                                                </div>
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

export default ModalExecutionConcluantNonConcluant;