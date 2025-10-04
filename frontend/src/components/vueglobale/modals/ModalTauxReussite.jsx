import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalTauxReussite = ({ show, onClose }) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [periode, setPeriode] = useState('7j');

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show, periode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`stats/taux-reussite/?periode=${periode}`);
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const tauxReussite = data.taux_reussite || 0;
    const couleur = tauxReussite >= 90 ? 'success' : tauxReussite >= 70 ? 'warning' : 'danger';

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-target-arrow me-2 text-success"></i>
                            Taux de Réussite Global
                        </h5>
                        <div className="d-flex gap-2">
                            <select 
                                className="form-select form-select-sm"
                                value={periode}
                                onChange={(e) => setPeriode(e.target.value)}
                            >
                                <option value="7j">7 derniers jours</option>
                                <option value="30j">30 derniers jours</option>
                                <option value="tout">Tout</option>
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
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Taux de Réussite</h6>
                                            <div className={`display-1 text-${couleur} fw-bold`}>
                                                {tauxReussite}%
                                            </div>
                                            <div className="progress mt-4" style={{ height: '30px' }}>
                                                <div 
                                                    className={`progress-bar bg-${couleur}`}
                                                    style={{ width: `${tauxReussite}%` }}
                                                >
                                                    {tauxReussite}%
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <span className={`badge bg-${couleur}`}>
                                                    {tauxReussite >= 90 ? 'Excellent' : 
                                                     tauxReussite >= 70 ? 'Bon' : 
                                                     'À améliorer'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Tests réussis</span>
                                                    <span className="fw-bold text-success">{data.reussis || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Tests échoués</span>
                                                    <span className="fw-bold text-danger">{data.echoues || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Total tests</span>
                                                    <span className="fw-bold text-primary">{data.total_tests || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Période</span>
                                                    <span className="text-muted">{periode}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Recommandations</h6>
                                            <ul className="list-unstyled">
                                                {tauxReussite >= 90 ? (
                                                    <li className="text-success">
                                                        <i className="ti ti-circle-check me-2"></i>
                                                        Excellente performance, continuez ainsi !
                                                    </li>
                                                ) : tauxReussite >= 70 ? (
                                                    <>
                                                        <li className="text-warning">
                                                            <i className="ti ti-alert-triangle me-2"></i>
                                                            Performance correcte, possibilité d'amélioration
                                                        </li>
                                                        <li className="text-warning">
                                                            <i className="ti ti-clock me-2"></i>
                                                            Analyser les causes des échecs
                                                        </li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li className="text-danger">
                                                            <i className="ti ti-alert-octagon me-2"></i>
                                                            Attention, taux de réussite faible
                                                        </li>
                                                        <li className="text-danger">
                                                            <i className="ti ti-settings me-2"></i>
                                                            Réviser les configurations de test
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
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

export default ModalTauxReussite;