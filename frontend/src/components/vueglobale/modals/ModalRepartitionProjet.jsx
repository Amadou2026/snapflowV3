import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalRepartitionProjet = ({ show, onClose }) => {
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
            const response = await api.get('stats/repartition-projet/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const totalTests = data.reduce((sum, item) => sum + (item.total_tests || 0), 0);

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-chart-pie me-2 text-primary"></i>
                            Répartition des Tests par Projet
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
                                        <div className="card-body">
                                            <h6 className="card-title text-center">Distribution</h6>
                                            <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center bg-light rounded">
                                                <div className="text-center text-muted">
                                                    <i className="ti ti-chart-pie f-40 mb-2"></i>
                                                    <p>Graphique circulaire</p>
                                                    <small>Total: {totalTests} tests</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails par Projet</h6>
                                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Projet</th>
                                                            <th>Tests</th>
                                                            <th>Part</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((projet, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-folder me-1 text-warning"></i>
                                                                    {projet.projet_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-primary">{projet.total_tests}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                                                            <div 
                                                                                className="progress-bar bg-success" 
                                                                                style={{ 
                                                                                    width: `${((projet.total_tests / totalTests) * 100).toFixed(1)}%` 
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {((projet.total_tests / totalTests) * 100).toFixed(1)}%
                                                                        </small>
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

export default ModalRepartitionProjet;