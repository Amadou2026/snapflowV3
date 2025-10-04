import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalTauxErreurScript = ({ show, onClose }) => {
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
            const response = await api.get('stats/taux-erreur-par-script/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const topScriptsAvecErreurs = data
        .filter(script => script.taux_erreur > 0)
        .sort((a, b) => b.taux_erreur - a.taux_erreur)
        .slice(0, 10);

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-alert-triangle me-2 text-danger"></i>
                            Taux d'Erreur par Script
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
                                            <h6 className="card-title">Scripts avec le plus d'erreurs</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Script</th>
                                                            <th>Total Exécutions</th>
                                                            <th>Échecs</th>
                                                            <th>Taux d'Erreur</th>
                                                            <th>Niveau d'Alerte</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {topScriptsAvecErreurs.map((script, index) => (
                                                            <tr key={index} className={script.taux_erreur > 50 ? 'table-danger' : script.taux_erreur > 20 ? 'table-warning' : ''}>
                                                                <td>
                                                                    <i className="ti ti-script me-2 text-info"></i>
                                                                    {script.script_nom}
                                                                </td>
                                                                <td>{script.total_executions}</td>
                                                                <td className="text-danger fw-bold">{script.nb_erreurs}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                            <div 
                                                                                className={`progress-bar ${
                                                                                    script.taux_erreur > 50 ? 'bg-danger' : 
                                                                                    script.taux_erreur > 20 ? 'bg-warning' : 'bg-info'
                                                                                }`}
                                                                                style={{ width: `${script.taux_erreur}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className={`badge ${
                                                                            script.taux_erreur > 50 ? 'bg-danger' : 
                                                                            script.taux_erreur > 20 ? 'bg-warning' : 'bg-info'
                                                                        }`}>
                                                                            {script.taux_erreur}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        script.taux_erreur > 50 ? 'bg-danger' : 
                                                                        script.taux_erreur > 20 ? 'bg-warning' : 'bg-secondary'
                                                                    }`}>
                                                                        {script.taux_erreur > 50 ? 'Critique' : 
                                                                         script.taux_erreur > 20 ? 'Élevé' : 'Normal'}
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
                                        <div className="card-body">
                                            <h6 className="card-title">Statistiques Globales</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Scripts avec erreurs</span>
                                                    <span className="badge bg-danger">
                                                        {data.filter(s => s.taux_erreur > 0).length}
                                                    </span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Scripts sans erreur</span>
                                                    <span className="badge bg-success">
                                                        {data.filter(s => s.taux_erreur === 0).length}
                                                    </span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Taux d'erreur moyen</span>
                                                    <span className="badge bg-warning">
                                                        {data.length > 0 ? 
                                                            (data.reduce((sum, s) => sum + s.taux_erreur, 0) / data.length).toFixed(1) + '%' : 
                                                            '0%'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Actions Recommandées</h6>
                                            <div className="alert alert-warning">
                                                <i className="ti ti-alert-triangle me-2"></i>
                                                <strong>Scripts critiques détectés</strong>
                                                <ul className="mt-2 mb-0">
                                                    <li>Vérifier la configuration des scripts à fort taux d'erreur</li>
                                                    <li>Analyser les logs d'erreur détaillés</li>
                                                    <li>Mettre à jour les scripts problématiques</li>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTauxErreurScript;