import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalTestsParJour = ({ show, onClose }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [periode, setPeriode] = useState('7j'); // 7j, 30j, 90j

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show, periode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`stats/tests-par-jour/?periode=${periode}`);
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
                            <i className="ti ti-calendar me-2 text-primary"></i>
                            Tests par Jour
                        </h5>
                        <div className="d-flex gap-2">
                            <select 
                                className="form-select form-select-sm"
                                value={periode}
                                onChange={(e) => setPeriode(e.target.value)}
                            >
                                <option value="7j">7 derniers jours</option>
                                <option value="30j">30 derniers jours</option>
                                <option value="90j">90 derniers jours</option>
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
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Évolution des tests</h6>
                                            <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center bg-light rounded">
                                                <div className="text-center text-muted">
                                                    <i className="ti ti-chart-line f-40 mb-2"></i>
                                                    <p>Graphique d'évolution</p>
                                                    <small>Données: {JSON.stringify(data.slice(0, 3))}</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Statistiques</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Total tests</span>
                                                    <span className="badge bg-primary">{
                                                        data.reduce((sum, item) => sum + (item.total || 0), 0)
                                                    }</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Moyenne/jour</span>
                                                    <span className="badge bg-info">{
                                                        data.length > 0 ? Math.round(data.reduce((sum, item) => sum + (item.total || 0), 0) / data.length) : 0
                                                    }</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>Jour le plus actif</span>
                                                    <span className="badge bg-success">{
                                                        data.length > 0 ? Math.max(...data.map(item => item.total || 0)) : 0
                                                    }</span>
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
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                        <button type="button" className="btn btn-primary">
                            <i className="ti ti-download me-1"></i>
                            Exporter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTestsParJour;