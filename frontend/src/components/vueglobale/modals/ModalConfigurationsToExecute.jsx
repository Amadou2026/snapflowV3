import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalConfigurationsToExecute = ({ show, onClose }) => {
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
            const response = await api.get('stats/to-execute/');
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
                            <i className="ti ti-player-play me-2 text-warning"></i>
                            Campagnes à Exécuter
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
                                            <h6 className="card-title">Campagnes en Attente d'Exécution</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Campagnes</th>
                                                            <th>Projet</th>
                                                            <th>Dernière Exécution</th>
                                                            <th>Prochaine Planifiée</th>
                                                            <th>Statut</th>
                                                            <th>Scripts</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((config, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-settings me-2 text-primary"></i>
                                                                    {config.configuration_nom}
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">{config.projet_nom}</span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {config.derniere_execution || 'Jamais'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-bold text-info">
                                                                        {config.prochaine_execution || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        config.statut === 'pending' ? 'bg-warning' :
                                                                        config.statut === 'ready' ? 'bg-success' :
                                                                        config.statut === 'error' ? 'bg-danger' : 'bg-secondary'
                                                                    }`}>
                                                                        {config.statut}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-info">{config.nb_scripts || 0}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button className="btn btn-outline-success" title="Exécuter maintenant">
                                                                            <i className="ti ti-player-play"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-primary" title="Voir détails">
                                                                            <i className="ti ti-eye"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-warning" title="Modifier">
                                                                            <i className="ti ti-edit"></i>
                                                                        </button>
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
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body text-center">
                                            <h6 className="card-title">Résumé</h6>
                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="text-warning">
                                                        <div className="h4 mb-0">{data.length}</div>
                                                        <small>Total</small>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="text-success">
                                                        <div className="h4 mb-0">
                                                            {data.filter(c => c.statut === 'ready').length}
                                                        </div>
                                                        <small>Prêtes</small>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="text-danger">
                                                        <div className="h4 mb-0">
                                                            {data.filter(c => c.statut === 'error').length}
                                                        </div>
                                                        <small>Erreurs</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Actions Groupées</h6>
                                            <div className="d-grid gap-2">
                                                <button className="btn btn-success">
                                                    <i className="ti ti-player-play me-2"></i>
                                                    Exécuter toutes les campagnes prêtes
                                                </button>
                                                <button className="btn btn-warning">
                                                    <i className="ti ti-refresh me-2"></i>
                                                    Actualiser les Statuts
                                                </button>
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

export default ModalConfigurationsToExecute;