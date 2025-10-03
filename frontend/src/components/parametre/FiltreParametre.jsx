import React, { useState, useEffect } from 'react';

const FiltreParametre = ({ parametres, onFilterChange, user }) => {
    const [filters, setFilters] = useState({
        societe: '',
        redmine: '',
        email: ''
    });

    // Extraire les sociétés uniques pour le dropdown
    const getSocietesUniques = () => {
        const societes = new Set();
        parametres.forEach(parametre => {
            if (parametre.societe_nom) {
                societes.add(parametre.societe_nom);
            }
        });
        return Array.from(societes).sort();
    };

    // Filtrer les paramètres selon les critères
    const filterParametres = () => {
        let filteredParametres = parametres;

        if (filters.societe) {
            filteredParametres = filteredParametres.filter(parametre => 
                parametre.societe_nom && parametre.societe_nom.toLowerCase().includes(filters.societe.toLowerCase())
            );
        }

        if (filters.redmine) {
            if (filters.redmine === 'configure') {
                filteredParametres = filteredParametres.filter(parametre => 
                    parametre.redmine_url && parametre.redmine_api_key
                );
            } else if (filters.redmine === 'non_configure') {
                filteredParametres = filteredParametres.filter(parametre => 
                    !parametre.redmine_url || !parametre.redmine_api_key
                );
            }
        }

        if (filters.email) {
            if (filters.email === 'configure') {
                filteredParametres = filteredParametres.filter(parametre => 
                    parametre.email_host_user
                );
            } else if (filters.email === 'non_configure') {
                filteredParametres = filteredParametres.filter(parametre => 
                    !parametre.email_host_user
                );
            }
        }

        return filteredParametres;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredParametres = filterParametres();
        onFilterChange(filteredParametres);
    }, [filters, parametres]);

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            societe: '',
            redmine: '',
            email: ''
        });
    };

    const societesUniques = getSocietesUniques();

    return (
        <div className="card mb-3">
            <div className="card-body">
                <div className="row align-items-end">
                    <div className="col-md-3">
                        <label htmlFor="filterSociete" className="form-label">
                            Filtrer par société
                        </label>
                        <select
                            className="form-select"
                            id="filterSociete"
                            value={filters.societe}
                            onChange={(e) => handleInputChange('societe', e.target.value)}
                        >
                            <option value="">Toutes les sociétés</option>
                            {societesUniques.map(societe => (
                                <option key={societe} value={societe}>
                                    {societe}
                                </option>
                            ))}
                            {societesUniques.length === 0 && (
                                <option value="" disabled>Aucune société disponible</option>
                            )}
                        </select>
                    </div>
                    
                    <div className="col-md-3">
                        <label htmlFor="filterRedmine" className="form-label">
                            État Redmine
                        </label>
                        <select
                            className="form-select"
                            id="filterRedmine"
                            value={filters.redmine}
                            onChange={(e) => handleInputChange('redmine', e.target.value)}
                        >
                            <option value="">Tous les états</option>
                            <option value="configure">Redmine configuré</option>
                            <option value="non_configure">Redmine non configuré</option>
                        </select>
                    </div>
                    
                    <div className="col-md-3">
                        <label htmlFor="filterEmail" className="form-label">
                            État Email
                        </label>
                        <select
                            className="form-select"
                            id="filterEmail"
                            value={filters.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                        >
                            <option value="">Tous les états</option>
                            <option value="configure">Email configuré</option>
                            <option value="non_configure">Email non configuré</option>
                        </select>
                    </div>
                    
                    <div className="col-md-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100"
                            onClick={clearFilters}
                        >
                            <i className="ti ti-filter-off me-1"></i>
                            Réinitialiser
                        </button>
                    </div>
                </div>
                
                {/* Indicateur du nombre de paramètres filtrés */}
                <div className="mt-3">
                    <small className="text-muted">
                        <i className="ti ti-settings me-1"></i>
                        {filterParametres().length} paramètre(s) 
                        {filterParametres().length !== parametres.length && ` sur ${parametres.length}`}
                    </small>
                </div>
            </div>
        </div>
    );
};

export default FiltreParametre;