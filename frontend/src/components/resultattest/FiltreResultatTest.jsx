import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const FiltreResultatTest = ({ resultats, onFilterChange, user }) => {
    const MySwal = withReactContent(Swal);
    const [filters, setFilters] = useState({
        script: '',
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
    const scripts = [...new Set(resultats
        .map(resultat => resultat.script_nom)
        .filter(script => script && script.trim() !== '')
    )].sort();

    const configurations = [...new Set(resultats
        .map(resultat => resultat.configuration_nom)
        .filter(config => config && config.trim() !== '')
    )].sort();

    const projets = [...new Set(resultats
        .map(resultat => resultat.projet_nom)
        .filter(projet => projet && projet.trim() !== '')
    )].sort();

    const statuts = [...new Set(resultats
        .map(resultat => resultat.statut)
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

    // Filtrer et trier les résultats selon les critères
    const filterAndSortResultats = () => {
        let filteredResultats = [...resultats];

        // Filtre par script
        if (filters.script) {
            filteredResultats = filteredResultats.filter(resultat => 
                resultat.script_nom === filters.script
            );
        }

        // Filtre par configuration
        if (filters.configuration) {
            filteredResultats = filteredResultats.filter(resultat => 
                resultat.configuration_nom === filters.configuration
            );
        }

        // Filtre par projet
        if (filters.projet) {
            filteredResultats = filteredResultats.filter(resultat => 
                resultat.projet_nom === filters.projet
            );
        }

        // Filtre par statut
        if (filters.statut) {
            filteredResultats = filteredResultats.filter(resultat => 
                resultat.statut === filters.statut
            );
        }

        // Filtre par date de début
        if (filters.dateDebut) {
            filteredResultats = filteredResultats.filter(resultat => {
                if (!resultat.started_at) return false;
                const resultatDate = new Date(resultat.started_at).toISOString().split('T')[0];
                return resultatDate >= filters.dateDebut;
            });
        }

        // Filtre par date de fin
        if (filters.dateFin) {
            filteredResultats = filteredResultats.filter(resultat => {
                if (!resultat.started_at) return false;
                const resultatDate = new Date(resultat.started_at).toISOString().split('T')[0];
                return resultatDate <= filters.dateFin;
            });
        }

        // Appliquer le tri
        filteredResultats.sort((a, b) => {
            let aValue, bValue;

            switch (filters.tri) {
                case 'script':
                    aValue = (a.script_nom || '').toLowerCase();
                    bValue = (b.script_nom || '').toLowerCase();
                    break;
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
                case 'execution':
                    aValue = a.execution_id;
                    bValue = b.execution_id;
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

        return filteredResultats;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredResultats = filterAndSortResultats();
        onFilterChange(filteredResultats);
    }, [filters, resultats]);

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
            script: '',
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
        total: resultats.length,
        pending: resultats.filter(r => r.statut === 'pending').length,
        running: resultats.filter(r => r.statut === 'running').length,
        done: resultats.filter(r => r.statut === 'done').length,
        error: resultats.filter(r => r.statut === 'error').length,
        non_executed: resultats.filter(r => r.statut === 'non_executed').length,
        withLogs: resultats.filter(r => r.log_fichier).length,
        uniqueScripts: scripts.length,
        uniqueConfigurations: configurations.length,
        uniqueProjets: projets.length
    };

    const currentFiltered = filterAndSortResultats();

    // Calculer les taux de réussite
    const tauxReussite = stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(1) : 0;
    const tauxEchec = stats.total > 0 ? ((stats.error / stats.total) * 100).toFixed(1) : 0;

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h6 className="card-title mb-3">
                    <i className="ti ti-filter me-2 text-primary"></i>
                    Filtres et Tri des Résultats
                    {isSuperAdmin && (
                        <span className="badge bg-warning ms-2">
                            <i className="ti ti-crown me-1"></i>
                            Super-Admin
                        </span>
                    )}
                </h6>
                
                {/* Ligne 1 : Filtres Basiques */}
                <div className="row g-3 align-items-end mb-3">
                    {/* Filtre par script */}
                    <div className="col-md-2">
                        <label htmlFor="filterScript" className="form-label small fw-bold">
                            <i className="ti ti-script me-1"></i>
                            Script
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterScript"
                            value={filters.script}
                            onChange={(e) => handleInputChange('script', e.target.value)}
                        >
                            <option value="">Tous les scripts</option>
                            {scripts.map((script, index) => (
                                <option key={index} value={script}>
                                    {script}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par configuration */}
                    <div className="col-md-2">
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
                                { key: 'script', label: 'Script', icon: 'ti ti-file-analytics' },
                                { key: 'configuration', label: 'Configuration', icon: 'ti ti-settings' },
                                { key: 'projet', label: 'Projet', icon: 'ti ti-folders' },
                                { key: 'statut', label: 'Statut', icon: 'ti ti-exchange' },
                                { key: 'execution', label: 'Execution', icon: 'ti ti-database-export' }
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
                                        title: 'Statistiques des Résultats',
                                        html: `
                                            <div class="text-start">
                                                <div class="row">
                                                    <div class="col-6">
                                                        <p><strong>Total résultats:</strong> ${stats.total}</p>
                                                        <p><strong>En attente:</strong> ${stats.pending}</p>
                                                        <p><strong>En cours:</strong> ${stats.running}</p>
                                                        <p><strong>Concluants:</strong> ${stats.done}</p>
                                                        <p><strong>Non concluants:</strong> ${stats.error}</p>
                                                        <p><strong>Non exécutés:</strong> ${stats.non_executed}</p>
                                                    </div>
                                                    <div class="col-6">
                                                        <p><strong>Avec logs:</strong> ${stats.withLogs}</p>
                                                        <p><strong>Scripts uniques:</strong> ${stats.uniqueScripts}</p>
                                                        <p><strong>Configurations uniques:</strong> ${stats.uniqueConfigurations}</p>
                                                        <p><strong>Projets uniques:</strong> ${stats.uniqueProjets}</p>
                                                        <p><strong>Taux de réussite:</strong> ${tauxReussite}%</p>
                                                        <p><strong>Taux d'échec:</strong> ${tauxEchec}%</p>
                                                    </div>
                                                </div>
                                                <hr>
                                                <p class="text-center"><strong>Résultats filtrés:</strong> ${currentFiltered.length}</p>
                                                <div class="mt-2">
                                                    <p><strong>Répartition par statut:</strong></p>
                                                    <div class="progress mb-2" style="height: 20px;">
                                                        <div class="progress-bar bg-success" style="width: ${tauxReussite}%">${tauxReussite}%</div>
                                                        <div class="progress-bar bg-danger" style="width: ${tauxEchec}%">${tauxEchec}%</div>
                                                    </div>
                                                </div>
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
                                    <i className="ti ti-checklist me-1"></i>
                                    {currentFiltered.length} résultat{currentFiltered.length > 1 ? 's' : ''} 
                                    {currentFiltered.length !== resultats.length && ` sur ${resultats.length}`}
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
                                {filters.script && (
                                    <span className="badge bg-primary">
                                        Script: {filters.script}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('script', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.configuration && (
                                    <span className="badge bg-info">
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
                                    <span className="badge bg-success">
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
                                    <span className="badge bg-warning">
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
                                    <span className="badge bg-secondary">
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
                                    <span className="badge bg-secondary">
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
                {currentFiltered.length !== resultats.length && (
                    <div className="row mt-2">
                        <div className="col-12">
                            <div className="d-flex gap-3 flex-wrap">
                                <small className="text-muted">
                                    <i className="ti ti-circle-check text-success me-1"></i>
                                    {currentFiltered.filter(r => r.statut === 'done').length} concluants
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-circle-x text-danger me-1"></i>
                                    {currentFiltered.filter(r => r.statut === 'error').length} non concluants
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-refresh text-info me-1"></i>
                                    {currentFiltered.filter(r => r.statut === 'running').length} en cours
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-clock text-warning me-1"></i>
                                    {currentFiltered.filter(r => r.statut === 'pending').length} en attente
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-download text-primary me-1"></i>
                                    {currentFiltered.filter(r => r.log_fichier).length} avec logs
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

export default FiltreResultatTest;