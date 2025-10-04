import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModalScriptsEnAttente = ({ show, onClose }) => {
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
            const response = await api.get('stats/scripts-en-attente/');
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-clock me-2 text-warning"></i>
                            Scripts en Attente d'Exécution
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
                                            <h6 className="card-title">Total en Attente</h6>
                                            <div className="display-3 text-warning fw-bold">{data.total_en_attente || 0}</div>
                                            <p className="text-muted">Scripts en file d'attente</p>
                                        </div>
                                    </div>
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h6 className="card-title">Statut de la File</h6>
                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>En attente</span>
                                                    <span className="badge bg-warning">{data.en_attente || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>Planifiés</span>
                                                    <span className="badge bg-info">{data.planifies || 0}</span>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between">
                                                    <span>En pause</span>
                                                    <span className="badge bg-secondary">{data.en_pause || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">Détails des Scripts en Attente</h6>
                                            <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Script</th>
                                                            <th>Configuration</th>
                                                            <th>Projet</th>
                                                            <th>Depuis</th>
                                                            <th>Priorité</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(data.details || []).map((script, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <i className="ti ti-script me-2 text-primary"></i>
                                                                    {script.script_nom}
                                                                </td>
                                                                <td>
                                                                    <small>{script.configuration_nom}</small>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">{script.projet_nom}</span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {script.depuis || 'N/A'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        script.priorite === 'haute' ? 'bg-danger' : 
                                                                        script.priorite === 'moyenne' ? 'bg-warning' : 'bg-info'
                                                                    }`}>
                                                                        {script.priorite || 'normale'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button className="btn btn-outline-success" title="Exécuter maintenant">
                                                                            <i className="ti ti-player-play"></i>
                                                                        </button>
                                                                        <button className="btn btn-outline-secondary" title="Mettre en pause">
                                                                            <i className="ti ti-pause"></i>
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
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Fermer
                        </button>
                        <button type="button" className="btn btn-warning">
                            <i className="ti ti-refresh me-1"></i>
                            Actualiser la File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalScriptsEnAttente;