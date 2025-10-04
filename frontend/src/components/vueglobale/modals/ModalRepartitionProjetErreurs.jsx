import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalRepartitionProjetErreurs = ({ show, onClose }) => {
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
            const response = await api.get('stats/repartition-projet-erreurs/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const totalErreurs = data.reduce((sum, item) => sum + (item.nb_erreurs || 0), 0);

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-alert-octagon me-2 text-danger"></i>
                            Répartition des Erreurs par Projet
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
                                            <h6 className="card-title">Total Erreurs</h6>
                                            <div className="display-3 text-danger fw-bold">{totalErreurs}</div>
                                            <p className="text-muted">Erreurs sur tous les projets</p>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Projets à Surveiller</h6>
                                            <div className="list-group list-group-flush">
                                                {data
                                                    .filter(projet => projet.nb_erreurs > 0)
                                                    .sort((a, b) => b.nb_erreurs - a.nb_erreurs)
                                                    .slice(0, 5)
                                                    .map((projet, index) => (
                                                        <div key={index} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span>
                                                                    <i className="ti ti-folder me-2 text-warning"></i>
                                                                    {projet.projet_nom}
                                                                </span>
                                                                <span className="badge bg-danger">{projet.nb_erreurs}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails des Erreurs</h6>
                                            <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Projet</th>
                                                            <th>Erreurs</th>
                                                            <th>Part</th>
                                                            <th>Niveau</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((projet, index) => (
                                                            <tr key={index} className={projet.nb_erreurs > 10 ? 'table-danger' : projet.nb_erreurs > 5 ? 'table-warning' : ''}>
                                                                <td>
                                                                    <i className="ti ti-folder me-1 text-warning"></i>
                                                                    {projet.projet_nom}
                                                                </td>
                                                                <td className="fw-bold text-danger">{projet.nb_erreurs}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                            <div
                                                                                className="progress-bar bg-danger"
                                                                                style={{
                                                                                    width: `${totalErreurs > 0 ? ((projet.nb_erreurs / totalErreurs) * 100).toFixed(1) : 0}%`
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {totalErreurs > 0 ? ((projet.nb_erreurs / totalErreurs) * 100).toFixed(1) : 0}%
                                                                        </small>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${projet.nb_erreurs > 10 ? 'bg-danger' :
                                                                            projet.nb_erreurs > 5 ? 'bg-warning' : 'bg-secondary'
                                                                        }`}>
                                                                        {projet.nb_erreurs > 10 ? 'Élevé' :
                                                                            projet.nb_erreurs > 5 ? 'Moyen' : 'Faible'}
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

export default ModalRepartitionProjetErreurs;