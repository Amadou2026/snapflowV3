import React, { useState, useEffect } from 'react';

const FiltreGestionUser = ({ users, onFilterChange }) => {
    const [filters, setFilters] = useState({
        nom: '',
        societe: '',
        statut: ''
    });

    // Fonction pour obtenir le nom de la société d'un utilisateur
    const getSocieteName = (userItem) => {
        // Le serializer renvoie la société sous 'societes' (au pluriel)
        if (userItem.societes && typeof userItem.societes === 'object') {
            return userItem.societes.nom || 'Société sans nom';
        }
        // Fallback vers societe si disponible (au cas où)
        else if (userItem.societe && typeof userItem.societe === 'object') {
            return userItem.societe.nom || 'Société sans nom';
        }
        else if (userItem.societe && typeof userItem.societe === 'number') {
            return `Société ID: ${userItem.societe}`;
        }
        return 'Non assigné';
    };

    // Extraire les sociétés uniques pour le dropdown
    const getSocietesUniques = () => {
        const societes = new Set();
        users.forEach(user => {
            const societeName = getSocieteName(user);
            if (societeName && societeName !== 'Non assigné') {
                societes.add(societeName);
            }
        });
        return Array.from(societes).sort();
    };

    // Filtrer les utilisateurs selon les critères
    const filterUsers = () => {
        let filteredUsers = users;

        if (filters.nom) {
            filteredUsers = filteredUsers.filter(user => 
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(filters.nom.toLowerCase()) ||
                user.email.toLowerCase().includes(filters.nom.toLowerCase())
            );
        }

        if (filters.societe) {
            filteredUsers = filteredUsers.filter(user => {
                const societeName = getSocieteName(user);
                return societeName.toLowerCase().includes(filters.societe.toLowerCase());
            });
        }

        if (filters.statut) {
            filteredUsers = filteredUsers.filter(user => {
                if (filters.statut === 'actif') return user.is_active && user.is_staff;
                if (filters.statut === 'utilisateur') return user.is_active && !user.is_staff;
                if (filters.statut === 'desactive') return !user.is_active;
                return true;
            });
        }

        return filteredUsers;
    };

    // Appliquer les filtres à chaque changement
    useEffect(() => {
        const filteredUsers = filterUsers();
        onFilterChange(filteredUsers);
    }, [filters, users]);

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            nom: '',
            societe: '',
            statut: ''
        });
    };

    const societesUniques = getSocietesUniques();

    return (
        <div className="card mb-3">
            <div className="card-body">
                <div className="row align-items-end">
                    <div className="col-md-3">
                        <label htmlFor="filterNom" className="form-label">
                            Rechercher par nom/email
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="filterNom"
                            placeholder="Nom, prénom ou email..."
                            value={filters.nom}
                            onChange={(e) => handleInputChange('nom', e.target.value)}
                        />
                    </div>
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
                            <option value="actif">Actif (Staff)</option>
                            <option value="utilisateur">Utilisateur</option>
                            <option value="desactive">Désactivé</option>
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
                
                {/* Indicateur du nombre d'utilisateurs filtrés */}
                <div className="mt-3">
                    <small className="text-muted">
                        <i className="ti ti-users me-1"></i>
                        {filterUsers().length} utilisateur{filterUsers().length > 1 ? 's' : ''} 
                        {filterUsers().length !== users.length && ` sur ${users.length}`}
                    </small>
                </div>

                {/* Debug info (à supprimer en production) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2">
                        <small className="text-muted">
                            Debug: {societesUniques.length} société(s) trouvée(s)
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiltreGestionUser;