import React from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ResultatDetailModal = ({ show, onClose, resultat }) => {
    if (!show || !resultat) return null;

    // Fonction pour afficher le statut
    const displayStatus = (statut) => {
        const statusConfig = {
            'pending': { class: 'bg-light-warning', icon: 'ti ti-clock', text: 'En attente' },
            'running': { class: 'bg-light-info', icon: 'ti ti-refresh', text: 'En cours' },
            'done': { class: 'bg-light-success', icon: 'ti ti-circle-check', text: 'Concluant' },
            'error': { class: 'bg-light-danger', icon: 'ti ti-circle-x', text: 'Non concluant' },
            'non_executed': { class: 'bg-light-secondary', icon: 'ti ti-ban', text: 'Non exécuté' }
        };

        const config = statusConfig[statut] || { class: 'bg-light-secondary', icon: 'ti ti-help', text: statut };

        return (
            <span className={`badge ${config.class} fs-6`}>
                <i className={`${config.icon} me-1`}></i>
                {config.text}
            </span>
        );
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
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Fonction pour télécharger le log
    const handleDownloadLog = async () => {
        if (!resultat.log_fichier) {
            MySwal.fire({
                title: 'Aucun log disponible',
                text: 'Aucun fichier log n\'est associé à ce résultat.',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            // Télécharger le fichier log
            const response = await fetch(resultat.log_fichier);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `resultat_${resultat.id}_${resultat.script_nom}_log.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            MySwal.fire({
                title: 'Erreur !',
                text: 'Erreur lors du téléchargement du log',
                icon: 'error',
                confirmButtonColor: '#d33',
                confirmButtonText: 'OK'
            });
        }
    };

    // Fonction pour afficher le commentaire formaté
    const renderCommentaire = (commentaire) => {
        if (!commentaire) return <span className="text-muted fst-italic">Aucun commentaire</span>;
        
        return commentaire.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < commentaire.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    {/* En-tête du modal */}
                    <div className="modal-header bg-light">
                        <h5 className="modal-title">
                            <i className="ti ti-info-circle me-2 text-primary"></i>
                            Détails du Résultat
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>

                    {/* Corps du modal */}
                    <div className="modal-body">
                        <div className="row">
                            {/* Colonne Informations Générales */}
                            <div className="col-md-6">
                                <h6 className="mb-3 text-primary">
                                    <i className="ti ti-info-circle me-1"></i>
                                    Informations Générales
                                </h6>
                                
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">ID du résultat</label>
                                    <div className="fw-semibold">#{resultat.id}</div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Script</label>
                                    <div className="d-flex align-items-center">
                                        <i className="ti ti-script me-2 text-info"></i>
                                        <span className="fw-semibold">{resultat.script_nom || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Configuration</label>
                                    <div className="d-flex align-items-center">
                                        <i className="ti ti-settings me-2 text-warning"></i>
                                        <span className="fw-semibold">{resultat.configuration_nom || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Projet</label>
                                    <div className="d-flex align-items-center">
                                        <i className="ti ti-folders me-2 text-success"></i>
                                        <span className="fw-semibold">{resultat.projet_nom || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Colonne Statut et Exécution */}
                            <div className="col-md-6">
                                <h6 className="mb-3 text-primary">
                                    <i className="ti ti-status-change me-1"></i>
                                    Statut et Exécution
                                </h6>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Statut</label>
                                    <div>
                                        {displayStatus(resultat.statut)}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Résultat interprété</label>
                                    <div className="fw-semibold">
                                        {resultat.statut === 'done' ? (
                                            <span className="text-success">
                                                <i className="ti ti-circle-check me-1"></i>
                                                Concluant
                                            </span>
                                        ) : resultat.statut === 'error' ? (
                                            <span className="text-danger">
                                                <i className="ti ti-circle-x me-1"></i>
                                                Non concluant
                                            </span>
                                        ) : resultat.statut === 'running' ? (
                                            <span className="text-info">
                                                <i className="ti ti-refresh me-1"></i>
                                                En cours
                                            </span>
                                        ) : resultat.statut === 'pending' ? (
                                            <span className="text-warning">
                                                <i className="ti ti-clock me-1"></i>
                                                En attente
                                            </span>
                                        ) : (
                                            <span className="text-secondary">
                                                <i className="ti ti-help me-1"></i>
                                                Statut inconnu
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">ID de l'exécution</label>
                                    <div className="fw-semibold">#{resultat.execution_id}</div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Date de début</label>
                                    <div className="d-flex align-items-center">
                                        <i className="ti ti-calendar me-2 text-primary"></i>
                                        <span>{formatDate(resultat.started_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Commentaire */}
                        <div className="row mt-3">
                            <div className="col-12">
                                <h6 className="mb-3 text-primary">
                                    <i className="ti ti-message-circle me-1"></i>
                                    Commentaire
                                </h6>
                                <div className="card bg-light">
                                    <div className="card-body">
                                        <p className="mb-0" style={{ minHeight: '80px' }}>
                                            {renderCommentaire(resultat.commentaire)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Fichiers */}
                        <div className="row mt-3">
                            <div className="col-12">
                                <h6 className="mb-3 text-primary">
                                    <i className="ti ti-file-text me-1"></i>
                                    Fichiers Associés
                                </h6>
                                <div className="d-flex gap-2">
                                    {resultat.log_fichier ? (
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={handleDownloadLog}
                                        >
                                            <i className="ti ti-download me-1"></i>
                                            Télécharger le Log
                                        </button>
                                    ) : (
                                        <span className="text-muted fst-italic">
                                            <i className="ti ti-file-off me-1"></i>
                                            Aucun fichier log disponible
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pied du modal */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <i className="ti ti-x me-1"></i>
                            Fermer
                        </button>
                        {resultat.log_fichier && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleDownloadLog}
                            >
                                <i className="ti ti-download me-1"></i>
                                Télécharger Log
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultatDetailModal;