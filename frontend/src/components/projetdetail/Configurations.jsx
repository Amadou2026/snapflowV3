import React, { useState } from 'react';
import AjouterConfigurationTestModal from './modals/AjouterConfigurationTestModal'; // Ajustez le chemin selon votre structure

const Configurations = ({ project, user }) => {
    const [showModal, setShowModal] = useState(false);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleConfigurationAdded = (newConfiguration) => {
        console.log('Nouvelle configuration ajoutée:', newConfiguration);
        // Recharger la page ou utiliser un state management
        window.location.reload();
    };

    return (
        <div className="tab-pane fade show active">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Configurations de test associées</h6>
                <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleOpenModal}
                >
                    <i className="ti ti-plus me-1"></i>
                    Ajouter une configuration
                </button>
            </div>
            
            {project.configurations_actives && project.configurations_actives.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Société</th>
                                <th>Périodicité</th>
                                <th>Statut</th>
                                <th>Dernière exécution</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.configurations_actives.map((config) => (
                                <tr key={config.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <i className="ti ti-settings text-primary me-2"></i>
                                            {config.nom}
                                        </div>
                                    </td>
                                    <td>{config.societe}</td>
                                    <td>
                                        <span className="badge bg-light-info">{config.periodicite}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${config.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                            {config.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        {config.last_execution
                                            ? new Date(config.last_execution).toLocaleDateString('fr-FR')
                                            : 'Jamais'
                                        }
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-sm btn-outline-primary">
                                                <i className="ti ti-edit"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-info">
                                                <i className="ti ti-player-play"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-5">
                    <i className="ti ti-settings-off text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted">Aucune configuration active pour ce projet</p>
                    <button 
                        className="btn btn-primary mt-2"
                        onClick={handleOpenModal}
                    >
                        <i className="ti ti-plus me-1"></i>
                        Créer la première configuration
                    </button>
                </div>
            )}

            {/* Modal d'ajout de configuration */}
            {user && (
                <AjouterConfigurationTestModal
                    show={showModal}
                    onClose={handleCloseModal}
                    onConfigurationAdded={handleConfigurationAdded}
                    user={user}
                />
            )}
        </div>
    );
};

export default Configurations;