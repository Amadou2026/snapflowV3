import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalTestsParProjet = ({ show, onClose }) => {
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
            const response = await api.get('stats/tests-par-projet/');
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
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-folders me-2 text-info"></i>
                            Tests par Projet
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
                                        <div className="card-body">
                                            <h6 className="card-title">Vue d'ensemble</h6>
                                            <div className="text-center">
                                                <div className="display-4 text-primary fw-bold">{data.length}</div>
                                                <p className="text-muted">Projets actifs</p>
                                                <div className="display-6 text-success">{totalTests}</div>
                                                <p className="text-muted">Total tests</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Répartition par Projet</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Projet</th>
                                                            <th>Tests</th>
                                                            <th>Pourcentage</th>
                                                            <th>Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((projet, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-folder me-2 text-warning"></i>
                                                                    {projet.projet_nom || 'N/A'}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-primary">{projet.total_tests || 0}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="progress" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-success" 
                                                                            style={{ 
                                                                                width: `${((projet.total_tests || 0) / totalTests * 100).toFixed(1)}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        {((projet.total_tests || 0) / totalTests * 100).toFixed(1)}%
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        (projet.total_tests || 0) > 100 ? 'bg-success' : 
                                                                        (projet.total_tests || 0) > 50 ? 'bg-warning' : 'bg-secondary'
                                                                    }`}>
                                                                        { (projet.total_tests || 0) > 100 ? 'Élevé' : 
                                                                          (projet.total_tests || 0) > 50 ? 'Moyen' : 'Faible' }
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

export default ModalTestsParProjet;