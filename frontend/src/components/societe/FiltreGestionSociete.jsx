import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const FiltreGestionSociete = ({ societes, onFilterChange, user }) => {
    const MySwal = withReactContent(Swal);
    const [filters, setFilters] = useState({
        nom: '',
        admin: '',
        secteur_activite: '',
        avec_projets: '',
        sans_admin: false,
        tri: 'nom',
        ordre: 'asc'
    });

    const isSuperAdmin = user?.is_superuser;

    // Extraire les données uniques pour les filtres
    const secteursActivite = [...new Set(societes
        .map(societe => societe.secteur_activite)
        .filter(secteur => secteur && secteur.trim() !== '')
    )].sort();

    // Extraire les noms d'administrateurs uniques
    const administrateurs = [...new Set(societes
        .map(societe => societe.admin?.full_name || societe.admin)
        .filter(admin => admin && admin.trim() !== '')
    )].sort();

    // Filtrer et trier les sociétés selon les critères
    const filterAndSortSocietes = () => {
        let filteredSocietes = [...societes];

        // Filtre par nom de société
        if (filters.nom) {
            filteredSocietes = filteredSocietes.filter(societe => 
                societe.nom.toLowerCase().includes(filters.nom.toLowerCase())
            );
        }

        // Filtre par nom d'administrateur
        if (filters.admin) {
            filteredSocietes = filteredSocietes.filter(societe => {
                const adminName = societe.admin?.full_name || societe.admin;
                return adminName && adminName.toLowerCase().includes(filters.admin.toLowerCase());
            });
        }

        // Filtre par secteur d'activité
        if (filters.secteur_activite) {
            filteredSocietes = filteredSocietes.filter(societe => 
                societe.secteur_activite === filters.secteur_activite
            );
        }

        // Filtre par présence de projets
        if (filters.avec_projets === 'avec') {
            filteredSocietes = filteredSocietes.filter(societe => 
                societe.projets && societe.projets.length > 0
            );
        } else if (filters.avec_projets === 'sans') {
            filteredSocietes = filteredSocietes.filter(societe => 
                !societe.projets || societe.projets.length === 0
            );
        }

        // Filtre pour sociétés sans admin (critère d'audit)
        if (filters.sans_admin) {
            filteredSocietes = filteredSocietes.filter(societe => 
                !societe.admin || (typeof societe.admin === 'string' && societe.admin.trim() === '')
            );
        }

        // Appliquer le tri
        filteredSocietes.sort((a, b) => {
            let aValue, bValue;

            switch (filters.tri) {
                case 'nom':
                    aValue = a.nom.toLowerCase();
                    bValue = b.nom.toLowerCase();
                    break;
                case 'admin':
                    aValue = (a.admin?.full_name || a.admin || '').toLowerCase();
                    bValue = (b.admin?.full_name || b.admin || '').toLowerCase();
                    break;
                case 'employes':
                    aValue = a.employes ? a.employes.length : 0;
                    bValue = b.employes ? b.employes.length : 0;
                    break;
                case 'projets':
                    aValue = a.projets ? a.projets.length : 0;
                    bValue = b.projets ? b.projets.length : 0;
                    break;
                case 'secteur':
                    aValue = (a.secteur_activite || '').toLowerCase();
                    bValue = (b.secteur_activite || '').toLowerCase();
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

        return filteredSocietes;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredSocietes = filterAndSortSocietes();
        onFilterChange(filteredSocietes);
    }, [filters, societes]);

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
            admin: '',
            secteur_activite: '',
            avec_projets: '',
            sans_admin: false,
            tri: 'nom',
            ordre: 'asc'
        });
    };

    // Statistiques pour l'affichage
    const stats = {
        total: societes.length,
        avecProjets: societes.filter(s => s.projets && s.projets.length > 0).length,
        sansProjets: societes.filter(s => !s.projets || s.projets.length === 0).length,
        avecAdmin: societes.filter(s => s.admin && (typeof s.admin !== 'string' || s.admin.trim() !== '')).length,
        sansAdmin: societes.filter(s => !s.admin || (typeof s.admin === 'string' && s.admin.trim() === '')).length,
        avecSecteur: societes.filter(s => s.secteur_activite && s.secteur_activite.trim() !== '').length
    };

    const currentFiltered = filterAndSortSocietes();

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
                    {/* Filtre par nom de société */}
                    <div className="col-md-3">
                        <label htmlFor="filterNom" className="form-label small fw-bold">
                            <i className="ti ti-building me-1"></i>
                            Nom de la société
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

                    {/* Filtre par nom d'administrateur */}
                    <div className="col-md-3">
                        <label htmlFor="filterAdmin" className="form-label small fw-bold">
                            <i className="ti ti-user-cog me-1"></i>
                            Administrateur
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            id="filterAdmin"
                            placeholder="Rechercher par admin..."
                            value={filters.admin}
                            onChange={(e) => handleInputChange('admin', e.target.value)}
                            list="adminList"
                        />
                        <datalist id="adminList">
                            {administrateurs.map((admin, index) => (
                                <option key={index} value={admin} />
                            ))}
                        </datalist>
                    </div>

                    {/* Filtre par secteur d'activité */}
                    <div className="col-md-3">
                        <label htmlFor="filterSecteur" className="form-label small fw-bold">
                            <i className="ti ti-category me-1"></i>
                            Secteur d'activité
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterSecteur"
                            value={filters.secteur_activite}
                            onChange={(e) => handleInputChange('secteur_activite', e.target.value)}
                        >
                            <option value="">Tous les secteurs</option>
                            {secteursActivite.map((secteur, index) => (
                                <option key={index} value={secteur}>
                                    {secteur}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par projets */}
                    <div className="col-md-3">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-folders me-1"></i>
                            Projets associés
                        </label>
                        <div className="btn-group w-100" role="group">
                            <input
                                type="radio"
                                className="btn-check"
                                name="projetsFilter"
                                id="projetsTous"
                                checked={filters.avec_projets === ''}
                                onChange={() => handleInputChange('avec_projets', '')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="projetsTous">
                                Tous
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="projetsFilter"
                                id="projetsAvec"
                                checked={filters.avec_projets === 'avec'}
                                onChange={() => handleInputChange('avec_projets', 'avec')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="projetsAvec">
                                Avec
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="projetsFilter"
                                id="projetsSans"
                                checked={filters.avec_projets === 'sans'}
                                onChange={() => handleInputChange('avec_projets', 'sans')}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="projetsSans">
                                Sans
                            </label>
                        </div>
                    </div>
                </div>

                {/* Ligne 2 : Filtres Avancés et Tri */}
                <div className="row g-3 align-items-end">
                    {/* Filtre audit - Sociétés sans admin */}
                    {isSuperAdmin && (
                        <div className="col-md-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="sansAdminFilter"
                                    checked={filters.sans_admin}
                                    onChange={(e) => handleInputChange('sans_admin', e.target.checked)}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="sansAdminFilter">
                                    <i className="ti ti-alert-triangle me-1 text-warning"></i>
                                    Sociétés sans Admin
                                    <span className="badge bg-warning ms-1">{stats.sansAdmin}</span>
                                </label>
                                <small className="form-text text-muted d-block">
                                    Critère d'audit
                                </small>
                            </div>
                        </div>
                    )}

                    {/* Tri des résultats */}
                    <div className="col-md-4">
                        <label className="form-label small fw-bold d-block">
                            <i className="ti ti-sort-descending me-1"></i>
                            Trier par
                        </label>
                        <div className="btn-group w-100" role="group">
                            {[
                                { key: 'nom', label: 'Nom', icon: 'ti ti-sort-a-z' },
                                { key: 'admin', label: 'Admin', icon: 'ti ti-user' },
                                { key: 'employes', label: 'Employés', icon: 'ti ti-users' },
                                { key: 'projets', label: 'Projets', icon: 'ti ti-folders' },
                                { key: 'secteur', label: 'Secteur', icon: 'ti ti-category' }
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
                                                        <p><strong>Total sociétés:</strong> ${stats.total}</p>
                                                        <p><strong>Avec admin:</strong> ${stats.avecAdmin}</p>
                                                        <p><strong>Sans admin:</strong> ${stats.sansAdmin}</p>
                                                    </div>
                                                    <div class="col-6">
                                                        <p><strong>Avec projets:</strong> ${stats.avecProjets}</p>
                                                        <p><strong>Sans projets:</strong> ${stats.sansProjets}</p>
                                                        <p><strong>Avec secteur:</strong> ${stats.avecSecteur}</p>
                                                    </div>
                                                </div>
                                                <hr>
                                                <p class="text-center"><strong>Résultats filtrés:</strong> ${currentFiltered.length}</p>
                                                ${filters.sans_admin ? `
                                                    <div class="alert alert-warning mt-2">
                                                        <i class="ti ti-alert-triangle me-1"></i>
                                                        <strong>Audit en cours:</strong> Affichage des sociétés sans administrateur assigné
                                                    </div>
                                                ` : ''}
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
                                    <i className="ti ti-building me-1"></i>
                                    {currentFiltered.length} société{currentFiltered.length > 1 ? 's' : ''} 
                                    {currentFiltered.length !== societes.length && ` sur ${societes.length}`}
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
                                        Société: {filters.nom}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('nom', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.admin && (
                                    <span className="badge bg-info">
                                        Admin: {filters.admin}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('admin', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.secteur_activite && (
                                    <span className="badge bg-success">
                                        Secteur: {filters.secteur_activite}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('secteur_activite', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.avec_projets === 'avec' && (
                                    <span className="badge bg-success">
                                        Avec projets
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('avec_projets', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.avec_projets === 'sans' && (
                                    <span className="badge bg-warning">
                                        Sans projets
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('avec_projets', '')}
                                        ></button>
                                    </span>
                                )}
                                {filters.sans_admin && (
                                    <span className="badge bg-danger">
                                        <i className="ti ti-alert-triangle me-1"></i>
                                        Sans admin
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.6rem'}}
                                            onClick={() => handleInputChange('sans_admin', false)}
                                        ></button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Résumé rapide */}
                {currentFiltered.length !== societes.length && (
                    <div className="row mt-2">
                        <div className="col-12">
                            <div className="d-flex gap-3 flex-wrap">
                                <small className="text-muted">
                                    <i className="ti ti-folders text-info me-1"></i>
                                    {currentFiltered.filter(s => s.projets && s.projets.length > 0).length} avec projets
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-category text-success me-1"></i>
                                    {[...new Set(currentFiltered.map(s => s.secteur_activite).filter(Boolean))].length} secteurs
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-users text-warning me-1"></i>
                                    {currentFiltered.reduce((total, s) => total + (s.employes ? s.employes.length : 0), 0)} employés
                                </small>
                                <small className="text-muted">
                                    <i className="ti ti-user-cog text-primary me-1"></i>
                                    {[...new Set(currentFiltered.map(s => s.admin?.full_name || s.admin).filter(Boolean))].length} admins
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

export default FiltreGestionSociete;