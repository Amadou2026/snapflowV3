import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalSuccessVsFailed = ({ show, onClose }) => {
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
            const response = await api.get('stats/success-vs-failed-par-jour/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const totalSuccess = data.reduce((sum, item) => sum + (item.success || 0), 0);
    const totalFailed = data.reduce((sum, item) => sum + (item.failed || 0), 0);
    const total = totalSuccess + totalFailed;
    const successRate = total > 0 ? ((totalSuccess / total) * 100).toFixed(1) : 0;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-chart-pie me-2 text-success"></i>
                            Succès vs Échecs par Jour
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
                                            <h6 className="card-title">Taux de Réussite</h6>
                                            <div className="display-4 text-success fw-bold">{successRate}%</div>
                                            <div className="progress mt-3" style={{ height: '20px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${successRate}%` }}
                                                >
                                                    {successRate}%
                                                </div>
                                                <div 
                                                    className="progress-bar bg-danger" 
                                                    style={{ width: `${100 - successRate}%` }}
                                                >
                                                    {100 - successRate}%
                                                </div>
                                            </div>
                                            <div className="row mt-3">
                                                <div className="col-6">
                                                    <div className="text-success">
                                                        <i className="ti ti-circle-check"></i> {totalSuccess}
                                                    </div>
                                                    <small>Succès</small>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-danger">
                                                        <i className="ti ti-circle-x"></i> {totalFailed}
                                                    </div>
                                                    <small>Échecs</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails par Jour</h6>
                                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Succès</th>
                                                            <th>Échecs</th>
                                                            <th>Taux</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.slice(0, 10).map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{item.date}</td>
                                                                <td className="text-success">{item.success || 0}</td>
                                                                <td className="text-danger">{item.failed || 0}</td>
                                                                <td>
                                                                    <span className={`badge ${((item.success || 0) / ((item.success || 0) + (item.failed || 0)) * 100) > 80 ? 'bg-success' : 'bg-warning'}`}>
                                                                        {((item.success || 0) / ((item.success || 0) + (item.failed || 0)) * 100 || 0).toFixed(1)}%
                                                                    </span>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalSuccessVsFailed;