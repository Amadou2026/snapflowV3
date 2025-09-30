import React, { useState, useEffect } from 'react';

const FiltreGestionSociete = ({ societes, onFilterChange }) => {
    const [filters, setFilters] = useState({
        nom: ''
    });

    // Filtrer les sociétés selon les critères
    const filterSocietes = () => {
        let filteredSocietes = societes;

        if (filters.nom) {
            filteredSocietes = filteredSocietes.filter(societe => 
                societe.nom.toLowerCase().includes(filters.nom.toLowerCase())
            );
        }

        return filteredSocietes;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredSocietes = filterSocietes();
        onFilterChange(filteredSocietes);
    }, [filters, societes]);

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            nom: ''
        });
    };

    return (
        <div className="card mb-3">
            <div className="card-body">
                <div className="row align-items-end">
                    <div className="col-md-6">
                        <label htmlFor="filterNom" className="form-label">
                            Rechercher par nom de société
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="filterNom"
                            placeholder="Nom de la société..."
                            value={filters.nom}
                            onChange={(e) => handleInputChange('nom', e.target.value)}
                        />
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
                
                {/* Indicateur du nombre de sociétés filtrées */}
                <div className="mt-3">
                    <small className="text-muted">
                        <i className="ti ti-building me-1"></i>
                        {filterSocietes().length} société{filterSocietes().length > 1 ? 's' : ''} 
                        {filterSocietes().length !== societes.length && ` sur ${societes.length}`}
                    </small>
                </div>
            </div>
        </div>
    );
};

export default FiltreGestionSociete;