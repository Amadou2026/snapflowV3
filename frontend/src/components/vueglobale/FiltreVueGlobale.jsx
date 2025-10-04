import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../../services/api';

const FiltreVueGlobale = ({ onFilterChange, user }) => {
    const MySwal = withReactContent(Swal);
    const [filters, setFilters] = useState({
        projet: '',
        dateDebut: '',
        dateFin: '',
        periode: 'mois'
    });

    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCustomDate, setIsCustomDate] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Charger la liste des projets depuis l'API
    useEffect(() => {
        const fetchProjets = async () => {
            try {
                setLoading(true);
                const response = await api.get('projets/');
                setProjets(response.data);
            } catch (error) {
                console.error('Erreur chargement projets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjets();
    }, []);

    // Initialiser les dates par défaut une seule fois
    useEffect(() => {
        if (!isInitialized) {
            const today = new Date();
            const dateDebut = new Date();
            dateDebut.setMonth(today.getMonth() - 1);

            const initialFilters = {
                ...filters,
                dateDebut: dateDebut.toISOString().split('T')[0],
                dateFin: today.toISOString().split('T')[0]
            };
            
            setFilters(initialFilters);
            setIsInitialized(true);
            
            // Ne pas appeler onFilterChange ici pour éviter la boucle
            // L'appel sera fait lors du premier clic sur "Appliquer"
        }
    }, [isInitialized]);

    // Gérer les périodes prédéfinies
    const handlePeriodeChange = (periode) => {
        if (periode === 'personnalise') {
            setIsCustomDate(true);
            setFilters(prev => ({ ...prev, periode }));
            return;
        }

        setIsCustomDate(false);

        const today = new Date();
        let dateDebut = new Date();

        switch (periode) {
            case 'jour':
                dateDebut.setDate(today.getDate() - 1);
                break;
            case 'semaine':
                dateDebut.setDate(today.getDate() - 7);
                break;
            case 'mois':
                dateDebut.setMonth(today.getMonth() - 1);
                break;
            case 'annee':
                dateDebut.setFullYear(today.getFullYear() - 1);
                break;
            default:
                dateDebut.setMonth(today.getMonth() - 1);
        }

        const newFilters = {
            ...filters,
            periode,
            dateDebut: dateDebut.toISOString().split('T')[0],
            dateFin: today.toISOString().split('T')[0]
        };
        
        setFilters(newFilters);
    };

    const handleInputChange = (field, value) => {
        const newFilters = {
            ...filters,
            [field]: value
        };
        setFilters(newFilters);

        // Si on change une date, basculer automatiquement en mode personnalisé
        if ((field === 'dateDebut' || field === 'dateFin') && value && !isCustomDate) {
            setIsCustomDate(true);
            setFilters(prev => ({ ...prev, periode: 'personnalise' }));
        }
    };

    const handleApplyFilters = useCallback(() => {
        console.log('🔍 Application des filtres:', filters);
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const clearFilters = useCallback(() => {
        const today = new Date();
        const dateDebut = new Date();
        dateDebut.setMonth(today.getMonth() - 1);

        const defaultFilters = {
            projet: '',
            dateDebut: dateDebut.toISOString().split('T')[0],
            dateFin: today.toISOString().split('T')[0],
            periode: 'mois'
        };
        
        setFilters(defaultFilters);
        setIsCustomDate(false);
        console.log('🗑️ Réinitialisation des filtres');
        onFilterChange(defaultFilters);
    }, [onFilterChange]);

    const removeProjetFilter = useCallback(() => {
        const newFilters = { ...filters, projet: '' };
        setFilters(newFilters);
        setTimeout(() => onFilterChange(newFilters), 100);
    }, [filters, onFilterChange]);

    const removeDateFilter = useCallback(() => {
        handlePeriodeChange('mois');
        setTimeout(handleApplyFilters, 100);
    }, [handleApplyFilters]);

    const getFilterSummary = () => {
        const summary = [];
        if (filters.projet) {
            const projet = projets.find(p => p.id === parseInt(filters.projet));
            summary.push(`Projet: ${projet?.nom || filters.projet}`);
        }
        
        if (filters.periode && filters.periode !== 'personnalise') {
            const periodeLabels = {
                'jour': 'Dernier jour',
                'semaine': 'Dernière semaine',
                'mois': 'Dernier mois',
                'annee': 'Dernière année'
            };
            summary.push(periodeLabels[filters.periode]);
        } else if (filters.dateDebut && filters.dateFin) {
            summary.push(`${filters.dateDebut} à ${filters.dateFin}`);
        }
        
        return summary.length > 0 ? summary.join(' • ') : 'Aucun filtre actif';
    };

    // Raccourci clavier pour appliquer les filtres
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleApplyFilters();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleApplyFilters]);

    return (
        <div className="card mb-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title mb-0">
                        <i className="ti ti-filter me-2 text-primary"></i>
                        Filtres Vue Globale
                    </h6>
                    {user?.is_superuser && (
                        <span className="badge bg-warning">
                            <i className="ti ti-crown me-1"></i>
                            Super-Admin
                        </span>
                    )}
                </div>
                
                {/* Ligne 1 : Filtres Principaux - Layout responsive */}
                <div className="row g-2 align-items-end">
                    {/* Filtre par projet - Pleine largeur sur mobile */}
                    <div className="col-12 col-sm-6 col-md-4">
                        <label htmlFor="filterProjet" className="form-label small fw-bold">
                            <i className="ti ti-folders me-1"></i>
                            Projet
                        </label>
                        <select
                            className="form-select form-select-sm"
                            id="filterProjet"
                            value={filters.projet}
                            onChange={(e) => handleInputChange('projet', e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Tous les projets</option>
                            {projets.map((projet) => (
                                <option key={projet.id} value={projet.id}>
                                    {projet.nom}
                                </option>
                            ))}
                        </select>
                        {loading && (
                            <small className="text-muted">
                                <i className="ti ti-loader me-1"></i>
                                Chargement...
                            </small>
                        )}
                    </div>

                    {/* Périodes prédéfinies */}
                    <div className="col-12 col-sm-6 col-md-3">
                        <label className="form-label small fw-bold">
                            <i className="ti ti-calendar me-1"></i>
                            Période
                        </label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.periode}
                            onChange={(e) => handlePeriodeChange(e.target.value)}
                        >
                            <option value="jour">Dernier jour</option>
                            <option value="semaine">Dernière semaine</option>
                            <option value="mois">Dernier mois</option>
                            <option value="annee">Dernière année</option>
                            <option value="personnalise">Personnalisée</option>
                        </select>
                    </div>

                    {/* Dates - Cachées sur mobile sauf en mode personnalisé */}
                    <div className={`col-6 col-sm-4 col-md-2 ${!isCustomDate ? 'd-none d-md-block' : ''}`}>
                        <label htmlFor="filterDateDebut" className="form-label small fw-bold">
                            <i className="ti ti-calendar me-1"></i>
                            Début
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            id="filterDateDebut"
                            value={filters.dateDebut}
                            onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                            max={filters.dateFin || new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className={`col-6 col-sm-4 col-md-2 ${!isCustomDate ? 'd-none d-md-block' : ''}`}>
                        <label htmlFor="filterDateFin" className="form-label small fw-bold">
                            <i className="ti ti-calendar me-1"></i>
                            Fin
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            id="filterDateFin"
                            value={filters.dateFin}
                            onChange={(e) => handleInputChange('dateFin', e.target.value)}
                            min={filters.dateDebut}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Boutons d'action - Centré sur mobile */}
                    <div className="col-12 col-sm-4 col-md-1">
                        <div className="d-flex gap-1 justify-content-sm-end justify-content-start">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleApplyFilters}
                                title="Appliquer les filtres (Ctrl+Enter)"
                            >
                                <i className="ti ti-search"></i>
                                <span className="d-none d-sm-inline ms-1">Appliquer</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={clearFilters}
                                title="Réinitialiser les filtres"
                            >
                                <i className="ti ti-filter-off"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Indicateur de période active - Toujours visible */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-calendar-event text-primary me-2"></i>
                                <small className="text-muted">
                                    {getFilterSummary()}
                                </small>
                            </div>
                            
                            {/* Badges des filtres actifs */}
                            <div className="d-flex flex-wrap gap-1">
                                {filters.projet && (
                                    <span className="badge bg-primary d-flex align-items-center">
                                        <i className="ti ti-folders me-1"></i>
                                        {projets.find(p => p.id === parseInt(filters.projet))?.nom || filters.projet}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.5rem'}}
                                            onClick={removeProjetFilter}
                                            aria-label="Supprimer le filtre projet"
                                        />
                                    </span>
                                )}
                                {(isCustomDate && filters.dateDebut && filters.dateFin) && (
                                    <span className="badge bg-info d-flex align-items-center">
                                        <i className="ti ti-calendar me-1"></i>
                                        {filters.dateDebut} → {filters.dateFin}
                                        <button 
                                            type="button" 
                                            className="btn-close btn-close-white ms-1" 
                                            style={{fontSize: '0.5rem'}}
                                            onClick={removeDateFilter}
                                            aria-label="Supprimer le filtre date"
                                        />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aide contextuelle */}
                {/* <div className="row mt-2">
                    <div className="col-12">
                        <div className="alert alert-light alert-sm border mb-0 py-2">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-info-circle text-info me-2"></i>
                                <div>
                                    <small className="text-muted">
                                        <strong>Conseil :</strong> Utilisez <kbd>Ctrl</kbd> + <kbd>Entrée</kbd> pour appliquer rapidement les filtres. 
                                        {isCustomDate && " En mode personnalisé, les dates sont entièrement modifiables."}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>

            <style jsx>{`
                .form-select-sm, .form-control-sm {
                    font-size: 0.875rem;
                }
                .badge .btn-close {
                    opacity: 0.8;
                }
                .badge .btn-close:hover {
                    opacity: 1;
                }
                kbd {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 0.25rem;
                    padding: 0.125rem 0.25rem;
                    font-size: 0.75em;
                    font-weight: 600;
                }
                @media (max-width: 576px) {
                    .card-body {
                        padding: 1rem;
                    }
                    .row.g-2 {
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default FiltreVueGlobale;