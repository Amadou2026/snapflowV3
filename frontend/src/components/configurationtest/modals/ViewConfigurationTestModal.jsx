import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ViewConfigurationTestModal = ({ show, onClose, configuration }) => {
    const [configDetails, setConfigDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && configuration) {
            loadConfigurationDetails();
        }
    }, [show, configuration]);

    const loadConfigurationDetails = async () => {
        setLoading(true);
        try {
            // CORRECTION : utiliser 'configuration-tests' au lieu de 'configuration-test'
            const response = await api.get(`configuration-tests/${configuration.id}/`);
            setConfigDetails(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfigDetails(null);
        onClose();
    };

    if (!show || !configuration) return null;

    // Fonction pour afficher la périodicité
    const displayPeriodicite = (periodicite) => {
        const periodiciteMap = {
            "2min": "Toutes les 2 minutes",
            "2h": "Toutes les 2 heures",
            "6h": "Toutes les 6 heures",
            "1j": "Une fois par jour",
            "1s": "Une fois par semaine",
            "1m": "Une fois par mois"
        };
        return periodiciteMap[periodicite] || periodicite;
    };

    // Ajoutez cette fonction dans votre composant
    const getPriorityInfo = (priorite, priorite_nom) => {
        const priorityMap = {
            1: { name: 'Basse', class: 'bg-secondary' },
            2: { name: 'Normale', class: 'bg-info' },
            3: { name: 'Haute', class: 'bg-warning' },
            4: { name: 'Urgente', class: 'bg-danger' },
            5: { name: 'Immédiate', class: 'bg-danger' }
        };

        const priority = priorityMap[priorite] || priorityMap[2]; // Default to Normale

        return {
            name: priorite_nom || priority.name,
            className: priority.class
        };
    };

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fonction pour afficher le statut avec plus de détails
    const displayStatus = (isActive, dateActivation, dateDesactivation) => {
        return isActive ? (
            <div>
                <span className="badge bg-success me-2">
                    <i className="ti ti-circle-check me-1"></i>
                    Active
                </span>
                {dateActivation && (
                    <small className="text-muted">
                        Depuis le {formatDate(dateActivation)}
                    </small>
                )}
            </div>
        ) : (
            <div>
                <span className="badge bg-danger me-2">
                    <i className="ti ti-circle-x me-1"></i>
                    Inactive
                </span>
                {dateDesactivation && (
                    <small className="text-muted">
                        Depuis le {formatDate(dateDesactivation)}
                    </small>
                )}
            </div>
        );
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-eye me-2"></i>
                            Détails de la configuration - {configuration.nom}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement des détails...</p>
                            </div>
                        ) : configDetails ? (
                            <div className="row">
                                <div className="col-12">
                                    {/* Informations générales */}
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-info-circle me-2 text-primary"></i>
                                                Informations générales
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Nom</label>
                                                        <p className="form-control-plaintext">{configDetails.nom}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Statut</label>
                                                        <div>
                                                            {displayStatus(
                                                                configDetails.is_active,
                                                                configDetails.date_activation,
                                                                configDetails.date_desactivation
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Société</label>
                                                        <p className="form-control-plaintext">
                                                            {/* CORRECTION : utiliser societe_details ou societe selon votre sérialiseur */}
                                                            {configDetails.societe_details?.nom ||
                                                                configDetails.societe?.nom ||
                                                                configDetails.societe_nom ||
                                                                'Non spécifiée'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Projet</label>
                                                        <p className="form-control-plaintext">
                                                            {/* CORRECTION : utiliser projet_details ou projet selon votre sérialiseur */}
                                                            {configDetails.projet_details?.nom ||
                                                                configDetails.projet?.nom ||
                                                                configDetails.projet_nom ||
                                                                'Non spécifié'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Périodicité</label>
                                                        <p className="form-control-plaintext">
                                                            {displayPeriodicite(configDetails.periodicite)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Dernière exécution</label>
                                                        <p className="form-control-plaintext">
                                                            {formatDate(configDetails.last_execution)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {configDetails.next_execution && (
                                                <div className="row">
                                                    <div className="col-12">
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">Prochaine exécution prévue</label>
                                                            <p className="form-control-plaintext text-info">
                                                                {formatDate(configDetails.next_execution)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Scripts associés */}
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-script me-2 text-info"></i>
                                                Scripts associés ({configDetails.scripts_count || configDetails.scripts?.length || 0})
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            {configDetails.scripts_details && configDetails.scripts_details.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Nom</th>
                                                                <th>Axe</th>
                                                                <th>Sous-axe</th>
                                                                <th>Priorité</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {configDetails.scripts_details.map(script => {
                                                                const priorityInfo = getPriorityInfo(script.priorite, script.priorite_nom);
                                                                return (
                                                                    <tr key={script.id}>
                                                                        <td>
                                                                            <strong>{script.nom}</strong>
                                                                        </td>
                                                                        <td>
                                                                            {script.axe_nom || script.axe?.nom || '-'}
                                                                        </td>
                                                                        <td>
                                                                            {script.sous_axe_nom || script.sous_axe?.nom || '-'}
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${priorityInfo.className}`}>
                                                                                {priorityInfo.name}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : configDetails.scripts && configDetails.scripts.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Nom</th>
                                                                <th>ID</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {configDetails.scripts.map(script => (
                                                                <tr key={script.id}>
                                                                    <td>
                                                                        <strong>{script.nom || `Script ${script.id}`}</strong>
                                                                    </td>
                                                                    <td>{script.id}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-muted text-center mb-0">Aucun script associé</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Emails de notification */}
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-mail me-2 text-warning"></i>
                                                Emails de notification ({configDetails.emails_count || configDetails.emails_notification?.length || 0})
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            {configDetails.emails_notification_details && configDetails.emails_notification_details.length > 0 ? (
                                                <div className="row">
                                                    {configDetails.emails_notification_details.map(email => (
                                                        <div key={email.id} className="col-md-6 mb-2">
                                                            <div className="border rounded p-2">
                                                                {/* <div className="fw-bold">{email.nom || 'Sans nom'}</div> */}
                                                                <div className="text-muted small">{email.email}</div>
                                                                <div>
                                                                    <span className={`badge ${email.est_actif ? 'bg-success' : 'bg-secondary'}`}>
                                                                        {email.est_actif ? 'Actif' : 'Inactif'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : configDetails.emails_notification && configDetails.emails_notification.length > 0 ? (
                                                <div className="row">
                                                    {configDetails.emails_notification.map(email => (
                                                        <div key={email.id} className="col-md-6 mb-2">
                                                            <div className="border rounded p-2">
                                                                <div className="fw-bold">{email.nom || 'Sans nom'}</div>
                                                                <div className="text-muted small">{email.email}</div>
                                                                <div>
                                                                    <span className="badge bg-secondary">Détails non disponibles</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted text-center mb-0">Aucun email de notification configuré</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dates importantes */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-calendar me-2 text-secondary"></i>
                                                Dates importantes
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Date de création</label>
                                                        <p className="form-control-plaintext">
                                                            {formatDate(configDetails.date_creation)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Date de modification</label>
                                                        <p className="form-control-plaintext">
                                                            {formatDate(configDetails.date_modification)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Date d'activation</label>
                                                        <p className="form-control-plaintext">
                                                            {formatDate(configDetails.date_activation)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {configDetails.date_desactivation && (
                                                <div className="row">
                                                    <div className="col-12">
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">Date de désactivation</label>
                                                            <p className="form-control-plaintext text-danger">
                                                                {formatDate(configDetails.date_desactivation)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Informations supplémentaires */}
                                    <div className="card mt-4">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                <i className="ti ti-chart-bar me-2 text-success"></i>
                                                Statistiques
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row text-center">
                                                <div className="col-md-4">
                                                    <div className="border rounded p-3">
                                                        <i className="ti ti-script f-24 text-info mb-2"></i>
                                                        <h4>{configDetails.scripts_count || 0}</h4>
                                                        <small className="text-muted">Scripts</small>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="border rounded p-3">
                                                        <i className="ti ti-mail f-24 text-warning mb-2"></i>
                                                        <h4>{configDetails.emails_count || 0}</h4>
                                                        <small className="text-muted">Emails</small>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="border rounded p-3">
                                                        <i className="ti ti-clock f-24 text-primary mb-2"></i>
                                                        <h4>{displayPeriodicite(configDetails.periodicite)}</h4>
                                                        <small className="text-muted">Périodicité</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <i className="ti ti-alert-circle f-40 text-muted mb-3"></i>
                                <p className="text-muted">Impossible de charger les détails de la configuration</p>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                        >
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewConfigurationTestModal;