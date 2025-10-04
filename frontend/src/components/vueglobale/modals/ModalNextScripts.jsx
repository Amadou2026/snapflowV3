import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalNextScripts = ({ show, onClose }) => {
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
            const response = await api.get('stats/next-scripts/');
            setData(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const maintenant = new Date();
    const prochaines24h = data.filter(script => {
        if (!script.prochaine_execution) return false;
        const dateExecution = new Date(script.prochaine_execution);
        const diffHeures = (dateExecution - maintenant) / (1000 * 60 * 60);
        return diffHeures <= 24;
    });

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-clock-play me-2 text-info"></i>
                            Prochaines Exécutions
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
                                        <div className="card-body text-center">
                                            <h6 className="card-title">À Venir</h6>
                                            <div className="display-4 text-primary fw-bold">{prochaines24h.length}</div>
                                            <p className="text-muted">Dans les 24h</p>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Prochaines Urgentes</h6>
                                            <div className="list-group list-group-flush">
                                                {data
                                                    .slice(0, 5)
                                                    .map((script, index) => (
                                                        <div key={index} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <small className="fw-bold">{script.configuration_nom}</small>
                                                                    <br />
                                                                    <small className="text-muted">{script.prochaine_execution}</small>
                                                                </div>
                                                                <span className={`badge ${
                                                                    script.priorite === 'haute' ? 'bg-danger' : 'bg-warning'
                                                                }`}>
                                                                    {script.priorite}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Calendrier des Exécutions</h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Prochaine Exécution</th>
                                                            <th>Dans</th>
                                                            <th>Périodicité</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.map((script, index) => {
                                                            const maintenant = new Date();
                                                            const prochaineExec = new Date(script.prochaine_execution);
                                                            const diffMinutes = Math.floor((prochaineExec - maintenant) / (1000 * 60));
                                                            const diffHeures = Math.floor(diffMinutes / 60);
                                                            const jours = Math.floor(diffHeures / 24);

                                                            let dansText = '';
                                                            let badgeClass = 'bg-secondary';
                                                            
                                                            if (diffMinutes < 60) {
                                                                dansText = `${diffMinutes} min`;
                                                                badgeClass = 'bg-danger';
                                                            } else if (diffHeures < 24) {
                                                                dansText = `${diffHeures} h`;
                                                                badgeClass = 'bg-warning';
                                                            } else {
                                                                dansText = `${jours} j`;
                                                                badgeClass = 'bg-info';
                                                            }

                                                            return (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <i className="ti ti-settings me-2 text-primary"></i>
                                                                        {script.configuration_nom}
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-light-primary">{script.projet_nom}</span>
                                                                    </td>
                                                                    <td>
                                                                        <small className="fw-bold">{script.prochaine_execution}</small>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${badgeClass}`}>{dansText}</span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-secondary">{script.periodicite}</span>
                                                                    </td>
                                                                    <td>
                                                                        <button className="btn btn-sm btn-outline-success">
                                                                            <i className="ti ti-player-play"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
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
                        <button type="button" className="btn btn-info">
                            <i className="ti ti-calendar me-1"></i>
                            Voir Calendrier Complet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalNextScripts;