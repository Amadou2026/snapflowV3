import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const FiltreGestionConfigurationTest = ({ configurations, onFilterChange, user }) => {
    const MySwal = withReactContent(Swal);
    const [filters, setFilters] = useState({
        nom: '',
        societe: '',
        projet: '',
        periodicite: '',
        statut: '',
        avec_scripts: '',
        tri: 'nom',
        ordre: 'asc'
    });

    const isSuperAdmin = user?.is_superuser;

    // Extraire les données uniques pour les filtres
    const societes = [...new Set(configurations
        .map(config => config.societe?.nom)
        .filter(societe => societe && societe.trim() !== '')
    )].sort();

    const projets = [...new Set(configurations
        .map(config => config.projet?.nom)
        .filter(projet => projet && projet.trim() !== '')
    )].sort();

    const periodicites = [...new Set(configurations
        .map(config => config.periodicite)
        .filter(periodicite => periodicite && periodicite.trim() !== '')
    )].sort();

    // Mapper les périodicités pour l'affichage
    const periodiciteMap = {
        "2min": "2 minutes",
        "2h": "2 heures",
        "6h": "6 heures",
        "1j": "1 jour",
        "1s": "1 semaine",
        "1m": "1 mois"
    };

    // Filtrer et trier les configurations selon les critères
    const filterAndSortConfigurations = () => {
        let filteredConfigurations = [...configurations];

        // Filtre par nom de configuration
        if (filters.nom) {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.nom.toLowerCase().includes(filters.nom.toLowerCase())
            );
        }

        // Filtre par société
        if (filters.societe) {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.societe?.nom === filters.societe
            );
        }

        // Filtre par projet
        if (filters.projet) {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.projet?.nom === filters.projet
            );
        }

        // Filtre par périodicité
        if (filters.periodicite) {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.periodicite === filters.periodicite
            );
        }

        // Filtre par statut
        if (filters.statut === 'active') {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.is_active === true
            );
        } else if (filters.statut === 'inactive') {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.is_active === false
            );
        }

        // Filtre par présence de scripts
        if (filters.avec_scripts === 'avec') {
            filteredConfigurations = filteredConfigurations.filter(config => 
                config.scripts && config.scripts.length > 0
            );
        } else if (filters.avec_scripts === 'sans') {
            filteredConfigurations = filteredConfigurations.filter(config => 
                !config.scripts || config.scripts.length === 0
            );
        }

        // Appliquer le tri
        filteredConfigurations.sort((a, b) => {
            let aValue, bValue;

            switch (filters.tri) {
                case 'nom':
                    aValue = a.nom.toLowerCase();
                    bValue = b.nom.toLowerCase();
                    break;
                case 'societe':
                    aValue = (a.societe?.nom || '').toLowerCase();
                    bValue = (b.societe?.nom || '').toLowerCase();
                    break;
                case 'projet':
                    aValue = (a.projet?.nom || '').toLowerCase();
                    bValue = (b.projet?.nom || '').toLowerCase();
                    break;
                case 'scripts':
                    aValue = a.scripts ? a.scripts.length : 0;
                    bValue = b.scripts ? b.scripts.length : 0;
                    break;
                case 'emails':
                    aValue = a.emails_notification ? a.emails_notification.length : 0;
                    bValue = b.emails_notification ? b.emails_notification.length : 0;
                    break;
                case 'periodicite':
                    aValue = a.periodicite;
                    bValue = b.periodicite;
                    break;
                case 'statut':
                    aValue = a.is_active ? 1 : 0;
                    bValue = b.is_active ? 1 : 0;
                    break;
                default:
                    aValue = a.nom.toLowerCase();
                    bValue = b.nom.toLowerCase();
            }

            if (filters.ordre === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filteredConfigurations;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredConfigurations = filterAndSortConfigurations();
        onFilterChange(filteredConfigurations);
    }, [filters, configurations]);

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
            ordre: prev.tri === nouveauTri ? (prev.ordre === 'asc' ? 'desc' : 'asc') : 'asc'
        }));
    };

    const clearFilters = () => {
        setFilters({
            nom: '',
            societe: '',
            projet: '',
            periodicite: '',
            statut: '',
            avec_scripts: '',
            tri: 'nom',
            ordre: 'asc'
        });
    };

    // Statistiques pour l'affichage
    const stats = {
        total: configurations.length,
        actives: configurations.filter(c => c.is_active === true).length,
        inactives: configurations.filter(c => c.is_active === false).length,
        avecScripts: configurations.filter(c => c.scripts && c.scripts.length > 0).length,
        sansScripts: configurations.filter(c => !c.scripts || c.scripts.length === 0).length,
        avecEmails: configurations.filter(c => c.emails_notification && c.emails_notification.length > 0).length
    };

    const currentFiltered = filterAndSortConfigurations();

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h6 className="card-title mb-3">
                    <i className="ti ti-filter me-2 text-primary"></i>
                    Filtres et Tri Avancés
                    {isSuperAdmin && (
                        <span className="badge bg-warning ms-2">
                            <i className="ti ti-crown me-1"></i>
                            Super-Admin
                        </span>
                    )}
                </h6>
                
                {/* Ligne 1 : Recherche et Filtres Basiques */}
                <div className="row g-3 align-items-end mb-3">
                    {/* Filtre par nom de configuration */}
                    <div className="col-md-3">
                        <label htmlFor="filterNom" className="form-label small fw-bold">
                            <i className="ti ti-settings me-1"></i>
                            Nom de la configuration
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            id="filterNom"
                            placeholder="Rechercher par nom..."
                            value={filters.nom}
                            onChange={(e) => handleInputChange('nom', e.target.value)}
                        />
                    </div>

                    {/* Filtre par société */}
                    {isSuperAdmin && (
                        <div className="col-md-2">
                            <label htmlFor="filterSociete" className="form-label small fw-bold">
                                <i className="ti ti-building me-1"></i>
                                Société
                            </label>
                            <select
                                className="form-select form-select-sm"
                                id="filterSociete"
                                value={filters.societe}
                                onChange={(e) => handleInputChange('societe', e.target.value)}
                            >
                                <option value="">Toutes les sociétés</option>
                                {societes.map((societe, index) => (
                                    <option key={index} value={societe}>
                                        {societe}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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

                    {/* Filtre par périodicité */}
                    <div className="col-md-2">
                        <label htmlFor="filterPeriodicite" className="form-label small fw-bold">
                            <i className="ti ti-clock me-1"></i>
                            Périodicité
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterPeriodicite"
                            value={filters.periodicite}
                            onChange={(e) => handleInputChange('periodicite', e.target.value)}
                        >
                            <option value="">Toutes les périodicités</option>
                            {periodicites.map((periodicite, index) => (
                                <option key={index} value={periodicite}>
                                    {periodiciteMap[periodicite] || periodicite}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par statut */}
                    <div className="col-md-3">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-status-change me-1"></i>
                            Statut
                        </label>
                        <div className="btn-group w-100" role="group">
                            <input
                                type="radio"
                                className="btn-check"
                                name="statutFilter"
                                id="statutTous"
                                checked={filters.statut === ''}
                                onChange={() => handleInputChange('statut', '')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="statutTous">
                                Tous
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="statutFilter"
                                id="statutActif"
                                checked={filters.statut === 'active'}
                                onChange={() => handleInputChange('statut', 'active')}
                            />
                            <label className="btn btn-outline-success btn-sm" htmlFor="statutActif">
                                Actives
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="statutFilter"
                                id="statutInactif"
                                checked={filters.statut === 'inactive'}
                                onChange={() => handleInputChange('statut', 'inactive')}
                            />
                            <label className="btn btn-outline-danger btn-sm" htmlFor="statutInactif">
                                Inactives
                            </label>
                        </div>
                    </div>
                </div>

                {/* Ligne 2 : Filtres Avancés et Tri */}
                <div className="row g-3 align-items-end">
                    {/* Filtre par scripts */}
                    <div className="col-md-3">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-script me-1"></i>
                            Scripts associés
                        </label>
                        <div className="btn-group w-100" role="group">
                            <input
                                type="radio"
                                className="btn-check"
                                name="scriptsFilter"
                                id="scriptsTous"
                                checked={filters.avec_scripts === ''}
                                onChange={() => handleInputChange('avec_scripts', '')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="scriptsTous">
                                Tous
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="scriptsFilter"
                                id="scriptsAvec"
                                checked={filters.avec_scripts === 'avec'}
                                onChange={() => handleInputChange('avec_scripts', 'avec')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="scriptsAvec">
                                Avec
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="scriptsFilter"
                                id="scriptsSans"
                                checked={filters.avec_scripts === 'sans'}
                                onChange={() => handleInputChange('avec_scripts', 'sans')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="scriptsSans">
                                Sans
                            </label>
                        </div>
                    </div>

                    {/* Tri des résultats */}
                    <div className="col-md-4">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-sort-descending me-1"></i>
                            Trier par
                        </label>
                        <div className="btn-group w-100" role="group">
                            {[
                                { key: 'nom', label: 'Nom', icon: 'ti ti-sort-ascending-letters' },
                                { key: 'societe', label: 'Société', icon: 'ti ti-building' },
                                { key: 'projet', label: 'Projet', icon: 'ti ti-folders' },
                                { key: 'scripts', label: 'Scripts', icon: 'ti ti-news' },
                                { key: 'emails', label: 'Emails', icon: 'ti ti-mail' },
                                { key: 'periodicite', label: 'Périodicité', icon: 'ti ti-clock' },
                                { key: 'statut', label: 'Statut', icon: 'ti ti-calendar-stats' }
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
                    <div className="col-md-5">
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() => {
                                    MySwal.fire({
                                        title: 'Statistiques Détaillées',
                                        html: `
                                            <div class="text-start">
                                                <div class="row">
                                                    <div class="col-6">
                                                        <p><strong>Total configurations:</strong> ${stats.total}</p>
                                                        <p><strong>Configurations actives:</strong> ${stats.actives}</p>
                                                        <p><strong>Configurations inactives:</strong> ${stats.inactives}</p>
                                                    </div>
                                                    <div class="col-6">
                                                        <p><strong>Avec scripts:</strong> ${stats.avecScripts}</p>
                                                        <p><strong>Sans scripts:</strong> ${stats.sansScripts}</p>
                                                        <p><strong>Avec emails:</strong> ${stats.avecEmails}</p>
                                                    </div>
                                                </div>
                                                <hr>
                                                <p class="text-center"><strong>Résultats filtrés:</strong> ${currentFiltered.length}</p>
                                                <div class="mt-2">
                                                    <p><strong>Répartition par périodicité:</strong></p>
                                                    <ul class="list-unstyled">
                                                        ${periodicites.map(periode => {
                                                            const count = configurations.filter(c => c.periodicite === periode).length;
                                                            return `<li>${periodiciteMap[periode] || periode}: ${count}</li>`;
                                                        }).join('')}
                                                    </ul>
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
                                    <i className="ti ti-settings me-1"></i>
                                    {currentFiltered.length} configuration{currentFiltered.length > 1 ? 's' : ''} 
                                    {currentFiltered.length !== configurations.length && ` sur ${configurations.length}`}
                                    {filters.tri && (
                                        <span className="ms-2">
                                            <i className="ti ti-sort-descending me-1"></i>
                                            Tri: {filters.tri} ({filters.ordre === 'asc' ? 'A→Z' : 'Z→A'})
                                        </span>
                                    )}
                                </small>
                            </div>
                            
                            {/* Indicateurs de filtres actifs */}
                            <div className="d-flex flex-wrap gap-1">
                                {filters.nom && (
                                    <span className="badge bg-primary">
                                        Nom: {filters.nom}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('nom', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.societe && (
                                    <span className="badge bg-info">
                                        Société: {filters.societe}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('societe', '')}
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
                                {filters.periodicite && (
                                    <span className="badge bg-warning">
                                        Périodicité: {periodiciteMap[filters.periodicite] || filters.periodicite}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('periodicite', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.statut === 'active' && (
                                    <span className="badge bg-success">
                                        Actives
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('statut', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.statut === 'inactive' && (
                                    <span className="badge bg-danger">
                                        Inactives
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('statut', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.avec_scripts === 'avec' && (
                                    <span className="badge bg-success">
                                        Avec scripts
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('avec_scripts', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.avec_scripts === 'sans' && (
                                    <span className="badge bg-warning">
                                        Sans scripts
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('avec_scripts', '')}
                                        ></button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Résumé rapide */}
                {currentFiltered.length !== configurations.length && (
                    <div className="row mt-2">
                        <div className="col-12">
                            <div className="d-flex gap-3 flex-wrap">
                                <small className="text-muted">
                                    <i className="ti ti-status-change text-success me-1"></i>
                                    {currentFiltered.filter(c => c.is_active === true).length} actives
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-script text-info me-1"></i>
                                    {currentFiltered.filter(c => c.scripts && c.scripts.length > 0).length} avec scripts
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-mail text-warning me-1"></i>
                                    {currentFiltered.filter(c => c.emails_notification && c.emails_notification.length > 0).length} avec emails
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-building text-primary me-1"></i>
                                    {[...new Set(currentFiltered.map(c => c.societe?.nom).filter(Boolean))].length} sociétés
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-folders text-secondary me-1"></i>
                                    {[...new Set(currentFiltered.map(c => c.projet?.nom).filter(Boolean))].length} projets
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

export default FiltreGestionConfigurationTest;