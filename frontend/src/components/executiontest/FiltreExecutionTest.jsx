import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const FiltreExecutionTest = ({ executions, onFilterChange, user }) => {
    const MySwal = withReactContent(Swal);
    const [filters, setFilters] = useState({
        configuration: '',
        projet: '',
        statut: '',
        dateDebut: '',
        dateFin: '',
        tri: 'started_at',
        ordre: 'desc'
    });

    const isSuperAdmin = user?.is_superuser;

    // Extraire les données uniques pour les filtres
    const configurations = [...new Set(executions
        .map(exec => exec.configuration_nom)
        .filter(config => config && config.trim() !== '')
    )].sort();

    const projets = [...new Set(executions
        .map(exec => exec.projet_nom)
        .filter(projet => projet && projet.trim() !== '')
    )].sort();

    const statuts = [...new Set(executions
        .map(exec => exec.statut)
        .filter(statut => statut && statut.trim() !== '')
    )].sort();

    // Mapper les statuts pour l'affichage
    const statutMap = {
        'pending': 'En attente',
        'running': 'En cours',
        'done': 'Concluant',
        'error': 'Non concluant',
        'non_executed': 'Non exécuté'
    };

    // Filtrer et trier les exécutions selon les critères
    const filterAndSortExecutions = () => {
        let filteredExecutions = [...executions];

        // Filtre par configuration
        if (filters.configuration) {
            filteredExecutions = filteredExecutions.filter(exec => 
                exec.configuration_nom === filters.configuration
            );
        }

        // Filtre par projet
        if (filters.projet) {
            filteredExecutions = filteredExecutions.filter(exec => 
                exec.projet_nom === filters.projet
            );
        }

        // Filtre par statut
        if (filters.statut) {
            filteredExecutions = filteredExecutions.filter(exec => 
                exec.statut === filters.statut
            );
        }

        // Filtre par date de début
        if (filters.dateDebut) {
            filteredExecutions = filteredExecutions.filter(exec => {
                if (!exec.started_at) return false;
                const execDate = new Date(exec.started_at).toISOString().split('T')[0];
                return execDate >= filters.dateDebut;
            });
        }

        // Filtre par date de fin
        if (filters.dateFin) {
            filteredExecutions = filteredExecutions.filter(exec => {
                if (!exec.started_at) return false;
                const execDate = new Date(exec.started_at).toISOString().split('T')[0];
                return execDate <= filters.dateFin;
            });
        }

        // Appliquer le tri
        filteredExecutions.sort((a, b) => {
            let aValue, bValue;

            switch (filters.tri) {
                case 'configuration':
                    aValue = (a.configuration_nom || '').toLowerCase();
                    bValue = (b.configuration_nom || '').toLowerCase();
                    break;
                case 'projet':
                    aValue = (a.projet_nom || '').toLowerCase();
                    bValue = (b.projet_nom || '').toLowerCase();
                    break;
                case 'statut':
                    aValue = a.statut;
                    bValue = b.statut;
                    break;
                case 'started_at':
                    aValue = a.started_at ? new Date(a.started_at).getTime() : 0;
                    bValue = b.started_at ? new Date(b.started_at).getTime() : 0;
                    break;
                case 'ended_at':
                    aValue = a.ended_at ? new Date(a.ended_at).getTime() : 0;
                    bValue = b.ended_at ? new Date(b.ended_at).getTime() : 0;
                    break;
                case 'duration':
                    const aDuration = a.started_at && a.ended_at ? 
                        new Date(a.ended_at).getTime() - new Date(a.started_at).getTime() : 0;
                    const bDuration = b.started_at && b.ended_at ? 
                        new Date(b.ended_at).getTime() - new Date(b.started_at).getTime() : 0;
                    aValue = aDuration;
                    bValue = bDuration;
                    break;
                default:
                    aValue = a.started_at ? new Date(a.started_at).getTime() : 0;
                    bValue = b.started_at ? new Date(b.started_at).getTime() : 0;
            }

            if (filters.ordre === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filteredExecutions;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredExecutions = filterAndSortExecutions();
        onFilterChange(filteredExecutions);
    }, [filters, executions]);

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTriChange = (nouveauTri) => {
        setFilters(prev => ({
            ...prev,
            tri: nouveauTri,
            ordre: prev.tri === nouveauTri ? (prev.ordre === 'asc' ? 'desc' : 'asc') : 'desc'
        }));
    };

    const clearFilters = () => {
        setFilters({
            configuration: '',
            projet: '',
            statut: '',
            dateDebut: '',
            dateFin: '',
            tri: 'started_at',
            ordre: 'desc'
        });
    };

    // Statistiques pour l'affichage
    const stats = {
        total: executions.length,
        pending: executions.filter(e => e.statut === 'pending').length,
        running: executions.filter(e => e.statut === 'running').length,
        done: executions.filter(e => e.statut === 'done').length,
        error: executions.filter(e => e.statut === 'error').length,
        non_executed: executions.filter(e => e.statut === 'non_executed').length,
        withLogs: executions.filter(e => e.log_fichier).length,
        withTickets: executions.filter(e => e.ticket_redmine_id).length
    };

    const currentFiltered = filterAndSortExecutions();

    // Calculer la durée moyenne des exécutions terminées
    const completedExecutions = executions.filter(e => e.started_at && e.ended_at);
    const averageDuration = completedExecutions.length > 0 
        ? completedExecutions.reduce((total, exec) => {
            const duration = new Date(exec.ended_at).getTime() - new Date(exec.started_at).getTime();
            return total + duration;
        }, 0) / completedExecutions.length
        : 0;

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) {
            return `${seconds} secondes`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)} minutes`;
        } else {
            return `${Math.floor(seconds / 3600)} heures`;
        }
    };

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h6 className="card-title mb-3">
                    <i className="ti ti-filter me-2 text-primary"></i>
                    Filtres et Tri des Exécutions
                    {isSuperAdmin && (
                        <span className="badge bg-warning ms-2">
                            <i className="ti ti-crown me-1"></i>
                            Super-Admin
                        </span>
                    )}
                </h6>
                
                {/* Ligne 1 : Filtres Basiques */}
                <div className="row g-3 align-items-end mb-3">
                    {/* Filtre par configuration */}
                    <div className="col-md-3">
                        <label htmlFor="filterConfiguration" className="form-label small fw-bold">
                            <i className="ti ti-settings me-1"></i>
                            Configuration
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterConfiguration"
                            value={filters.configuration}
                            onChange={(e) => handleInputChange('configuration', e.target.value)}
                        >
                            <option value="">Toutes les configurations</option>
                            {configurations.map((config, index) => (
                                <option key={index} value={config}>
                                    {config}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par projet */}
                    <div className="col-md-2">
                        <label htmlFor="filterProjet" className="form-label small fw-bold">
                            <i className="ti ti-folders me-1"></i>
                            Projet
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterProjet"
                            value={filters.projet}
                            onChange={(e) => handleInputChange('projet', e.target.value)}
                        >
                            <option value="">Tous les projets</option>
                            {projets.map((projet, index) => (
                                <option key={index} value={projet}>
                                    {projet}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par statut */}
                    <div className="col-md-2">
                        <label htmlFor="filterStatut" className="form-label small fw-bold">
                            <i className="ti ti-status-change me-1"></i>
                            Statut
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterStatut"
                            value={filters.statut}
                            onChange={(e) => handleInputChange('statut', e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            {statuts.map((statut, index) => (
                                <option key={index} value={statut}>
                                    {statutMap[statut] || statut}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par date de début */}
                    <div className="col-md-2">
                        <label htmlFor="filterDateDebut" className="form-label small fw-bold">
                            <i className="ti ti-calendar me-1"></i>
                            Date début
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            id="filterDateDebut"
                            value={filters.dateDebut}
                            onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                        />
                    </div>

                    {/* Filtre par date de fin */}
                    <div className="col-md-2">
                        <label htmlFor="filterDateFin" className="form-label small fw-bold">
                            <i className="ti ti-calendar me-1"></i>
                            Date fin
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            id="filterDateFin"
                            value={filters.dateFin}
                            onChange={(e) => handleInputChange('dateFin', e.target.value)}
                        />
                    </div>
                </div>

                {/* Ligne 2 : Tri et Actions */}
                <div className="row g-3 align-items-end">
                    {/* Tri des résultats */}
                    <div className="col-md-6">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-sort-descending me-1"></i>
                            Trier par
                        </label>
                        <div className="btn-group w-100" role="group">
                            {[
                                { key: 'started_at', label: 'Date début', icon: 'ti ti-calendar-time' },
                                { key: 'ended_at', label: 'Date fin', icon: 'ti ti-calendar' },
                                { key: 'duration', label: 'Durée', icon: 'ti ti-clock' },
                                { key: 'configuration', label: 'Configuration', icon: 'ti ti-settings' },
                                { key: 'projet', label: 'Projet', icon: 'ti ti-folders' },
                                { key: 'statut', label: 'Statut', icon: 'ti ti-exchange' }
                            ].map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`btn btn-sm ${filters.tri === key ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => handleTriChange(key)}
                                    title={`Trier par ${label}`}
                                >
                                    <i className={`${icon} ${filters.tri === key && filters.ordre === 'desc' ? 'rotate-180' : ''}`}></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="col-md-6">
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() => {
                                    MySwal.fire({
                                        title: 'Statistiques des Exécutions',
                                        html: `
                                            <div class="text-start">
                                                <div class="row">
                                                    <div class="col-6">
                                                        <p><strong>Total exécutions:</strong> ${stats.total}</p>
                                                        <p><strong>En attente:</strong> ${stats.pending}</p>
                                                        <p><strong>En cours:</strong> ${stats.running}</p>
                                                        <p><strong>Concluantes:</strong> ${stats.done}</p>
                                                        <p><strong>Non concluantes:</strong> ${stats.error}</p>
                                                        <p><strong>Non exécutées:</strong> ${stats.non_executed}</p>
                                                    </div>
                                                    <div class="col-6">
                                                        <p><strong>Avec logs:</strong> ${stats.withLogs}</p>
                                                        <p><strong>Avec tickets:</strong> ${stats.withTickets}</p>
                                                        <p><strong>Durée moyenne:</strong> ${formatDuration(averageDuration)}</p>
                                                        <p><strong>Terminées:</strong> ${completedExecutions.length}</p>
                                                        <p><strong>Configurations uniques:</strong> ${configurations.length}</p>
                                                        <p><strong>Projets uniques:</strong> ${projets.length}</p>
                                                    </div>
                                                </div>
                                                <hr>
                                                <p class="text-center"><strong>Résultats filtrés:</strong> ${currentFiltered.length}</p>
                                            </div>
                                        `,
                                        icon: 'info',
                                        confirmButtonText: 'Fermer',
                                        width: 600
                                    });
                                }}
                                title="Statistiques détaillées"
                            >
                                <i className="ti ti-chart-bar me-1"></i>
                                Statistiques
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={clearFilters}
                                title="Réinitialiser tous les filtres"
                            >
                                <i className="ti ti-filter-off me-1"></i>
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Indicateurs et statistiques */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted">
                                    <i className="ti ti-player-play me-1"></i>
                                    {currentFiltered.length} exécution{currentFiltered.length > 1 ? 's' : ''} 
                                    {currentFiltered.length !== executions.length && ` sur ${executions.length}`}
                                    {filters.tri && (
                                        <span className="ms-2">
                                            <i className="ti ti-sort-descending me-1"></i>
                                            Tri: {filters.tri} ({filters.ordre === 'asc' ? 'croissant' : 'décroissant'})
                                        </span>
                                    )}
                                </small>
                            </div>
                            
                            {/* Indicateurs de filtres actifs */}
                            <div className="d-flex flex-wrap gap-1">
                                {filters.configuration && (
                                    <span className="badge bg-primary">
                                        Config: {filters.configuration}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('configuration', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.projet && (
                                    <span className="badge bg-info">
                                        Projet: {filters.projet}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('projet', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.statut && (
                                    <span className="badge bg-success">
                                        Statut: {statutMap[filters.statut] || filters.statut}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('statut', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.dateDebut && (
                                    <span className="badge bg-warning">
                                        Début: {filters.dateDebut}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('dateDebut', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.dateFin && (
                                    <span className="badge bg-warning">
                                        Fin: {filters.dateFin}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('dateFin', '')}
                                        ></button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Résumé rapide */}
                {currentFiltered.length !== executions.length && (
                    <div className="row mt-2">
                        <div className="col-12">
                            <div className="d-flex gap-3 flex-wrap">
                                <small className="text-muted">
                                    <i className="ti ti-circle-check text-success me-1"></i>
                                    {currentFiltered.filter(e => e.statut === 'done').length} concluantes
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-circle-x text-danger me-1"></i>
                                    {currentFiltered.filter(e => e.statut === 'error').length} non concluantes
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-refresh text-info me-1"></i>
                                    {currentFiltered.filter(e => e.statut === 'running').length} en cours
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-clock text-warning me-1"></i>
                                    {currentFiltered.filter(e => e.statut === 'pending').length} en attente
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-download text-primary me-1"></i>
                                    {currentFiltered.filter(e => e.log_fichier).length} avec logs
                                </small>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .rotate-180 {
                    transform: rotate(180deg);
                    transition: transform 0.2s ease;
                }
            `}</style>
        </div>
    );
};

export default FiltreExecutionTest;