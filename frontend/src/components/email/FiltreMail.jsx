import React, { useState, useEffect } from 'react';

const FiltreMail = ({ emails, onFilterChange, user }) => {
    const [filters, setFilters] = useState({
        email: '',
        societe: '',
        statut: ''
    });

    // Extraire les sociétés uniques pour le dropdown
    const getSocietesUniques = () => {
        const societes = new Set();
        emails.forEach(email => {
            if (email.societe_nom && email.societe_nom !== 'Aucune société') {
                societes.add(email.societe_nom);
            }
        });
        return Array.from(societes).sort();
    };

    // Filtrer les emails selon les critères
    const filterEmails = () => {
        let filteredEmails = emails;

        if (filters.email) {
            filteredEmails = filteredEmails.filter(email => 
                email.email.toLowerCase().includes(filters.email.toLowerCase())
            );
        }

        if (filters.societe) {
            filteredEmails = filteredEmails.filter(email => 
                email.societe_nom && email.societe_nom.toLowerCase().includes(filters.societe.toLowerCase())
            );
        }

        if (filters.statut) {
            filteredEmails = filteredEmails.filter(email => {
                if (filters.statut === 'actif') return email.est_actif;
                if (filters.statut === 'inactif') return !email.est_actif;
                return true;
            });
        }

        return filteredEmails;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredEmails = filterEmails();
        onFilterChange(filteredEmails);
    }, [filters, emails]);

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            email: '',
            societe: '',
            statut: ''
        });
    };

    const societesUniques = getSocietesUniques();
    const isSuperAdmin = user?.is_superuser;

    return (
        <div className="card mb-3">
            <div className="card-body">
                <div className="row align-items-end">
                    <div className="col-md-3">
                        <label htmlFor="filterEmail" className="form-label">
                            Rechercher par email
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="filterEmail"
                            placeholder="Adresse email..."
                            value={filters.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                    </div>
                    
                    {isSuperAdmin && (
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
                    )}
                    
                    <div className={isSuperAdmin ? "col-md-3" : "col-md-6"}>
                        <label htmlFor="filterStatut" className="form-label">
                            Filtrer par statut
                        </label>
                        <select
                            className="form-select"
                            id="filterStatut"
                            value={filters.statut}
                            onChange={(e) => handleInputChange('statut', e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                        </select>
                    </div>
                    
                    <div className={isSuperAdmin ? "col-md-3" : "col-md-6"}>
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
                
                {/* Indicateur du nombre d'emails filtrés */}
                <div className="mt-3">
                    <small className="text-muted">
                        <i className="ti ti-mail me-1"></i>
                        {filterEmails().length} email{filterEmails().length > 1 ? 's' : ''} 
                        {filterEmails().length !== emails.length && ` sur ${emails.length}`}
                    </small>
                </div>
            </div>
        </div>
    );
};

export default FiltreMail;