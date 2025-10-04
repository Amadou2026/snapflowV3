import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalScriptsTests = ({ show, onClose }) => {
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
            const response = await api.get('stats/scripts-tests/');
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
                            <i className="ti ti-script me-2 text-info"></i>
                            Statistiques des Scripts de Test
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
                                            <h6 className="card-title">Performance des Scripts</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Script</th>
                                                            <th>Total Exécutions</th>
                                                            <th>Réussites</th>
                                                            <th>Échecs</th>
                                                            <th>Taux Réussite</th>
                                                            <th>Dernière Exécution</th>
                                                            <th>Performance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((script, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-script me-2 text-primary"></i>
                                                                    {script.script_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-secondary">{script.total_executions}</span>
                                                                </td>
                                                                <td className="text-success fw-bold">{script.reussites}</td>
                                                                <td className="text-danger">{script.echecs}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                            <div 
                                                                                className={`progress-bar ${
                                                                                    script.taux_reussite >= 90 ? 'bg-success' : 
                                                                                    script.taux_reussite >= 70 ? 'bg-warning' : 'bg-danger'
                                                                                }`}
                                                                                style={{ width: `${script.taux_reussite}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className={`badge ${
                                                                            script.taux_reussite >= 90 ? 'bg-success' : 
                                                                            script.taux_reussite >= 70 ? 'bg-warning' : 'bg-danger'
                                                                        }`}>
                                                                            {script.taux_reussite}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {script.derniere_execution || 'N/A'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        script.taux_reussite >= 90 ? 'bg-success' : 
                                                                        script.taux_reussite >= 70 ? 'bg-warning' : 'bg-danger'
                                                                    }`}>
                                                                        {script.taux_reussite >= 90 ? 'Excellent' : 
                                                                         script.taux_reussite >= 70 ? 'Bon' : 'À améliorer'}
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
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Scripts les Plus Utilisés</h6>
                                            <div className="list-group list-group-flush">
                                                {data
                                                    .sort((a, b) => b.total_executions - a.total_executions)
                                                    .slice(0, 5)
                                                    .map((script, index) => (
                                                        <div key={index} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span>
                                                                    <i className="ti ti-script me-2 text-info"></i>
                                                                    {script.script_nom}
                                                                </span>
                                                                <span className="badge bg-primary">{script.total_executions}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Scripts les Plus Fiables</h6>
                                            <div className="list-group list-group-flush">
                                                {data
                                                    .filter(s => s.total_executions > 0)
                                                    .sort((a, b) => b.taux_reussite - a.taux_reussite)
                                                    .slice(0, 5)
                                                    .map((script, index) => (
                                                        <div key={index} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span>
                                                                    <i className="ti ti-script me-2 text-success"></i>
                                                                    {script.script_nom}
                                                                </span>
                                                                <span className="badge bg-success">{script.taux_reussite}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
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

export default ModalScriptsTests;